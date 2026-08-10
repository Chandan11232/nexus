# DocuFlow — Collaborative Knowledge Base with AI Superpowers

[![Deployed on Zerops](https://img.shields.io/badge/Deployed%20on-Zerops-0ea5e9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkwxMy4wOSA4LjI2TDIwIDkuMjdsLTUuMDYgNC45Nkw2Ljk0IDE2LjA3TDEyIDIybDUuMDYtNS45M0wxOCA5LjI3TDEyLjkxIDguMjZMMTIgMloiIGZpbGw9IndoaXRlIi8+PC9zdmc+)](https://zerops.io)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=for-the-badge&logo=go)](https://golang.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **Real-time collaborative docs with AI-powered insights, global edge publishing, and zero-setup deployment. Built for the Zerops Hackathon.**

## ✨ Features

| Feature | Description | Zerops Service |
|---------|-------------|----------------|
| **Real-time Collaboration** | CRDT-powered conflict-free editing with live cursors, selections, presence | Auto-scaling Containers + WebSocket |
| **AI Insights** | Auto-summarization, semantic search, smart tagging, key point extraction | Auto-scaling Python Workers + pgvector + **Groq (Llama 3.1)** |
| **Global Edge Publishing** | One-click publish to 4 regions (Tokyo, Frankfurt, Virginia, Sydney) with <50ms latency | Edge Global Deployment |
| **Rich Content Blocks** | 15+ block types: headings, code, tables, callouts, embeds, math, diagrams | Next.js + TipTap/Yjs |
| **Exports** | PDF, HTML, Markdown, static site bundles via signed URLs | S3-Compatible Object Storage |
| **Analytics** | Real-time dashboards with read-replica routing, partitioned events | Managed PostgreSQL + Read Replicas |
| **Zero Trust** | Private network, mTLS, no public IPs for internal services | Private Network / VPN |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ZEROPS PROJECT                                    │
├──────────────┬──────────────┬──────────────┬──────────────────────────────┤
│   FRONTEND   │    BACKEND   │   WORKERS    │        DATABASE              │
│  (Next.js)   │   (Go API)   │  (Python)    │  PostgreSQL + 2 Read Replicas│
│  Edge Global │  Auto-scale  │  Auto-scale  │  (Primary, Analytics, Search)│
└──────┬───────┴──────┬───────┴──────┬───────┴──────────────┬───────────────┘
       │              │              │                      │
       ▼              ▼              ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MANAGED SERVICES                                     │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│   OBJECT     │    EDGE      │   SCHEDULED  │   PRIVATE    │   REDIS /      │
│   STORAGE    │   GLOBAL     │    JOBS      │   NETWORK    │   RABBITMQ     │
│  (S3-compat) │  DEPLOYMENT  │   (Cron)     │  (Service    │  (Pub/Sub,     │
│              │              │              │   Mesh)      │   Queue, Cache)│
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Zerops CLI (`npm i -g @zerops/cli`)
- GitHub account

### Local Development

```bash
# Clone and enter
git clone https://github.com/yourusername/docuflow
cd docuflow

# Start all services (PostgreSQL, Redis, RabbitMQ, MinIO, API, Workers, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Access services
# Frontend:     http://localhost:3000
# API:          http://localhost:8080
# MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
# RabbitMQ:     http://localhost:15672 (docuflow/docuflow)
```

### Deploy to Zerops

```bash
# Login to Zerops
zerops login

# Create project from config
zerops project import --file zerops.yml

# Set required secrets in Zerops UI:
# - JWT_SECRET, JWT_REFRESH_SECRET (openssl rand -base64 64)
# - GROQ_API_KEY (from https://console.groq.com/keys)
# - EDGE_PURGE_TOKEN, INTERNAL_JOB_TOKEN (openssl rand -base64 32)

# Deploy
zerops deploy --project docuflow

# Your app is live at https://docuflow.zerops.app
```

## 📁 Project Structure

```
docuflow/
├── apps/
│   ├── web/                 # Next.js 14 Frontend (Edge)
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   ├── api/                 # Go Backend API
│   │   ├── cmd/server/      # Entry point
│   │   ├── internal/        # Private packages
│   │   │   ├── handler/     # HTTP handlers
│   │   │   ├── middleware/  # Auth, CORS, logging
│   │   │   ├── service/     # Business logic
│   │   │   ├── repository/  # Data access
│   │   │   └── model/       # Domain models
│   │   └── migrations/      # SQL migrations
│   └── workers/             # Python AI Workers
│       └── worker/
│           └── tasks/       # Celery tasks
├── packages/
│   ├── db/                  # Database schema & migrations
│   ├── crdt/                # CRDT utilities (Yjs wrapper)
│   └── zerops/              # Shared Zerops config
├── docker/                  # Docker configs (nginx, etc.)
├── zerops.yml               # Zerops project definition
├── docker-compose.yml       # Local development
└── README.md
```

## 🔧 Zerops Services Used

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Edge Global Deployment** | Frontend hosting in 4 regions with instant cache purge | `mode: edge`, `regions: [fra, iad, nrt, syd]` |
| **Managed PostgreSQL** | Primary DB with 2 read replicas, pgvector for search | `replicas: 2`, `extensions: [pgvector]` |
| **Auto-scaling Containers** | API scales on CPU + WebSocket connections; Workers on queue depth | `metrics: [cpu, custom:websocket_connections, custom:queue_depth]` |
| **Object Storage (S3)** | Direct browser uploads, static hosting, lifecycle rules | `buckets: [docuflow-assets, docuflow-published]` |
| **Private Network** | Zero-trust mesh, mTLS, no public IPs | `networks: [private]` |
| **Scheduled Jobs (Cron)** | Analytics rollup, search reindex, cleanup, monitoring | `jobs: [analytics-rollup, search-reindex, ...]` |
| **Managed Redis/Valkey** | Pub/sub for presence, caching, rate limiting | `mode: managed` |
| **Managed RabbitMQ** | Task queues, dead letters, retries | `quorumQueues: true` |

## 🛠️ Tech Stack

**Frontend:** Next.js 14 (App Router, Edge Runtime), React 18, Tailwind CSS, Framer Motion, TypeScript
**Backend:** Go 1.22, Gin, pgx, JWT, WebSocket (gorilla/ws)
**Workers:** Python 3.11, Celery, Redis, RabbitMQ, sentence-transformers, pgvector, **Groq (Llama 3.1 70B)**
**Database:** PostgreSQL 16, pgvector, partitioned analytics tables
**Platform:** Zerops (Edge, Managed PG, Auto-scaling, S3, Cron, Private Network)

## 📊 Demo

1. **Open** https://docuflow.zerops.app
2. **Start writing** — no signup required
3. **Open in another tab** — see real-time cursors
4. **Click AI** — get summaries, tags, semantic search
5. **Publish** — instant global URL with <50ms latency worldwide

## 🧪 Testing

```bash
# Unit tests
docker-compose exec api go test ./...
docker-compose exec workers python -m pytest

# Load test
hey -n 10000 -c 100 https://api.docuflow.zerops.app/health
```

## 📝 License

MIT License — feel free to use for your own projects!

## 🙏 Acknowledgments

- **Zerops** for the incredible platform
- **Yjs** for CRDT implementation
- **pgvector** for vector similarity search
- **Groq** for lightning-fast LLM inference (Llama 3.1 70B)

---

Built with ❤️ for the Zerops Hackathon
