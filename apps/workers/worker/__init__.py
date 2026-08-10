import os
import logging
from celery import Celery
from celery.signals import worker_ready, worker_shutdown
from kombu import Queue

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Celery app
app = Celery("docuflow_workers")

app.conf.update(
    broker_url=os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//"),
    result_backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,
    task_soft_time_limit=540,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=100,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_routes={
        "worker.tasks.embeddings.*": {"queue": "embeddings"},
        "worker.tasks.summarization.*": {"queue": "summarization"},
        "worker.tasks.export.*": {"queue": "exports"},
        "worker.tasks.analytics.*": {"queue": "analytics"},
        "worker.tasks.cleanup.*": {"queue": "cleanup"},
    },
    task_queues=(
        Queue("default", routing_key="default"),
        Queue("embeddings", routing_key="embeddings"),
        Queue("summarization", routing_key="summarization"),
        Queue("exports", routing_key="exports"),
        Queue("analytics", routing_key="analytics"),
        Queue("cleanup", routing_key="cleanup"),
    ),
    beat_schedule={},
)

# Auto-discover tasks
app.autodiscover_tasks(["worker.tasks"])


@worker_ready.connect
def on_worker_ready(**kwargs):
    logger.info("Worker ready - registering queues")


@worker_shutdown.connect
def on_worker_shutdown(**kwargs):
    logger.info("Worker shutting down")


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    logger.info(f"Request: {self.request!r}")


if __name__ == "__main__":
    app.start()