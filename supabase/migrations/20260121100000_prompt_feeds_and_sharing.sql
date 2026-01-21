-- Phase 9: Prompt Feeds and Sharing
-- This migration adds:
-- 1. prompt_feeds table for external prompt sources
-- 2. external_prompts table for prompts from feeds
-- 3. prompt_shares table for sharing prompts with specific employees
-- 4. Updates to prompt_templates for sharing functionality

-- =============================================
-- Prompt Feeds (External Sources)
-- =============================================
CREATE TABLE IF NOT EXISTS public.prompt_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'webhook', 'rss', 'manual')),
  source_url TEXT,
  api_key_encrypted TEXT,
  refresh_interval_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending' CHECK (last_sync_status IN ('pending', 'success', 'error')),
  last_sync_error TEXT,
  sync_count INTEGER DEFAULT 0,
  created_by TEXT, -- user_email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prompt_feeds ENABLE ROW LEVEL SECURITY;

-- Everyone can view active feeds
CREATE POLICY "prompt_feeds_select_active" ON public.prompt_feeds
  FOR SELECT USING (is_active = TRUE);

-- =============================================
-- External Prompts (from feeds)
-- =============================================
CREATE TABLE IF NOT EXISTS public.external_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES public.prompt_feeds(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Original ID from the source
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  author TEXT,
  source_url TEXT,
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  popularity_score INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feed_id, external_id)
);

ALTER TABLE public.external_prompts ENABLE ROW LEVEL SECURITY;

-- Everyone can view external prompts
CREATE POLICY "external_prompts_select_all" ON public.external_prompts
  FOR SELECT USING (TRUE);

-- =============================================
-- Prompt Shares (share prompts with specific employees)
-- =============================================
CREATE TABLE IF NOT EXISTS public.prompt_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  shared_by TEXT NOT NULL, -- user_email of owner
  shared_with TEXT NOT NULL, -- user_email of recipient
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, shared_with)
);

ALTER TABLE public.prompt_shares ENABLE ROW LEVEL SECURITY;

-- Users can see shares where they are the owner or recipient
CREATE POLICY "prompt_shares_select" ON public.prompt_shares
  FOR SELECT USING (
    shared_by = current_setting('request.jwt.claim.email', true)::TEXT
    OR shared_with = current_setting('request.jwt.claim.email', true)::TEXT
  );

-- Users can create shares for prompts they own
CREATE POLICY "prompt_shares_insert" ON public.prompt_shares
  FOR INSERT WITH CHECK (
    shared_by = current_setting('request.jwt.claim.email', true)::TEXT
  );

-- Users can delete shares they created
CREATE POLICY "prompt_shares_delete" ON public.prompt_shares
  FOR DELETE USING (
    shared_by = current_setting('request.jwt.claim.email', true)::TEXT
  );

-- =============================================
-- Add shared_with_emails to prompt_templates
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_templates' AND column_name = 'shared_with_emails'
  ) THEN
    ALTER TABLE public.prompt_templates ADD COLUMN shared_with_emails TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- =============================================
-- Update prompt_templates RLS to include shared prompts
-- =============================================
DROP POLICY IF EXISTS "Users can view own prompts and public prompts" ON public.prompt_templates;
DROP POLICY IF EXISTS "prompt_templates_select" ON public.prompt_templates;

CREATE POLICY "prompt_templates_select" ON public.prompt_templates
  FOR SELECT USING (
    user_email = current_setting('request.jwt.claim.email', true)::TEXT
    OR is_public = TRUE
    OR current_setting('request.jwt.claim.email', true)::TEXT = ANY(shared_with_emails)
    OR EXISTS (
      SELECT 1 FROM public.prompt_shares
      WHERE prompt_id = prompt_templates.id
      AND shared_with = current_setting('request.jwt.claim.email', true)::TEXT
    )
  );

-- =============================================
-- Helper Functions
-- =============================================

-- Function to share a prompt with another user
CREATE OR REPLACE FUNCTION public.share_prompt(
  p_prompt_id UUID,
  p_owner_email TEXT,
  p_share_with_email TEXT,
  p_can_edit BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN
  -- Check if the requester owns the prompt
  SELECT EXISTS (
    SELECT 1 FROM public.prompt_templates
    WHERE id = p_prompt_id AND user_email = p_owner_email
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RETURN FALSE;
  END IF;

  -- Insert the share record
  INSERT INTO public.prompt_shares (prompt_id, shared_by, shared_with, can_edit)
  VALUES (p_prompt_id, p_owner_email, p_share_with_email, p_can_edit)
  ON CONFLICT (prompt_id, shared_with)
  DO UPDATE SET can_edit = p_can_edit;

  -- Update the shared_with_emails array
  UPDATE public.prompt_templates
  SET shared_with_emails = array_append(
    COALESCE(array_remove(shared_with_emails, p_share_with_email), '{}'),
    p_share_with_email
  )
  WHERE id = p_prompt_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unshare a prompt
CREATE OR REPLACE FUNCTION public.unshare_prompt(
  p_prompt_id UUID,
  p_owner_email TEXT,
  p_unshare_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN
  -- Check if the requester owns the prompt
  SELECT EXISTS (
    SELECT 1 FROM public.prompt_templates
    WHERE id = p_prompt_id AND user_email = p_owner_email
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RETURN FALSE;
  END IF;

  -- Delete the share record
  DELETE FROM public.prompt_shares
  WHERE prompt_id = p_prompt_id AND shared_with = p_unshare_email;

  -- Update the shared_with_emails array
  UPDATE public.prompt_templates
  SET shared_with_emails = array_remove(shared_with_emails, p_unshare_email)
  WHERE id = p_prompt_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get prompts shared with a user
CREATE OR REPLACE FUNCTION public.get_shared_prompts(
  p_user_email TEXT
) RETURNS SETOF public.prompt_templates AS $$
BEGIN
  RETURN QUERY
  SELECT pt.*
  FROM public.prompt_templates pt
  WHERE pt.user_email = p_user_email
     OR pt.is_public = TRUE
     OR p_user_email = ANY(pt.shared_with_emails)
     OR EXISTS (
       SELECT 1 FROM public.prompt_shares ps
       WHERE ps.prompt_id = pt.id AND ps.shared_with = p_user_email
     )
  ORDER BY pt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to copy an external prompt to user's library
CREATE OR REPLACE FUNCTION public.import_external_prompt(
  p_user_email TEXT,
  p_external_prompt_id UUID
) RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
  v_prompt RECORD;
BEGIN
  -- Get the external prompt
  SELECT * INTO v_prompt
  FROM public.external_prompts
  WHERE id = p_external_prompt_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Create a copy in user's library
  INSERT INTO public.prompt_templates (
    user_email, title, description, content, category, tags, difficulty, is_public
  ) VALUES (
    p_user_email,
    v_prompt.title,
    v_prompt.description,
    v_prompt.content,
    v_prompt.category,
    v_prompt.tags,
    v_prompt.difficulty,
    FALSE
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_prompt_feeds_is_active ON public.prompt_feeds(is_active);
CREATE INDEX IF NOT EXISTS idx_external_prompts_feed_id ON public.external_prompts(feed_id);
CREATE INDEX IF NOT EXISTS idx_external_prompts_category ON public.external_prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompt_shares_prompt_id ON public.prompt_shares(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_shares_shared_with ON public.prompt_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_shared_with ON public.prompt_templates USING GIN(shared_with_emails);

-- =============================================
-- Seed some sample prompt feeds (admin-created)
-- =============================================
INSERT INTO public.prompt_feeds (name, description, source_type, source_url, is_active, created_by)
VALUES
  ('OneEdge Essentials', 'Curated essential prompts for enterprise productivity', 'manual', NULL, TRUE, 'system'),
  ('Developer Tools', 'Prompts optimized for code generation and debugging', 'manual', NULL, TRUE, 'system'),
  ('Content Creation', 'Writing, editing, and content generation prompts', 'manual', NULL, TRUE, 'system')
ON CONFLICT DO NOTHING;

-- Seed some sample external prompts
INSERT INTO public.external_prompts (feed_id, external_id, title, description, content, author, category, tags, difficulty)
SELECT
  f.id,
  'essential-001',
  'Professional Email Writer',
  'Transform your rough notes into polished professional emails',
  E'You are an expert email writer. Transform the following rough notes into a professional email.\n\nNotes: {user_input}\n\nConsider:\n- Appropriate tone for business communication\n- Clear and concise language\n- Professional greeting and closing\n- Proper formatting',
  'OneEdge Team',
  'Content',
  ARRAY['email', 'writing', 'professional'],
  'beginner'
FROM public.prompt_feeds f WHERE f.name = 'OneEdge Essentials'
ON CONFLICT DO NOTHING;

INSERT INTO public.external_prompts (feed_id, external_id, title, description, content, author, category, tags, difficulty)
SELECT
  f.id,
  'essential-002',
  'Meeting Summary Generator',
  'Generate structured meeting summaries with action items',
  E'Analyze the following meeting notes and create a structured summary.\n\nMeeting Notes:\n{user_input}\n\nProvide:\n1. **Key Discussion Points** - Main topics discussed\n2. **Decisions Made** - Any decisions finalized\n3. **Action Items** - Tasks with owners and deadlines\n4. **Next Steps** - Follow-up meetings or activities\n5. **Parking Lot** - Items to discuss later',
  'OneEdge Team',
  'General',
  ARRAY['meetings', 'summary', 'productivity'],
  'beginner'
FROM public.prompt_feeds f WHERE f.name = 'OneEdge Essentials'
ON CONFLICT DO NOTHING;

INSERT INTO public.external_prompts (feed_id, external_id, title, description, content, author, category, tags, difficulty)
SELECT
  f.id,
  'dev-001',
  'Code Review Assistant',
  'Get thorough code reviews with actionable feedback',
  E'You are a senior software engineer conducting a code review. Analyze the following code for:\n\n1. **Bugs & Errors** - Logic errors, edge cases, potential crashes\n2. **Security** - Vulnerabilities, injection risks, data exposure\n3. **Performance** - Inefficiencies, memory leaks, optimization opportunities\n4. **Maintainability** - Code clarity, naming, documentation\n5. **Best Practices** - Design patterns, SOLID principles\n\nCode to review:\n```\n{user_input}\n```\n\nProvide specific, actionable feedback with code suggestions where applicable.',
  'OneEdge Team',
  'Development',
  ARRAY['code-review', 'development', 'quality'],
  'intermediate'
FROM public.prompt_feeds f WHERE f.name = 'Developer Tools'
ON CONFLICT DO NOTHING;

INSERT INTO public.external_prompts (feed_id, external_id, title, description, content, author, category, tags, difficulty)
SELECT
  f.id,
  'dev-002',
  'Debug Assistant',
  'Systematic debugging help for tricky issues',
  E'You are an expert debugger. Help diagnose and fix the following issue.\n\n**Error/Issue:**\n{user_input}\n\nAnalyze this systematically:\n1. What is the immediate error/symptom?\n2. What are possible root causes?\n3. What information would help narrow down the issue?\n4. Suggest debugging steps in order of likelihood\n5. Provide potential fixes with explanations\n\nIf code is provided, analyze it for common issues.',
  'OneEdge Team',
  'Development',
  ARRAY['debugging', 'development', 'troubleshooting'],
  'intermediate'
FROM public.prompt_feeds f WHERE f.name = 'Developer Tools'
ON CONFLICT DO NOTHING;

INSERT INTO public.external_prompts (feed_id, external_id, title, description, content, author, category, tags, difficulty)
SELECT
  f.id,
  'content-001',
  'Blog Post Outliner',
  'Create comprehensive blog post outlines with SEO considerations',
  E'Create a detailed blog post outline for the following topic.\n\nTopic: {user_input}\n\nProvide:\n1. **Title Options** - 3 engaging, SEO-friendly titles\n2. **Target Audience** - Who should read this\n3. **Key Takeaways** - What readers will learn\n4. **Outline**\n   - Introduction hook\n   - Main sections with subpoints\n   - Conclusion with CTA\n5. **SEO Keywords** - Primary and secondary keywords\n6. **Estimated Length** - Word count recommendation',
  'OneEdge Team',
  'Content',
  ARRAY['writing', 'blog', 'seo', 'content'],
  'beginner'
FROM public.prompt_feeds f WHERE f.name = 'Content Creation'
ON CONFLICT DO NOTHING;
