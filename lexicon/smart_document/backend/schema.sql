-- Lexicon AI — Supabase Schema Setup
-- Run this in the Supabase SQL Editor

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS analyses;

-- Create analyses table with extended columns for history/library features
CREATE TABLE analyses (
    id BIGSERIAL,
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(500) DEFAULT 'Untitled Document',
    document_type VARCHAR(255) DEFAULT 'Unknown',
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    clauses JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_score NUMERIC(4,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own analyses
CREATE POLICY "Users can view own analyses"
    ON analyses FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
    ON analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own analyses
CREATE POLICY "Users can update own analyses"
    ON analyses FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
    ON analyses FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policy: Service role (backend) can do everything
CREATE POLICY "Service role full access"
    ON analyses FOR ALL
    USING (true)
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
