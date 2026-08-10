import os
import logging
from typing import List, Dict, Any
from celery import shared_task
from sentence_transformers import SentenceTransformer
import pgvector
from pgvector.psycopg2 import register_vector
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

# Global model cache
_embedding_model = None
_groq_client = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        logger.info(f"Loading embedding model: {model_name}")
        _embedding_model = SentenceTransformer(model_name)
    return _embedding_model


def get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")
        from groq import Groq
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def get_db_connection():
    return psycopg2.connect(
        os.getenv("DATABASE_URL"),
        cursor_factory=RealDictCursor,
    )


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_embeddings(self, document_id: str, content: str, block_ids: List[str]):
    """Generate vector embeddings for document blocks."""
    try:
        model = get_embedding_model()
        
        # Split content into chunks if needed
        chunks = chunk_text(content, max_length=512)
        embeddings = model.encode(chunks, normalize_embeddings=True)
        
        # Store in database
        conn = get_db_connection()
        register_vector(conn)
        
        with conn.cursor() as cur:
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                cur.execute(
                    """
                    INSERT INTO document_embeddings (document_id, block_id, chunk_index, content, embedding)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (document_id, block_id, chunk_index) DO UPDATE SET
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding,
                        updated_at = NOW()
                    """,
                    (document_id, block_ids[i] if i < len(block_ids) else f"chunk_{i}", i, chunk, embedding.tolist())
                )
            conn.commit()
        
        conn.close()
        logger.info(f"Generated {len(embeddings)} embeddings for document {document_id}")
        return {"status": "success", "embeddings_count": len(embeddings)}
        
    except Exception as exc:
        logger.error(f"Embedding generation failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_document_summary(self, document_id: str, content: str):
    """Generate AI summary for a document using Groq."""
    try:
        if os.getenv("GROQ_API_KEY"):
            return _generate_summary_groq(document_id, content)
        else:
            return _generate_summary_local(document_id, content)
    except Exception as exc:
        logger.error(f"Summary generation failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


def _generate_summary_groq(document_id: str, content: str):
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    
    # Truncate content to fit context window (Groq supports 8k-128k depending on model)
    max_content = 12000
    if len(content) > max_content:
        content = content[:max_content] + "\n\n[Content truncated...]"
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "Generate a concise summary of this document. Include key points, main topics, and action items if any. Use markdown formatting."},
            {"role": "user", "content": content},
        ],
        max_tokens=800,
        temperature=0.3,
    )
    
    summary = response.choices[0].message.content
    tokens_used = response.usage.total_tokens if response.usage else 0
    
    # Store in database
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO document_summaries (document_id, summary, model, tokens_used)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (document_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                model = EXCLUDED.model,
                tokens_used = EXCLUDED.tokens_used,
                updated_at = NOW()
            """,
            (document_id, summary, f"groq/{model}", tokens_used)
        )
        conn.commit()
    conn.close()
    
    return {"status": "success", "summary": summary, "model": model, "tokens_used": tokens_used}


def _generate_summary_local(document_id: str, content: str):
    from transformers import pipeline
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    
    # Chunk long content
    chunks = chunk_text(content, max_length=1024)
    summaries = []
    
    for chunk in chunks:
        result = summarizer(chunk, max_length=150, min_length=30, do_sample=False)
        summaries.append(result[0]["summary_text"])
    
    summary = " ".join(summaries)
    
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO document_summaries (document_id, summary, model)
            VALUES (%s, %s, %s)
            ON CONFLICT (document_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                model = EXCLUDED.model,
                updated_at = NOW()
            """,
            (document_id, summary, "facebook/bart-large-cnn")
        )
        conn.commit()
    conn.close()
    
    return {"status": "success", "summary": summary}


@shared_task(bind=True, max_retries=2)
def extract_key_points(self, document_id: str, content: str):
    """Extract key points and action items from document."""
    try:
        # Try Groq first for better extraction
        if os.getenv("GROQ_API_KEY"):
            return _extract_key_points_groq(document_id, content)
        else:
            return _extract_key_points_local(document_id, content)
    except Exception as exc:
        logger.error(f"Key points extraction failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


def _extract_key_points_groq(document_id: str, content: str):
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "Extract key points, action items, decisions, and important insights from this document. Return as a JSON array of strings. Be concise."},
            {"role": "user", "content": content[:8000]},
        ],
        max_tokens=500,
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    
    import json
    result = json.loads(response.choices[0].message.content)
    points = result.get("points", result.get("key_points", []))
    
    if isinstance(points, dict):
        points = list(points.values())
    
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO document_key_points (document_id, points)
            VALUES (%s, %s)
            ON CONFLICT (document_id) DO UPDATE SET
                points = EXCLUDED.points,
                updated_at = NOW()
            """,
            (document_id, points)
        )
        conn.commit()
    conn.close()
    
    return {"status": "success", "points_count": len(points)}


def _extract_key_points_local(document_id: str, content: str):
    points = []
    lines = content.split("\n")
    
    for line in lines:
        line = line.strip()
        if line.startswith(("- ", "* ", "• ", "1. ", "2. ")):
            points.append(line)
        elif any(keyword in line.lower() for keyword in ["action:", "todo:", "follow up:", "next step:"]):
            points.append(line)
    
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO document_key_points (document_id, points)
            VALUES (%s, %s)
            ON CONFLICT (document_id) DO UPDATE SET
                points = EXCLUDED.points,
                updated_at = NOW()
            """,
            (document_id, points)
        )
        conn.commit()
    conn.close()
    
    return {"status": "success", "points_count": len(points)}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def auto_tag_document(self, document_id: str, content: str, title: str):
    """Auto-generate tags for a document using keyword extraction."""
    try:
        # Try Groq for better tagging
        if os.getenv("GROQ_API_KEY"):
            return _auto_tag_groq(document_id, content, title)
        else:
            return _auto_tag_local(document_id, content, title)
    except Exception as exc:
        logger.error(f"Auto-tagging failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


def _auto_tag_groq(document_id: str, content: str, title: str):
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "Generate 5-10 relevant tags for this document. Return as JSON array of strings. Tags should be lowercase, hyphenated, and cover topics, technologies, and domains."},
            {"role": "user", "content": f"Title: {title}\n\nContent: {content[:6000]}"},
        ],
        max_tokens=200,
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    
    import json
    result = json.loads(response.choices[0].message.content)
    tags = result.get("tags", result.get("keywords", []))
    
    if isinstance(tags, dict):
        tags = list(tags.values())
    
    # Normalize tags
    tags = [tag.lower().replace(" ", "-").replace("_", "-") for tag in tags]
    tags = list(dict.fromkeys(tags))[:10]  # Deduplicate, max 10
    
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO document_tags (document_id, tags)
            VALUES (%s, %s)
            ON CONFLICT (document_id) DO UPDATE SET
                tags = EXCLUDED.tags,
                updated_at = NOW()
            """,
            (document_id, tags)
        )
        conn.commit()
    conn.close()
    
    return {"status": "success", "tags": tags}


def _auto_tag_local(document_id: str, content: str, title: str):
    from sklearn.feature_extraction.text import TfidfVectorizer
    import numpy as np
    
    vectorizer = TfidfVectorizer(
        max_features=20,
        stop_words="english",
        ngram_range=(1, 2),
    )
    
    tfidf = vectorizer.fit_transform([content])
    feature_names = vectorizer.get_feature_names_out()
    scores = tfidf.toarray()[0]
    
    top_indices = np.argsort(scores)[::-1][:10]
    tags = [feature_names[i] for i in top_indices if scores[i] > 0.1]
    
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO document_tags (document_id, tags)
            VALUES (%s, %s)
            ON CONFLICT (document_id) DO UPDATE SET
                tags = EXCLUDED.tags,
                updated_at = NOW()
            """,
            (document_id, tags)
        )
        conn.commit()
    conn.close()
    
    return {"status": "success", "tags": tags}


def chunk_text(text: str, max_length: int = 512) -> List[str]:
    """Split text into chunks of max_length tokens (approximate)."""
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        word_len = len(word) // 4 + 1  # Rough token estimate
        if current_length + word_len > max_length and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = word_len
        else:
            current_chunk.append(word)
            current_length += word_len
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks if chunks else [text]