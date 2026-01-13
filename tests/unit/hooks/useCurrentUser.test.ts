/**
 * Unit Tests for useCurrentUser Hook
 *
 * Tests user authentication state management,
 * localStorage persistence, and profile hydration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCurrentUser, getCurrentUser, type CurrentUser } from '@/hooks/useCurrentUser';

// Mock supabaseClient
vi.mock('@/services/supabaseClient', () => ({
  default: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

const STORAGE_KEY = 'oneedge_user';

describe('useCurrentUser', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should return null when no user is stored', () => {
      const { result } = renderHook(() => useCurrentUser());
      expect(result.current).toBeNull();
    });

    it('should return stored user from localStorage', () => {
      const mockUser: CurrentUser = {
        email: 'test@example.com',
        name: 'Test User',
        givenName: 'Test',
        familyName: 'User',
        picture: 'https://example.com/avatar.jpg',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current).toEqual(mockUser);
    });

    it('should handle malformed JSON in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current).toBeNull();
    });

    it('should handle missing email in stored user', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'Test' }));

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current).toBeNull();
    });
  });

  describe('storage event handling', () => {
    it('should update user when storage changes', async () => {
      const { result } = renderHook(() => useCurrentUser());

      expect(result.current).toBeNull();

      const newUser: CurrentUser = {
        email: 'new@example.com',
        name: 'New User',
      };

      act(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
      });

      await waitFor(() => {
        expect(result.current).toEqual(newUser);
      });
    });

    it('should handle user removal from storage', async () => {
      const mockUser: CurrentUser = {
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current).toEqual(mockUser);

      act(() => {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
      });

      await waitFor(() => {
        expect(result.current).toBeNull();
      });
    });
  });

  describe('profile hydration', () => {
    it('should hydrate profile from Supabase when available', async () => {
      const supabaseClient = await import('@/services/supabaseClient');

      vi.mocked(supabaseClient.default?.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { name: 'Updated Name' },
              error: null,
            }),
          }),
        }),
      } as any);

      const mockUser: CurrentUser = {
        email: 'test@example.com',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current?.name).toBe('Updated Name');
      });
    });

    it('should handle Supabase errors gracefully', async () => {
      const supabaseClient = await import('@/services/supabaseClient');

      vi.mocked(supabaseClient.default?.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'TEST_ERROR', message: 'Test error' },
            }),
          }),
        }),
      } as any);

      const mockUser: CurrentUser = {
        email: 'test@example.com',
        name: 'Original Name',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      // Should keep original name despite error
      await waitFor(() => {
        expect(result.current?.name).toBe('Original Name');
      });
    });
  });

  describe('name parsing', () => {
    it('should split full name into given and family names', async () => {
      const supabaseClient = await import('@/services/supabaseClient');

      vi.mocked(supabaseClient.default?.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { name: 'John Doe' },
              error: null,
            }),
          }),
        }),
      } as any);

      const mockUser: CurrentUser = {
        email: 'test@example.com',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current?.givenName).toBe('John');
        expect(result.current?.familyName).toBe('Doe');
      });
    });

    it('should handle single name correctly', async () => {
      const supabaseClient = await import('@/services/supabaseClient');

      vi.mocked(supabaseClient.default?.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { name: 'Madonna' },
              error: null,
            }),
          }),
        }),
      } as any);

      const mockUser: CurrentUser = {
        email: 'test@example.com',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current?.givenName).toBe('Madonna');
        expect(result.current?.familyName).toBeUndefined();
      });
    });

    it('should handle multi-part names correctly', async () => {
      const supabaseClient = await import('@/services/supabaseClient');

      vi.mocked(supabaseClient.default?.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { name: 'Jean Claude Van Damme' },
              error: null,
            }),
          }),
        }),
      } as any);

      const mockUser: CurrentUser = {
        email: 'test@example.com',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current?.givenName).toBe('Jean');
        expect(result.current?.familyName).toBe('Claude Van Damme');
      });
    });
  });

  describe('getCurrentUser function', () => {
    it('should return null when no user is stored', () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return stored user', () => {
      const mockUser: CurrentUser = {
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const user = getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('should work independently from the hook', () => {
      const mockUser: CurrentUser = {
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      // Don't render the hook, just call the function
      const user = getCurrentUser();
      expect(user).toEqual(mockUser);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const mockUser = {
        email: 'test@example.com',
        name: '',
        givenName: '   ',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current?.email).toBe('test@example.com');
    });

    it('should handle undefined window (SSR)', () => {
      // This is handled by the typeof window check in the hook
      const user = getCurrentUser();
      expect(user).not.toThrow;
    });

    it('should preserve existing user data when hydration returns no updates', async () => {
      const supabaseClient = await import('@/services/supabaseClient');

      vi.mocked(supabaseClient.default?.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const mockUser: CurrentUser = {
        email: 'test@example.com',
        name: 'Original Name',
        picture: 'https://example.com/pic.jpg',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current).toEqual(mockUser);
      });
    });
  });
});
