/**
 * Supabase Mock for Unit Tests
 *
 * Provides a fully mocked Supabase client for testing services
 * that depend on database operations.
 */

import { vi } from 'vitest';

// Mock Supabase query builder
export const createMockQueryBuilder = () => {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'containedBy',
    'range',
    'overlaps',
    'textSearch',
    'filter',
    'not',
    'or',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'csv',
    'from',
    'rpc',
  ];

  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnThis();
  });

  // Default return values
  builder.select = vi.fn().mockReturnValue({
    ...builder,
    then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
  });

  return builder;
};

// Mock storage client
export const createMockStorageClient = () => ({
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
    download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url/file' } }),
  }),
});

// Mock auth client
export const createMockAuthClient = () => ({
  getSession: vi.fn().mockResolvedValue({
    data: { session: null },
    error: null,
  }),
  getUser: vi.fn().mockResolvedValue({
    data: { user: null },
    error: null,
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { user: null, session: null },
    error: null,
  }),
  signInWithOAuth: vi.fn().mockResolvedValue({
    data: { url: 'https://oauth.test/callback' },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  refreshSession: vi.fn().mockResolvedValue({
    data: { session: null },
    error: null,
  }),
});

// Mock realtime client
export const createMockRealtimeClient = () => ({
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
    unsubscribe: vi.fn().mockResolvedValue('ok'),
  }),
  removeChannel: vi.fn().mockResolvedValue('ok'),
});

// Create the main mock client
export const createMockSupabaseClient = () => {
  const queryBuilder = createMockQueryBuilder();

  return {
    from: vi.fn((table: string) => ({
      ...queryBuilder,
      table,
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: createMockAuthClient(),
    storage: createMockStorageClient(),
    realtime: createMockRealtimeClient(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
    }),
  };
};

// Default mock instance
export const mockSupabaseClient = createMockSupabaseClient();

// Mock data factories
export const mockConversation = (overrides = {}) => ({
  id: 'conv-1',
  user_email: 'test@example.com',
  title: 'Test Conversation',
  messages: [],
  folder_id: null,
  pinned: false,
  shared: false,
  unread: false,
  tags: [],
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockPromptTemplate = (overrides = {}) => ({
  id: 'prompt-1',
  user_email: 'test@example.com',
  title: 'Test Prompt',
  description: 'A test prompt template',
  content: 'This is {{variable}} prompt',
  category: 'general',
  tags: ['test'],
  is_public: false,
  likes_count: 0,
  uses_count: 0,
  difficulty: 'beginner' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockModel = (overrides = {}) => ({
  id: 'gpt-4',
  object: 'model',
  created: Date.now(),
  owned_by: 'openai',
  ...overrides,
});

export const mockVirtualKey = (overrides = {}) => ({
  id: 'vk-1',
  user_email: 'test@example.com',
  key_name: 'Test Key',
  key_hash: 'sk-test-...abc',
  models: ['gpt-4', 'claude-3-sonnet'],
  budget: 100,
  used: 25,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

export default mockSupabaseClient;
