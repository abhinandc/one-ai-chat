-- Migration: Create user_preferences table and model ranking function
-- Phase 1 of IMPLEMENTATION_PLAN.md

-- ============================================
-- 1. USER PREFERENCES TABLE
-- ============================================
-- Stores user settings including chat preferences, n8n credentials, and model preferences

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,

  -- Chat Settings (from ChatSettingsDrawer)
  chat_system_prompt TEXT DEFAULT 'You are a helpful AI assistant.',
  chat_temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (chat_temperature >= 0 AND chat_temperature <= 2),
  chat_max_tokens INTEGER DEFAULT 4000 CHECK (chat_max_tokens > 0 AND chat_max_tokens <= 128000),
  chat_top_p NUMERIC(3,2) DEFAULT 0.9 CHECK (chat_top_p >= 0 AND chat_top_p <= 1),
  chat_stream_response BOOLEAN DEFAULT true,

  -- N8N Configuration (migrated from localStorage)
  n8n_instance_url TEXT,
  n8n_api_key_encrypted TEXT,
  n8n_connected BOOLEAN DEFAULT false,
  n8n_last_sync_at TIMESTAMPTZ,

  -- Model Preferences
  default_model_id TEXT,
  preferred_coding_model TEXT,
  preferred_chat_model TEXT,
  preferred_image_model TEXT,

  -- UI Preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  sidebar_collapsed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================
-- 4. MODEL RANKING FUNCTION
-- ============================================
-- Ranks models based on query type for smart model selection on the home page

CREATE OR REPLACE FUNCTION public.get_ranked_models_for_query(
  p_user_email TEXT,
  p_query_type TEXT DEFAULT 'chat', -- 'chat', 'code', 'image', 'analysis'
  p_limit INTEGER DEFAULT 4
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(ranked_models) INTO result
  FROM (
    SELECT
      m.id,
      m.name,
      m.display_name,
      m.provider,
      m.api_path,
      m.kind,
      m.mode,
      m.context_length,
      m.max_tokens,
      m.cost_per_1k_input,
      m.cost_per_1k_output,
      CASE
        -- Code-related queries: prefer models with 'code' in kind or name
        WHEN p_query_type = 'code' AND (m.kind ILIKE '%code%' OR m.name ILIKE '%code%' OR m.name ILIKE '%claude%') THEN 100
        -- Image-related queries: prefer vision models
        WHEN p_query_type = 'image' AND (m.kind ILIKE '%vision%' OR m.mode ILIKE '%image%' OR m.name ILIKE '%vision%') THEN 100
        -- Analysis queries: prefer models with large context
        WHEN p_query_type = 'analysis' AND m.context_length > 32000 THEN 90
        -- General chat: balanced scoring
        WHEN p_query_type = 'chat' THEN 50
        ELSE 30
      END as relevance_score
    FROM public.models m
    INNER JOIN public.virtual_keys vk ON vk.email = p_user_email
    WHERE m.is_available = true
      AND (
        -- Check if user has access to this model via virtual key
        vk.models_json::text ILIKE '%' || m.name || '%'
        OR vk.models_json::text ILIKE '%all%'
      )
      AND vk.disabled = false
    ORDER BY relevance_score DESC, m.name ASC
    LIMIT p_limit
  ) as ranked_models;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_ranked_models_for_query TO authenticated;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_email ON public.user_preferences(user_email);

-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.user_preferences IS 'User settings for chat, n8n integration, model preferences, and UI';
COMMENT ON COLUMN public.user_preferences.n8n_api_key_encrypted IS 'Encrypted N8N API key - use edge function for decryption';
COMMENT ON FUNCTION public.get_ranked_models_for_query IS 'Returns ranked models based on query type for smart model selection';
