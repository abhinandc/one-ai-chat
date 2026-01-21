import { useState, useCallback, useRef } from 'react';
import {
  apiClient,
  parseSSEStream,
  type ChatCompletionRequest,
  type ChatMessage,
  type ContentPart,
} from '../services/api';

// Attachment type for images/files
export interface ChatAttachment {
  name: string;
  type: string; // MIME type
  size: number;
  data?: string; // Base64 data URI
}

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
  isThinking: boolean; // True when content has <thinking> but no </thinking> yet
  thinkingContent: string; // Content inside <thinking> block during streaming
}

export function useChat(options: UseChatOptions = {}) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    streamingMessage: '',
    isThinking: false,
    thinkingContent: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    attachments?: ChatAttachment[],
    customOptions?: Partial<UseChatOptions>
  ) => {
    const finalOptions = { ...options, ...customOptions };

    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // Build message content - use array format if we have attachments (images, PDFs, etc.)
    const hasAttachments = attachments?.some(a => a.data);

    let messageContent: string | ContentPart[];
    if (hasAttachments) {
      // Build multimodal content array for models
      // The backend will process these attachments using tools if the model doesn't support vision
      const contentParts: ContentPart[] = [];

      // Add text content first
      if (content.trim()) {
        contentParts.push({ type: 'text', text: content });
      }

      // Add all attachments (images, PDFs, text files, etc.)
      attachments?.forEach(attachment => {
        if (attachment.data) {
          // Log the attachment info
          const dataPrefix = attachment.data.substring(0, 50);
          console.log('[useChat] Adding attachment:', {
            name: attachment.name,
            type: attachment.type,
            dataPrefix,
            dataLength: attachment.data.length,
          });

          // Use image_url format for all attachments - backend will handle appropriately
          // This format is compatible with vision models and our document processing tools
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: attachment.data, // Base64 data URI
              detail: 'auto',
            },
            // Store metadata for the backend to identify file type
            metadata: {
              name: attachment.name,
              type: attachment.type,
              size: attachment.size,
            },
          } as ContentPart);
        }
      });

      messageContent = contentParts;
      console.log('[useChat] Sending message with', contentParts.length, 'parts:',
        contentParts.map(p => p.type === 'text' ? 'text' : `attachment (${(p as any).metadata?.type || 'unknown'}, ${(p as any).image_url?.url?.length || 0} chars)`));
    } else {
      messageContent = content;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
    };

    // For display purposes, store the message with attachment metadata
    // This allows the UI to render image thumbnails like Claude/OpenAI
    const displayMessage: ChatMessage = {
      role: 'user',
      content: content,
      // Store attachment metadata for UI display (thumbnails)
      metadata: attachments && attachments.length > 0 ? {
        attachments: attachments.map(a => ({
          name: a.name,
          type: a.type,
          size: a.size,
          // Include base64 data for image thumbnails
          data: a.type?.startsWith('image/') ? a.data : undefined,
        })),
      } : undefined,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, displayMessage],
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

      // Add previous messages (these should already be string content)
      messages.push(...state.messages);
      // Add the new user message with potential image content
      messages.push(userMessage);

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

            // Detect thinking state: has <thinking> but no </thinking> yet
            const hasOpenThinking = assistantContent.includes('<thinking>');
            const hasCloseThinking = assistantContent.includes('</thinking>');
            const isCurrentlyThinking = hasOpenThinking && !hasCloseThinking;

            // Extract thinking content if we're in thinking mode
            let thinkingContent = '';
            if (isCurrentlyThinking) {
              const thinkingStart = assistantContent.lastIndexOf('<thinking>');
              if (thinkingStart !== -1) {
                thinkingContent = assistantContent.slice(thinkingStart + 10);
              }
            }

            setState(prev => ({
              ...prev,
              streamingMessage: assistantContent,
              isThinking: isCurrentlyThinking,
              thinkingContent: thinkingContent,
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
          isThinking: false,
          thinkingContent: '',
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
            isThinking: false,
            thinkingContent: '',
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
        isThinking: false,
        thinkingContent: '',
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
      isThinking: false,
      thinkingContent: '',
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