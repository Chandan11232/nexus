import os
import logging
from celery import shared_task
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)


def get_db_connection(read_only=False):
    url = os.getenv("DATABASE_READ_URL" if read_only else "DATABASE_URL")
    return psycopg2.connect(url, cursor_factory=RealDictCursor)


@shared_task(bind=True, max_retries=2)
def rollup_analytics(self):
    """Roll up analytics events into materialized views (runs every 5 min)."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Aggregate page views
            cur.execute("""
                INSERT INTO analytics_pageviews_hourly (document_id, hour, views, unique_visitors, avg_duration)
                SELECT 
                    document_id,
                    date_trunc('hour', timestamp) as hour,
                    COUNT(*) as views,
                    COUNT(DISTINCT visitor_id) as unique_visitors,
                    AVG(duration_ms) as avg_duration
                FROM analytics_events
                WHERE event_type = 'pageview'
                    AND timestamp >= NOW() - INTERVAL '1 hour'
                    AND timestamp < date_trunc('hour', NOW())
                GROUP BY document_id, date_trunc('hour', timestamp)
                ON CONFLICT (document_id, hour) DO UPDATE SET
                    views = EXCLUDED.views,
                    unique_visitors = EXCLUDED.unique_visitors,
                    avg_duration = EXCLUDED.avg_duration
            """)
            
            # Aggregate edit events
            cur.execute("""
                INSERT INTO analytics_edits_hourly (document_id, hour, edits, editors, chars_added, chars_removed)
                SELECT 
                    document_id,
                    date_trunc('hour', timestamp) as hour,
                    COUNT(*) as edits,
                    COUNT(DISTINCT user_id) as editors,
                    SUM(COALESCE(payload->>'charsAdded', '0')::int) as chars_added,
                    SUM(COALESCE(payload->>'charsRemoved', '0')::int) as chars_removed
                FROM analytics_events
                WHERE event_type = 'edit'
                    AND timestamp >= NOW() - INTERVAL '1 hour'
                    AND timestamp < date_trunc('hour', NOW())
                GROUP BY document_id, date_trunc('hour', timestamp)
                ON CONFLICT (document_id, hour) DO UPDATE SET
                    edits = EXCLUDED.edits,
                    editors = EXCLUDED.editors,
                    chars_added = EXCLUDED.chars_added,
                    chars_removed = EXCLUDED.chars_removed
            """)
            
            # Aggregate AI usage
            cur.execute("""
                INSERT INTO analytics_ai_hourly (document_id, hour, summaries, embeddings, searches, tokens_used)
                SELECT 
                    document_id,
                    date_trunc('hour', timestamp) as hour,
                    COUNT(*) FILTER (WHERE event_type = 'ai_summary') as summaries,
                    COUNT(*) FILTER (WHERE event_type = 'ai_embedding') as embeddings,
                    COUNT(*) FILTER (WHERE event_type = 'ai_search') as searches,
                    SUM(COALESCE(payload->>'tokens', '0')::int) as tokens_used
                FROM analytics_events
                WHERE event_type IN ('ai_summary', 'ai_embedding', 'ai_search')
                    AND timestamp >= NOW() - INTERVAL '1 hour'
                    AND timestamp < date_trunc('hour', NOW())
                GROUP BY document_id, date_trunc('hour', timestamp)
                ON CONFLICT (document_id, hour) DO UPDATE SET
                    summaries = EXCLUDED.summaries,
                    embeddings = EXCLUDED.embeddings,
                    searches = EXCLUDED.searches,
                    tokens_used = EXCLUDED.tokens_used
            """)
            
            conn.commit()
        
        conn.close()
        logger.info("Analytics rollup completed")
        return {"status": "success"}
        
    except Exception as exc:
        logger.error(f"Analytics rollup failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def reindex_search(self):
    """Reindex search vectors from primary to search replica (runs hourly)."""
    try:
        # Read from primary
        primary_conn = get_db_connection(read_only=False)
        # Write to search replica
        search_conn = get_db_connection(read_only=True)
        
        with primary_conn.cursor() as cur:
            cur.execute("""
                SELECT d.id, d.title, d.content, d.updated_at
                FROM documents d
                WHERE d.updated_at > NOW() - INTERVAL '2 hours'
                    AND d.published = true
            """)
            documents = cur.fetchall()
        
        if not documents:
            return {"status": "success", "indexed": 0}
        
        # Generate embeddings for new/updated documents
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
        
        texts = [f"{doc['title']}\n\n{doc['content']}" for doc in documents]
        embeddings = model.encode(texts, normalize_embeddings=True)
        
        with search_conn.cursor() as cur:
            for doc, embedding in zip(documents, embeddings):
                cur.execute("""
                    INSERT INTO document_search_index (document_id, title, content, embedding, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (document_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding,
                        updated_at = EXCLUDED.updated_at
                """, (doc['id'], doc['title'], doc['content'], embedding.tolist(), doc['updated_at']))
            
            search_conn.commit()
        
        primary_conn.close()
        search_conn.close()
        
        logger.info(f"Search reindex completed: {len(documents)} documents")
        return {"status": "success", "indexed": len(documents)}
        
    except Exception as exc:
        logger.error(f"Search reindex failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1)
def batch_ai_summary(self):
    """Generate AI summaries for documents that don't have them (runs nightly)."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT d.id, d.content
                FROM documents d
                LEFT JOIN document_summaries s ON d.id = s.document_id
                WHERE s.document_id IS NULL
                    AND d.published = true
                    AND LENGTH(d.content) > 500
                LIMIT 50
            """)
            documents = cur.fetchall()
        
        conn.close()
        
        if not documents:
            return {"status": "success", "processed": 0}
        
        # Queue individual summary tasks
        from worker.tasks.embeddings import generate_document_summary
        for doc in documents:
            generate_document_summary.delay(doc['id'], doc['content'])
        
        logger.info(f"Queued {len(documents)} documents for AI summary")
        return {"status": "success", "queued": len(documents)}
        
    except Exception as exc:
        logger.error(f"Batch AI summary failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1)
def check_replica_lag(self):
    """Check PostgreSQL replica lag and alert if > 5 seconds."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    client_addr,
                    state,
                    pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) as lag_bytes,
                    pg_wal_lsn_diff(pg_current_wal_lsn(), flush_lsn) as flush_lag_bytes,
                    EXTRACT(EPOCH FROM (now() - backend_start)) as connection_age
                FROM pg_stat_replication
            """)
            replicas = cur.fetchall()
        
        conn.close()
        
        alerts = []
        for replica in replicas:
            # Convert byte lag to approximate time lag
            # Assuming ~10MB/s write throughput, 5MB = ~0.5s
            lag_mb = replica['lag_bytes'] / (1024 * 1024)
            estimated_lag_seconds = lag_mb / 10
            
            if estimated_lag_seconds > 5:
                alerts.append({
                    "client": replica['client_addr'],
                    "lag_bytes": replica['lag_bytes'],
                    "estimated_lag_seconds": round(estimated_lag_seconds, 2),
                    "state": replica['state'],
                })
        
        if alerts:
            logger.warning(f"Replica lag alert: {alerts}")
            # Could send to alerting system here
        
        return {"status": "success", "replicas_checked": len(replicas), "alerts": len(alerts)}
        
    except Exception as exc:
        logger.error(f"Replica lag check failed: {exc}")
        raise self.retry(exc=exc)