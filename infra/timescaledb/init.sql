CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'viewer',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    symbols TEXT[] NOT NULL DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(32) NOT NULL,
    condition VARCHAR(32) NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    channels TEXT[] DEFAULT '{email}',
    active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE economic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(512) NOT NULL,
    event_type VARCHAR(64),
    scheduled_at TIMESTAMPTZ NOT NULL,
    impact VARCHAR(16),
    commodities_affected TEXT[],
    description TEXT,
    actual_value VARCHAR(128),
    forecast_value VARCHAR(128),
    previous_value VARCHAR(128)
);

CREATE TABLE morning_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    content TEXT NOT NULL,
    summary TEXT,
    key_highlights JSONB DEFAULT '[]',
    commodities_mentioned TEXT[],
    model_used VARCHAR(64)
);
