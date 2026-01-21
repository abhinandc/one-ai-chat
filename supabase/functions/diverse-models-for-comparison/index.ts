import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API paths compatible with chat functionality
const CHAT_COMPATIBLE_PATHS = ['/v1/chat/completions', '/v1/messages'];

// API paths for image generation
const IMAGE_GENERATION_PATHS = ['/v1/images/generations'];

interface DiverseModelsRequest {
  query_type?: 'chat' | 'code' | 'image' | 'analysis';
  limit?: number;
}

/**
 * Intelligent scoring for model selection
 * Returns a score from 0-100+ based on how well the model fits the query type
 */
function scoreModel(model: any, queryType: string): number {
  let score = 50; // Base score

  const name = (model.name || '').toLowerCase();
  const kind = (model.kind || '').toLowerCase();
  const mode = (model.mode || '').toLowerCase();
  const apiPath = model.api_path || '';

  // Check if this is a specialized model
  const isOCR = kind.includes('ocr') || mode.includes('ocr') || name.includes('ocr');
  const isEmbedding = kind.includes('embedding') || name.includes('embedding');
  const isTTS = kind.includes('tts') || kind.includes('stt') || name.includes('whisper');
  const isImageGen = apiPath === '/v1/images/generations' || name.includes('dall-e');
  const isVision = kind.includes('vision') || name.includes('vision');

  // Check if this is a flagship chat/code model
  const isClaude = name.includes('claude');
  const isGPT4 = name.includes('gpt-4') || name.includes('gpt4');
  const isGPT35 = name.includes('gpt-3.5') || name.includes('gpt35');
  const isSonnet = name.includes('sonnet');
  const isOpus = name.includes('opus');
  const isHaiku = name.includes('haiku');
  const isFlagship = isClaude || isGPT4 || isSonnet || isOpus;

  switch (queryType) {
    case 'code':
      // For code: heavily prefer Claude/GPT models, heavily penalize OCR/specialized
      if (isOCR) score -= 80;  // OCR is terrible for code
      if (isEmbedding) score -= 80;
      if (isTTS) score -= 80;
      if (isImageGen) score -= 60;

      // Boost coding-capable models
      if (isSonnet) score += 50;
      if (isOpus) score += 45;
      if (name.includes('gpt-4o')) score += 50;
      if (isGPT4 && !name.includes('4o')) score += 40;
      if (isClaude && !isSonnet && !isOpus && !isHaiku) score += 35;
      if (isHaiku) score += 30;
      if (isGPT35) score += 25;
      if (name.includes('code') || kind.includes('code')) score += 40;
      if (model.context_length > 32000) score += 10;
      break;

    case 'image':
      // For image: prefer vision/image models
      if (isImageGen) score += 60;
      if (isVision) score += 50;
      if (name.includes('dall-e')) score += 70;
      if (name.includes('gpt-4o')) score += 40; // Has vision
      if (isOCR) score += 20; // OCR is vision-related
      if (isEmbedding) score -= 50;
      if (isTTS) score -= 50;
      break;

    case 'analysis':
      // For analysis: prefer large context models
      if (isOCR) score -= 40;
      if (isEmbedding) score -= 60;
      if (isTTS) score -= 60;

      if (model.context_length > 100000) score += 50;
      else if (model.context_length > 32000) score += 35;
      else if (model.context_length > 16000) score += 20;

      if (isOpus) score += 40;
      if (isSonnet) score += 35;
      if (isGPT4) score += 30;
      break;

    case 'chat':
    default:
      // For chat: prefer flagship models, penalize specialized
      if (isOCR) score -= 60;
      if (isEmbedding) score -= 70;
      if (isTTS) score -= 70;
      if (isImageGen) score -= 40;

      // Boost flagship conversational models
      if (name.includes('gpt-4o') || name.includes('chatgpt-4o')) score += 45;
      if (isSonnet) score += 40;
      if (isOpus) score += 35;
      if (isHaiku) score += 30;
      if (isClaude && !isSonnet && !isOpus && !isHaiku) score += 25;
      if (isGPT4 && !name.includes('4o')) score += 30;
      if (isGPT35) score += 20;
      if (name.includes('turbo')) score += 15;
      if (name.includes('latest')) score += 10;
      break;
  }

  // General boosts for newer versions
  if (name.includes('4.5')) score += 10;
  if (name.includes('3.5') && isClaude) score += 8;

  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);

    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedEmail = claimsData.user.email?.toLowerCase();
    if (!authenticatedEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'No email in token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let requestBody: DiverseModelsRequest = { query_type: 'chat', limit: 4 };
    try {
      if (req.body) {
        requestBody = { ...requestBody, ...await req.json() };
      }
    } catch {
      // Use defaults
    }

    const { query_type = 'chat', limit = 4 } = requestBody;

    console.log(`[diverse-models] User: ${authenticatedEmail}, query_type: ${query_type}, limit: ${limit}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's virtual keys
    const { data: virtualKeys, error: vkError } = await supabase
      .from('virtual_keys')
      .select('models_json')
      .eq('email', authenticatedEmail)
      .eq('disabled', false);

    if (vkError) {
      throw new Error(vkError.message);
    }

    if (!virtualKeys || virtualKeys.length === 0) {
      return new Response(
        JSON.stringify({ success: true, models: [], message: 'No virtual keys' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract all model names from virtual keys
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
            allModelNames.push(m.id);
          }
        }
      }
    }
    const uniqueModelNames = [...new Set(allModelNames)];

    if (uniqueModelNames.length === 0) {
      return new Response(
        JSON.stringify({ success: true, models: [], message: 'No models in virtual keys' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get model details
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*')
      .in('name', uniqueModelNames)
      .eq('is_available', true);

    if (modelsError) {
      throw new Error(modelsError.message);
    }

    if (!models || models.length === 0) {
      return new Response(
        JSON.stringify({ success: true, models: [], message: 'No available models found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[diverse-models] Found ${models.length} available models`);

    // For image queries, look for image generation models first
    if (query_type === 'image') {
      const imageModels = models.filter(m => IMAGE_GENERATION_PATHS.includes(m.api_path));

      console.log(`[diverse-models] Found ${imageModels.length} image generation models`);

      if (imageModels.length === 0) {
        // No image generation models available - return specific message
        return new Response(
          JSON.stringify({
            success: true,
            models: [],
            message: 'no_image_models',
            query_type,
            user_message: 'No image generation models are available for your account. Please contact your administrator to enable image generation capabilities.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return available image models (no scoring needed, just provider diversity)
      const selectedImageModels: typeof imageModels = [];
      const seenProviders = new Set<string>();

      for (const model of imageModels) {
        const provider = model.provider?.toLowerCase() || 'unknown';
        if (!seenProviders.has(provider) && selectedImageModels.length < limit) {
          seenProviders.add(provider);
          selectedImageModels.push(model);
        }
      }

      // Fill remaining slots if needed
      if (selectedImageModels.length < limit) {
        for (const model of imageModels) {
          if (!selectedImageModels.includes(model) && selectedImageModels.length < limit) {
            selectedImageModels.push(model);
          }
        }
      }

      const responseModels = selectedImageModels.map(m => ({
        id: m.id,
        name: m.name,
        display_name: m.display_name || m.name,
        provider: m.provider,
        api_path: m.api_path,
        kind: m.kind,
        mode: m.mode,
        context_length: m.context_length,
        max_tokens: m.max_tokens,
        cost_per_1k_input: m.cost_per_1k_input,
        cost_per_1k_output: m.cost_per_1k_output,
        score: 100, // Image models get full score for image queries
      }));

      console.log(`[diverse-models] Returning ${responseModels.length} image generation models`);

      return new Response(
        JSON.stringify({
          success: true,
          query_type,
          total_available: imageModels.length,
          models: responseModels
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For non-image queries, filter to chat-compatible endpoints only
    const chatCompatibleModels = models.filter(m => CHAT_COMPATIBLE_PATHS.includes(m.api_path));

    console.log(`[diverse-models] ${chatCompatibleModels.length} chat-compatible models`);

    if (chatCompatibleModels.length === 0) {
      return new Response(
        JSON.stringify({ success: true, models: [], message: 'No chat-compatible models' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score all models intelligently
    const scoredModels = chatCompatibleModels.map(model => ({
      ...model,
      score: scoreModel(model, query_type)
    }));

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    // Log all scores for debugging
    console.log(`[diverse-models] Model scores for ${query_type}:`);
    scoredModels.slice(0, 10).forEach(m => {
      console.log(`  ${m.name} (${m.provider}, kind:${m.kind}): ${m.score}`);
    });

    // Select diverse models - one per provider, prioritized by score
    const selectedModels: typeof scoredModels = [];
    const seenProviders = new Set<string>();

    // First pass: get best model from each unique provider (only if score > 30)
    for (const model of scoredModels) {
      const provider = model.provider?.toLowerCase() || 'unknown';

      if (!seenProviders.has(provider) && selectedModels.length < limit && model.score > 30) {
        seenProviders.add(provider);
        selectedModels.push(model);
        console.log(`[diverse-models] Selected ${model.name} (${provider}) - score: ${model.score}`);
      }
    }

    // Second pass: if we need more models, add best remaining with score > 30
    if (selectedModels.length < limit) {
      for (const model of scoredModels) {
        if (!selectedModels.includes(model) && selectedModels.length < limit && model.score > 30) {
          selectedModels.push(model);
          console.log(`[diverse-models] Added ${model.name} (${model.provider}) - score: ${model.score}`);
        }
      }
    }

    // Third pass: if still need more (unlikely), add remaining regardless of score
    if (selectedModels.length < limit) {
      for (const model of scoredModels) {
        if (!selectedModels.includes(model) && selectedModels.length < limit) {
          selectedModels.push(model);
          console.log(`[diverse-models] Fallback added ${model.name} - score: ${model.score}`);
        }
      }
    }

    // Format response
    const responseModels = selectedModels.map(m => ({
      id: m.id,
      name: m.name,
      display_name: m.display_name || m.name,
      provider: m.provider,
      api_path: m.api_path,
      kind: m.kind,
      mode: m.mode,
      context_length: m.context_length,
      max_tokens: m.max_tokens,
      cost_per_1k_input: m.cost_per_1k_input,
      cost_per_1k_output: m.cost_per_1k_output,
      score: m.score,
    }));

    console.log(`[diverse-models] Returning ${responseModels.length} diverse models`);

    return new Response(
      JSON.stringify({
        success: true,
        query_type,
        total_available: chatCompatibleModels.length,
        models: responseModels
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[diverse-models] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
