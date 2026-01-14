import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Use service role to fetch credentials and config
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
    const actualModelId = modelData.model_key || modelData.name;
    console.log(`[llm-proxy] Provider: ${provider}, Actual model ID: ${actualModelId}`);

    // Get provider configuration from database
    const { data: providerConfig, error: providerConfigError } = await supabase
      .from('provider_config')
      .select('*')
      .eq('provider', provider)
      .single();

    if (providerConfigError) {
      console.warn(`[llm-proxy] No provider_config for ${provider}, using defaults`);
    }

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
    
    // Build endpoint URL from database config
    // Priority: model.endpoint_url > credential.base_url > credential.endpoint_url > provider_config.base_url
    const baseUrl = modelData.endpoint_url || credential.base_url || credential.endpoint_url || providerConfig?.base_url;
    
    if (!baseUrl) {
      console.error('[llm-proxy] No base URL configured for provider:', provider);
      return new Response(
        JSON.stringify({ error: `No base URL configured for provider: ${provider}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API path from model or provider config
    let apiPath = modelData.api_path || providerConfig?.default_api_path;
    
    if (!apiPath) {
      console.error('[llm-proxy] No API path configured for model:', model);
      return new Response(
        JSON.stringify({ error: `No API path configured for model: ${model}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Replace {model} placeholder in API path (for Gemini-style endpoints)
    apiPath = apiPath.replace('{model}', actualModelId);
    
    // For streaming Gemini, use streamGenerateContent
    if ((provider === 'google' || provider === 'gemini') && stream && apiPath.includes(':generateContent')) {
      apiPath = apiPath.replace(':generateContent', ':streamGenerateContent');
    }

    const fullEndpoint = `${baseUrl}${apiPath}`;
    console.log(`[llm-proxy] Endpoint: ${fullEndpoint}`);

    // Build request headers from provider config
    const authHeader2 = providerConfig?.auth_header || 'Authorization';
    const authPrefix = providerConfig?.auth_prefix ?? 'Bearer ';
    const extraHeaders = providerConfig?.extra_headers || {};
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header based on provider config
    if (provider === 'google' || provider === 'gemini') {
      // For Google/Gemini, the API key is passed as a query parameter, not a header
      // Already handled in the endpoint URL
    } else {
      headers[authHeader2] = `${authPrefix}${apiKey}`;
    }

    // Add any extra headers from provider config
    for (const [key, value] of Object.entries(extraHeaders)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    // Build request body based on provider
    let requestBody: any;

    if (provider === 'anthropic') {
      // Anthropic format
      const systemMsg = messages.find((m: any) => m.role === 'system');
      const nonSystemMsgs = messages.filter((m: any) => m.role !== 'system');
      
      requestBody = {
        model: actualModelId,
        messages: nonSystemMsgs,
        stream: stream,
        max_tokens: max_tokens || 4096,
      };
      
      if (systemMsg) {
        requestBody.system = systemMsg.content;
      }
      if (temperature !== undefined) requestBody.temperature = temperature;
      if (top_p !== undefined) requestBody.top_p = top_p;
      
    } else if (provider === 'google' || provider === 'gemini') {
      // Gemini format
      requestBody = {
        contents: messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          maxOutputTokens: max_tokens || 4096,
        }
      };
      
      if (temperature !== undefined) requestBody.generationConfig.temperature = temperature;
      if (top_p !== undefined) requestBody.generationConfig.topP = top_p;
      
      const geminiSystemMsg = messages.find((m: any) => m.role === 'system');
      if (geminiSystemMsg) {
        requestBody.systemInstruction = { parts: [{ text: geminiSystemMsg.content }] };
      }
      
      // Add API key to URL for Gemini
      const separator = fullEndpoint.includes('?') ? '&' : '?';
      const geminiEndpoint = `${fullEndpoint}${separator}key=${apiKey}`;
      
      console.log(`[llm-proxy] Making request to Gemini API`);
      
      const response = await fetch(geminiEndpoint, {
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

      // Transform Gemini response to OpenAI format
      if (stream && response.body) {
        console.log('[llm-proxy] Streaming Gemini response');
        return transformGeminiStream(response.body, model, corsHeaders);
      } else {
        const data = await response.json();
        const openAIResponse = transformGeminiResponse(data, model);
        return new Response(
          JSON.stringify(openAIResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else if (provider === 'cohere') {
      // Cohere v2 format
      requestBody = {
        model: actualModelId,
        messages: messages,
        stream: stream,
      };
      if (max_tokens) requestBody.max_tokens = max_tokens;
      if (temperature !== undefined) requestBody.temperature = temperature;
      if (top_p !== undefined) requestBody.p = top_p;
      
    } else {
      // OpenAI-compatible format (default for most providers)
      requestBody = {
        model: actualModelId,
        messages: messages,
        stream: stream,
      };
      if (max_tokens) requestBody.max_tokens = max_tokens;
      if (temperature !== undefined) requestBody.temperature = temperature;
      if (top_p !== undefined) requestBody.top_p = top_p;
    }

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
      
      // For Anthropic, transform SSE format to OpenAI format
      if (provider === 'anthropic') {
        return transformAnthropicStream(response.body, model, corsHeaders);
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

// Transform Anthropic streaming response to OpenAI format
function transformAnthropicStream(body: ReadableStream, model: string, corsHeaders: Record<string, string>): Response {
  const reader = body.getReader();
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

// Transform Gemini streaming response to OpenAI format
function transformGeminiStream(body: ReadableStream, model: string, corsHeaders: Record<string, string>): Response {
  const reader = body.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const transformStream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Gemini streams JSON objects separated by newlines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const parsed = JSON.parse(line);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
              const openAIChunk = {
                id: 'msg',
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{
                  index: 0,
                  delta: { content: text },
                  finish_reason: null
                }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
            }
            
            if (parsed.candidates?.[0]?.finishReason) {
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

// Transform Gemini non-streaming response to OpenAI format
function transformGeminiResponse(data: any, model: string): any {
  return {
    id: 'msg',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      },
      finish_reason: data.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'stop'
    }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0
    }
  };
}