-- Create integration_channels table to store available integration types (no hardcoding)
CREATE TABLE IF NOT EXISTS public.integration_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- icon name (e.g., 'mail', 'message-circle', 'slack')
  category TEXT NOT NULL DEFAULT 'communication', -- communication, productivity, crm, etc.
  config_schema JSONB DEFAULT '{}', -- JSON schema for configuration
  auth_type TEXT DEFAULT 'api_key', -- api_key, oauth, webhook
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_integrations table for connected integrations per user
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  channel_id UUID REFERENCES public.integration_channels(id) ON DELETE CASCADE,
  config_encrypted JSONB DEFAULT '{}', -- encrypted config (tokens, keys)
  status TEXT DEFAULT 'connected', -- connected, disconnected, error
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_email, channel_id)
);

-- Create automation_rules table for natural language rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  natural_language_rule TEXT NOT NULL, -- "When I receive an email from a VIP client, notify me on Slack"
  trigger_channel_id UUID REFERENCES public.integration_channels(id),
  trigger_config JSONB DEFAULT '{}',
  action_channel_id UUID REFERENCES public.integration_channels(id),
  action_config JSONB DEFAULT '{}',
  is_automated BOOLEAN DEFAULT true, -- automated or manual trigger
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflow_templates table for pre-built templates
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  natural_language_example TEXT, -- example rule
  trigger_channel_slug TEXT,
  action_channel_slug TEXT,
  default_config JSONB DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integration_channels (public read)
CREATE POLICY "Integration channels are viewable by everyone"
  ON public.integration_channels FOR SELECT
  USING (true);

-- RLS Policies for user_integrations (user-specific)
CREATE POLICY "Users can view their own integrations"
  ON public.user_integrations FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can create their own integrations"
  ON public.user_integrations FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own integrations"
  ON public.user_integrations FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete their own integrations"
  ON public.user_integrations FOR DELETE
  USING (auth.jwt() ->> 'email' = user_email);

-- RLS Policies for automation_rules (user-specific)
CREATE POLICY "Users can view their own rules"
  ON public.automation_rules FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can create their own rules"
  ON public.automation_rules FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own rules"
  ON public.automation_rules FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete their own rules"
  ON public.automation_rules FOR DELETE
  USING (auth.jwt() ->> 'email' = user_email);

-- RLS Policies for workflow_templates (public read)
CREATE POLICY "Workflow templates are viewable by everyone"
  ON public.workflow_templates FOR SELECT
  USING (true);

-- Insert default integration channels
INSERT INTO public.integration_channels (name, slug, description, icon, category, auth_type) VALUES
  ('Email (Gmail)', 'gmail', 'Send and receive emails via Gmail', 'mail', 'communication', 'oauth'),
  ('Email (Outlook)', 'outlook', 'Send and receive emails via Outlook', 'mail', 'communication', 'oauth'),
  ('Google Chat', 'google-chat', 'Send messages to Google Chat spaces', 'message-circle', 'communication', 'oauth'),
  ('Slack', 'slack', 'Post messages and notifications to Slack channels', 'hash', 'communication', 'oauth'),
  ('Microsoft Teams', 'teams', 'Send messages to Microsoft Teams', 'users', 'communication', 'oauth'),
  ('Webhook', 'webhook', 'Trigger or receive HTTP webhooks', 'globe', 'developer', 'api_key'),
  ('Calendar', 'calendar', 'Create and manage calendar events', 'calendar', 'productivity', 'oauth'),
  ('Google Sheets', 'sheets', 'Read and write to spreadsheets', 'table', 'productivity', 'oauth'),
  ('Notion', 'notion', 'Create and update Notion pages', 'file-text', 'productivity', 'oauth'),
  ('HubSpot', 'hubspot', 'Manage contacts and deals', 'briefcase', 'crm', 'api_key'),
  ('Salesforce', 'salesforce', 'Sync leads and opportunities', 'cloud', 'crm', 'oauth'),
  ('Jira', 'jira', 'Create and update issues', 'check-square', 'project', 'oauth'),
  ('GitHub', 'github', 'Manage issues and PRs', 'github', 'developer', 'oauth'),
  ('OpenAI', 'openai', 'AI-powered text generation', 'sparkles', 'ai', 'api_key'),
  ('Custom API', 'custom-api', 'Connect to any REST API', 'code', 'developer', 'api_key')
ON CONFLICT (slug) DO NOTHING;

-- Insert default workflow templates
INSERT INTO public.workflow_templates (name, description, icon, category, natural_language_example, trigger_channel_slug, action_channel_slug, is_featured) VALUES
  ('VIP Email Alert', 'Get notified instantly when VIP clients email you', 'star', 'communication', 'When I receive an email from a VIP client, send me a Slack notification', 'gmail', 'slack', true),
  ('Meeting Summary', 'AI-summarize meeting notes and share to team', 'file-text', 'productivity', 'After each meeting, summarize the notes and post to Google Chat', 'calendar', 'google-chat', true),
  ('Lead to CRM', 'Auto-create contacts from form submissions', 'user-plus', 'crm', 'When a new form is submitted, create a HubSpot contact', 'webhook', 'hubspot', true),
  ('Issue Tracker', 'Create Jira tickets from Slack messages', 'alert-circle', 'project', 'When someone mentions @ticket in Slack, create a Jira issue', 'slack', 'jira', false),
  ('Daily Digest', 'Morning summary of key metrics', 'sun', 'productivity', 'Every morning at 8am, send me a summary of yesterday''s activity', 'calendar', 'gmail', true),
  ('Smart Reply', 'AI-draft replies to common questions', 'message-circle', 'ai', 'When I receive a support email, draft an AI response', 'gmail', 'openai', true),
  ('Data Sync', 'Keep spreadsheets updated automatically', 'refresh-cw', 'productivity', 'When a new deal closes, update the revenue spreadsheet', 'hubspot', 'sheets', false),
  ('GitHub to Slack', 'Stay updated on repo activity', 'github', 'developer', 'When a PR is merged, notify the dev channel', 'github', 'slack', false)
ON CONFLICT DO NOTHING;

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_automation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_integration_channels_timestamp
  BEFORE UPDATE ON public.integration_channels
  FOR EACH ROW EXECUTE FUNCTION update_automation_timestamps();

CREATE TRIGGER update_user_integrations_timestamp
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_automation_timestamps();

CREATE TRIGGER update_automation_rules_timestamp
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_automation_timestamps();