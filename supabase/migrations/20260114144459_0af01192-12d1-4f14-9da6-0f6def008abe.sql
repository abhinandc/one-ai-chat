-- Add base_url column to llm_credentials if it doesn't exist
ALTER TABLE llm_credentials ADD COLUMN IF NOT EXISTS base_url TEXT;

-- Update base URLs for each provider
UPDATE llm_credentials SET base_url = 'https://api.openai.com' WHERE provider = 'openai' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.anthropic.com' WHERE provider = 'anthropic' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.groq.com' WHERE provider = 'groq' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.mistral.ai' WHERE provider = 'mistral' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.cohere.com' WHERE provider = 'cohere' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://generativelanguage.googleapis.com' WHERE provider IN ('google', 'gemini') AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.perplexity.ai' WHERE provider = 'perplexity' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.together.xyz' WHERE provider = 'together' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.fireworks.ai' WHERE provider = 'fireworks' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.deepseek.com' WHERE provider = 'deepseek' AND base_url IS NULL;
UPDATE llm_credentials SET base_url = 'https://api.x.ai' WHERE provider IN ('xai', 'grok') AND base_url IS NULL;

-- Fix Anthropic models to use correct api_path
UPDATE models SET api_path = '/v1/messages' WHERE provider = 'anthropic';

-- Update models with correct api_path per provider pattern
-- Groq uses /openai/v1/chat/completions
UPDATE models SET api_path = '/openai/v1/chat/completions' WHERE provider = 'groq';

-- Cohere uses /v2/chat
UPDATE models SET api_path = '/v2/chat' WHERE provider = 'cohere';

-- Perplexity uses /chat/completions  
UPDATE models SET api_path = '/chat/completions' WHERE provider = 'perplexity';

-- DeepSeek uses /chat/completions
UPDATE models SET api_path = '/chat/completions' WHERE provider = 'deepseek';

-- Fireworks uses /inference/v1/chat/completions
UPDATE models SET api_path = '/inference/v1/chat/completions' WHERE provider = 'fireworks';

-- Create a provider_config table for centralized provider settings
CREATE TABLE IF NOT EXISTS provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT UNIQUE NOT NULL,
  base_url TEXT NOT NULL,
  default_api_path TEXT NOT NULL DEFAULT '/v1/chat/completions',
  auth_header TEXT NOT NULL DEFAULT 'Authorization',
  auth_prefix TEXT NOT NULL DEFAULT 'Bearer ',
  extra_headers JSONB DEFAULT '{}',
  api_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert provider configurations
INSERT INTO provider_config (provider, base_url, default_api_path, auth_header, auth_prefix, extra_headers, api_version) VALUES
  ('openai', 'https://api.openai.com', '/v1/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('anthropic', 'https://api.anthropic.com', '/v1/messages', 'x-api-key', '', '{"anthropic-version": "2023-06-01"}', '2023-06-01'),
  ('google', 'https://generativelanguage.googleapis.com', '/v1beta/models/{model}:generateContent', 'x-goog-api-key', '', '{}', NULL),
  ('gemini', 'https://generativelanguage.googleapis.com', '/v1beta/models/{model}:generateContent', 'x-goog-api-key', '', '{}', NULL),
  ('groq', 'https://api.groq.com', '/openai/v1/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('mistral', 'https://api.mistral.ai', '/v1/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('cohere', 'https://api.cohere.com', '/v2/chat', 'Authorization', 'Bearer ', '{}', NULL),
  ('perplexity', 'https://api.perplexity.ai', '/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('together', 'https://api.together.xyz', '/v1/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('fireworks', 'https://api.fireworks.ai', '/inference/v1/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('deepseek', 'https://api.deepseek.com', '/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('xai', 'https://api.x.ai', '/v1/chat/completions', 'Authorization', 'Bearer ', '{}', NULL),
  ('grok', 'https://api.x.ai', '/v1/chat/completions', 'Authorization', 'Bearer ', '{}', NULL)
ON CONFLICT (provider) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  default_api_path = EXCLUDED.default_api_path,
  auth_header = EXCLUDED.auth_header,
  auth_prefix = EXCLUDED.auth_prefix,
  extra_headers = EXCLUDED.extra_headers,
  api_version = EXCLUDED.api_version,
  updated_at = now();

-- Enable RLS on provider_config
ALTER TABLE provider_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read provider_config
CREATE POLICY "Allow authenticated read access to provider_config" ON provider_config
  FOR SELECT TO authenticated USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to provider_config" ON provider_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);