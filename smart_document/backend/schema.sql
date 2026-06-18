-- Lexicon AI — Supabase Schema Setup
-- Run this in the Supabase SQL Editor

-- Drop tables if they exist (for fresh setup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS shared_documents;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS analyses;

-- Create profiles table first
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'lawyer',
    name VARCHAR(255) DEFAULT 'Unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Create trigger function to create profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'lawyer'),
    COALESCE(new.raw_user_meta_data->>'name', 'Unknown')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
    inconsistency_score NUMERIC(4,2) DEFAULT 0,
    inconsistencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT DEFAULT '',
    review_status VARCHAR(50) DEFAULT 'pending',
    lawyer_notes TEXT DEFAULT '',
    collaboration_messages JSONB DEFAULT '[]'::jsonb,
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


-- ============================================================================
-- Messages table — Client/Lawyer communication per document
-- ============================================================================
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES analyses(document_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL DEFAULT 'lawyer',
    sender_name VARCHAR(255) DEFAULT 'Unknown',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their documents"
    ON messages FOR SELECT
    USING (true);

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Service role full access on messages"
    ON messages FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_messages_document_id ON messages(document_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);


-- ============================================================================
-- Shared Documents table — Lawyer shares documents with clients
-- ============================================================================
CREATE TABLE shared_documents (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES analyses(document_id) ON DELETE CASCADE,
    lawyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, client_id)
);

ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers and clients can view shared documents"
    ON shared_documents FOR SELECT
    USING (auth.uid() = lawyer_id OR auth.uid() = client_id);

CREATE POLICY "Lawyers can share documents"
    ON shared_documents FOR INSERT
    WITH CHECK (auth.uid() = lawyer_id);

CREATE POLICY "Lawyers can unshare documents"
    ON shared_documents FOR DELETE
    USING (auth.uid() = lawyer_id);

CREATE POLICY "Service role full access on shared_documents"
    ON shared_documents FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shared_documents_client_id ON shared_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_shared_documents_lawyer_id ON shared_documents(lawyer_id);


-- ============================================================================
-- Notes table — Per-document notes by users
-- ============================================================================
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES analyses(document_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on notes"
    ON notes FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notes_document_id ON notes(document_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

