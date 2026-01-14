import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model name to actual API model ID mapping
const MODEL_ID_MAP: Record<string, string> = {
  // Anthropic models
  'Claude Opus 4.5': 'claude-opus-4-20250514',
  'Claude Opus 4.1': 'claude-opus-4-20250514',
  'Claude Opus 4': 'claude-opus-4-20250514',
  'Claude Sonnet 4.5': 'claude-sonnet-4-20250514',
  'Claude Sonnet 4': 'claude-sonnet-4-20250514',
  'Claude Sonnet 3.7': 'claude-3-7-sonnet-20250219',
  'Claude Haiku 4.5': 'claude-haiku-4-20250514',
  'Claude Haiku 3.5': 'claude-3-5-haiku-20241022',
  'Claude Haiku 3': 'claude-3-haiku-20240307',
  // OpenAI models
  'GPT-4o': 'gpt-4o',
  'GPT-4o Mini': 'gpt-4o-mini',
  'GPT-4 Turbo': 'gpt-4-turbo',
  'GPT-4': 'gpt-4',
  'GPT-3.5 Turbo': 'gpt-3.5-turbo',
  'o1': 'o1',
  'o1-mini': 'o1-mini',
  'o1-preview': 'o1-preview',
  'o3-mini': 'o3-mini',
  'chatgpt-4o-latest': 'chatgpt-4o-latest',
  'codex-mini-latest': 'codex-mini-latest',
  // Google/Gemini models
  'Gemini 2.0 Flash': 'gemini-2.0-flash',
  'Gemini 1.5 Pro': 'gemini-1.5-pro',
  'Gemini 1.5 Flash': 'gemini-1.5-flash',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email.toLowerCase();
    console.log(`[llm-proxy] User: ${userEmail}`);

    // Get request body
    const body = await req.json();
    const { model, messages, stream = true, temperature, max_tokens, top_p } = body;

    if (!model || !messages) {
      return new Response(
        JSON.stringify({ error: 'Missing model or messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[llm-proxy] Requested Model: ${model}, Stream: ${stream}`);

    // Use service role to fetch credentials
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the model details
    const { data: modelData, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('name', model)
      .single();

    if (modelError || !modelData) {
      console.error('[llm-proxy] Model not found:', model);
      return new Response(
        JSON.stringify({ error: `Model not found: ${model}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const provider = modelData.provider?.toLowerCase() || 'openai';
    // Use model_key from DB, or fall back to mapping, or use the name as-is
    const actualModelId = modelData.model_key || MODEL_ID_MAP[modelData.name] || MODEL_ID_MAP[model] || model;
    console.log(`[llm-proxy] Provider: ${provider}, Actual model ID: ${actualModelId}`);

    // Get LLM credentials for this provider
    const { data: credential, error: credError } = await supabase
      .from('llm_credentials')
      .select('*')
      .eq('provider', provider)
      .single();

    if (credError || !credential?.api_key_encrypted) {
      console.error('[llm-proxy] No credentials for provider:', provider);
      return new Response(
        JSON.stringify({ error: `No API credentials for provider: ${provider}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = modelData.api_key_encrypted || credential.api_key_encrypted;
    
    // ============================================
    // PROVIDER ENDPOINT CONFIGURATION
    // Based on official API documentation:
    // - OpenAI: https://api.openai.com/v1/chat/completions
    // - Anthropic: https://api.anthropic.com/v1/messages (NOT /chat/completions!)
    // - Google Gemini: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    // - Groq: https://api.groq.com/openai/v1/chat/completions
    // - Mistral: https://api.mistral.ai/v1/chat/completions
    // - Cohere: https://api.cohere.com/v2/chat
    // - Azure OpenAI: https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version={version}
    // - Perplexity: https://api.perplexity.ai/chat/completions
    // - Together AI: https://api.together.xyz/v1/chat/completions
    // - Fireworks: https://api.fireworks.ai/inference/v1/chat/completions
    // - DeepSeek: https://api.deepseek.com/chat/completions
    // - xAI/Grok: https://api.x.ai/v1/chat/completions
    // ============================================
    
    let endpointUrl = modelData.endpoint_url || credential.endpoint_url;
    let apiPath: string;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Build request body - start with OpenAI-compatible format
    let requestBody: any = {
      model: actualModelId,
      messages: messages,
      stream: stream,
    };

    if (temperature !== undefined) requestBody.temperature = temperature;
    if (top_p !== undefined) requestBody.top_p = top_p;
    
    switch (provider) {
      case 'openai':
        endpointUrl = endpointUrl || 'https://api.openai.com';
        apiPath = '/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'anthropic':
        // CRITICAL: Anthropic uses /v1/messages, NOT /v1/chat/completions
        endpointUrl = endpointUrl || 'https://api.anthropic.com';
        apiPath = '/v1/messages';
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        // Anthropic requires max_tokens
        requestBody.max_tokens = max_tokens || 4096;
        // Extract system message for Anthropic (they use a separate 'system' field)
        const systemMsg = messages.find((m: any) => m.role === 'system');
        const nonSystemMsgs = messages.filter((m: any) => m.role !== 'system');
        if (systemMsg) {
          requestBody.system = systemMsg.content;
        }
        requestBody.messages = nonSystemMsgs;
        break;
        
      case 'google':
      case 'gemini':
        // Google Gemini uses a different format entirely
        endpointUrl = endpointUrl || 'https://generativelanguage.googleapis.com';
        apiPath = `/v1beta/models/${actualModelId}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`;
        // Transform to Gemini format
        requestBody = {
          contents: messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          generationConfig: {
            temperature: temperature,
            topP: top_p,
            maxOutputTokens: max_tokens || 4096,
          }
        };
        const geminiSystemMsg = messages.find((m: any) => m.role === 'system');
        if (geminiSystemMsg) {
          requestBody.systemInstruction = { parts: [{ text: geminiSystemMsg.content }] };
        }
        break;
        
      case 'groq':
        // Groq uses OpenAI-compatible format at /openai/v1/chat/completions
        endpointUrl = endpointUrl || 'https://api.groq.com';
        apiPath = '/openai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'mistral':
        endpointUrl = endpointUrl || 'https://api.mistral.ai';
        apiPath = '/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'cohere':
        // Cohere v2 API
        endpointUrl = endpointUrl || 'https://api.cohere.com';
        apiPath = '/v2/chat';
        headers['Authorization'] = `Bearer ${apiKey}`;
        // Cohere has a slightly different format but mostly compatible
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'perplexity':
        endpointUrl = endpointUrl || 'https://api.perplexity.ai';
        apiPath = '/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'together':
        endpointUrl = endpointUrl || 'https://api.together.xyz';
        apiPath = '/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'fireworks':
        endpointUrl = endpointUrl || 'https://api.fireworks.ai';
        apiPath = '/inference/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'deepseek':
        endpointUrl = endpointUrl || 'https://api.deepseek.com';
        apiPath = '/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      case 'xai':
      case 'grok':
        endpointUrl = endpointUrl || 'https://api.x.ai';
        apiPath = '/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
        break;
        
      default:
        // Default to OpenAI-compatible format
        endpointUrl = endpointUrl || 'https://api.openai.com';
        apiPath = modelData.api_path || '/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        if (max_tokens) requestBody.max_tokens = max_tokens;
    }

    const fullEndpoint = `${endpointUrl}${apiPath}`;
    console.log(`[llm-proxy] Endpoint: ${fullEndpoint}`);
    console.log(`[llm-proxy] Making request to ${fullEndpoint}`);

    // Make the API call
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[llm-proxy] API error ${response.status}:`, errorText);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle streaming response
    if (stream && response.body) {
      console.log('[llm-proxy] Streaming response');
      
      // For Anthropic, we need to transform the SSE format to OpenAI format
      if (provider === 'anthropic') {
        const reader = response.body.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        const transformStream = new ReadableStream({
          async start(controller) {
            let buffer = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (!line.trim() || !line.startsWith('data:')) continue;
                
                const data = line.slice(5).trim();
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  
                  // Transform Anthropic format to OpenAI format
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    const openAIChunk = {
                      id: parsed.message?.id || 'msg',
                      object: 'chat.completion.chunk',
                      created: Math.floor(Date.now() / 1000),
                      model: model,
                      choices: [{
                        index: 0,
                        delta: { content: parsed.delta.text },
                        finish_reason: null
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                  } else if (parsed.type === 'message_stop') {
                    const openAIChunk = {
                      id: 'msg',
                      object: 'chat.completion.chunk',
                      created: Math.floor(Date.now() / 1000),
                      model: model,
                      choices: [{
                        index: 0,
                        delta: {},
                        finish_reason: 'stop'
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  }
                } catch (e) {
                  // Skip unparseable lines
                }
              }
            }
            
            controller.close();
          }
        });
        
        return new Response(transformStream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      }
      
      // For OpenAI-compatible providers, pass through directly
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const data = await response.json();
    
    // Transform Anthropic response to OpenAI format
    if (provider === 'anthropic') {
      const openAIResponse = {
        id: data.id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.content?.[0]?.text || ''
          },
          finish_reason: data.stop_reason || 'stop'
        }],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      };
      return new Response(
        JSON.stringify(openAIResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[llm-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
