/**
 * CORS Headers for Edge Functions
 *
 * Provides standard CORS headers and preflight handling
 * for all OneEdge Edge Functions.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

/**
 * Handle CORS preflight requests.
 * Returns a response for OPTIONS requests, or null for other methods.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

/**
 * Create a JSON response with CORS headers.
 */
export function jsonResponse(
  data: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create an error response with CORS headers.
 */
export function errorResponse(
  message: string,
  status = 400
): Response {
  return jsonResponse({ error: message }, status);
}
