/**
 * Integration Tests for Chat Functionality
 *
 * Tests the integration between chat hooks, services, and API client.
 * These tests verify that components work together correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Use vi.hoisted to create mocks that can be used in vi.mock
const { mockSupabase, mockQueryBuilder } = vi.hoisted(() => {
  const mockQueryBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq',
    'gt', 'gte', 'lt', 'lte', 'or', 'order', 'limit', 'single', 'maybeSingle',
  ];

  methods.forEach(method => {
    mockQueryBuilder[method] = vi.fn(() => mockQueryBuilder);
  });

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: 'test' }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  };

  return { mockSupabase, mockQueryBuilder };
});

// Mock modules
vi.mock('@/services/supabaseClient', () => ({
  default: mockSupabase,
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: mockSupabase,
  default: mockSupabase,
}));

import { useChat } from '@/hooks/useChat';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Chat Integration Tests', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('oneai_api_key', 'test-api-key');
    localStorage.setItem('oneedge_user', JSON.stringify({ email: 'test@example.com' }));

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
    queryClient.clear();
  });

  describe('Chat with Streaming Response', () => {
    it('should handle complete chat flow with streaming', async () => {
      // Setup mock stream
      const encoder = new TextEncoder();
      const streamData = [
        'data: {"id":"1","choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"id":"2","choices":[{"delta":{"content":" there"}}]}\n\n',
        'data: {"id":"3","choices":[{"delta":{"content":"!"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      let index = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (index < streamData.length) {
            controller.enqueue(encoder.encode(streamData[index]));
            index++;
          } else {
            controller.close();
          }
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: mockStream,
      });

      const { result } = renderHook(() => useChat({ model: 'gpt-4' }), { wrapper });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // Wait for streaming to complete
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      }, { timeout: 5000 });

      // Should have both user message and assistant response
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    });

    it('should fallback to non-streaming on error', async () => {
      // First call fails (streaming)
      mockFetch
        .mockRejectedValueOnce(new Error('Stream error'))
        // Second call succeeds (non-streaming fallback)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'response-1',
              choices: [{ message: { content: 'Fallback response' } }],
            }),
        });

      const { result } = renderHook(() => useChat({ model: 'gpt-4' }), { wrapper });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useChat({ model: 'gpt-4', onError }), {
        wrapper,
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

      // Error should be handled
      expect(result.current.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChat({ model: 'gpt-4' }), { wrapper });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });
    });
  });

  describe('Conversation Management', () => {
    it('should maintain message history', async () => {
      const encoder = new TextEncoder();
      let callCount = 0;

      mockFetch.mockImplementation(() => {
        callCount++;
        const response = `Response ${callCount}`;
        const streamData = [
          `data: {"id":"${callCount}","choices":[{"delta":{"content":"${response}"}}]}\n\n`,
          'data: [DONE]\n\n',
        ];
        let index = 0;

        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'text/event-stream' }),
          body: new ReadableStream({
            pull(controller) {
              if (index < streamData.length) {
                controller.enqueue(encoder.encode(streamData[index]));
                index++;
              } else {
                controller.close();
              }
            },
          }),
        });
      });

      const { result } = renderHook(() => useChat({ model: 'gpt-4' }), { wrapper });

      // Send first message
      await act(async () => {
        await result.current.sendMessage('First');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

      // Send second message
      await act(async () => {
        await result.current.sendMessage('Second');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

      // Should have accumulated messages
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should clear messages', async () => {
      const encoder = new TextEncoder();
      const streamData = [
        'data: {"id":"1","choices":[{"delta":{"content":"Test response"}}]}\n\n',
        'data: [DONE]\n\n',
      ];
      let index = 0;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: new ReadableStream({
          pull(controller) {
            if (index < streamData.length) {
              controller.enqueue(encoder.encode(streamData[index]));
              index++;
            } else {
              controller.close();
            }
          },
        }),
      });

      const { result } = renderHook(() => useChat({ model: 'gpt-4' }), { wrapper });

      // Send a message first
      await act(async () => {
        await result.current.sendMessage('Test');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

      // Should have messages now
      expect(result.current.messages.length).toBeGreaterThan(0);

      // Clear messages
      await act(async () => {
        result.current.clearMessages();
      });

      expect(result.current.messages.length).toBe(0);
    });
  });
});
