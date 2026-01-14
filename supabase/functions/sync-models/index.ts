import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelInfo {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  context_length?: number;
  max_tokens?: number;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optionally filter by provider
    const body = await req.json().catch(() => ({}));
    const targetProvider = body.provider?.toLowerCase();

    const results: Record<string, { success: boolean; models?: ModelInfo[]; error?: string }> = {};

    // Get all credentials from database
    const { data: credentials, error: credError } = await supabase
      .from('llm_credentials')
      .select('*');

    if (credError) {
      throw new Error(`Failed to fetch credentials: ${credError.message}`);
    }

    for (const credential of credentials || []) {
      const provider = credential.provider?.toLowerCase();
      
      // Skip if targeting specific provider
      if (targetProvider && provider !== targetProvider) continue;

      const apiKey = credential.api_key_encrypted;
      if (!apiKey) {
        results[provider] = { success: false, error: 'No API key configured' };
        continue;
      }

      try {
        const models = await fetchModelsFromProvider(provider, apiKey, credential);
        
        if (models.length > 0) {
          // Upsert models to database
          for (const model of models) {
            const { error: upsertError } = await supabase
              .from('models')
              .upsert({
                name: model.display_name || model.name,
                model_key: model.id,
                provider: model.provider,
                display_name: model.display_name,
                context_length: model.context_length,
                max_tokens: model.max_tokens,
                description: model.description,
                is_available: true,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'name,provider',
                ignoreDuplicates: false,
              });

            if (upsertError) {
              console.error(`[sync-models] Failed to upsert model ${model.id}:`, upsertError);
            }
          }
          
          results[provider] = { success: true, models };
        } else {
          results[provider] = { success: false, error: 'No models returned' };
        }
      } catch (err) {
        console.error(`[sync-models] Error fetching from ${provider}:`, err);
        results[provider] = { 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        synced_at: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-models] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchModelsFromProvider(
  provider: string, 
  apiKey: string,
  credential: any
): Promise<ModelInfo[]> {
  const baseUrl = credential.base_url || credential.endpoint_url;
  
  switch (provider) {
    case 'openai':
      return fetchOpenAIModels(apiKey, baseUrl);
    case 'anthropic':
      return fetchAnthropicModels(apiKey, baseUrl);
    case 'google':
    case 'gemini':
      return fetchGeminiModels(apiKey, baseUrl);
    case 'groq':
      return fetchGroqModels(apiKey, baseUrl);
    case 'mistral':
      return fetchMistralModels(apiKey, baseUrl);
    case 'cohere':
      return fetchCohereModels(apiKey, baseUrl);
    case 'perplexity':
      return fetchPerplexityModels(apiKey, baseUrl);
    case 'together':
      return fetchTogetherModels(apiKey, baseUrl);
    case 'fireworks':
      return fetchFireworksModels(apiKey, baseUrl);
    case 'deepseek':
      return fetchDeepSeekModels(apiKey, baseUrl);
    case 'xai':
    case 'grok':
      return fetchXAIModels(apiKey, baseUrl);
    default:
      console.log(`[sync-models] Unknown provider: ${provider}`);
      return [];
  }
}

// OpenAI Models API
async function fetchOpenAIModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.openai.com'}/v1/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Filter to chat models only
  const chatModels = (data.data || []).filter((m: any) => 
    m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3')
  );

  return chatModels.map((m: any) => ({
    id: m.id,
    name: m.id,
    display_name: formatDisplayName(m.id),
    provider: 'openai',
    context_length: getOpenAIContextLength(m.id),
  }));
}

// Anthropic Models API
async function fetchAnthropicModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.anthropic.com'}/v1/models`;
  
  const response = await fetch(url, {
    headers: { 
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  });

  if (!response.ok) {
    // Anthropic may not have a public models endpoint, return known models
    console.log('[sync-models] Anthropic models API not available, using known models');
    return getKnownAnthropicModels();
  }

  const data = await response.json();
  
  return (data.data || data.models || []).map((m: any) => ({
    id: m.id || m.name,
    name: m.id || m.name,
    display_name: m.display_name || formatDisplayName(m.id || m.name),
    provider: 'anthropic',
    context_length: m.context_window || 200000,
    max_tokens: m.max_tokens || 8192,
  }));
}

// Known Anthropic models (fallback if API not available)
function getKnownAnthropicModels(): ModelInfo[] {
  return [
    { id: 'claude-sonnet-4-5-20250514', name: 'claude-sonnet-4-5-20250514', display_name: 'Claude Sonnet 4.5', provider: 'anthropic', context_length: 200000, max_tokens: 8192 },
    { id: 'claude-sonnet-4-20250514', name: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet 4', provider: 'anthropic', context_length: 200000, max_tokens: 8192 },
    { id: 'claude-3-7-sonnet-20250219', name: 'claude-3-7-sonnet-20250219', display_name: 'Claude Sonnet 3.7', provider: 'anthropic', context_length: 200000, max_tokens: 8192 },
    { id: 'claude-opus-4-5-20251101', name: 'claude-opus-4-5-20251101', display_name: 'Claude Opus 4.5', provider: 'anthropic', context_length: 200000, max_tokens: 8192 },
    { id: 'claude-opus-4-20250514', name: 'claude-opus-4-20250514', display_name: 'Claude Opus 4', provider: 'anthropic', context_length: 200000, max_tokens: 8192 },
    { id: 'claude-3-5-haiku-20241022', name: 'claude-3-5-haiku-20241022', display_name: 'Claude Haiku 3.5', provider: 'anthropic', context_length: 200000, max_tokens: 8192 },
    { id: 'claude-3-haiku-20240307', name: 'claude-3-haiku-20240307', display_name: 'Claude Haiku 3', provider: 'anthropic', context_length: 200000, max_tokens: 4096 },
  ];
}

// Google Gemini Models API
async function fetchGeminiModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models?key=${apiKey}`;
  
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Filter to generative models
  const generativeModels = (data.models || []).filter((m: any) => 
    m.name?.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent')
  );

  return generativeModels.map((m: any) => ({
    id: m.name.replace('models/', ''),
    name: m.name.replace('models/', ''),
    display_name: m.displayName || formatDisplayName(m.name.replace('models/', '')),
    provider: 'google',
    context_length: m.inputTokenLimit,
    max_tokens: m.outputTokenLimit,
    description: m.description,
  }));
}

// Groq Models API
async function fetchGroqModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.groq.com'}/openai/v1/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.data || []).map((m: any) => ({
    id: m.id,
    name: m.id,
    display_name: formatDisplayName(m.id),
    provider: 'groq',
    context_length: m.context_window,
  }));
}

// Mistral Models API
async function fetchMistralModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.mistral.ai'}/v1/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.data || []).map((m: any) => ({
    id: m.id,
    name: m.id,
    display_name: formatDisplayName(m.id),
    provider: 'mistral',
    context_length: m.max_context_length,
    max_tokens: m.max_tokens,
  }));
}

// Cohere Models API
async function fetchCohereModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.cohere.com'}/v1/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`Cohere API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Filter to chat models
  const chatModels = (data.models || []).filter((m: any) => 
    m.endpoints?.includes('chat')
  );

  return chatModels.map((m: any) => ({
    id: m.name,
    name: m.name,
    display_name: formatDisplayName(m.name),
    provider: 'cohere',
    context_length: m.context_length,
    max_tokens: m.max_tokens,
  }));
}

// Perplexity - no public models API, use known models
async function fetchPerplexityModels(_apiKey: string, _baseUrl?: string): Promise<ModelInfo[]> {
  return [
    { id: 'llama-3.1-sonar-small-128k-online', name: 'llama-3.1-sonar-small-128k-online', display_name: 'Sonar Small', provider: 'perplexity', context_length: 128000 },
    { id: 'llama-3.1-sonar-large-128k-online', name: 'llama-3.1-sonar-large-128k-online', display_name: 'Sonar Large', provider: 'perplexity', context_length: 128000 },
    { id: 'llama-3.1-sonar-huge-128k-online', name: 'llama-3.1-sonar-huge-128k-online', display_name: 'Sonar Huge', provider: 'perplexity', context_length: 128000 },
  ];
}

// Together AI Models API
async function fetchTogetherModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.together.xyz'}/v1/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`Together API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Filter to chat models
  const chatModels = (data || []).filter((m: any) => 
    m.type === 'chat' || m.display_type === 'chat'
  );

  return chatModels.slice(0, 50).map((m: any) => ({
    id: m.id,
    name: m.id,
    display_name: m.display_name || formatDisplayName(m.id),
    provider: 'together',
    context_length: m.context_length,
  }));
}

// Fireworks AI Models API  
async function fetchFireworksModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.fireworks.ai'}/inference/v1/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(`Fireworks API error: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.data || []).slice(0, 50).map((m: any) => ({
    id: m.id,
    name: m.id,
    display_name: formatDisplayName(m.id),
    provider: 'fireworks',
    context_length: m.context_length,
  }));
}

// DeepSeek Models API
async function fetchDeepSeekModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.deepseek.com'}/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    // Fallback to known models
    return [
      { id: 'deepseek-chat', name: 'deepseek-chat', display_name: 'DeepSeek Chat', provider: 'deepseek', context_length: 64000 },
      { id: 'deepseek-coder', name: 'deepseek-coder', display_name: 'DeepSeek Coder', provider: 'deepseek', context_length: 64000 },
      { id: 'deepseek-reasoner', name: 'deepseek-reasoner', display_name: 'DeepSeek Reasoner', provider: 'deepseek', context_length: 64000 },
    ];
  }

  const data = await response.json();
  
  return (data.data || []).map((m: any) => ({
    id: m.id,
    name: m.id,
    display_name: formatDisplayName(m.id),
    provider: 'deepseek',
    context_length: m.context_length,
  }));
}

// xAI/Grok Models API
async function fetchXAIModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  const url = `${baseUrl || 'https://api.x.ai'}/v1/models`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    // Fallback to known models
    return [
      { id: 'grok-2', name: 'grok-2', display_name: 'Grok 2', provider: 'xai', context_length: 131072 },
      { id: 'grok-2-mini', name: 'grok-2-mini', display_name: 'Grok 2 Mini', provider: 'xai', context_length: 131072 },
    ];
  }

  const data = await response.json();
  
  return (data.data || []).map((m: any) => ({
    id: m.id,
    name: m.id,
    display_name: formatDisplayName(m.id),
    provider: 'xai',
    context_length: m.context_length,
  }));
}

// Helper to format model IDs into display names
function formatDisplayName(modelId: string): string {
  return modelId
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Gpt/g, 'GPT')
    .replace(/Ai/g, 'AI')
    .replace(/Llama/g, 'LLaMA')
    .trim();
}

// Get context length for OpenAI models
function getOpenAIContextLength(modelId: string): number {
  if (modelId.includes('gpt-4o')) return 128000;
  if (modelId.includes('gpt-4-turbo')) return 128000;
  if (modelId.includes('gpt-4-32k')) return 32768;
  if (modelId.includes('gpt-4')) return 8192;
  if (modelId.includes('gpt-3.5-turbo-16k')) return 16384;
  if (modelId.includes('gpt-3.5')) return 4096;
  if (modelId.includes('o1') || modelId.includes('o3')) return 128000;
  return 8192;
}
