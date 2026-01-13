-- ============================================================================
-- OneEdge Platform - New Tables Migration
-- Created: 2026-01-08
-- Description: Creates tables specific to OneEdge that complement EdgeAdmin tables
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USER ROLES TABLE
-- Purpose: Distinguish OneEdge admins from regular employees
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);

COMMENT ON TABLE public.user_roles IS 'OneEdge user roles - distinguishes platform admins from employees';
COMMENT ON COLUMN public.user_roles.role IS 'admin = OneEdge platform admin, employee = regular user';

-- ============================================================================
-- 2. AGENTS TABLE
-- Purpose: Custom agent definitions created by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL,
  system_prompt TEXT,
  workflow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_with UUID[] DEFAULT ARRAY[]::UUID[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.agents IS 'Custom AI agent definitions created by users';
COMMENT ON COLUMN public.agents.workflow_data IS 'Visual node-based workflow configuration (ReactFlow data)';
COMMENT ON COLUMN public.agents.shared_with IS 'Array of user IDs who can access this agent';

-- Index for faster lookups
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_is_shared ON public.agents(is_shared) WHERE is_shared = TRUE;

-- ============================================================================
-- 3. EDGE VAULT CREDENTIALS TABLE
-- Purpose: Secure credential storage for integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.edge_vault_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'google', 'slack', 'jira', 'n8n', 'github', 'notion', 'custom'
  )),
  label TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'revoked')),
  last_validated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.edge_vault_credentials IS 'Secure storage for user integration credentials';
COMMENT ON COLUMN public.edge_vault_credentials.encrypted_credentials IS 'AES-256 encrypted JSON containing credentials';

-- Index for faster lookups
CREATE INDEX idx_edge_vault_user_id ON public.edge_vault_credentials(user_id);
CREATE INDEX idx_edge_vault_integration_type ON public.edge_vault_credentials(integration_type);

-- ============================================================================
-- 4. AUTOMATION TEMPLATES TABLE
-- Purpose: Admin-maintained automation templates for common workflows
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'gsuite', 'slack', 'jira', 'chat', 'email', 'custom'
  )),
  template_data JSONB NOT NULL,
  required_credentials TEXT[] DEFAULT ARRAY[]::TEXT[],
  default_model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.automation_templates IS 'Pre-built automation templates maintained by admins';
COMMENT ON COLUMN public.automation_templates.required_credentials IS 'Integration types required to use this template';

-- Index for faster lookups
CREATE INDEX idx_automation_templates_category ON public.automation_templates(category);
CREATE INDEX idx_automation_templates_is_active ON public.automation_templates(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 5. PROMPT FEEDS TABLE
-- Purpose: External prompt source configurations (admin-managed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prompt_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'webhook', 'rss')),
  source_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  auth_header TEXT,
  refresh_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (refresh_interval_minutes >= 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'pending')),
  last_sync_error TEXT,
  prompts_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.prompt_feeds IS 'External prompt community feed configurations';

-- Index for active feeds
CREATE INDEX idx_prompt_feeds_is_active ON public.prompt_feeds(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 6. EXTERNAL PROMPTS TABLE
-- Purpose: Prompts fetched from external feeds
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.external_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID NOT NULL REFERENCES public.prompt_feeds(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  author TEXT,
  author_url TEXT,
  source_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  uses_count INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_prompts_feed_external_id_unique UNIQUE (feed_id, external_id)
);

COMMENT ON TABLE public.external_prompts IS 'Prompts imported from external community feeds';

-- Index for faster lookups
CREATE INDEX idx_external_prompts_feed_id ON public.external_prompts(feed_id);
CREATE INDEX idx_external_prompts_category ON public.external_prompts(category);

-- ============================================================================
-- 7. AI GALLERY REQUESTS TABLE
-- Purpose: Employee requests for new models or tools
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_gallery_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('model', 'tool')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  use_case TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'rejected', 'implemented'
  )),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ai_gallery_requests IS 'Employee requests for new AI models or tools';

-- Index for faster lookups
CREATE INDEX idx_ai_gallery_requests_user_id ON public.ai_gallery_requests(user_id);
CREATE INDEX idx_ai_gallery_requests_status ON public.ai_gallery_requests(status);
CREATE INDEX idx_ai_gallery_requests_type ON public.ai_gallery_requests(request_type);

-- ============================================================================
-- 8. N8N CONFIGURATIONS TABLE
-- Purpose: User-specific n8n instance configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.n8n_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  webhook_url TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN (
    'connected', 'disconnected', 'error', 'pending'
  )),
  last_sync_at TIMESTAMPTZ,
  workflows_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT n8n_configurations_user_id_unique UNIQUE (user_id)
);

COMMENT ON TABLE public.n8n_configurations IS 'User n8n instance connection settings';

-- ============================================================================
-- 9. PROJECTS TABLE
-- Purpose: Conversation organization for mobile app
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#0066FF',
  icon TEXT NOT NULL DEFAULT 'folder',
  conversation_ids UUID[] DEFAULT ARRAY[]::UUID[],
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'Mobile app conversation organization';

-- Index for faster lookups
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_is_archived ON public.projects(is_archived);

-- ============================================================================
-- 10. SIA MEMORY TABLE
-- Purpose: Persistent Sia voice assistant memory per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sia_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_data JSONB NOT NULL DEFAULT '{
    "facts": [],
    "preferences": {},
    "context": {},
    "recentTopics": []
  }'::jsonb,
  summary TEXT,
  personality_adjustments JSONB DEFAULT '{}'::jsonb,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sia_memory_user_id_unique UNIQUE (user_id)
);

COMMENT ON TABLE public.sia_memory IS 'Persistent memory for Sia voice assistant';
COMMENT ON COLUMN public.sia_memory.memory_data IS 'Structured memory including facts, preferences, context';
COMMENT ON COLUMN public.sia_memory.summary IS 'Rolling summary of user interactions';

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all new tables
CREATE TRIGGER set_updated_at_user_roles
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_agents
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_edge_vault_credentials
  BEFORE UPDATE ON public.edge_vault_credentials
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_automation_templates
  BEFORE UPDATE ON public.automation_templates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_prompt_feeds
  BEFORE UPDATE ON public.prompt_feeds
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_external_prompts
  BEFORE UPDATE ON public.external_prompts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_ai_gallery_requests
  BEFORE UPDATE ON public.ai_gallery_requests
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_n8n_configurations
  BEFORE UPDATE ON public.n8n_configurations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_sia_memory
  BEFORE UPDATE ON public.sia_memory
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_oneedge_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  RETURN COALESCE(user_role, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY - ENABLE RLS
-- ============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_vault_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_gallery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sia_memory ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- USER ROLES POLICIES
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_oneedge_admin(auth.uid()) OR NOT EXISTS (SELECT 1 FROM public.user_roles));

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles FOR UPDATE
  USING (public.is_oneedge_admin(auth.uid()));

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE
  USING (public.is_oneedge_admin(auth.uid()));

-- AGENTS POLICIES
CREATE POLICY "agents_select_own_or_shared"
  ON public.agents FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = ANY(shared_with)
    OR (is_shared = TRUE AND public.is_oneedge_admin(auth.uid()))
  );

CREATE POLICY "agents_insert_own"
  ON public.agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agents_update_own"
  ON public.agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "agents_delete_own"
  ON public.agents FOR DELETE
  USING (auth.uid() = user_id);

-- EDGE VAULT CREDENTIALS POLICIES (Strict - user only)
CREATE POLICY "edge_vault_select_own"
  ON public.edge_vault_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "edge_vault_insert_own"
  ON public.edge_vault_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "edge_vault_update_own"
  ON public.edge_vault_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "edge_vault_delete_own"
  ON public.edge_vault_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- AUTOMATION TEMPLATES POLICIES (Admins manage, employees read active)
CREATE POLICY "automation_templates_select_active"
  ON public.automation_templates FOR SELECT
  USING (is_active = TRUE OR public.is_oneedge_admin(auth.uid()));

CREATE POLICY "automation_templates_insert_admin"
  ON public.automation_templates FOR INSERT
  WITH CHECK (public.is_oneedge_admin(auth.uid()));

CREATE POLICY "automation_templates_update_admin"
  ON public.automation_templates FOR UPDATE
  USING (public.is_oneedge_admin(auth.uid()));

CREATE POLICY "automation_templates_delete_admin"
  ON public.automation_templates FOR DELETE
  USING (public.is_oneedge_admin(auth.uid()));

-- PROMPT FEEDS POLICIES (Admins manage, employees read active)
CREATE POLICY "prompt_feeds_select_active"
  ON public.prompt_feeds FOR SELECT
  USING (is_active = TRUE OR public.is_oneedge_admin(auth.uid()));

CREATE POLICY "prompt_feeds_insert_admin"
  ON public.prompt_feeds FOR INSERT
  WITH CHECK (public.is_oneedge_admin(auth.uid()));

CREATE POLICY "prompt_feeds_update_admin"
  ON public.prompt_feeds FOR UPDATE
  USING (public.is_oneedge_admin(auth.uid()));

CREATE POLICY "prompt_feeds_delete_admin"
  ON public.prompt_feeds FOR DELETE
  USING (public.is_oneedge_admin(auth.uid()));

-- EXTERNAL PROMPTS POLICIES (Everyone can read)
CREATE POLICY "external_prompts_select_all"
  ON public.external_prompts FOR SELECT
  USING (TRUE);

CREATE POLICY "external_prompts_insert_admin"
  ON public.external_prompts FOR INSERT
  WITH CHECK (public.is_oneedge_admin(auth.uid()));

CREATE POLICY "external_prompts_update_admin"
  ON public.external_prompts FOR UPDATE
  USING (public.is_oneedge_admin(auth.uid()));

CREATE POLICY "external_prompts_delete_admin"
  ON public.external_prompts FOR DELETE
  USING (public.is_oneedge_admin(auth.uid()));

-- AI GALLERY REQUESTS POLICIES
CREATE POLICY "ai_gallery_requests_select_own_or_admin"
  ON public.ai_gallery_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_oneedge_admin(auth.uid()));

CREATE POLICY "ai_gallery_requests_insert_own"
  ON public.ai_gallery_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_gallery_requests_update_own_or_admin"
  ON public.ai_gallery_requests FOR UPDATE
  USING (auth.uid() = user_id OR public.is_oneedge_admin(auth.uid()));

CREATE POLICY "ai_gallery_requests_delete_admin"
  ON public.ai_gallery_requests FOR DELETE
  USING (public.is_oneedge_admin(auth.uid()));

-- N8N CONFIGURATIONS POLICIES (Strict - user only)
CREATE POLICY "n8n_configurations_select_own"
  ON public.n8n_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "n8n_configurations_insert_own"
  ON public.n8n_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "n8n_configurations_update_own"
  ON public.n8n_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "n8n_configurations_delete_own"
  ON public.n8n_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- PROJECTS POLICIES (Strict - user only)
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- SIA MEMORY POLICIES (Strict - user only)
CREATE POLICY "sia_memory_select_own"
  ON public.sia_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sia_memory_insert_own"
  ON public.sia_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sia_memory_update_own"
  ON public.sia_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "sia_memory_delete_own"
  ON public.sia_memory FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table access to authenticated users (RLS handles row-level permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edge_vault_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_feeds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_prompts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_gallery_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sia_memory TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.is_oneedge_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- ============================================================================
-- RPC FUNCTIONS FOR PROMPT LIKES
-- ============================================================================

-- Function to increment prompt likes count
CREATE OR REPLACE FUNCTION public.increment_prompt_likes(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.prompt_templates
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement prompt likes count
CREATE OR REPLACE FUNCTION public.decrement_prompt_likes(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.prompt_templates
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment prompt uses count
CREATE OR REPLACE FUNCTION public.increment_prompt_uses(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.prompt_templates
  SET uses_count = COALESCE(uses_count, 0) + 1
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment automation template usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.automation_templates
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution on RPC functions
GRANT EXECUTE ON FUNCTION public.increment_prompt_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_prompt_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_prompt_uses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_usage(UUID) TO authenticated;
