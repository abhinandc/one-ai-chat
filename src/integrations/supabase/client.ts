/**
 * Supabase Client Configuration
 *
 * This module provides the configured Supabase client for OneEdge.
 * It connects to the shared Supabase instance used by both EdgeAdmin and OneEdge.
 *
 * @module integrations/supabase/client
 */

import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Database } from './types';
import { authLogger as logger } from '@/lib/logger';

// Validate environment variables at module load time
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In test environment, use fallback values if not configured
const isTestEnv = import.meta.env.MODE === 'test' || typeof import.meta.env.VITEST !== 'undefined';

if (!supabaseUrl && !isTestEnv) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please configure this in your .env file.'
  );
}

if (!supabaseAnonKey && !isTestEnv) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. ' +
    'Please configure this in your .env file.'
  );
}

// Fail fast in production if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase configuration missing. Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.'
  );
}

const finalSupabaseUrl = supabaseUrl;
const finalSupabaseAnonKey = supabaseAnonKey;

/**
 * The main Supabase client instance for OneEdge.
 *
 * Features:
 * - Type-safe database operations via generated types
 * - Persistent session management via localStorage
 * - Automatic token refresh
 * - Multi-tab session synchronization
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  finalSupabaseUrl,
  finalSupabaseAnonKey,
  {
    auth: {
      // Persist session to localStorage for remember-me functionality
      persistSession: true,
      // Storage key for the session
      storageKey: 'oneedge-auth-token',
      // Auto-refresh tokens before expiry
      autoRefreshToken: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
      // Flow type for OAuth - PKCE is more secure
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-client-info': 'oneedge-web',
      },
    },
    // Realtime configuration for subscriptions
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Type for auth state change callback
 */
export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null
) => void;

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 *
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session?.user.email);
 *   }
 * });
 *
 * // Later, to cleanup:
 * unsubscribe();
 * ```
 */
export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

/**
 * Get the current session, if any.
 * Returns null if not authenticated.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    logger.error('Error getting session', { error: error.message });
    return null;
  }
  return session;
}

/**
 * Get the current user, if authenticated.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    logger.error('Error getting user', { error: error.message });
    return null;
  }
  return user;
}

/**
 * Validate that a redirect URL is safe (same-origin only).
 * Prevents open redirect vulnerabilities.
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Sign in with Google OAuth.
 * Redirects to Google for authentication.
 *
 * @param redirectTo - Optional URL to redirect to after authentication (must be same-origin)
 */
export async function signInWithGoogle(redirectTo?: string) {
  // Validate redirect URL to prevent open redirect attacks
  const defaultRedirect = `${window.location.origin}/auth/callback`;
  const safeRedirect = redirectTo && isValidRedirectUrl(redirectTo)
    ? redirectTo
    : defaultRedirect;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: safeRedirect,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new Error(`Google sign-in failed: ${error.message}`);
  }
}

/**
 * Sign out the current user.
 * Clears the session from localStorage.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

/**
 * Refresh the current session.
 * Useful when you need a fresh access token.
 */
export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(`Session refresh failed: ${error.message}`);
  }
  return session;
}

// Re-export for convenience
export { finalSupabaseUrl as supabaseUrl, finalSupabaseAnonKey as supabaseAnonKey };
export default supabase;
