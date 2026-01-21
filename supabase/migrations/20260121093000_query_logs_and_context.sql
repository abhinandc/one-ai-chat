-- Migration: Create query_logs table for context/memory logging
-- Phase 6 of ROADMAP.md - Query Logger

-- ============================================
-- 1. QUERY LOGS TABLE
-- ============================================
-- Stores key contexts from conversations for employee-scoped memory

CREATE TABLE IF NOT EXISTS public.query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

  -- Query metadata
  query_text TEXT NOT NULL,
  query_type TEXT DEFAULT 'chat' CHECK (query_type IN ('chat', 'code', 'image', 'analysis', 'automation', 'agent')),
  model_used TEXT,

  -- Response summary (extracted key points)
  response_summary TEXT,
  key_entities JSONB DEFAULT '[]', -- Extracted entities: [{type: 'person', name: 'John'}, {type: 'topic', name: 'AI'}]
  key_topics TEXT[] DEFAULT '{}', -- Simple topic tags

  -- Context markers
  importance_score INTEGER DEFAULT 0 CHECK (importance_score >= 0 AND importance_score <= 10),
  is_bookmark BOOLEAN DEFAULT false, -- User can mark important queries
  context_tags TEXT[] DEFAULT '{}', -- User-added or auto-generated tags

  -- Usage metrics
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(query_text, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(response_summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(key_topics, ' '), '')), 'C')
  ) STORED
);

-- ============================================
-- 2. CONTEXT MEMORIES TABLE
-- ============================================
-- Persistent user context/memories extracted from conversations

CREATE TABLE IF NOT EXISTS public.context_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,

  -- Memory content
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'project', 'person', 'skill', 'goal')),
  content TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),

  -- Source tracking
  source_query_id UUID REFERENCES public.query_logs(id) ON DELETE SET NULL,
  source_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_memories ENABLE ROW LEVEL SECURITY;

-- Query logs policies
CREATE POLICY "Users can view own query logs" ON public.query_logs
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own query logs" ON public.query_logs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own query logs" ON public.query_logs
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own query logs" ON public.query_logs
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Context memories policies
CREATE POLICY "Users can view own memories" ON public.context_memories
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own memories" ON public.context_memories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own memories" ON public.context_memories
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own memories" ON public.context_memories
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_query_logs_user_email ON public.query_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_query_logs_conversation ON public.query_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON public.query_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_logs_query_type ON public.query_logs(query_type);
CREATE INDEX IF NOT EXISTS idx_query_logs_importance ON public.query_logs(importance_score DESC) WHERE importance_score > 5;
CREATE INDEX IF NOT EXISTS idx_query_logs_search ON public.query_logs USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_context_memories_user_email ON public.context_memories(user_email);
CREATE INDEX IF NOT EXISTS idx_context_memories_type ON public.context_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_context_memories_active ON public.context_memories(user_email, is_active) WHERE is_active = true;

-- ============================================
-- 5. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_context_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER context_memories_updated_at
  BEFORE UPDATE ON public.context_memories
  FOR EACH ROW EXECUTE FUNCTION update_context_memories_updated_at();

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to log a query and extract context
CREATE OR REPLACE FUNCTION public.log_query(
  p_user_email TEXT,
  p_conversation_id UUID,
  p_query_text TEXT,
  p_query_type TEXT DEFAULT 'chat',
  p_model_used TEXT DEFAULT NULL,
  p_response_summary TEXT DEFAULT NULL,
  p_key_topics TEXT[] DEFAULT '{}',
  p_tokens_input INTEGER DEFAULT 0,
  p_tokens_output INTEGER DEFAULT 0,
  p_response_time_ms INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.query_logs (
    user_email, conversation_id, query_text, query_type, model_used,
    response_summary, key_topics, tokens_input, tokens_output, response_time_ms
  ) VALUES (
    p_user_email, p_conversation_id, p_query_text, p_query_type, p_model_used,
    p_response_summary, p_key_topics, p_tokens_input, p_tokens_output, p_response_time_ms
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search query logs
CREATE OR REPLACE FUNCTION public.search_query_logs(
  p_user_email TEXT,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.query_logs AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.query_logs
  WHERE user_email = p_user_email
    AND search_vector @@ plainto_tsquery('english', p_search_query)
  ORDER BY ts_rank(search_vector, plainto_tsquery('english', p_search_query)) DESC, created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent context for a user
CREATE OR REPLACE FUNCTION public.get_recent_context(
  p_user_email TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(context) INTO result
  FROM (
    SELECT
      ql.id,
      ql.query_text,
      ql.response_summary,
      ql.key_topics,
      ql.query_type,
      ql.model_used,
      ql.created_at
    FROM public.query_logs ql
    WHERE ql.user_email = p_user_email
      AND ql.response_summary IS NOT NULL
    ORDER BY
      ql.importance_score DESC,
      ql.created_at DESC
    LIMIT p_limit
  ) as context;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active memories for a user
CREATE OR REPLACE FUNCTION public.get_user_memories(
  p_user_email TEXT,
  p_memory_type TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(memories) INTO result
  FROM (
    SELECT
      id,
      memory_type,
      content,
      confidence,
      last_accessed_at,
      access_count
    FROM public.context_memories
    WHERE user_email = p_user_email
      AND is_active = true
      AND (p_memory_type IS NULL OR memory_type = p_memory_type)
    ORDER BY confidence DESC, access_count DESC
  ) as memories;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.log_query TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_query_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_memories TO authenticated;

-- ============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.query_logs IS 'Logs queries and their context for employee-scoped memory and analytics';
COMMENT ON TABLE public.context_memories IS 'Persistent user memories extracted from conversations';
COMMENT ON COLUMN public.query_logs.key_entities IS 'Extracted entities in JSON format: [{type, name}]';
COMMENT ON COLUMN public.query_logs.importance_score IS 'Auto-calculated or user-set importance (0-10)';
COMMENT ON COLUMN public.context_memories.confidence IS 'Confidence score for the memory (0-1)';
COMMENT ON FUNCTION public.log_query IS 'Log a query with extracted context';
COMMENT ON FUNCTION public.search_query_logs IS 'Full-text search across query logs';
COMMENT ON FUNCTION public.get_recent_context IS 'Get recent context for continuity';
COMMENT ON FUNCTION public.get_user_memories IS 'Get active memories for a user';
