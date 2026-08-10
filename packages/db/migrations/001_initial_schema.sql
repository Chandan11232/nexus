-- DocuFlow Database Schema
-- Migration: 001_initial_schema
-- Run: psql -h localhost -U docuflow -d docuflow -f packages/db/migrations/001_initial_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ─────────────────────────────────────────────
-- CORE TABLES
-- ─────────────────────────────────────────────

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
    content JSONB NOT NULL DEFAULT '[]', -- Block-based content (Notion-style)
    markdown_content TEXT, -- Computed markdown for search/export
    icon VARCHAR(50),
    cover_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    publish_url TEXT,
    custom_domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    last_edited_by UUID REFERENCES users(id),
    last_edited_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Blocks (for granular CRDT sync)
CREATE TABLE document_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- heading, paragraph, code, list, table, image, callout, etc.
    content JSONB NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    properties JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- COLLABORATION
-- ─────────────────────────────────────────────

-- Document Presence (real-time cursors/selections)
CREATE TABLE document_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cursor_position JSONB, -- {blockId, offset, selection}
    color VARCHAR(7) NOT NULL, -- Hex color for cursor
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AI FEATURES
-- ─────────────────────────────────────────────

-- Document Embeddings (for semantic search)
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    block_id UUID REFERENCES document_blocks(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384), -- all-MiniLM-L6-v2 dimension
    model VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, block_id, chunk_index)
);

-- Document Summaries
CREATE TABLE document_summaries (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Key Points
CREATE TABLE document_key_points (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    points TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Tags
CREATE TABLE document_tags (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search Index (on read replica)
CREATE TABLE document_search_index (
    document_id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXPORTS & PUBLISHING
-- ─────────────────────────────────────────────

-- Document Exports
CREATE TABLE document_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL, -- pdf, html, markdown
    storage_path TEXT NOT NULL,
    download_url TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, format)
);

-- ─────────────────────────────────────────────
-- ANALYTICS (Partitioned by month)
-- ─────────────────────────────────────────────

CREATE TABLE analytics_events (
    id BIGSERIAL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    visitor_id VARCHAR(100), -- Anonymous visitor ID
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL, -- pageview, edit, ai_summary, ai_embedding, ai_search, export, publish
    payload JSONB DEFAULT '{}',
    duration_ms INTEGER,
    user_agent TEXT,
    referrer TEXT,
    country CHAR(2),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE analytics_events_2026_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE analytics_events_2026_02 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE analytics_events_2026_03 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE analytics_events_2026_04 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE analytics_events_2026_05 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE analytics_events_2026_06 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE analytics_events_2026_07 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE analytics_events_2026_08 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE analytics_events_2026_09 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE analytics_events_2026_10 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE analytics_events_2026_11 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE analytics_events_2026_12 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Materialized views for analytics (refreshed by cron)
CREATE MATERIALIZED VIEW analytics_pageviews_hourly AS
SELECT 
    document_id,
    date_trunc('hour', timestamp) as hour,
    COUNT(*) as views,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    AVG(duration_ms) as avg_duration
FROM analytics_events
WHERE event_type = 'pageview'
GROUP BY document_id, date_trunc('hour', timestamp);

CREATE UNIQUE INDEX ON analytics_pageviews_hourly (document_id, hour);

CREATE MATERIALIZED VIEW analytics_edits_hourly AS
SELECT 
    document_id,
    date_trunc('hour', timestamp) as hour,
    COUNT(*) as edits,
    COUNT(DISTINCT user_id) as editors,
    SUM(COALESCE(payload->>'charsAdded', '0')::int) as chars_added,
    SUM(COALESCE(payload->>'charsRemoved', '0')::int) as chars_removed
FROM analytics_events
WHERE event_type = 'edit'
GROUP BY document_id, date_trunc('hour', timestamp);

CREATE UNIQUE INDEX ON analytics_edits_hourly (document_id, hour);

CREATE MATERIALIZED VIEW analytics_ai_hourly AS
SELECT 
    document_id,
    date_trunc('hour', timestamp) as hour,
    COUNT(*) FILTER (WHERE event_type = 'ai_summary') as summaries,
    COUNT(*) FILTER (WHERE event_type = 'ai_embedding') as embeddings,
    COUNT(*) FILTER (WHERE event_type = 'ai_search') as searches,
    SUM(COALESCE(payload->>'tokens', '0')::int) as tokens_used
FROM analytics_events
WHERE event_type IN ('ai_summary', 'ai_embedding', 'ai_search')
GROUP BY document_id, date_trunc('hour', timestamp);

CREATE UNIQUE INDEX ON analytics_ai_hourly (document_id, hour);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- Organization Members
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- Documents
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_parent ON documents(parent_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_published ON documents(published) WHERE published = true;
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_last_edited ON documents(last_edited_at DESC);
CREATE INDEX idx_documents_title_trgm ON documents USING GIN (title gin_trgm_ops);

-- Document Blocks
CREATE INDEX idx_blocks_document ON document_blocks(document_id);
CREATE INDEX idx_blocks_parent ON document_blocks(parent_id);
CREATE INDEX idx_blocks_position ON document_blocks(document_id, position);

-- Presence
CREATE INDEX idx_presence_document ON document_presence(document_id);
CREATE INDEX idx_presence_last_seen ON document_presence(last_seen);

-- Comments
CREATE INDEX idx_comments_document ON comments(document_id);
CREATE INDEX idx_comments_block ON comments(block_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Embeddings
CREATE INDEX idx_embeddings_document ON document_embeddings(document_id);
CREATE INDEX idx_embeddings_vector ON document_embeddings USING hnsw (embedding vector_cosine_ops);

-- Search Index
CREATE INDEX idx_search_vector ON document_search_index USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_search_title_trgm ON document_search_index USING GIN (title gin_trgm_ops);

-- Exports
CREATE INDEX idx_exports_document ON document_exports(document_id);
CREATE INDEX idx_exports_expires ON document_exports(expires_at);

-- Analytics
CREATE INDEX idx_analytics_document_time ON analytics_events(document_id, timestamp DESC);
CREATE INDEX idx_analytics_org_time ON analytics_events(organization_id, timestamp DESC);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_visitor ON analytics_events(visitor_id);

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_blocks_updated_at BEFORE UPDATE ON document_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_summaries_updated_at BEFORE UPDATE ON document_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_key_points_updated_at BEFORE UPDATE ON document_key_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_tags_updated_at BEFORE UPDATE ON document_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_search_index_updated_at BEFORE UPDATE ON document_search_index
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (Optional - for multi-tenant)
-- ─────────────────────────────────────────────

-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY documents_org_policy ON documents
--     USING (organization_id IN (
--         SELECT organization_id FROM organization_members WHERE user_id = current_user_id()
--     ));

-- ─────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────

-- Function to create monthly partition automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date
    );
    
    -- Create indexes on new partition
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_document_time ON %I (document_id, timestamp DESC)', 
        partition_name || '_doc_time', partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_org_time ON %I (organization_id, timestamp DESC)', 
        partition_name || '_org_time', partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_event_type ON %I (event_type)', 
        partition_name || '_event_type', partition_name);
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- DEFAULT DATA
-- ─────────────────────────────────────────────

-- Insert default organization for development
INSERT INTO organizations (id, name, slug, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'DocuFlow Demo',
    'demo',
    '{"allowPublicPublish": true, "aiEnabled": true}'
) ON CONFLICT (slug) DO NOTHING;