import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Document processing configuration
const DOCUMENT_PROCESSOR = {
  // Vision/OCR model for processing images and documents
  visionEndpoint: 'https://api-oneai.oneorigin.us/v1/chat/completions',
  visionModel: 'op3', // olmOCR model - supports images and PDFs
  authHeader: 'X-API-Key', // OneAI uses X-API-Key header, not Authorization Bearer

  // Prompts for different document types
  prompts: {
    image: 'Extract all text content from this image. Return only the extracted text, preserving formatting where possible. If no text is found, describe what you see in the image briefly.',
    pdf: 'This is a PDF document. Extract all text content from it, preserving the structure and formatting as much as possible. Include headings, paragraphs, tables, and lists.',
    document: 'Extract all text and data from this document. Preserve the structure and formatting. For tables, format them in a readable way.',
  }
};

// Check if model supports vision based on model data
function modelSupportsVision(modelData: any): boolean {
  const kind = (modelData.kind || '').toLowerCase();
  const mode = (modelData.mode || '').toLowerCase();
  const name = (modelData.name || '').toLowerCase();
  const capabilities = (modelData.capabilities || '').toLowerCase();
  const modelKey = (modelData.model_key || '').toLowerCase();

  // Known vision-capable models - comprehensive list
  // Claude: All Claude 3.x and 4.x models support vision
  // OpenAI: GPT-4o, GPT-4 Turbo, GPT-4 Vision variants
  // Google: All Gemini models
  // OneAI OCR models: op3, paddleocr, olmocr
  const visionModels = [
    // OpenAI vision models
    'gpt-4o',           // GPT-4o and GPT-4o-mini
    'gpt-4-vision',     // GPT-4 Vision Preview
    'gpt-4-turbo',      // GPT-4 Turbo (supports vision)
    'gpt-4-1106',       // GPT-4 Turbo 1106 (vision preview)
    // Claude models - ALL Claude 3.x and 4.x support vision
    'claude-3',         // All Claude 3 variants (opus, sonnet, haiku)
    'claude-3.5',       // Claude 3.5 Sonnet
    'claude-opus-4',    // Claude Opus 4
    'claude-sonnet-4',  // Claude Sonnet 4
    'claude-4',         // All Claude 4 variants
    // Google Gemini - all support vision
    'gemini',
    // OneAI OCR models (these are explicitly for document processing)
    'op3', 'paddleocr', 'olmocr'
  ];

  const isKnownVisionModel = visionModels.some(vm =>
    modelKey.includes(vm) || name.includes(vm)
  );

  const result = (
    isKnownVisionModel ||
    kind.includes('vision') ||
    mode.includes('image') ||
    mode.includes('vision') ||
    name.includes('vision') ||
    capabilities.includes('vision') ||
    capabilities.includes('image')
  );

  console.log(`[llm-proxy] Vision check: modelKey=${modelKey}, name=${name}, kind=${kind}, mode=${mode}, isKnownVision=${isKnownVisionModel}, result=${result}`);

  return result;
}

// Check if model is an explicit OCR model (OneAI op3, paddleocr, olmocr)
// These should always use the OCR processing path, not native vision
function isExplicitOCRModel(modelData: any): boolean {
  const name = (modelData.name || '').toLowerCase();
  const modelKey = (modelData.model_key || '').toLowerCase();

  const ocrModels = ['op3', 'olmocr', 'paddleocr', 'oneai-ocr'];
  const isOCR = ocrModels.some(ocr =>
    modelKey.includes(ocr) || name.includes(ocr)
  );

  console.log(`[llm-proxy] OCR model check: modelKey=${modelKey}, name=${name}, isOCR=${isOCR}`);
  return isOCR;
}

// Detect attachment type from data URI or metadata
function getAttachmentType(dataUri: string, metadata?: any): 'image' | 'pdf' | 'text' | 'spreadsheet' | 'unknown' {
  // Check metadata first
  const mimeType = metadata?.type || '';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'text';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet';

  // Check data URI prefix
  if (dataUri.startsWith('data:image/')) return 'image';
  if (dataUri.startsWith('data:application/pdf')) return 'pdf';
  if (dataUri.startsWith('data:text/')) return 'text';
  if (dataUri.includes('spreadsheet') || dataUri.includes('excel')) return 'spreadsheet';

  return 'unknown';
}

// Check if messages contain any attachments (images, PDFs, etc.)
function messagesContainAttachments(messages: any[]): boolean {
  return messages.some((msg: any) => {
    if (Array.isArray(msg.content)) {
      return msg.content.some((part: any) =>
        (part.type === 'image_url' && part.image_url?.url) ||
        (part.type === 'file' && part.file?.url) ||
        (part.type === 'document' && part.document?.url)
      );
    }
    return false;
  });
}

// Check if messages contain non-image attachments (PDFs, text files, spreadsheets)
// These ALWAYS need OCR processing even if model supports vision
function messagesContainDocuments(messages: any[]): boolean {
  return messages.some((msg: any) => {
    if (Array.isArray(msg.content)) {
      return msg.content.some((part: any) => {
        if (part.type === 'image_url' && part.image_url?.url) {
          const dataUri = part.image_url.url;
          const attachmentType = getAttachmentType(dataUri, part.metadata);
          // Non-image types need OCR processing
          return attachmentType !== 'image' && attachmentType !== 'unknown';
        }
        // file/document types always need processing
        return (part.type === 'file' || part.type === 'document');
      });
    }
    return false;
  });
}

// Check if messages contain ONLY images (no PDFs, text, etc.)
function messagesContainOnlyImages(messages: any[]): boolean {
  let hasImages = false;
  let hasNonImages = false;

  messages.forEach((msg: any) => {
    if (Array.isArray(msg.content)) {
      msg.content.forEach((part: any) => {
        if (part.type === 'image_url' && part.image_url?.url) {
          const dataUri = part.image_url.url;
          const attachmentType = getAttachmentType(dataUri, part.metadata);
          if (attachmentType === 'image') {
            hasImages = true;
          } else if (attachmentType !== 'unknown') {
            hasNonImages = true;
          }
        }
        if (part.type === 'file' || part.type === 'document') {
          hasNonImages = true;
        }
      });
    }
  });

  return hasImages && !hasNonImages;
}

// Extract text from base64-encoded text file
function extractTextFromBase64(dataUri: string): string {
  try {
    const base64Match = dataUri.match(/^data:[^;]+;base64,(.+)$/);
    if (base64Match) {
      const base64Data = base64Match[1];
      const decoded = atob(base64Data);
      return decoded;
    }
    return '[Could not decode text file]';
  } catch (error) {
    console.error('[llm-proxy] Base64 decode error:', error);
    return '[Text file decoding failed]';
  }
}

// Process attachment using vision model (for images and PDFs)
async function processAttachmentWithVision(
  dataUri: string,
  attachmentType: string,
  apiKey: string
): Promise<string> {
  try {
    console.log(`[llm-proxy] ===== OCR PROCESSING START =====`);
    console.log(`[llm-proxy] Processing ${attachmentType} with vision model`);
    console.log(`[llm-proxy] Data URI length: ${dataUri.length}`);
    console.log(`[llm-proxy] Data URI prefix: ${dataUri.substring(0, 50)}`);
    console.log(`[llm-proxy] OCR Endpoint: ${DOCUMENT_PROCESSOR.visionEndpoint}`);
    console.log(`[llm-proxy] OCR Model: ${DOCUMENT_PROCESSOR.visionModel}`);
    console.log(`[llm-proxy] Auth Header: ${DOCUMENT_PROCESSOR.authHeader}`);
    console.log(`[llm-proxy] API Key prefix: ${apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING'}`);

    const prompt = attachmentType === 'pdf'
      ? DOCUMENT_PROCESSOR.prompts.pdf
      : attachmentType === 'image'
        ? DOCUMENT_PROCESSOR.prompts.image
        : DOCUMENT_PROCESSOR.prompts.document;

    const visionRequest = {
      model: DOCUMENT_PROCESSOR.visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUri } }
          ]
        }
      ],
      max_tokens: 8192,
      temperature: 0.1,
    };

    console.log(`[llm-proxy] OCR Request model: ${visionRequest.model}`);
    console.log(`[llm-proxy] Making OCR API call...`);

    const response = await fetch(DOCUMENT_PROCESSOR.visionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [DOCUMENT_PROCESSOR.authHeader]: apiKey,
      },
      body: JSON.stringify(visionRequest),
    });

    console.log(`[llm-proxy] OCR Response status: ${response.status}`);
    console.log(`[llm-proxy] OCR Response ok: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[llm-proxy] ===== OCR API ERROR =====`);
      console.error(`[llm-proxy] OCR API Status: ${response.status}`);
      console.error(`[llm-proxy] OCR API Error: ${errorText}`);
      console.error(`[llm-proxy] ===== END OCR ERROR =====`);
      return `[${attachmentType.toUpperCase()} could not be processed: ${response.status} - ${errorText.substring(0, 200)}]`;
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || `[No content extracted from ${attachmentType}]`;
    console.log(`[llm-proxy] ===== OCR SUCCESS =====`);
    console.log(`[llm-proxy] Extracted ${attachmentType} text length: ${extractedText.length}`);
    console.log(`[llm-proxy] Extracted text preview: ${extractedText.substring(0, 200)}...`);
    console.log(`[llm-proxy] ===== END OCR PROCESSING =====`);
    return extractedText;
  } catch (error) {
    console.error(`[llm-proxy] ===== OCR EXCEPTION =====`);
    console.error(`[llm-proxy] ${attachmentType} processing error:`, error);
    console.error(`[llm-proxy] ===== END OCR EXCEPTION =====`);
    return `[${attachmentType.toUpperCase()} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

// Process messages to extract content from attachments for non-vision models
// Returns messages with all attachments converted to plain text
async function processMessagesWithTools(messages: any[], apiKey: string): Promise<any[]> {
  const processedMessages: any[] = [];

  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      const processedParts: string[] = [];

      for (const part of msg.content) {
        if (part.type === 'text') {
          processedParts.push(part.text);
        } else if (part.type === 'image_url' && part.image_url?.url) {
          const dataUri = part.image_url.url;
          const attachmentType = getAttachmentType(dataUri, part.metadata);
          const fileName = part.metadata?.name || 'attachment';

          console.log(`[llm-proxy] Processing attachment: ${fileName}, type: ${attachmentType}`);

          if (attachmentType === 'text') {
            // Directly decode text files
            const textContent = extractTextFromBase64(dataUri);
            processedParts.push(`[Content from ${fileName}]:\n${textContent}`);
          } else if (attachmentType === 'spreadsheet') {
            // For spreadsheets, try to decode as CSV/text first
            const csvContent = extractTextFromBase64(dataUri);
            if (csvContent && !csvContent.startsWith('[')) {
              processedParts.push(`[Content from ${fileName}]:\n${csvContent}`);
            } else {
              // Fall back to vision model
              const extractedText = await processAttachmentWithVision(dataUri, attachmentType, apiKey);
              processedParts.push(`[Content extracted from ${fileName}]:\n${extractedText}`);
            }
          } else {
            // Use vision model for images, PDFs, and unknown types
            const extractedText = await processAttachmentWithVision(dataUri, attachmentType, apiKey);
            const label = attachmentType === 'image' ? 'Image' :
                          attachmentType === 'pdf' ? 'PDF' : 'Document';
            processedParts.push(`[${label} content from ${fileName}]:\n${extractedText}`);
          }
        } else if (part.type === 'file' || part.type === 'document') {
          // Handle other file/document formats
          const url = part.file?.url || part.document?.url;
          if (url) {
            const attachmentType = getAttachmentType(url, part.metadata);
            const fileName = part.metadata?.name || 'document';
            const extractedText = await processAttachmentWithVision(url, attachmentType, apiKey);
            processedParts.push(`[Document content from ${fileName}]:\n${extractedText}`);
          }
        }
      }

      // Combine all parts into a single plain text string
      // This ensures the message is compatible with non-vision models
      const combinedText = processedParts.join('\n\n');
      processedMessages.push({ role: msg.role, content: combinedText });
    } else {
      // Already plain text, pass through
      processedMessages.push({ role: msg.role, content: msg.content });
    }
  }

  return processedMessages;
}

// Clean messages for vision API compatibility
// Removes extra fields like 'metadata' that OpenAI doesn't accept
function cleanMessagesForVisionAPI(messages: any[]): any[] {
  return messages.map((msg: any) => {
    if (Array.isArray(msg.content)) {
      const cleanedContent = msg.content.map((part: any) => {
        if (part.type === 'image_url' && part.image_url) {
          // Only keep type and image_url - strip metadata and other fields
          return {
            type: 'image_url',
            image_url: {
              url: part.image_url.url,
              detail: part.image_url.detail || 'auto',
            }
          };
        }
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        }
        return part;
      });
      return { role: msg.role, content: cleanedContent };
    }
    return msg;
  });
}

// Convert OpenAI image format to Anthropic image format
// OpenAI: { type: 'image_url', image_url: { url: 'data:image/png;base64,ABC...' } }
// Anthropic: { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'ABC...' } }
function convertMessagesForAnthropic(messages: any[]): any[] {
  console.log(`[llm-proxy] Converting ${messages.length} messages for Anthropic format`);

  return messages.map((msg: any, msgIdx: number) => {
    if (Array.isArray(msg.content)) {
      const convertedContent = msg.content.map((part: any, partIdx: number) => {
        if (part.type === 'image_url' && part.image_url?.url) {
          const dataUri = part.image_url.url;
          console.log(`[llm-proxy] Converting image [${msgIdx}][${partIdx}]: dataUri prefix=${dataUri.substring(0, 50)}`);

          // Parse data URI with robust regex: data:image/png;base64,ABC...
          // Handle edge cases: missing media_type, various image formats
          const match = dataUri.match(/^data:([^;,]+)?(?:;base64)?,(.+)$/);
          if (match) {
            // Default to image/png if media_type is missing or empty
            let mediaType = match[1] || 'image/png';
            const base64Data = match[2];

            // Normalize MIME types (handle both 'jpeg' and 'jpg')
            if (mediaType === 'image/jpg') {
              mediaType = 'image/jpeg';
            }

            // Validate supported media types for Anthropic
            const supportedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
            if (!supportedTypes.includes(mediaType)) {
              console.warn(`[llm-proxy] Unsupported media type ${mediaType}, defaulting to image/png`);
              mediaType = 'image/png';
            }

            console.log(`[llm-proxy] Anthropic image: mediaType=${mediaType}, dataLength=${base64Data.length}`);
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              }
            };
          }

          // If it's a URL (not base64), Anthropic supports URL format too
          if (dataUri.startsWith('http')) {
            console.log(`[llm-proxy] Anthropic image URL: ${dataUri.substring(0, 80)}`);
            return {
              type: 'image',
              source: {
                type: 'url',
                url: dataUri,
              }
            };
          }

          // Fallback: return as text description
          console.warn(`[llm-proxy] Could not convert image format for Anthropic: ${dataUri.substring(0, 50)}`);
          return { type: 'text', text: '[Image could not be processed]' };
        }
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        }
        // Preserve other content types unchanged
        return part;
      });
      return { role: msg.role, content: convertedContent };
    }
    return msg;
  });
}

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
    const supportsVision = modelSupportsVision(modelData);
    console.log(`[llm-proxy] Provider: ${provider}, Actual model ID: ${actualModelId}, Supports vision: ${supportsVision}`);

    // Get provider configuration from database (case-insensitive)
    const { data: providerConfig, error: providerConfigError } = await supabase
      .from('provider_config')
      .select('*')
      .ilike('provider', provider)
      .single();

    if (providerConfigError) {
      console.warn(`[llm-proxy] No provider_config for ${provider}, using defaults`);
    }

    // Extract provider config values with defaults
    const requestFormat = providerConfig?.request_format || 'openai';
    const responseFormat = providerConfig?.response_format || 'openai';
    const supportsTemperatureAndTopP = providerConfig?.supports_temperature_and_top_p ?? true;
    const maxTokensDefault = providerConfig?.max_tokens_default || 4096;
    const systemMessageFormat = providerConfig?.system_message_format || 'message';
    
    console.log(`[llm-proxy] Request format: ${requestFormat}, Response format: ${responseFormat}`);

    // Get LLM credentials for this provider (case-insensitive)
    const { data: credential, error: credError } = await supabase
      .from('llm_credentials')
      .select('*')
      .ilike('provider', provider)
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

    // Replace {model} placeholder in API path
    apiPath = apiPath.replace('{model}', actualModelId);
    
    // For streaming Gemini, use streamGenerateContent
    if (requestFormat === 'gemini' && stream && apiPath.includes(':generateContent')) {
      apiPath = apiPath.replace(':generateContent', ':streamGenerateContent');
    }

    let fullEndpoint = `${baseUrl}${apiPath}`;
    
    // For Gemini, add API key as query parameter
    if (requestFormat === 'gemini') {
      const separator = fullEndpoint.includes('?') ? '&' : '?';
      fullEndpoint = `${fullEndpoint}${separator}key=${apiKey}`;
    }
    
    console.log(`[llm-proxy] Endpoint: ${fullEndpoint.replace(apiKey, '***')}`);

    // Build request headers from provider config
    const authHeaderName = providerConfig?.auth_header || 'Authorization';
    const authPrefix = providerConfig?.auth_prefix ?? 'Bearer ';
    const extraHeaders = providerConfig?.extra_headers || {};
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header (except for Gemini which uses query param)
    if (requestFormat !== 'gemini') {
      headers[authHeaderName] = `${authPrefix}${apiKey}`;
    }

    // Add any extra headers from provider config
    for (const [key, value] of Object.entries(extraHeaders)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    // Check if this is an image generation request
    const isImageGeneration = apiPath.includes('/images/generations');

    // Process attachments if model doesn't support vision
    // This uses OCR/document processing tools to extract text from images, PDFs, etc.
    // IMPORTANT: This is disabled for now to debug the 400 error.
    // The basic text-only case should work exactly as v36 did.
    let processedMessages = messages;
    let hasAttachments = false;

    // Feature flag - enable document processing for non-vision models
    const ENABLE_DOCUMENT_PROCESSING = true;

    if (ENABLE_DOCUMENT_PROCESSING) {
      try {
        hasAttachments = messagesContainAttachments(messages);
        const hasDocuments = messagesContainDocuments(messages);
        const hasOnlyImages = messagesContainOnlyImages(messages);
        console.log(`[llm-proxy] ===== DOCUMENT DETECTION =====`);
        console.log(`[llm-proxy] Has attachments: ${hasAttachments}`);
        console.log(`[llm-proxy] Has documents (PDF/text/spreadsheet): ${hasDocuments}`);
        console.log(`[llm-proxy] Has only images: ${hasOnlyImages}`);
        console.log(`[llm-proxy] Model supports vision: ${supportsVision}`);

        // Log attachment details for debugging
        messages.forEach((msg: any, msgIdx: number) => {
          if (Array.isArray(msg.content)) {
            msg.content.forEach((part: any, partIdx: number) => {
              if (part.type === 'image_url' && part.image_url?.url) {
                const dataUri = part.image_url.url;
                const attachmentType = getAttachmentType(dataUri, part.metadata);
                console.log(`[llm-proxy] Attachment [${msgIdx}][${partIdx}]: type=${attachmentType}, metadata.type=${part.metadata?.type}, dataUri prefix=${dataUri.substring(0, 30)}`);
              }
            });
          }
        });
        console.log(`[llm-proxy] ===== END DETECTION =====`);

        // NEW ROUTING LOGIC - Default to vision APIs, OCR only when needed
        // Priority order:
        // 1. Explicit OCR model (op3, olmocr, paddleocr) → ALWAYS use OCR
        // 2. Images + Vision model → Use native vision API (OpenAI/Claude)
        // 3. Documents (PDFs) + Vision model → Use OCR (vision APIs don't handle PDFs)
        // 4. Non-vision model + attachments → Use OCR
        // 5. No attachments → Pass through as-is

        const useExplicitOCR = isExplicitOCRModel(modelData);
        console.log(`[llm-proxy] ===== ROUTING DECISION =====`);
        console.log(`[llm-proxy] Explicit OCR model: ${useExplicitOCR}`);
        console.log(`[llm-proxy] Has only images: ${hasOnlyImages}`);
        console.log(`[llm-proxy] Has documents: ${hasDocuments}`);
        console.log(`[llm-proxy] Supports vision: ${supportsVision}`);

        if (useExplicitOCR && hasAttachments) {
          // User explicitly selected an OCR model → Use OCR processing
          console.log(`[llm-proxy] Routing: Using OCR (explicit OCR model selected: ${modelData.name})`);

          const { data: ocrCredential } = await supabase
            .from('llm_credentials')
            .select('api_key_encrypted')
            .ilike('provider', 'oneai')
            .single();

          const ocrApiKey = ocrCredential?.api_key_encrypted || apiKey;
          console.log(`[llm-proxy] Using OCR API key: ${ocrApiKey ? 'present' : 'missing'}`);

          try {
            processedMessages = await processMessagesWithTools(messages, ocrApiKey);
            console.log(`[llm-proxy] OCR processed successfully, message count: ${processedMessages.length}`);
          } catch (toolError) {
            console.error('[llm-proxy] Error processing with OCR:', toolError);
            processedMessages = messages;
          }
        } else if (hasOnlyImages && supportsVision && !useExplicitOCR) {
          // Images + vision model → Use native vision API (NOT OCR)
          // This is the NEW DEFAULT for image processing!
          console.log(`[llm-proxy] Routing: Using VISION API for ${modelData.name} (native vision support)`);

          if (requestFormat === 'anthropic') {
            console.log(`[llm-proxy] Converting images to Anthropic format...`);
            processedMessages = convertMessagesForAnthropic(messages);
          } else {
            console.log(`[llm-proxy] Cleaning images for OpenAI-compatible API...`);
            processedMessages = cleanMessagesForVisionAPI(messages);
          }
        } else if (hasDocuments) {
          // Documents (PDFs, text, spreadsheets) need OCR processing
          // Vision APIs like OpenAI/Claude don't support PDFs directly
          console.log(`[llm-proxy] Routing: Using OCR for documents (PDFs/text/spreadsheets)`);

          const { data: ocrCredential } = await supabase
            .from('llm_credentials')
            .select('api_key_encrypted')
            .ilike('provider', 'oneai')
            .single();

          const ocrApiKey = ocrCredential?.api_key_encrypted || apiKey;
          console.log(`[llm-proxy] Using OCR API key: ${ocrApiKey ? 'present' : 'missing'}`);

          try {
            processedMessages = await processMessagesWithTools(messages, ocrApiKey);
            console.log(`[llm-proxy] Documents processed successfully, message count: ${processedMessages.length}`);
            processedMessages.forEach((msg, i) => {
              const contentLen = typeof msg.content === 'string' ? msg.content.length : 'array';
              console.log(`[llm-proxy] Processed msg[${i}]: role=${msg.role}, contentLength=${contentLen}`);
            });
          } catch (toolError) {
            console.error('[llm-proxy] Error processing documents:', toolError);
            processedMessages = messages;
          }
        } else if (hasOnlyImages && !supportsVision) {
          // Images + non-vision model → Must use OCR
          console.log(`[llm-proxy] Routing: Using OCR (model ${modelData.name} doesn't support vision)`);

          const { data: ocrCredential } = await supabase
            .from('llm_credentials')
            .select('api_key_encrypted')
            .ilike('provider', 'oneai')
            .single();

          const ocrApiKey = ocrCredential?.api_key_encrypted || apiKey;

          try {
            processedMessages = await processMessagesWithTools(messages, ocrApiKey);
            console.log(`[llm-proxy] Images processed via OCR successfully, message count: ${processedMessages.length}`);
          } catch (toolError) {
            console.error('[llm-proxy] Error processing images:', toolError);
            processedMessages = messages;
          }
        } else if (hasAttachments) {
          // Fallback: unknown attachment types
          if (supportsVision) {
            console.log(`[llm-proxy] Routing: Unknown attachments with vision model - attempting vision API`);
            if (requestFormat === 'anthropic') {
              processedMessages = convertMessagesForAnthropic(messages);
            } else {
              processedMessages = cleanMessagesForVisionAPI(messages);
            }
          } else {
            console.log(`[llm-proxy] Routing: Unknown attachments - attempting OCR`);
            const { data: ocrCredential } = await supabase
              .from('llm_credentials')
              .select('api_key_encrypted')
              .ilike('provider', 'oneai')
              .single();

            const ocrApiKey = ocrCredential?.api_key_encrypted || apiKey;

            try {
              processedMessages = await processMessagesWithTools(messages, ocrApiKey);
            } catch (toolError) {
              console.error('[llm-proxy] Error processing attachments:', toolError);
              processedMessages = messages;
            }
          }
        }
        console.log(`[llm-proxy] ===== END ROUTING =====`);
        // else: no attachments, use original messages
      } catch (checkError) {
        console.error('[llm-proxy] Error checking for attachments:', checkError);
        hasAttachments = false;
      }
    } else {
      console.log(`[llm-proxy] Document processing disabled, using original messages`);
    }

    let requestBody: any;

    if (isImageGeneration) {
      // Image generation uses different request format
      // Extract prompt from messages (use last user message)
      const userMessages = processedMessages.filter((m: any) => m.role === 'user');
      const prompt = userMessages.length > 0
        ? userMessages[userMessages.length - 1].content
        : '';

      // Use minimal parameters for maximum compatibility across providers
      // Some providers don't support response_format, quality, style, etc.
      requestBody = {
        model: actualModelId,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      };

      console.log(`[llm-proxy] Image generation request for model: ${actualModelId}`);
    } else {
      // Build request body based on request_format from database
      requestBody = buildRequestBody({
        requestFormat,
        systemMessageFormat,
        actualModelId,
        messages: processedMessages, // Use processed messages
        stream,
        temperature,
        max_tokens,
        top_p,
        maxTokensDefault,
        supportsTemperatureAndTopP,
        provider,
      });
    }

    console.log(`[llm-proxy] Making request with format: ${isImageGeneration ? 'image' : requestFormat}`);

    // Log request body summary for debugging (without full content)
    const msgSummary = requestBody.messages?.map((m: any) => ({
      role: m.role,
      contentType: Array.isArray(m.content) ? 'array' : typeof m.content,
      contentLength: typeof m.content === 'string' ? m.content.length : Array.isArray(m.content) ? m.content.length : 0,
    }));
    console.log(`[llm-proxy] Request body messages summary:`, JSON.stringify(msgSummary));

    // Make the API call
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[llm-proxy] API error ${response.status}:`, errorText);
      console.error(`[llm-proxy] Request was to: ${fullEndpoint.replace(apiKey, '***')}`);
      console.error(`[llm-proxy] Model: ${actualModelId}, Provider: ${provider}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle image generation response
    if (isImageGeneration) {
      const imageData = await response.json();
      console.log(`[llm-proxy] Image generation response received`);
      console.log(`[llm-proxy] Full response structure:`, JSON.stringify(imageData, null, 2).slice(0, 500));
      console.log(`[llm-proxy] Image data array length:`, imageData.data?.length || 0);

      if (imageData.data?.[0]) {
        console.log(`[llm-proxy] First image data keys:`, Object.keys(imageData.data[0]));
      }

      // Transform to chat-like response for frontend compatibility
      // Handle both URL and base64 responses
      let imageUrl = imageData.data?.[0]?.url;
      const b64Json = imageData.data?.[0]?.b64_json;
      const revisedPrompt = imageData.data?.[0]?.revised_prompt;

      console.log(`[llm-proxy] url present: ${!!imageUrl}, b64_json present: ${!!b64Json}`);

      // If base64 data is returned, convert to data URL
      if (!imageUrl && b64Json) {
        imageUrl = `data:image/png;base64,${b64Json}`;
        console.log(`[llm-proxy] Converted base64 to data URL, length: ${imageUrl.length}`);
      }

      if (imageUrl) {
        const urlType = imageUrl.startsWith('data:') ? 'base64-dataurl' : 'https-url';
        console.log(`[llm-proxy] Final image URL type: ${urlType}, length: ${imageUrl.length}`);
        if (urlType === 'https-url') {
          console.log(`[llm-proxy] URL prefix: ${imageUrl.slice(0, 100)}...`);
        }
      } else {
        console.log(`[llm-proxy] WARNING: No image URL or b64_json found in response`);
      }

      const imageContent = imageUrl
        ? `![Generated Image](${imageUrl})${revisedPrompt ? `\n\n*Revised prompt: ${revisedPrompt}*` : ''}`
        : 'Image generation failed - no image returned';

      // Return as SSE stream format so frontend can parse it consistently
      // First chunk with content
      const contentChunk = {
        id: `img-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          delta: { content: imageContent },
          finish_reason: null
        }]
      };

      // Final chunk with finish_reason
      const finalChunk = {
        id: `img-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          delta: {},
          finish_reason: 'stop'
        }]
      };

      const sseResponse = `data: ${JSON.stringify(contentChunk)}\n\ndata: ${JSON.stringify(finalChunk)}\n\ndata: [DONE]\n\n`;

      return new Response(sseResponse, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
      });
    }

    // Handle response based on response_format from database
    if (stream && response.body) {
      console.log(`[llm-proxy] Streaming response with format: ${responseFormat}`);
      
      if (responseFormat === 'anthropic') {
        return transformAnthropicStream(response.body, model, corsHeaders);
      } else if (responseFormat === 'gemini') {
        return transformGeminiStream(response.body, model, corsHeaders);
      } else if (responseFormat === 'cohere') {
        return transformCohereStream(response.body, model, corsHeaders);
      }
      
      // OpenAI-compatible, pass through directly
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const data = await response.json();
    
    if (responseFormat === 'anthropic') {
      return new Response(
        JSON.stringify(transformAnthropicResponse(data, model)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (responseFormat === 'gemini') {
      return new Response(
        JSON.stringify(transformGeminiResponse(data, model)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (responseFormat === 'cohere') {
      return new Response(
        JSON.stringify(transformCohereResponse(data, model)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OpenAI format, return as-is
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

// Build request body based on request format from database
function buildRequestBody(params: {
  requestFormat: string;
  systemMessageFormat: string;
  actualModelId: string;
  messages: any[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  maxTokensDefault: number;
  supportsTemperatureAndTopP: boolean;
  provider: string;
}): any {
  const {
    requestFormat,
    systemMessageFormat,
    actualModelId,
    messages,
    stream,
    temperature,
    max_tokens,
    top_p,
    maxTokensDefault,
    supportsTemperatureAndTopP,
    provider,
  } = params;

  const systemMsg = messages.find((m: any) => m.role === 'system');
  const nonSystemMsgs = messages.filter((m: any) => m.role !== 'system');

  if (requestFormat === 'anthropic') {
    const body: any = {
      model: actualModelId,
      messages: nonSystemMsgs,
      stream: stream,
      max_tokens: max_tokens || maxTokensDefault,
    };
    
    // Anthropic uses system as a top-level field
    if (systemMsg) {
      body.system = systemMsg.content;
    }
    
    // Anthropic doesn't support both temperature and top_p
    if (temperature !== undefined) {
      body.temperature = temperature;
    } else if (top_p !== undefined) {
      body.top_p = top_p;
    }
    
    return body;
  }

  if (requestFormat === 'gemini') {
    const body: any = {
      contents: nonSystemMsgs.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        maxOutputTokens: max_tokens || maxTokensDefault,
      }
    };
    
    if (temperature !== undefined) body.generationConfig.temperature = temperature;
    if (top_p !== undefined) body.generationConfig.topP = top_p;
    
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }
    
    return body;
  }

  if (requestFormat === 'cohere') {
    const body: any = {
      model: actualModelId,
      messages: messages,
      stream: stream,
    };
    
    if (max_tokens) body.max_tokens = max_tokens;
    if (temperature !== undefined) body.temperature = temperature;
    if (top_p !== undefined) body.p = top_p;
    
    return body;
  }

  // OpenAI-compatible format (default)
  // For OneAI/vLLM: Gateway has a bug where it transforms plain strings to ["string"]
  // which vLLM rejects. vLLM only accepts ContentPart array format [{type: "text", text: "..."}]
  // But Gateway only accepts ContentPart array when there's an image in the message.
  // Workaround: Skip system messages and prepend system prompt to first user message
  const isOneAI = provider === 'oneai';

  let finalMessages = messages;
  if (isOneAI) {
    // Find system message and extract its content
    const systemMsg = messages.find((m: any) => m.role === 'system');
    const systemPrompt = systemMsg ? (typeof systemMsg.content === 'string' ? systemMsg.content : '') : '';

    // Filter out system messages (they cause issues with OneAI Gateway)
    finalMessages = messages
      .filter((m: any) => m.role !== 'system')
      .map((msg: any, index: number) => {
        const content = msg.content;

        // For user messages with ContentPart array (has images), prepend system prompt
        if (Array.isArray(content)) {
          const normalizedContent = content.map((part: any) => {
            if (typeof part === 'object' && part !== null && part.type) {
              // If it's a text part and this is the first message, prepend system prompt
              if (part.type === 'text' && index === 0 && systemPrompt) {
                return { type: 'text', text: systemPrompt + '\n\n' + part.text };
              }
              return part;
            }
            if (typeof part === 'string') {
              return { type: 'text', text: part };
            }
            return part;
          });
          return { role: msg.role, content: normalizedContent };
        }

        // For plain string content user messages, we can't convert to ContentPart array
        // Gateway will corrupt it. Just pass through and hope for the best.
        // (This mainly affects non-vision requests which may work depending on model)
        return msg;
      });
  }

  const body: any = {
    model: actualModelId,
    messages: finalMessages,
    stream: stream,
  };
  
  if (max_tokens) body.max_tokens = max_tokens;
  
  // Handle temperature and top_p based on provider support
  if (supportsTemperatureAndTopP) {
    if (temperature !== undefined) body.temperature = temperature;
    if (top_p !== undefined) body.top_p = top_p;
  } else {
    // Only use temperature if provider doesn't support both
    if (temperature !== undefined) {
      body.temperature = temperature;
    } else if (top_p !== undefined) {
      body.top_p = top_p;
    }
  }
  
  return body;
}

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

// Transform Anthropic non-streaming response to OpenAI format
function transformAnthropicResponse(data: any, model: string): any {
  return {
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
      finish_reason: data.candidates?.[0]?.finishReason || 'stop'
    }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0
    }
  };
}

// Transform Cohere streaming response to OpenAI format
function transformCohereStream(body: ReadableStream, model: string, corsHeaders: Record<string, string>): Response {
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
          if (!line.trim()) continue;
          
          try {
            const parsed = JSON.parse(line);
            
            if (parsed.event_type === 'text-generation' && parsed.text) {
              const openAIChunk = {
                id: 'msg',
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{
                  index: 0,
                  delta: { content: parsed.text },
                  finish_reason: null
                }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
            } else if (parsed.event_type === 'stream-end') {
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

// Transform Cohere non-streaming response to OpenAI format
function transformCohereResponse(data: any, model: string): any {
  return {
    id: data.generation_id || 'msg',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: data.text || data.message?.content?.[0]?.text || ''
      },
      finish_reason: data.finish_reason || 'stop'
    }],
    usage: {
      prompt_tokens: data.meta?.tokens?.input_tokens || 0,
      completion_tokens: data.meta?.tokens?.output_tokens || 0,
      total_tokens: (data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0)
    }
  };
}
