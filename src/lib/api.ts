const sanitizeBase = (value?: string) => {
  if (!value) {
    return '';
  }
  return value.replace(/\/+$/, '');
};

const DEFAULT_ADMIN_BASE = sanitizeBase(import.meta.env.VITE_API_BASE_URL ?? '/api');
const DEFAULT_MCP_BASE = sanitizeBase(import.meta.env.VITE_MCP_API_URL ?? `${DEFAULT_ADMIN_BASE}/mcp`);
const FALLBACK_VIRTUAL_KEY = import.meta.env.VITE_ONEAI_API_KEY ?? '';

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

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string[] | string;
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: Partial<ChatMessage>;
  finish_reason?: string | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface CompletionRequest {
  model: string;
  prompt: string | string[];
  suffix?: string | null;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  logprobs?: number | null;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  best_of?: number;
  user?: string;
}

export interface CompletionChoice {
  text: string;
  index: number;
  logprobs?: unknown;
  finish_reason: string | null;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  input: string | string[];
  model: string;
  encoding_format?: string;
  user?: string;
}

export interface EmbeddingVector {
  object: string;
  embedding: number[];
  index: number;
}

export interface EmbeddingResponse {
  data: EmbeddingVector[];
  model: string;
  usage?: {
    prompt_tokens: number;
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

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
  hd?: string;
  given_name?: string;
  family_name?: string;
}

type ListModelsResponse = {
  data?: Model[];
};

const ensureBase = (candidate: string, fallback: string) => {
  return candidate && candidate.trim().length > 0 ? candidate : fallback;
};

export class OneEdgeClient {
  private readonly baseURL: string;
  private readonly mcpURL: string;

  constructor(config: { baseURL?: string; mcpURL?: string } = {}) {
    const base = sanitizeBase(config.baseURL ?? DEFAULT_ADMIN_BASE);
    const mcpBase = sanitizeBase(config.mcpURL ?? DEFAULT_MCP_BASE);
    this.baseURL = ensureBase(base, '/api');
    this.mcpURL = ensureBase(mcpBase, '/api/mcp');
  }

  private resolveURL(base: string, path: string): string {
    if (!path) {
      return base;
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private getStoredCredentials(): { api_key: string; full_endpoint: string; model_key: string; auth_header: string } | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('oneai_credentials');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Unable to read credentials from localStorage:', error);
      }
    }
    return null;
  }

  private getAllStoredCredentials(): { api_key: string; full_endpoint: string; model_key: string; auth_header: string; provider: string }[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('oneai_all_credentials');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Unable to read all credentials from localStorage:', error);
      }
    }
    return [];
  }

  private getCredentialForModel(modelName: string): { api_key: string; full_endpoint: string; model_key: string; auth_header: string; provider?: string } | null {
    const allCreds = this.getAllStoredCredentials();
    const modelCred = allCreds.find(c => c.model_key === modelName);
    if (modelCred) {
      return modelCred;
    }
    // Fall back to default credentials
    return this.getStoredCredentials();
  }

  private getVirtualKey(): string {
    // First try to get from full credentials
    const creds = this.getStoredCredentials();
    if (creds?.api_key) {
      return creds.api_key;
    }

    // Fall back to legacy storage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('oneai_api_key');
        if (stored) {
          return stored;
        }
      } catch (error) {
        console.warn('Unable to read Virtual Key from localStorage:', error);
      }
    }

    return FALLBACK_VIRTUAL_KEY;
  }

  /**
   * Get the chat completion endpoint from stored credentials
   */
  getChatEndpoint(): string {
    const creds = this.getStoredCredentials();
    if (creds?.full_endpoint) {
      return creds.full_endpoint;
    }
    // Fall back to default endpoint
    return `${this.baseURL}/v1/chat/completions`;
  }

  /**
   * Get the model key from stored credentials
   */
  getModelKey(): string | null {
    const creds = this.getStoredCredentials();
    return creds?.model_key || null;
  }

  private buildHeaders(init?: HeadersInit, accept?: string): Headers {
    const headers = new Headers(init);
    const key = this.getVirtualKey();
    const creds = this.getStoredCredentials();

    if (!key) {
      throw new Error('No virtual key configured. Open the API Keys modal and paste a Virtual Key from OneEdge Admin.');
    }

    // Use the auth header from credentials (default to Authorization)
    const authHeader = creds?.auth_header || 'Authorization';
    if (!headers.has(authHeader)) {
      headers.set(authHeader, `Bearer ${key}`);
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (accept) {
      headers.set('Accept', accept);
    } else if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    return headers;
  }

  private async requestFrom<T>(base: string, path: string, options: RequestInit = {}): Promise<T> {
    const url = this.resolveURL(base, path);
    const { headers: initHeaders, ...rest } = options;
    const headers = this.buildHeaders(initHeaders);

    const response = await fetch(url, {
      ...rest,
      headers,
    });

    if (!response.ok) {
      await this.raiseDetailedError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    if (contentType.includes('text/')) {
      const text = await response.text();
      return text as unknown as T;
    }

    const buffer = await response.arrayBuffer();
    return buffer as unknown as T;
  }

  private async streamFrom(base: string, path: string, options: RequestInit = {}, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    const url = this.resolveURL(base, path);
    const { headers: initHeaders, signal: initSignal, ...rest } = options;
    const headers = this.buildHeaders(initHeaders, 'text/event-stream');

    const response = await fetch(url, {
      ...rest,
      headers,
      signal: signal ?? initSignal,
    });

    if (!response.ok) {
      await this.raiseDetailedError(response);
    }

    if (!response.body) {
      throw new Error('The server did not return a stream.');
    }

    return response.body;
  }

  private async raiseDetailedError(response: Response): Promise<never> {
    let message = `Request failed with status ${response.status}`;

    try {
      const json = await response.clone().json();
      if (typeof json === 'string') {
        message = json;
      } else if (json?.error) {
        if (typeof json.error === 'string') {
          message = json.error;
        } else if (typeof json.error.message === 'string') {
          message = json.error.message;
        }
      } else if (typeof json?.message === 'string') {
        message = json.message;
      }
    } catch {
      try {
        const text = await response.clone().text();
        if (text) {
          message = text;
        }
      } catch {
        // ignore - keep default message
      }
    }

    throw new Error(message);
  }

  // Admin proxy helpers
  private requestAdmin<T>(path: string, options: RequestInit = {}): Promise<T> {
    return this.requestFrom<T>(this.baseURL, path, options);
  }

  private streamAdmin(path: string, options: RequestInit = {}, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    return this.streamFrom(this.baseURL, path, options, signal);
  }

  private requestMcp<T>(path: string, options: RequestInit = {}): Promise<T> {
    return this.requestFrom<T>(this.mcpURL, path, options);
  }

  async listModels(): Promise<Model[]> {
    const payload = await this.requestAdmin<ListModelsResponse>('/v1/models');
    return payload?.data ?? [];
  }

  async getModels(): Promise<Model[]> {
    return this.listModels();
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Get credential for the specific model being requested
    const creds = this.getCredentialForModel(request.model);
    const endpoint = creds?.full_endpoint || this.getChatEndpoint();
    const modelKey = request.model; // Always use the requested model name
    
    const payload = { ...request, model: modelKey, stream: false };
    
    // If we have credentials with an endpoint, call it directly
    if (creds?.full_endpoint && creds?.api_key) {
      const headers = new Headers();
      headers.set(creds.auth_header || 'Authorization', `Bearer ${creds.api_key}`);
      headers.set('Content-Type', 'application/json');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        await this.raiseDetailedError(response);
      }
      
      return (await response.json()) as ChatCompletionResponse;
    }
    
    return this.requestAdmin<ChatCompletionResponse>('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createChatCompletionStream(request: ChatCompletionRequest, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    // Get credential for the specific model being requested
    const creds = this.getCredentialForModel(request.model);
    const endpoint = creds?.full_endpoint || this.getChatEndpoint();
    const modelKey = request.model; // Always use the requested model name
    
    const payload = { ...request, model: modelKey, stream: true };
    
    // If we have credentials with an endpoint, call it directly
    if (creds?.full_endpoint && creds?.api_key) {
      const headers = new Headers();
      headers.set(creds.auth_header || 'Authorization', `Bearer ${creds.api_key}`);
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'text/event-stream');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
      });
      
      if (!response.ok) {
        await this.raiseDetailedError(response);
      }
      
      if (!response.body) {
        throw new Error('No response body for streaming request');
      }
      
      return response.body;
    }
    
    return this.streamAdmin('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, signal);
  }

  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    return this.requestAdmin<CompletionResponse>('/v1/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.requestAdmin<EmbeddingResponse>('/v1/embeddings', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async chatCompletions(body: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.createChatCompletion(body);
  }

  async chatCompletionsStream(body: ChatCompletionRequest, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    return this.createChatCompletionStream(body, signal);
  }

  async completions(body: CompletionRequest): Promise<CompletionResponse> {
    return this.createCompletion(body);
  }

  async embeddings(body: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.createEmbedding(body);
  }

  async getAgents(filters?: { env?: string; labels?: string; subject?: string }): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (filters?.env) params.append('env', filters.env);
    if (filters?.labels) params.append('labels', filters.labels);
    if (filters?.subject) params.append('subject', filters.subject);

    const query = params.toString();
    return this.requestMcp<Agent[]>(`/agents${query ? `?${query}` : ''}`);
  }

  async getAgent(id: string): Promise<Agent | null> {
    try {
      return await this.requestMcp<Agent>(`/agents/${id}`);
    } catch (error) {
      console.error('Failed to fetch agent:', error);
      return null;
    }
  }

  async createAgent(agent: Partial<Agent>): Promise<Agent> {
    return this.requestMcp<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    return this.requestMcp<Agent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    await this.requestMcp(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async publishAgent(id: string, env: string, by: string): Promise<Agent> {
    return this.requestMcp<Agent>(`/agents/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ env, by }),
    });
  }

  async getAgentManifest(id: string): Promise<Agent> {
    return this.requestMcp<Agent>(`/agents/${id}/manifest`);
  }

  async getPermissions(filters?: { agentId?: string; subjectId?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.agentId) params.append('agentId', filters.agentId);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);

    const query = params.toString();
    return this.requestMcp<any[]>(`/permissions${query ? `?${query}` : ''}`);
  }

  async getPermission(agentId: string, subjectId: string): Promise<any | null> {
    try {
      return await this.requestMcp<any>(`/permissions/${agentId}/${subjectId}`);
    } catch (error) {
      console.error('Failed to fetch permission:', error);
      return null;
    }
  }

  async createPermission(permission: any): Promise<any> {
    return this.requestMcp<any>('/permissions', {
      method: 'POST',
      body: JSON.stringify(permission),
    });
  }

  async updatePermission(agentId: string, subjectId: string, permission: any): Promise<any> {
    return this.requestMcp<any>(`/permissions/${agentId}/${subjectId}`, {
      method: 'PUT',
      body: JSON.stringify(permission),
    });
  }

  async deletePermission(agentId: string, subjectId: string): Promise<void> {
    await this.requestMcp(`/permissions/${agentId}/${subjectId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.requestAdmin('/health');
      return true;
    } catch {
      return false;
    }
  }

  async mcpHealthCheck(): Promise<boolean> {
    try {
      await this.requestMcp('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export async function* parseSSEStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<ChatCompletionChunk, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const raw of lines) {
        const line = raw.trim();
        if (!line || !line.startsWith('data:')) {
          continue;
        }

        const data = line.slice(5).trim();
        if (!data) {
          continue;
        }

        if (data === '[DONE]') {
          return;
        }

        try {
          const parsed = JSON.parse(data) as ChatCompletionChunk;
          yield parsed;
        } catch (error) {
          console.warn('Failed to parse SSE data chunk:', { data, error });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

const oneAIClient = new OneEdgeClient();

export { oneAIClient };

export default oneAIClient;
