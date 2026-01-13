import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase';
import supabaseClient from '@/services/supabaseClient';
import { authLogger as logger } from '@/lib/logger';

export interface CurrentUser {
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}

const STORAGE_KEY = 'oneedge_user';

const normalizeValue = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const splitFullName = (value?: string | null) => {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return { first: undefined, last: undefined };
  }

  const parts = normalized.split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], last: undefined };
  }

  return {
    first: parts[0],
    last: parts.slice(1).join(' '),
  };
};

const persistUser = (value: CurrentUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      email: value.email,
      name: value.name,
      givenName: value.givenName,
      familyName: value.familyName,
      picture: value.picture,
    }),
  );
};

const parseStoredUser = (): CurrentUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      return {
        email: parsed.email,
        name: parsed.name,
        givenName: parsed.givenName,
        familyName: parsed.familyName,
        picture: parsed.picture,
      };
    }
  } catch (error) {
    logger.warn('Unable to parse stored user', { error });
  }

  return null;
};

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(() => parseStoredUser());

  // Listen to localStorage changes (backward compatibility)
  useEffect(() => {
    const handler = () => {
      setUser(parseStoredUser());
    };

    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Sync with Supabase Auth session
  useEffect(() => {
    let cancelled = false;

    const syncWithAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          const authUser = session.user;
          const userProfile: CurrentUser = {
            email: authUser.email!,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email,
            picture: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
            givenName: authUser.user_metadata?.given_name,
            familyName: authUser.user_metadata?.family_name,
          };

          setUser(userProfile);
          persistUser(userProfile);
        } else if (!user) {
          // No session and no stored user - ensure we're cleared
          setUser(null);
        }
      } catch (error) {
        logger.warn('Error syncing with Supabase Auth', { error });
      }
    };

    syncWithAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          persistUser(null);
        } else if (session?.user) {
          const authUser = session.user;
          const userProfile: CurrentUser = {
            email: authUser.email!,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email,
            picture: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
            givenName: authUser.user_metadata?.given_name,
            familyName: authUser.user_metadata?.family_name,
          };

          setUser(userProfile);
          persistUser(userProfile);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Load additional profile data from app_users table
  useEffect(() => {
    const email = user?.email;
    if (!email) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const { data: dbUser, error: dbUserError } = await supabaseClient
          .from('app_users')
          .select('name, avatar_url')
          .eq('email', email)
          .maybeSingle();

        let resolvedName = normalizeValue(dbUser?.name) ?? user?.name;
        let resolvedPicture = dbUser?.avatar_url ?? user?.picture;

        if (dbUserError && dbUserError.code !== 'PGRST116') {
          logger.warn('Unable to load app_users profile', { error: dbUserError.message });
        }

        if (cancelled) {
          return;
        }

        if (!resolvedName && !resolvedPicture) {
          return;
        }

        const derivedNames = splitFullName(resolvedName ?? user?.name);

        const next: CurrentUser = {
          email,
          name: resolvedName ?? user?.name,
          givenName: user?.givenName ?? derivedNames.first,
          familyName: user?.familyName ?? derivedNames.last,
          picture: resolvedPicture ?? user?.picture,
        };

        setUser((prev) => {
          if (
            prev &&
            prev.email === next.email &&
            prev.name === next.name &&
            prev.picture === next.picture &&
            prev.givenName === next.givenName &&
            prev.familyName === next.familyName
          ) {
            return prev;
          }

          persistUser(next);
          return next;
        });
      } catch (error) {
        logger.warn('Failed to hydrate current user profile', { error });
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return user;
}

export function getCurrentUser(): CurrentUser | null {
  return parseStoredUser();
}
