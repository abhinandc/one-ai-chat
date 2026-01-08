import { useEffect, useState } from 'react';
import supabaseClient from '@/services/supabaseClient';

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
    console.warn('Unable to parse stored user', error);
  }

  return null;
};

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(() => parseStoredUser());

  useEffect(() => {
    const handler = () => {
      setUser(parseStoredUser());
    };

    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  }, []);

  useEffect(() => {
    const supabase = supabaseClient;
    const email = user?.email;
    if (!supabase || !email) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const { data: dbUser, error: dbUserError } = await supabase
          .from('users')
          .select('name')
          .eq('email', email)
          .maybeSingle();

        let resolvedName = normalizeValue(dbUser?.name) ?? user?.name;
        let resolvedPicture = user?.picture;

        if (dbUserError && dbUserError.code !== 'PGRST116') {
          console.warn('Unable to load users profile', dbUserError.message);
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
        console.warn('Failed to hydrate current user profile', error);
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
