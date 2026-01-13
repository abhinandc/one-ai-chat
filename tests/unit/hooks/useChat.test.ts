/**
 * Unit Tests for useChat Hook
 *
 * Tests the chat functionality including message sending,
 * streaming, error handling, and state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';
import { createMockStreamResponse, mockChatResponse, mockFetchJson, mockFetchError } from '../../__mocks__/api';

// Mock the API module
vi.mock('@/services/api', () => ({
  apiClient: {
    createChatCompletion: vi.fn(),
    createChatCompletionStream: vi.fn(),
  },
  parseSSEStream: vi.fn(),
}));

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for API key
    localStorage.setItem('oneai_api_key', 'test-api-key');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with empty messages and default state', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.streamingMessage).toBe('');
    });

    it('should accept initial options', () => {
      const options = {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.9,
        systemPrompt: 'You are a helpful assistant.',
      };

      const { result } = renderHook(() => useChat(options));

      expect(result.current.messages).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('should not send empty messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('');
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not send whitespace-only messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should add user message to state', async () => {
      // Mock the API client
      const mockApiClient = await import('@/services/api');
      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockResolvedValue(
        createMockStreamResponse(['Hello', '!'])
      );

      const mockParseSSEStream = vi.fn().mockImplementation(async function* () {
        yield { choices: [{ delta: { content: 'Hello' } }] };
        yield { choices: [{ delta: { content: '!' } }] };
      });
      vi.mocked(mockApiClient.parseSSEStream).mockImplementation(mockParseSSEStream);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello, world!');
      });

      expect(result.current.messages).toContainEqual({
        role: 'user',
        content: 'Hello, world!',
      });
    });

    it('should set loading state while processing', async () => {
      const mockApiClient = await import('@/services/api');

      let resolveStream: (value: unknown) => void;
      const streamPromise = new Promise((resolve) => {
        resolveStream = resolve;
      });

      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockImplementation(
        () => streamPromise as Promise<ReadableStream<Uint8Array>>
      );

      const { result } = renderHook(() => useChat());

      // Start sending (don't await)
      act(() => {
        result.current.sendMessage('Test message');
      });

      // Check loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isStreaming).toBe(true);
      });

      // Cleanup
      resolveStream!(createMockStreamResponse([]));
    });
  });

  describe('stopStreaming', () => {
    it('should abort streaming when called', async () => {
      const mockApiClient = await import('@/services/api');

      const abortController = new AbortController();
      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockImplementation(
        async (_, signal) => {
          // Simulate long-running stream
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
          }
          return createMockStreamResponse([]);
        }
      );

      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.sendMessage('Test');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      act(() => {
        result.current.stopStreaming();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', async () => {
      const { result } = renderHook(() => useChat());

      // Manually set some messages
      act(() => {
        result.current.setMessages([
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ]);
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.error).toBeNull();
      expect(result.current.streamingMessage).toBe('');
    });
  });

  describe('setMessages', () => {
    it('should set messages directly', () => {
      const { result } = renderHook(() => useChat());

      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi!' },
      ];

      act(() => {
        result.current.setMessages(messages);
      });

      expect(result.current.messages).toEqual(messages);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockApiClient = await import('@/services/api');
      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockRejectedValue(
        new Error('API Error')
      );
      vi.mocked(mockApiClient.apiClient.createChatCompletion).mockRejectedValue(
        new Error('API Error')
      );

      const onError = vi.fn();
      const { result } = renderHook(() => useChat({ onError }));

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.isLoading).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call onError callback when provided', async () => {
      const mockApiClient = await import('@/services/api');
      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockRejectedValue(
        new Error('Test error')
      );
      vi.mocked(mockApiClient.apiClient.createChatCompletion).mockRejectedValue(
        new Error('Test error')
      );

      const onError = vi.fn();
      const { result } = renderHook(() => useChat({ onError }));

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('Test error');
    });
  });

  describe('options', () => {
    it('should use custom options when sending messages', async () => {
      const mockApiClient = await import('@/services/api');
      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockResolvedValue(
        createMockStreamResponse(['Response'])
      );
      vi.mocked(mockApiClient.parseSSEStream).mockImplementation(async function* () {
        yield { choices: [{ delta: { content: 'Response' } }] };
      });

      const options = {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 500,
        systemPrompt: 'You are helpful.',
      };

      const { result } = renderHook(() => useChat(options));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockApiClient.apiClient.createChatCompletionStream).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          temperature: 0.5,
          max_tokens: 500,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: 'You are helpful.' }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should allow overriding options per message', async () => {
      const mockApiClient = await import('@/services/api');
      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockResolvedValue(
        createMockStreamResponse(['Response'])
      );
      vi.mocked(mockApiClient.parseSSEStream).mockImplementation(async function* () {
        yield { choices: [{ delta: { content: 'Response' } }] };
      });

      const { result } = renderHook(() => useChat({ model: 'gpt-4', temperature: 0.7 }));

      await act(async () => {
        await result.current.sendMessage('Hello', { temperature: 0.3 });
      });

      expect(mockApiClient.apiClient.createChatCompletionStream).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
        }),
        expect.any(Object)
      );
    });
  });

  describe('fallback to non-streaming', () => {
    it('should fallback to non-streaming on stream error', async () => {
      const mockApiClient = await import('@/services/api');

      // First call fails (streaming)
      vi.mocked(mockApiClient.apiClient.createChatCompletionStream).mockRejectedValue(
        new Error('Stream failed')
      );

      // Second call succeeds (non-streaming fallback)
      vi.mocked(mockApiClient.apiClient.createChatCompletion).mockResolvedValue({
        ...mockChatResponse,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Fallback response' },
            finish_reason: 'stop',
          },
        ],
      });

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      // Should have the fallback response
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          role: 'assistant',
          content: 'Fallback response',
        })
      );
    });
  });
});
