import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[employee_keys] Fetching keys for: ${email}`);

    // 1. Get user's virtual keys
    const { data: virtualKeys, error: vkError } = await supabase
      .from('virtual_keys')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('disabled', false);

    if (vkError) {
      console.error('[employee_keys] Error fetching virtual keys:', vkError);
      throw new Error(vkError.message);
    }

    if (!virtualKeys || virtualKeys.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          email, 
          total_keys: 0, 
          keys: [],
          credentials: [],
          message: 'No virtual keys assigned to this user'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[employee_keys] Found ${virtualKeys.length} virtual keys`);

    // 2. Get all model names from virtual keys (models_json contains names, not UUIDs)
    const allModelNames: string[] = [];
    for (const vk of virtualKeys) {
      const models = vk.models_json || [];
      if (Array.isArray(models)) {
        for (const m of models) {
          if (typeof m === 'string') {
            allModelNames.push(m);
          } else if (m?.name) {
            allModelNames.push(m.name);
          } else if (m?.id) {
            // Could be a UUID, but we'll try by name first
            allModelNames.push(m.id);
          }
        }
      }
    }
    const uniqueModelNames = [...new Set(allModelNames)];
    console.log(`[employee_keys] Model names: ${uniqueModelNames.join(', ')}`);

    // 3. Get model details by NAME
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*')
      .in('name', uniqueModelNames.length > 0 ? uniqueModelNames : ['__none__']);

    if (modelsError) {
      console.error('[employee_keys] Error fetching models:', modelsError);
    }

    // Create maps for both name and id lookup
    const modelsByName = new Map((models || []).map(m => [m.name, m]));
    const modelsById = new Map((models || []).map(m => [m.id, m]));
    console.log(`[employee_keys] Fetched ${models?.length || 0} models`);

    // 4. Get unique providers from models
    const providers = [...new Set((models || []).map(m => m.provider?.toLowerCase()).filter(Boolean))];
    console.log(`[employee_keys] Providers: ${providers.join(', ')}`);

    // 5. Get LLM credentials for these providers
    const { data: credentials, error: credError } = await supabase
      .from('llm_credentials')
      .select('*')
      .in('provider', providers.length > 0 ? providers : ['__none__']);

    if (credError) {
      console.error('[employee_keys] Error fetching credentials:', credError);
    }

    const credentialsMap = new Map((credentials || []).map(c => [c.provider?.toLowerCase(), c]));
    console.log(`[employee_keys] Fetched ${credentials?.length || 0} LLM credentials`);

    // 6. Build response with decrypted credentials
    const responseCredentials: any[] = [];
    const responseKeys: any[] = [];

    for (const vk of virtualKeys) {
      const vkModels = vk.models_json || [];
      const enrichedModels: any[] = [];

      for (const modelRef of vkModels) {
        // modelRef can be a string (name) or an object with name/id
        const modelName = typeof modelRef === 'string' ? modelRef : (modelRef?.name || modelRef?.id);
        
        // Try to find model by name first, then by id
        let model = modelsByName.get(modelName) || modelsById.get(modelName);
        
        if (model) {
          const provider = model.provider?.toLowerCase() || 'openai';
          const cred = credentialsMap.get(provider);
          
          // Get the API key - either from model directly or from llm_credentials
          const apiKey = model.api_key_encrypted || cred?.api_key_encrypted || null;
          
          // Build endpoint URL
          let endpointUrl = model.endpoint_url || cred?.endpoint_url;
          if (!endpointUrl) {
            // Default endpoints by provider
            switch (provider) {
              case 'openai':
                endpointUrl = 'https://api.openai.com';
                break;
              case 'anthropic':
                endpointUrl = 'https://api.anthropic.com';
                break;
              case 'google':
              case 'gemini':
                endpointUrl = 'https://generativelanguage.googleapis.com';
                break;
              case 'oneai':
                endpointUrl = 'https://api.oneorigin.ai';
                break;
              default:
                endpointUrl = 'https://api.openai.com';
            }
          }

          const apiPath = model.api_path || '/v1/chat/completions';
          const fullEndpoint = `${endpointUrl}${apiPath}`;

          enrichedModels.push({
            id: model.id,
            name: model.name,
            display_name: model.display_name || model.name,
            provider: model.provider,
            kind: model.kind || 'chat',
            mode: model.mode || 'chat',
            max_tokens: model.max_tokens || 4096,
            context_length: model.context_length || 4096,
            cost_per_1k_input: model.cost_per_1k_input || 0,
            cost_per_1k_output: model.cost_per_1k_output || 0,
            api_path: apiPath,
            token_param: model.token_param || 'max_tokens',
            features: model.features || [],
            config: model.config || {},
          });

          // Add to credentials array (for useVirtualKeyInit) - one per model
          if (apiKey) {
            responseCredentials.push({
              api_key: apiKey,
              endpoint_url: endpointUrl,
              api_path: apiPath,
              full_endpoint: fullEndpoint,
              model_key: model.name,
              model_name: model.display_name || model.name,
              model_id: model.id,
              provider: model.provider,
              kind: model.kind || 'chat',
              mode: model.mode || 'chat',
              auth_type: 'bearer',
              auth_header: 'Authorization',
              max_tokens: model.max_tokens || 4096,
              context_length: model.context_length || 4096,
            });
          }
        } else {
          console.warn(`[employee_keys] Model not found: ${modelName}`);
        }
      }

      responseKeys.push({
        id: vk.id,
        label: vk.label,
        email: vk.email,
        key_prefix: vk.masked_key?.substring(0, 8) || 'sk-****',
        masked_key: vk.masked_key,
        disabled: vk.disabled,
        created_at: vk.created_at,
        expires_at: vk.expires_at,
        rate_limits: {
          rpm: vk.rpm || 120,
          rpd: vk.rpd || 2000,
          tpm: vk.tpm || 10000,
          tpd: vk.tpd || 100000,
        },
        all_models_allowed: false,
        models_count: enrichedModels.length,
        models: enrichedModels,
        budget: null,
        tags: vk.tags_json || [],
      });
    }

    // Also get all available models for reference
    const { data: allModels } = await supabase
      .from('models')
      .select('id, name, display_name, provider, max_tokens, context_length, cost_per_1k_input, cost_per_1k_output')
      .eq('is_available', true)
      .in('name', uniqueModelNames.length > 0 ? uniqueModelNames : ['__none__']);

    const response = {
      success: true,
      email,
      total_keys: virtualKeys.length,
      keys: responseKeys,
      credentials: responseCredentials, // This is what useVirtualKeyInit needs!
      all_models_count: allModels?.length || 0,
      all_models: allModels || [],
      has_unrestricted_access: false,
    };

    console.log(`[employee_keys] Returning ${responseCredentials.length} credentials for ${email}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[employee_keys] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
