-- Phase 12: Agents & Automations Enhancement
-- This migration adds N8N configuration persistence, EdgeVault, and automation templates

-- =============================================
-- N8N Configuration (Supabase persistence)
-- =============================================
CREATE TABLE IF NOT EXISTS public.n8n_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  instance_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  webhook_url TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  workflow_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "n8n_config_select" ON public.n8n_configurations
  FOR SELECT USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "n8n_config_insert" ON public.n8n_configurations
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "n8n_config_update" ON public.n8n_configurations
  FOR UPDATE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "n8n_config_delete" ON public.n8n_configurations
  FOR DELETE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- =============================================
-- EdgeVault Credentials (Secure credential storage)
-- =============================================
CREATE TABLE IF NOT EXISTS public.edge_vault_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'google', 'slack', 'jira', 'github', 'notion', 'salesforce',
    'hubspot', 'zendesk', 'asana', 'trello', 'monday', 'linear',
    'airtable', 'dropbox', 'box', 'onedrive', 'custom'
  )),
  label TEXT NOT NULL,
  encrypted_data TEXT NOT NULL, -- Encrypted JSON with credentials
  oauth_provider TEXT, -- For OAuth-based integrations
  oauth_scopes TEXT[], -- Scopes granted
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'revoked')),
  last_validated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, integration_type, label)
);

ALTER TABLE public.edge_vault_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_credentials_select" ON public.edge_vault_credentials
  FOR SELECT USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "vault_credentials_insert" ON public.edge_vault_credentials
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "vault_credentials_update" ON public.edge_vault_credentials
  FOR UPDATE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "vault_credentials_delete" ON public.edge_vault_credentials
  FOR DELETE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- =============================================
-- Automation Templates (Admin-maintained)
-- =============================================
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'gsuite', 'slack', 'jira', 'github', 'crm', 'productivity', 'communication', 'custom'
  )),
  subcategory TEXT, -- e.g., 'email', 'calendar', 'docs'
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'schedule', 'webhook', 'email', 'event', 'manual', 'ai_trigger'
  )),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'ai_process', 'send_email', 'post_message', 'create_doc',
    'update_record', 'api_call', 'multi_step'
  )),
  action_config JSONB DEFAULT '{}'::jsonb,
  ai_model TEXT, -- Preferred AI model for this template
  required_credentials TEXT[] DEFAULT '{}', -- Integration types needed
  icon TEXT,
  color TEXT,
  estimated_setup_minutes INTEGER DEFAULT 5,
  complexity TEXT DEFAULT 'simple' CHECK (complexity IN ('simple', 'medium', 'advanced')),
  use_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT, -- admin email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view active templates
CREATE POLICY "templates_select" ON public.automation_templates
  FOR SELECT USING (is_active = TRUE);

-- Only admins can manage templates (check user_roles table)
CREATE POLICY "templates_admin_all" ON public.automation_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_email = current_setting('request.jwt.claim.email', true)::TEXT
      AND role = 'admin'
    )
  );

-- =============================================
-- Custom Agents (User-created AI agents)
-- =============================================
CREATE TABLE IF NOT EXISTS public.custom_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  system_prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  tools TEXT[] DEFAULT '{}', -- Tool names this agent can use
  knowledge_base_ids UUID[] DEFAULT '{}', -- References to knowledge bases
  workflow_data JSONB DEFAULT '{}'::jsonb, -- Visual workflow definition
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with TEXT[] DEFAULT '{}', -- User emails who can access
  is_public BOOLEAN DEFAULT FALSE, -- Available to everyone in org
  use_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

-- Users can see their own agents, shared agents, and public agents
CREATE POLICY "agents_select" ON public.custom_agents
  FOR SELECT USING (
    user_email = current_setting('request.jwt.claim.email', true)::TEXT
    OR current_setting('request.jwt.claim.email', true)::TEXT = ANY(shared_with)
    OR is_public = TRUE
  );

CREATE POLICY "agents_insert" ON public.custom_agents
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "agents_update" ON public.custom_agents
  FOR UPDATE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

CREATE POLICY "agents_delete" ON public.custom_agents
  FOR DELETE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- =============================================
-- Helper Functions
-- =============================================

-- Save N8N configuration
CREATE OR REPLACE FUNCTION public.save_n8n_config(
  p_user_email TEXT,
  p_instance_url TEXT,
  p_api_key_encrypted TEXT,
  p_webhook_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_config_id UUID;
BEGIN
  INSERT INTO public.n8n_configurations (
    user_email, instance_url, api_key_encrypted, webhook_url, is_connected
  ) VALUES (
    p_user_email, p_instance_url, p_api_key_encrypted, p_webhook_url, TRUE
  )
  ON CONFLICT (user_email) DO UPDATE SET
    instance_url = EXCLUDED.instance_url,
    api_key_encrypted = EXCLUDED.api_key_encrypted,
    webhook_url = EXCLUDED.webhook_url,
    is_connected = TRUE,
    updated_at = NOW()
  RETURNING id INTO v_config_id;

  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get N8N configuration
CREATE OR REPLACE FUNCTION public.get_n8n_config(
  p_user_email TEXT
) RETURNS TABLE (
  id UUID,
  instance_url TEXT,
  api_key_encrypted TEXT,
  webhook_url TEXT,
  is_connected BOOLEAN,
  last_sync_at TIMESTAMPTZ,
  workflow_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.instance_url, c.api_key_encrypted, c.webhook_url,
    c.is_connected, c.last_sync_at, c.workflow_count
  FROM public.n8n_configurations c
  WHERE c.user_email = p_user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update N8N sync status
CREATE OR REPLACE FUNCTION public.update_n8n_sync(
  p_user_email TEXT,
  p_workflow_count INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.n8n_configurations
  SET
    last_sync_at = NOW(),
    workflow_count = p_workflow_count,
    updated_at = NOW()
  WHERE user_email = p_user_email;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add EdgeVault credential
CREATE OR REPLACE FUNCTION public.add_vault_credential(
  p_user_email TEXT,
  p_integration_type TEXT,
  p_label TEXT,
  p_encrypted_data TEXT,
  p_oauth_provider TEXT DEFAULT NULL,
  p_oauth_scopes TEXT[] DEFAULT '{}',
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_credential_id UUID;
BEGIN
  INSERT INTO public.edge_vault_credentials (
    user_email, integration_type, label, encrypted_data,
    oauth_provider, oauth_scopes, expires_at, metadata, last_validated_at
  ) VALUES (
    p_user_email, p_integration_type, p_label, p_encrypted_data,
    p_oauth_provider, p_oauth_scopes, p_expires_at, p_metadata, NOW()
  )
  ON CONFLICT (user_email, integration_type, label) DO UPDATE SET
    encrypted_data = EXCLUDED.encrypted_data,
    oauth_scopes = EXCLUDED.oauth_scopes,
    expires_at = EXCLUDED.expires_at,
    metadata = EXCLUDED.metadata,
    last_validated_at = NOW(),
    status = 'active',
    updated_at = NOW()
  RETURNING id INTO v_credential_id;

  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's vault credentials (without encrypted data for listing)
CREATE OR REPLACE FUNCTION public.get_vault_credentials(
  p_user_email TEXT,
  p_integration_type TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  integration_type TEXT,
  label TEXT,
  oauth_provider TEXT,
  oauth_scopes TEXT[],
  status TEXT,
  last_validated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.integration_type, c.label, c.oauth_provider, c.oauth_scopes,
    c.status, c.last_validated_at, c.expires_at, c.created_at
  FROM public.edge_vault_credentials c
  WHERE c.user_email = p_user_email
    AND (p_integration_type IS NULL OR c.integration_type = p_integration_type)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create custom agent
CREATE OR REPLACE FUNCTION public.create_custom_agent(
  p_user_email TEXT,
  p_name TEXT,
  p_description TEXT,
  p_system_prompt TEXT,
  p_model TEXT,
  p_temperature REAL DEFAULT 0.7,
  p_max_tokens INTEGER DEFAULT 2048,
  p_tools TEXT[] DEFAULT '{}',
  p_is_shared BOOLEAN DEFAULT FALSE,
  p_is_public BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  v_agent_id UUID;
BEGIN
  INSERT INTO public.custom_agents (
    user_email, name, description, system_prompt, model,
    temperature, max_tokens, tools, is_shared, is_public
  ) VALUES (
    p_user_email, p_name, p_description, p_system_prompt, p_model,
    p_temperature, p_max_tokens, p_tools, p_is_shared, p_is_public
  )
  RETURNING id INTO v_agent_id;

  RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's agents (including shared)
CREATE OR REPLACE FUNCTION public.get_custom_agents(
  p_user_email TEXT,
  p_include_public BOOLEAN DEFAULT TRUE,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  user_email TEXT,
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  system_prompt TEXT,
  model TEXT,
  temperature REAL,
  max_tokens INTEGER,
  tools TEXT[],
  is_shared BOOLEAN,
  is_public BOOLEAN,
  use_count INTEGER,
  tags TEXT[],
  is_own BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.user_email, a.name, a.description, a.avatar_url,
    a.system_prompt, a.model, a.temperature, a.max_tokens, a.tools,
    a.is_shared, a.is_public, a.use_count, a.tags,
    (a.user_email = p_user_email) as is_own,
    a.created_at
  FROM public.custom_agents a
  WHERE
    a.user_email = p_user_email
    OR p_user_email = ANY(a.shared_with)
    OR (p_include_public AND a.is_public = TRUE)
  ORDER BY
    (a.user_email = p_user_email) DESC, -- Own agents first
    a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get automation templates
CREATE OR REPLACE FUNCTION public.get_automation_templates(
  p_category TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  trigger_type TEXT,
  trigger_config JSONB,
  action_type TEXT,
  action_config JSONB,
  ai_model TEXT,
  required_credentials TEXT[],
  icon TEXT,
  color TEXT,
  complexity TEXT,
  use_count INTEGER,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.name, t.description, t.category, t.subcategory,
    t.trigger_type, t.trigger_config, t.action_type, t.action_config,
    t.ai_model, t.required_credentials, t.icon, t.color,
    t.complexity, t.use_count, t.is_featured
  FROM public.automation_templates t
  WHERE
    t.is_active = TRUE
    AND (p_category IS NULL OR t.category = p_category)
    AND (NOT p_featured_only OR t.is_featured = TRUE)
  ORDER BY t.is_featured DESC, t.use_count DESC, t.name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment template use count
CREATE OR REPLACE FUNCTION public.use_automation_template(
  p_template_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.automation_templates
  SET use_count = use_count + 1, updated_at = NOW()
  WHERE id = p_template_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_n8n_config_user ON public.n8n_configurations(user_email);
CREATE INDEX IF NOT EXISTS idx_vault_creds_user ON public.edge_vault_credentials(user_email);
CREATE INDEX IF NOT EXISTS idx_vault_creds_type ON public.edge_vault_credentials(integration_type);
CREATE INDEX IF NOT EXISTS idx_automation_templates_category ON public.automation_templates(category);
CREATE INDEX IF NOT EXISTS idx_automation_templates_featured ON public.automation_templates(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_custom_agents_user ON public.custom_agents(user_email);
CREATE INDEX IF NOT EXISTS idx_custom_agents_public ON public.custom_agents(is_public) WHERE is_public = TRUE;

-- =============================================
-- Seed Automation Templates
-- =============================================
INSERT INTO public.automation_templates (name, description, category, subcategory, trigger_type, action_type, required_credentials, icon, complexity, is_featured) VALUES
-- GSuite Templates
('Email Summarizer', 'Summarize unread emails daily and send to Slack', 'gsuite', 'email', 'schedule', 'ai_process', ARRAY['google', 'slack'], 'mail', 'simple', true),
('Calendar Prep', 'Prepare meeting notes before calendar events', 'gsuite', 'calendar', 'event', 'ai_process', ARRAY['google'], 'calendar', 'medium', true),
('Doc Drafter', 'Draft Google Docs from prompts', 'gsuite', 'docs', 'manual', 'create_doc', ARRAY['google'], 'file-text', 'simple', false),
('Sheet Analyzer', 'Analyze Google Sheets data with AI', 'gsuite', 'sheets', 'manual', 'ai_process', ARRAY['google'], 'table', 'medium', false),

-- Slack Templates
('Channel Summarizer', 'Daily digest of Slack channel activity', 'slack', 'messages', 'schedule', 'ai_process', ARRAY['slack'], 'hash', 'simple', true),
('Mention Alerter', 'AI-summarized mention notifications', 'slack', 'mentions', 'event', 'post_message', ARRAY['slack'], 'message-circle', 'simple', false),
('Customer Response Drafter', 'Draft responses to customer messages', 'slack', 'customer', 'event', 'ai_process', ARRAY['slack'], 'users', 'medium', true),

-- Jira Templates
('Ticket Prioritizer', 'AI-prioritize new Jira tickets', 'jira', 'tickets', 'event', 'ai_process', ARRAY['jira'], 'briefcase', 'medium', true),
('Sprint Reporter', 'Generate sprint summary reports', 'jira', 'sprints', 'schedule', 'ai_process', ARRAY['jira'], 'check-square', 'medium', false),
('Bug Analyzer', 'Analyze bug patterns and trends', 'jira', 'bugs', 'schedule', 'ai_process', ARRAY['jira'], 'alert-circle', 'advanced', false),

-- GitHub Templates
('PR Reviewer', 'AI-assisted pull request review', 'github', 'prs', 'event', 'ai_process', ARRAY['github'], 'github', 'advanced', true),
('Issue Triager', 'Automatically triage and label issues', 'github', 'issues', 'event', 'update_record', ARRAY['github'], 'code', 'medium', false),

-- Productivity Templates
('Daily Standup', 'Generate daily standup from activity', 'productivity', 'standup', 'schedule', 'ai_process', ARRAY['slack'], 'sun', 'simple', true),
('Weekly Report', 'Compile weekly activity report', 'productivity', 'reports', 'schedule', 'ai_process', ARRAY[]::TEXT[], 'star', 'medium', false),
('Task Summary', 'Summarize pending tasks across tools', 'productivity', 'tasks', 'schedule', 'ai_process', ARRAY[]::TEXT[], 'check-square', 'medium', false)

ON CONFLICT DO NOTHING;
