/**
 * API Mock for Unit Tests
 *
 * Provides mocked API client and responses for testing
 * components and hooks that interact with the OneEdge API.
 */

import { vi } from 'vitest';

// Types from the actual API
export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  owner: string;
  version: string;
  modelRouting: {
    primary: string;
    fallbacks?: string[];
    shadow?: string[];
  };
  tools: { slug: string; scopes: string[] }[];
  datasets: { id: string; access: 'read' | 'write'; filters?: unknown }[];
  runtime: {
    maxTokens: number;
    maxSeconds: number;
    maxCostUSD: number;
    allowDomains?: string[];
    fileIO?: boolean;
  };
  labels?: string[];
  published?: {
    env: 'dev' | 'staging' | 'prod';
    at: string;
    by: string;
  };
}

// Mock data
export const mockModels: Model[] = [
  { id: 'gpt-4', object: 'model', created: 1677610602, owned_by: 'openai' },
  { id: 'gpt-4o', object: 'model', created: 1677610603, owned_by: 'openai' },
  { id: 'gpt-4o-mini', object: 'model', created: 1677610604, owned_by: 'openai' },
  { id: 'claude-3-opus-20240229', object: 'model', created: 1677610605, owned_by: 'anthropic' },
  { id: 'claude-3-sonnet-20240229', object: 'model', created: 1677610606, owned_by: 'anthropic' },
  { id: 'claude-3-haiku-20240229', object: 'model', created: 1677610607, owned_by: 'anthropic' },
  { id: 'gemini-pro', object: 'model', created: 1677610608, owned_by: 'google' },
];

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Test Agent',
    owner: 'test@example.com',
    version: '1.0.0',
    modelRouting: { primary: 'gpt-4' },
    tools: [],
    datasets: [],
    runtime: { maxTokens: 2048, maxSeconds: 60, maxCostUSD: 1.0 },
    labels: ['test'],
  },
];

export const mockChatResponse: ChatCompletionResponse = {
  id: 'chatcmpl-test-123',
  object: 'chat.completion',
  created: Date.now(),
  model: 'gpt-4',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: 'This is a test response.' },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 5,
    total_tokens: 15,
  },
};

// Create mock streaming response
export const createMockStreamResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        const chunk = chunks[index];
        const data = `data: ${JSON.stringify({
          id: 'chatcmpl-test',
          object: 'chat.completion.chunk',
          created: Date.now(),
          model: 'gpt-4',
          choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
        })}\n\n`;
        controller.enqueue(encoder.encode(data));
        index++;
      } else {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
};

// Mock API Client
export const createMockApiClient = () => ({
  listModels: vi.fn().mockResolvedValue(mockModels),
  getModels: vi.fn().mockResolvedValue(mockModels),
  createChatCompletion: vi.fn().mockResolvedValue(mockChatResponse),
  createChatCompletionStream: vi.fn().mockResolvedValue(createMockStreamResponse(['Hello', ' world', '!'])),
  createCompletion: vi.fn().mockResolvedValue({
    id: 'cmpl-test',
    object: 'text_completion',
    created: Date.now(),
    model: 'gpt-4',
    choices: [{ text: 'Test completion', index: 0, finish_reason: 'stop' }],
  }),
  createEmbedding: vi.fn().mockResolvedValue({
    data: [{ object: 'embedding', embedding: [0.1, 0.2, 0.3], index: 0 }],
    model: 'text-embedding-ada-002',
    usage: { prompt_tokens: 5, total_tokens: 5 },
  }),
  getAgents: vi.fn().mockResolvedValue(mockAgents),
  getAgent: vi.fn().mockImplementation((id: string) =>
    Promise.resolve(mockAgents.find((a) => a.id === id) || null)
  ),
  createAgent: vi.fn().mockImplementation((agent: Partial<Agent>) =>
    Promise.resolve({ ...mockAgents[0], ...agent, id: 'new-agent-id' })
  ),
  updateAgent: vi.fn().mockImplementation((id: string, updates: Partial<Agent>) =>
    Promise.resolve({ ...mockAgents[0], ...updates, id })
  ),
  deleteAgent: vi.fn().mockResolvedValue(undefined),
  publishAgent: vi.fn().mockImplementation((id: string, env: string, by: string) =>
    Promise.resolve({ ...mockAgents[0], id, published: { env, at: new Date().toISOString(), by } })
  ),
  healthCheck: vi.fn().mockResolvedValue(true),
  mcpHealthCheck: vi.fn().mockResolvedValue(true),
});

export const mockApiClient = createMockApiClient();

// Mock fetch helper for stream testing
export const mockFetchStream = (chunks: string[]) => {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'text/event-stream' }),
    body: createMockStreamResponse(chunks),
  });
};

// Mock fetch helper for JSON responses
export const mockFetchJson = <T>(data: T, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone: () => ({
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    }),
  });
};

// Mock fetch helper for errors
export const mockFetchError = (message: string, status = 500) => {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ error: { message } }),
    text: () => Promise.resolve(JSON.stringify({ error: { message } })),
    clone: () => ({
      json: () => Promise.resolve({ error: { message } }),
      text: () => Promise.resolve(JSON.stringify({ error: { message } })),
    }),
  });
};

export default mockApiClient;
