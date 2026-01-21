-- Phase 10: Playground Sessions
-- This migration adds Supabase persistence for playground sessions

-- =============================================
-- Playground Sessions Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.playground_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  top_p REAL DEFAULT 0.9,
  prompt TEXT NOT NULL,
  response TEXT,
  streaming_enabled BOOLEAN DEFAULT TRUE,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playground_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "playground_sessions_select" ON public.playground_sessions
  FOR SELECT USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "playground_sessions_insert" ON public.playground_sessions
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "playground_sessions_update" ON public.playground_sessions
  FOR UPDATE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "playground_sessions_delete" ON public.playground_sessions
  FOR DELETE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- =============================================
-- Playground Settings (user preferences for playground)
-- =============================================
CREATE TABLE IF NOT EXISTS public.playground_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  default_model TEXT,
  default_temperature REAL DEFAULT 0.7,
  default_max_tokens INTEGER DEFAULT 2048,
  default_top_p REAL DEFAULT 0.9,
  default_streaming BOOLEAN DEFAULT TRUE,
  auto_save_sessions BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playground_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playground_settings_all" ON public.playground_settings
  FOR ALL USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- =============================================
-- Helper Functions
-- =============================================

-- Save or update a playground session
CREATE OR REPLACE FUNCTION public.save_playground_session(
  p_user_email TEXT,
  p_session_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_temperature REAL DEFAULT 0.7,
  p_max_tokens INTEGER DEFAULT 2048,
  p_top_p REAL DEFAULT 0.9,
  p_prompt TEXT DEFAULT '',
  p_response TEXT DEFAULT '',
  p_streaming_enabled BOOLEAN DEFAULT TRUE,
  p_tokens_used INTEGER DEFAULT 0,
  p_response_time_ms INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_session_name TEXT;
BEGIN
  -- Generate name if not provided
  v_session_name := COALESCE(p_name, 'Session ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI'));

  IF p_session_id IS NOT NULL THEN
    -- Update existing session
    UPDATE public.playground_sessions
    SET
      name = v_session_name,
      model = COALESCE(p_model, model),
      temperature = p_temperature,
      max_tokens = p_max_tokens,
      top_p = p_top_p,
      prompt = p_prompt,
      response = p_response,
      streaming_enabled = p_streaming_enabled,
      tokens_used = p_tokens_used,
      response_time_ms = p_response_time_ms,
      updated_at = NOW()
    WHERE id = p_session_id AND user_email = p_user_email
    RETURNING id INTO v_session_id;

    IF v_session_id IS NOT NULL THEN
      RETURN v_session_id;
    END IF;
  END IF;

  -- Insert new session
  INSERT INTO public.playground_sessions (
    user_email, name, model, temperature, max_tokens, top_p,
    prompt, response, streaming_enabled, tokens_used, response_time_ms
  ) VALUES (
    p_user_email, v_session_name, COALESCE(p_model, ''), p_temperature, p_max_tokens, p_top_p,
    p_prompt, p_response, p_streaming_enabled, p_tokens_used, p_response_time_ms
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent playground sessions
CREATE OR REPLACE FUNCTION public.get_playground_sessions(
  p_user_email TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_favorites_only BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
  id UUID,
  name TEXT,
  model TEXT,
  temperature REAL,
  max_tokens INTEGER,
  top_p REAL,
  prompt TEXT,
  response TEXT,
  streaming_enabled BOOLEAN,
  is_favorite BOOLEAN,
  tags TEXT[],
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id, ps.name, ps.model, ps.temperature, ps.max_tokens, ps.top_p,
    ps.prompt, ps.response, ps.streaming_enabled, ps.is_favorite, ps.tags,
    ps.tokens_used, ps.response_time_ms, ps.created_at, ps.updated_at
  FROM public.playground_sessions ps
  WHERE ps.user_email = p_user_email
    AND (NOT p_favorites_only OR ps.is_favorite = TRUE)
  ORDER BY ps.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle favorite status
CREATE OR REPLACE FUNCTION public.toggle_session_favorite(
  p_session_id UUID,
  p_user_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_status BOOLEAN;
BEGIN
  UPDATE public.playground_sessions
  SET is_favorite = NOT is_favorite, updated_at = NOW()
  WHERE id = p_session_id AND user_email = p_user_email
  RETURNING is_favorite INTO v_new_status;

  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_playground_sessions_user ON public.playground_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_playground_sessions_created ON public.playground_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playground_sessions_favorite ON public.playground_sessions(user_email, is_favorite) WHERE is_favorite = TRUE;
