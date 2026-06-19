-- Lexicon AI — Supabase Schema Setup
-- Run this in the Supabase SQL Editor

-- Drop trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop tables if they exist (for fresh setup, ordered by dependencies)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS shared_documents CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.lawyers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;

-- ==========================================
-- 1. TABLE CREATION
-- ==========================================

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'lawyer',
    name VARCHAR(255) DEFAULT 'Unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lawyers table
CREATE TABLE public.lawyers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    specialty VARCHAR(255) DEFAULT 'General Counsel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clients table (no lawyer_id — lawyer assignment happens per-appointment)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analyses table
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

-- Shared Documents table
CREATE TABLE shared_documents (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES analyses(document_id) ON DELETE CASCADE,
    lawyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, client_id)
);

-- Messages table
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES analyses(document_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL DEFAULT 'lawyer',
    sender_name VARCHAR(255) DEFAULT 'Unknown',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES analyses(document_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table (lawyer_id is nullable for "any available" booking)
CREATE TABLE public.appointments (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name VARCHAR(255) DEFAULT 'Client',
    lawyer_name VARCHAR(255) DEFAULT 'Lawyer',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 2. TRIGGER ROUTING DEFINITION
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role VARCHAR(50);
  user_name VARCHAR(255);
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'lawyer');
  user_name := COALESCE(new.raw_user_meta_data->>'name', 'Unknown');
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (
    new.id,
    new.email,
    user_role,
    user_name
  );
  
  -- Conditionally insert into lawyers or clients
  IF user_role = 'lawyer' THEN
    INSERT INTO public.lawyers (id, name, email, specialty)
    VALUES (
      new.id,
      user_name,
      new.email,
      COALESCE(new.raw_user_meta_data->>'specialty', 'General Counsel')
    )
    ON CONFLICT (id) DO NOTHING;
  ELSIF user_role = 'client' THEN
    INSERT INTO public.clients (id, name, email)
    VALUES (
      new.id,
      user_name,
      new.email
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 4. CREATE SECURITY POLICIES
-- ==========================================

-- Profiles policies
CREATE POLICY "Users can view own profile or lawyers" ON public.profiles FOR SELECT USING (auth.uid() = id OR role = 'lawyer' OR EXISTS (SELECT 1 FROM public.clients c WHERE (c.id = public.profiles.id AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.client_id = c.id AND a.lawyer_id = auth.uid())) OR (c.id = auth.uid())));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Lawyers policies
CREATE POLICY "Anyone can view lawyers" ON public.lawyers FOR SELECT USING (true);
CREATE POLICY "Lawyers can update own profile" ON public.lawyers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access on lawyers" ON public.lawyers FOR ALL USING (true) WITH CHECK (true);

-- Clients policies (lawyers can view all clients, clients can view self)
CREATE POLICY "Clients and lawyers can view client details" ON public.clients FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'lawyer')
);
CREATE POLICY "Clients can update own profile" ON public.clients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Analyses policies
CREATE POLICY "Users can view own analyses" ON analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON analyses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on analyses" ON analyses FOR ALL USING (true) WITH CHECK (true);

-- Shared Documents policies
CREATE POLICY "Lawyers and clients can view shared documents" ON shared_documents FOR SELECT USING (auth.uid() = lawyer_id OR auth.uid() = client_id);
CREATE POLICY "Lawyers can share documents" ON shared_documents FOR INSERT WITH CHECK (auth.uid() = lawyer_id);
CREATE POLICY "Lawyers can unshare documents" ON shared_documents FOR DELETE USING (auth.uid() = lawyer_id);
CREATE POLICY "Service role full access on shared_documents" ON shared_documents FOR ALL USING (true) WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages for their documents" ON messages FOR SELECT USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM analyses a WHERE a.document_id = messages.document_id AND a.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM shared_documents sd WHERE sd.document_id = messages.document_id AND (sd.lawyer_id = auth.uid() OR sd.client_id = auth.uid())));
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Service role full access on messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- Notes policies
CREATE POLICY "Users can view notes of accessible documents" ON notes FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM shared_documents sd 
      WHERE sd.document_id = notes.document_id 
      AND (sd.lawyer_id = auth.uid() OR sd.client_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM analyses a
      WHERE a.document_id = notes.document_id
      AND a.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create notes for accessible documents" ON notes FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM analyses a WHERE a.document_id = notes.document_id AND a.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM shared_documents sd WHERE sd.document_id = notes.document_id AND (sd.lawyer_id = auth.uid() OR sd.client_id = auth.uid())
      )
    )
);

CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on notes" ON notes FOR ALL USING (true) WITH CHECK (true);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id);
CREATE POLICY "Authenticated users can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = lawyer_id);
CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE USING (auth.uid() = client_id OR auth.uid() = lawyer_id);
CREATE POLICY "Service role full access on appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 5. INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

CREATE INDEX IF NOT EXISTS idx_messages_document_id ON messages(document_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_shared_documents_client_id ON shared_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_shared_documents_lawyer_id ON shared_documents(lawyer_id);

CREATE INDEX IF NOT EXISTS idx_notes_document_id ON notes(document_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer_id ON public.appointments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);


-- ==========================================
-- 6. SEED SELECTION DATA
-- ==========================================

-- Seed default lawyers into auth.users (trigger will propagate to profiles and lawyers)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES 
  (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 
    '00000000-0000-0000-0000-000000000000', 
    'johndoe@lexicon.com', 
    '$2a$10$U.48wT9r3eXgG10g3tKj9uvJ6a8W/tO2Z1Fep.FwM0bWwBbe8x8x2', -- bcrypt hash for 'password123'
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"John Doe, Esq.","role":"lawyer","specialty":"Corporate Law"}', 
    now(), 
    now(), 
    'authenticated', 
    'authenticated', 
    ''
  ),
  (
    'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', 
    '00000000-0000-0000-0000-000000000000', 
    'janesmith@lexicon.com', 
    '$2a$10$U.48wT9r3eXgG10g3tKj9uvJ6a8W/tO2Z1Fep.FwM0bWwBbe8x8x2', 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Jane Smith, Esq.","role":"lawyer","specialty":"Intellectual Property"}', 
    now(), 
    now(), 
    'authenticated', 
    'authenticated', 
    ''
  )
ON CONFLICT (id) DO NOTHING;
