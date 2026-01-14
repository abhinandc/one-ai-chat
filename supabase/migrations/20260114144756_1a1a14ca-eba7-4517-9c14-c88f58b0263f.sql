-- Update Anthropic models with correct API model IDs
UPDATE models SET model_key = 'claude-sonnet-4-5-20250514' WHERE name = 'Claude Sonnet 4.5' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-sonnet-4-20250514' WHERE name = 'Claude Sonnet 4' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-3-7-sonnet-20250219' WHERE name = 'Claude Sonnet 3.7' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-opus-4-5-20251101' WHERE name = 'Claude Opus 4.5' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-opus-4-20250514' WHERE name = 'Claude Opus 4' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-opus-4-1-20250515' WHERE name = 'Claude Opus 4.1' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-3-5-haiku-20241022' WHERE name = 'Claude Haiku 3.5' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-3-haiku-20240307' WHERE name = 'Claude Haiku 3' AND provider = 'anthropic';
UPDATE models SET model_key = 'claude-haiku-4-5-20251201' WHERE name = 'Claude Haiku 4.5' AND provider = 'anthropic';

-- Also update OpenAI models with correct API model IDs  
UPDATE models SET model_key = 'gpt-4o' WHERE name = 'GPT-4o' AND provider = 'openai';
UPDATE models SET model_key = 'gpt-4o-mini' WHERE name = 'GPT-4o Mini' AND provider = 'openai';
UPDATE models SET model_key = 'gpt-4-turbo' WHERE name = 'GPT-4 Turbo' AND provider = 'openai';
UPDATE models SET model_key = 'gpt-4' WHERE name = 'GPT-4' AND provider = 'openai';
UPDATE models SET model_key = 'gpt-3.5-turbo' WHERE name = 'GPT-3.5 Turbo' AND provider = 'openai';
UPDATE models SET model_key = 'o1-preview' WHERE name = 'o1 Preview' AND provider = 'openai';
UPDATE models SET model_key = 'o1-mini' WHERE name = 'o1 Mini' AND provider = 'openai';

-- Update Google/Gemini models
UPDATE models SET model_key = 'gemini-1.5-pro' WHERE name = 'Gemini 1.5 Pro' AND provider = 'google';
UPDATE models SET model_key = 'gemini-1.5-flash' WHERE name = 'Gemini 1.5 Flash' AND provider = 'google';
UPDATE models SET model_key = 'gemini-pro' WHERE name = 'Gemini Pro' AND provider = 'google';

-- Update Groq models
UPDATE models SET model_key = 'llama-3.1-70b-versatile' WHERE name = 'Llama 3.1 70B' AND provider = 'groq';
UPDATE models SET model_key = 'llama-3.1-8b-instant' WHERE name = 'Llama 3.1 8B' AND provider = 'groq';
UPDATE models SET model_key = 'mixtral-8x7b-32768' WHERE name = 'Mixtral 8x7B' AND provider = 'groq';

-- Update Mistral models
UPDATE models SET model_key = 'mistral-large-latest' WHERE name = 'Mistral Large' AND provider = 'mistral';
UPDATE models SET model_key = 'mistral-medium-latest' WHERE name = 'Mistral Medium' AND provider = 'mistral';
UPDATE models SET model_key = 'mistral-small-latest' WHERE name = 'Mistral Small' AND provider = 'mistral';

-- Update Cohere models
UPDATE models SET model_key = 'command-r-plus' WHERE name = 'Command R+' AND provider = 'cohere';
UPDATE models SET model_key = 'command-r' WHERE name = 'Command R' AND provider = 'cohere';

-- Update Perplexity models
UPDATE models SET model_key = 'llama-3.1-sonar-large-128k-online' WHERE name = 'Sonar Large' AND provider = 'perplexity';
UPDATE models SET model_key = 'llama-3.1-sonar-small-128k-online' WHERE name = 'Sonar Small' AND provider = 'perplexity';

-- Update DeepSeek models
UPDATE models SET model_key = 'deepseek-chat' WHERE name = 'DeepSeek Chat' AND provider = 'deepseek';
UPDATE models SET model_key = 'deepseek-coder' WHERE name = 'DeepSeek Coder' AND provider = 'deepseek';