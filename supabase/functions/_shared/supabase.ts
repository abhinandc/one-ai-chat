/**
 * Supabase Admin Client for Edge Functions
 *
 * This module provides a Supabase client with service role key
 * for use in Edge Functions that need to bypass RLS.
 *
 * IMPORTANT: Only use this in Edge Functions, never expose
 * the service key to the frontend.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Supabase Admin client with service role key.
 * This client bypasses RLS and should only be used in Edge Functions.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Create a Supabase client from an Authorization header.
 * Used to verify the user's JWT and get their user ID.
 */
export function createClientFromAuth(authHeader: string | null) {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  return createClient(supabaseUrl!, supabaseServiceKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get the user ID from an Authorization header.
 */
export async function getUserFromAuth(authHeader: string | null): Promise<{
  id: string;
  email: string;
} | null> {
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
  };
}
