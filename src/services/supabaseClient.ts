/**
 * Legacy Supabase Client Export
 *
 * @deprecated Use `@/integrations/supabase` instead.
 *
 * This file is maintained for backward compatibility.
 * New code should import from the integrations module:
 *
 * @example
 * ```ts
 * // Old (deprecated)
 * import { supabase } from '@/services/supabaseClient';
 *
 * // New (recommended)
 * import { supabase } from '@/integrations/supabase';
 * ```
 */

// Re-export everything from the new module location
export {
  supabase,
  supabaseUrl,
  supabaseAnonKey,
  onAuthStateChange,
  getCurrentSession,
  getCurrentUser,
  signInWithGoogle,
  signOut,
  refreshSession,
} from '../integrations/supabase';

// Default export for backward compatibility
export { default } from '../integrations/supabase';
