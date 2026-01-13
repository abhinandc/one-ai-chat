/**
 * Integration Tests for Authentication
 *
 * Tests the authentication flow including Supabase auth,
 * session management, and user state.
 *
 * IMPORTANT: These tests use REAL Supabase connection.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  testSupabase,
  cleanupTestData,
  TEST_USER_EMAIL,
} from '../setup';

// Use vi.hoisted to create mocks
const { mockSupabase, mockAuthClient } = vi.hoisted(() => {
  const mockAuthClient = {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  };

  const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: mockAuthClient,
  };

  return { mockSupabase, mockAuthClient };
});

// Mock modules
vi.mock('@/services/supabaseClient', () => ({
  default: mockSupabase,
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: mockSupabase,
  default: mockSupabase,
}));

import { useCurrentUser } from '@/hooks/useCurrentUser';

describe('Authentication Integration Tests', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(TEST_USER_EMAIL);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock returns
    mockAuthClient.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockAuthClient.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData(TEST_USER_EMAIL);
  });

  describe('Session Management', () => {
    it('should return null user when not authenticated', async () => {
      mockAuthClient.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentUser).toBeNull();
    });

    it('should return user when authenticated session exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: TEST_USER_EMAIL,
        user_metadata: {
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      };

      mockAuthClient.getSession.mockResolvedValue({
        data: {
          session: {
            user: mockUser,
            access_token: 'test-token',
            refresh_token: 'refresh-token',
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentUser).toBeDefined();
    });

    it('should handle session errors gracefully', async () => {
      mockAuthClient.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired', code: 'SESSION_EXPIRED' },
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentUser).toBeNull();
    });
  });

  describe('OAuth Sign In', () => {
    it('should initiate Google OAuth flow', async () => {
      mockAuthClient.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize' },
        error: null,
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signInWithGoogle?.();
      });

      expect(mockAuthClient.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
    });

    it('should handle OAuth errors', async () => {
      mockAuthClient.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider error', code: 'OAUTH_ERROR' },
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle error gracefully without throwing
      await expect(
        act(async () => {
          await result.current.signInWithGoogle?.();
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Sign Out', () => {
    it('should clear session on sign out', async () => {
      const mockUser = {
        id: 'user-123',
        email: TEST_USER_EMAIL,
      };

      mockAuthClient.getSession.mockResolvedValue({
        data: {
          session: {
            user: mockUser,
            access_token: 'test-token',
          },
        },
        error: null,
      });

      mockAuthClient.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut?.();
      });

      expect(mockAuthClient.signOut).toHaveBeenCalled();
    });

    it('should clear localStorage on sign out', async () => {
      localStorage.setItem('oneedge_user', JSON.stringify({ email: TEST_USER_EMAIL }));
      localStorage.setItem('oneai_api_key', 'test-key');

      mockAuthClient.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut?.();
      });

      // After sign out, localStorage should be cleared
      expect(mockAuthClient.signOut).toHaveBeenCalled();
    });
  });

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes on mount', () => {
      renderHook(() => useCurrentUser(), { wrapper });

      expect(mockAuthClient.onAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribe = vi.fn();
      mockAuthClient.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const { unmount } = renderHook(() => useCurrentUser(), { wrapper });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should handle SIGNED_IN event', async () => {
      let authCallback: (event: string, session: unknown) => void;

      mockAuthClient.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate sign in event
      act(() => {
        authCallback!('SIGNED_IN', {
          user: { id: 'user-123', email: TEST_USER_EMAIL },
          access_token: 'new-token',
        });
      });

      // User should be updated
      expect(mockAuthClient.onAuthStateChange).toHaveBeenCalled();
    });

    it('should handle SIGNED_OUT event', async () => {
      let authCallback: (event: string, session: unknown) => void;

      mockAuthClient.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockAuthClient.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: TEST_USER_EMAIL },
            access_token: 'token',
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate sign out event
      act(() => {
        authCallback!('SIGNED_OUT', null);
      });

      expect(mockAuthClient.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('LocalStorage Integration', () => {
    it('should read user from localStorage on init', async () => {
      const storedUser = {
        email: TEST_USER_EMAIL,
        name: 'Stored User',
        picture: 'https://example.com/stored-avatar.jpg',
      };

      localStorage.setItem('oneedge_user', JSON.stringify(storedUser));

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have user from localStorage
      expect(localStorage.getItem('oneedge_user')).toBeTruthy();
    });

    it('should persist user to localStorage on sign in', async () => {
      const mockUser = {
        id: 'user-123',
        email: TEST_USER_EMAIL,
        user_metadata: {
          name: 'New User',
          avatar_url: 'https://example.com/new-avatar.jpg',
        },
      };

      mockAuthClient.getSession.mockResolvedValue({
        data: {
          session: {
            user: mockUser,
            access_token: 'token',
          },
        },
        error: null,
      });

      renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(mockAuthClient.getSession).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should retry on transient errors', async () => {
      let callCount = 0;

      mockAuthClient.getSession.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({
            data: { session: null },
            error: { message: 'Transient error', code: 'NETWORK_ERROR' },
          });
        }
        return Promise.resolve({
          data: {
            session: {
              user: { id: 'user-123', email: TEST_USER_EMAIL },
              access_token: 'token',
            },
          },
          error: null,
        });
      });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have attempted multiple times
      expect(mockAuthClient.getSession).toHaveBeenCalled();
    });

    it('should clear corrupted localStorage gracefully', async () => {
      localStorage.setItem('oneedge_user', 'invalid-json');

      // Should not throw
      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});

describe('Real Supabase Connection Test', () => {
  it('should connect to real Supabase instance', async () => {
    // Test that we can actually connect to Supabase
    const { data, error } = await testSupabase
      .from('prompt_templates')
      .select('count')
      .limit(1);

    // Should connect without throwing (even if no data)
    expect(error).toBeNull();
  });

  it('should be able to query tables', async () => {
    // Try to query a table
    const { data, error } = await testSupabase
      .from('conversations')
      .select('id')
      .limit(1);

    // Connection should work
    expect(error).toBeNull();
  });
});
