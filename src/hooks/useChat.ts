import { useState, useCallback, useRef } from 'react';
import {
  apiClient,
  parseSSEStream,
  type ChatCompletionRequest,
  type ChatMessage,
} from '../services/api';

export interface UseChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  onError?: (error: Error) => void;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  streamingMessage: string;
}

export function useChat(options: UseChatOptions = {}) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    streamingMessage: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, customOptions?: Partial<UseChatOptions>) => {
    const finalOptions = { ...options, ...customOptions };

    if (!content.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      isStreaming: true,
      error: null,
      streamingMessage: '',
    }));

    try {
      const messages: ChatMessage[] = [];

      if (finalOptions.systemPrompt) {
        messages.push({
          role: 'system',
          content: finalOptions.systemPrompt,
        });
      }

      messages.push(...state.messages, userMessage);

      const request: ChatCompletionRequest = {
        model: finalOptions.model || 'default',
        messages,
        stream: true,
        temperature: finalOptions.temperature ?? 0.7,
        max_tokens: finalOptions.maxTokens ?? 2048,
        top_p: finalOptions.topP ?? 0.9,
      };

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        console.log('[useChat] Starting stream request:', { model: request.model });
        const stream = await apiClient.createChatCompletionStream(request, controller.signal);
        console.log('[useChat] Stream obtained, starting to read chunks');
        let assistantContent = '';
        let chunkCount = 0;

        for await (const chunk of parseSSEStream(stream)) {
          if (controller.signal.aborted) {
            console.log('[useChat] Stream aborted by user');
            break;
          }

          chunkCount++;
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            assistantContent += delta;
            setState(prev => ({
              ...prev,
              streamingMessage: assistantContent,
            }));
          }
        }

        console.log('[useChat] Stream complete:', { chunkCount, contentLength: assistantContent.length });

        if (controller.signal.aborted) {
          return;
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: assistantContent || 'No response generated',
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          isStreaming: false,
          streamingMessage: '',
        }));
      } catch (streamError) {
        console.error('[useChat] Stream error:', streamError);
        
        if (streamError instanceof DOMException && streamError.name === 'AbortError') {
          return;
        }

        if ((streamError as Error)?.name === 'AbortError') {
          return;
        }

        console.warn('[useChat] Streaming failed, falling back to non-streaming request:', streamError);

        try {
          const response = await apiClient.createChatCompletion({
            ...request,
            stream: false,
          });

          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response.choices?.[0]?.message?.content || 'No response generated',
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            isLoading: false,
            isStreaming: false,
            streamingMessage: '',
          }));
        } catch (fallbackError) {
          console.error('[useChat] Non-streaming fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';

      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        error: errorMessage,
        streamingMessage: '',
      }));

      if (finalOptions.onError) {
        finalOptions.onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [options, state.messages]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({
      ...prev,
      isLoading: false,
      isStreaming: false,
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
      streamingMessage: '',
    }));
  }, []);

  const setMessages = useCallback((messages: ChatMessage[]) => {
    setState(prev => ({
      ...prev,
      messages,
    }));
  }, []);

  return {
    ...state,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages,
  };
}