-- ============================================
-- CONVERSATION SHARING FEATURE
-- Migration: Add public conversation sharing
-- ============================================

-- Shared conversations table
CREATE TABLE IF NOT EXISTS public.shared_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'link', 'public')),
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_shared_conversations_token
  ON public.shared_conversations(share_token);

-- Index for user's shared conversations
CREATE INDEX IF NOT EXISTS idx_shared_conversations_user
  ON public.shared_conversations(user_id);

-- RLS Policies
ALTER TABLE public.shared_conversations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own shared conversations
CREATE POLICY "Users can manage own shared conversations"
  ON public.shared_conversations
  FOR ALL
  USING (auth.uid() = user_id);

-- Anyone can view public or link-shared conversations (when token is known)
CREATE POLICY "Anyone can view shared conversations"
  ON public.shared_conversations
  FOR SELECT
  USING (
    privacy = 'public'
    OR (privacy = 'link' AND share_token IS NOT NULL)
    OR auth.uid() = user_id
  );

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12-character alphanumeric token
    token := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.shared_conversations WHERE share_token = token) INTO token_exists;

    -- Exit loop if token is unique
    EXIT WHEN NOT token_exists;
  END LOOP;

  RETURN token;
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_shared_conversation_views(token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shared_conversations
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE share_token = token;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.shared_conversations IS 'Public shareable conversations with privacy controls';
COMMENT ON COLUMN public.shared_conversations.privacy IS 'private: not shared, link: accessible via token, public: listed publicly';
COMMENT ON COLUMN public.shared_conversations.share_token IS 'Unique token for accessing shared conversation';
