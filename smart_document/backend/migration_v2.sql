-- Migration: Add meeting_link column to appointments and create direct_messages table
-- Run this in your Supabase SQL Editor

-- 1. Add meeting_link column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500);

-- 2. Create direct_messages table for user-to-user messaging
CREATE TABLE IF NOT EXISTS direct_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID NOT NULL REFERENCES auth.users(id),
    sender_name TEXT NOT NULL DEFAULT 'User',
    sender_role TEXT NOT NULL DEFAULT 'client',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create index for efficient message queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);

-- 4. Enable RLS on direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for direct_messages
DROP POLICY IF EXISTS "Users can read their own messages" ON direct_messages;
CREATE POLICY "Users can read their own messages" ON direct_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

DROP POLICY IF EXISTS "Users can insert messages they send" ON direct_messages;
CREATE POLICY "Users can insert messages they send" ON direct_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- 6. Add phone numbers, sharing fields, available slots, and nullable note fields
ALTER TABLE notes ALTER COLUMN document_id DROP NOT NULL;
ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS available_slots TEXT DEFAULT '09:00,10:00,11:00,14:00,15:00,16:00';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS share_phone_with_lawyer BOOLEAN DEFAULT FALSE;

-- 7. Fix RLS policy on analyses table so that clients can view shared document details
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
CREATE POLICY "Users can view own or shared analyses" ON analyses
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM shared_documents
            WHERE shared_documents.document_id = analyses.document_id
            AND shared_documents.client_id = auth.uid()
        )
    );
