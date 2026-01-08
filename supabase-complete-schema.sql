-- Complete Supabase Schema for OneEdge UI Application

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  title text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  folder_id uuid REFERENCES conversation_folders(id) ON DELETE SET NULL,
  pinned boolean DEFAULT false,
  shared boolean DEFAULT false,
  unread boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Conversation folders table
CREATE TABLE IF NOT EXISTS conversation_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'bg-accent-blue',
  created_at timestamptz DEFAULT now()
);

-- 3. Prompt templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  uses_count integer DEFAULT 0,
  difficulty text DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Prompt likes table
CREATE TABLE IF NOT EXISTS prompt_likes (
  user_email text NOT NULL,
  prompt_id uuid NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_email, prompt_id)
);

-- 5. Automations table
CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  agent_id text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean DEFAULT true,
  last_run_at timestamptz,
  total_runs integer DEFAULT 0,
  success_rate numeric DEFAULT 100.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Automation executions table
CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_data jsonb,
  error_message text,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 7. Agent workflows table
CREATE TABLE IF NOT EXISTS agent_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  agent_id text NOT NULL,
  name text NOT NULL,
  description text,
  workflow_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Tool installations table
CREATE TABLE IF NOT EXISTS tool_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  tool_name text NOT NULL,
  agent_id text NOT NULL,
  configuration jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  installed_at timestamptz DEFAULT now()
);

-- 9. Tool submissions table
CREATE TABLE IF NOT EXISTS tool_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  implementation text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now()
);

-- 10. Enhanced activity events table
CREATE TABLE IF NOT EXISTS activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

-- 11. Enhanced API usage logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  model text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  cost_usd numeric DEFAULT 0.0,
  request_type text DEFAULT 'completion',
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Row Level Security Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for conversation_folders
CREATE POLICY "Users can manage their own folders" ON conversation_folders
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for prompt_templates
CREATE POLICY "Users can view public prompts and manage their own" ON prompt_templates
  FOR SELECT USING (is_public = true OR user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can manage their own prompts" ON prompt_templates
  FOR INSERT WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own prompts" ON prompt_templates
  FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own prompts" ON prompt_templates
  FOR DELETE USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for prompt_likes
CREATE POLICY "Users can manage their own likes" ON prompt_likes
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for automations
CREATE POLICY "Users can manage their own automations" ON automations
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for automation_executions
CREATE POLICY "Users can view their own execution history" ON automation_executions
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for agent_workflows
CREATE POLICY "Users can manage their own workflows" ON agent_workflows
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for tool_installations
CREATE POLICY "Users can manage their own tool installations" ON tool_installations
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for tool_submissions
CREATE POLICY "Users can manage their own tool submissions" ON tool_submissions
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for activity_events
CREATE POLICY "Users can view their own activity" ON activity_events
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- RLS Policies for api_usage_logs
CREATE POLICY "Users can view their own usage logs" ON api_usage_logs
  FOR ALL USING (user_email = auth.jwt() ->> 'email');
