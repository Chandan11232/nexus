import os
import logging
import tempfile
import subprocess
from pathlib import Path
from celery import shared_task
from weasyprint import HTML, CSS
from minio import Minio
from minio.error import S3Error

logger = logging.getLogger(__name__)


def get_minio_client():
    return Minio(
        os.getenv("STORAGE_ENDPOINT", "localhost:9000").replace("http://", "").replace("https://", ""),
        access_key=os.getenv("STORAGE_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("STORAGE_SECRET_KEY", "minioadmin"),
        secure=os.getenv("STORAGE_ENDPOINT", "").startswith("https"),
    )


def get_db_connection():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    return psycopg2.connect(
        os.getenv("DATABASE_URL"),
        cursor_factory=RealDictCursor,
    )


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def export_document_pdf(self, document_id: str, html_content: str, options: dict = None):
    """Export document to PDF using WeasyPrint."""
    try:
        options = options or {}
        
        # Create PDF
        html = HTML(string=html_content, base_url=".")
        css = CSS(string=options.get("css", """
            @page { margin: 2cm; size: A4; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }
            h1, h2, h3 { color: #1a1a2e; page-break-after: avoid; }
            code { background: #f4f4f5; padding: 0.2em 0.4em; border-radius: 4px; }
            pre { background: #18181b; color: #f4f4f5; padding: 1em; border-radius: 8px; overflow-x: auto; }
            blockquote { border-left: 4px solid #0ea5e9; padding-left: 1em; color: #52525b; }
            table { width: 100%; border-collapse: collapse; margin: 1em 0; }
            th, td { border: 1px solid #e4e4e7; padding: 0.5em; text-align: left; }
        """))
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            html.write_pdf(tmp.name, stylesheets=[css])
            tmp_path = tmp.name
        
        # Upload to MinIO
        client = get_minio_client()
        bucket = os.getenv("STORAGE_BUCKET", "docuflow-assets")
        object_name = f"exports/{document_id}/document.pdf"
        
        client.fput_object(bucket, object_name, tmp_path)
        
        # Generate presigned URL (7 days)
        url = client.presigned_get_object(bucket, object_name, expires=7*24*3600)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        # Update database
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO document_exports (document_id, format, storage_path, download_url, expires_at)
                VALUES (%s, 'pdf', %s, %s, NOW() + INTERVAL '7 days')
                ON CONFLICT (document_id, format) DO UPDATE SET
                    storage_path = EXCLUDED.storage_path,
                    download_url = EXCLUDED.download_url,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()
                """,
                (document_id, object_name, url)
            )
            conn.commit()
        conn.close()
        
        logger.info(f"PDF export completed for document {document_id}")
        return {"status": "success", "url": url, "format": "pdf"}
        
    except Exception as exc:
        logger.error(f"PDF export failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def export_document_html(self, document_id: str, html_content: str, assets: dict = None):
    """Export document as static HTML bundle."""
    try:
        assets = assets or {}
        
        # Create complete HTML with embedded assets
        full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{assets.get('title', 'Document')}</title>
    <style>
        {assets.get('css', '')}
        @media print {{
            @page {{ margin: 2cm; }}
            body {{ font-size: 12pt; }}
        }}
    </style>
</head>
<body>
    {html_content}
    <script>
        {assets.get('js', '')}
    </script>
</body>
</html>"""
        
        # Upload to MinIO
        client = get_minio_client()
        bucket = os.getenv("STORAGE_BUCKET", "docuflow-assets")
        object_name = f"exports/{document_id}/index.html"
        
        with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False) as tmp:
            tmp.write(full_html)
            tmp_path = tmp.name
        
        client.fput_object(bucket, object_name, tmp_path, content_type="text/html")
        os.unlink(tmp_path)
        
        # Also upload any additional assets (images, CSS, JS)
        for asset_name, asset_content in assets.get("additional", {}).items():
            asset_path = f"exports/{document_id}/{asset_name}"
            with tempfile.NamedTemporaryFile(mode="w", suffix=f".{asset_name.split('.')[-1]}", delete=False) as tmp:
                tmp.write(asset_content)
                tmp_path = tmp.name
            client.fput_object(bucket, asset_path, tmp_path)
            os.unlink(tmp_path)
        
        # Generate presigned URL
        url = client.presigned_get_object(bucket, object_name, expires=7*24*3600)
        
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO document_exports (document_id, format, storage_path, download_url, expires_at)
                VALUES (%s, 'html', %s, %s, NOW() + INTERVAL '7 days')
                ON CONFLICT (document_id, format) DO UPDATE SET
                    storage_path = EXCLUDED.storage_path,
                    download_url = EXCLUDED.download_url,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()
                """,
                (document_id, object_name, url)
            )
            conn.commit()
        conn.close()
        
        return {"status": "success", "url": url, "format": "html"}
        
    except Exception as exc:
        logger.error(f"HTML export failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def export_document_markdown(self, document_id: str, markdown_content: str):
    """Export document as Markdown."""
    try:
        client = get_minio_client()
        bucket = os.getenv("STORAGE_BUCKET", "docuflow-assets")
        object_name = f"exports/{document_id}/document.md"
        
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as tmp:
            tmp.write(markdown_content)
            tmp_path = tmp.name
        
        client.fput_object(bucket, object_name, tmp_path, content_type="text/markdown")
        os.unlink(tmp_path)
        
        url = client.presigned_get_object(bucket, object_name, expires=7*24*3600)
        
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO document_exports (document_id, format, storage_path, download_url, expires_at)
                VALUES (%s, 'markdown', %s, %s, NOW() + INTERVAL '7 days')
                ON CONFLICT (document_id, format) DO UPDATE SET
                    storage_path = EXCLUDED.storage_path,
                    download_url = EXCLUDED.download_url,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()
                """,
                (document_id, object_name, url)
            )
            conn.commit()
        conn.close()
        
        return {"status": "success", "url": url, "format": "markdown"}
        
    except Exception as exc:
        logger.error(f"Markdown export failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def publish_to_edge(self, document_id: str, html_content: str, custom_domain: str = None):
    """Publish document to global edge as static site."""
    try:
        client = get_minio_client()
        bucket = "docuflow-published"
        object_prefix = f"{document_id}/"
        
        # Create index.html
        with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False) as tmp:
            tmp.write(html_content)
            tmp_path = tmp.name
        
        client.fput_object(bucket, f"{object_prefix}index.html", tmp_path, content_type="text/html")
        os.unlink(tmp_path)
        
        # Trigger edge cache purge
        _purge_edge_cache(document_id, custom_domain)
        
        # Generate public URL
        public_url = f"https://{custom_domain or 'docuflow.app'}/{document_id}/"
        
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE documents SET
                    published = true,
                    published_at = NOW(),
                    publish_url = %s,
                    custom_domain = %s
                WHERE id = %s
                """,
                (public_url, custom_domain, document_id)
            )
            conn.commit()
        conn.close()
        
        return {"status": "success", "url": public_url}
        
    except Exception as exc:
        logger.error(f"Edge publish failed for {document_id}: {exc}")
        raise self.retry(exc=exc)


def _purge_edge_cache(document_id: str, custom_domain: str = None):
    """Trigger edge cache purge via API."""
    import httpx
    
    purge_url = os.getenv("EDGE_PURGE_URL")
    purge_token = os.getenv("EDGE_PURGE_TOKEN")
    
    if not purge_url or not purge_token:
        logger.warning("Edge purge not configured")
        return
    
    paths = [f"/{document_id}/", f"/{document_id}/index.html"]
    if custom_domain:
        paths.append(f"https://{custom_domain}/{document_id}/")
    
    try:
        response = httpx.post(
            purge_url,
            json={"paths": paths},
            headers={"Authorization": f"Bearer {purge_token}"},
            timeout=10,
        )
        response.raise_for_status()
        logger.info(f"Edge cache purged for {document_id}")
    except Exception as e:
        logger.error(f"Edge purge failed: {e}")


@shared_task(bind=True, max_retries=1)
def cleanup_temp_uploads(self):
    """Clean up abandoned multipart uploads older than 24 hours."""
    try:
        client = get_minio_client()
        bucket = os.getenv("STORAGE_BUCKET", "docuflow-assets")
        
        # List objects with temp/ prefix
        objects = client.list_objects(bucket, prefix="temp/", recursive=True)
        
        deleted = 0
        for obj in objects:
            # Check if older than 24 hours
            from datetime import datetime, timezone
            age = datetime.now(timezone.utc) - obj.last_modified
            if age.total_seconds() > 24 * 3600:
                client.remove_object(bucket, obj.object_name)
                deleted += 1
        
        logger.info(f"Cleaned up {deleted} temp uploads")
        return {"status": "success", "deleted": deleted}
        
    except Exception as exc:
        logger.error(f"Cleanup failed: {exc}")
        raise self.retry(exc=exc)