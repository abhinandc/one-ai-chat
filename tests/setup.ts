/**
 * OneEdge Test Setup
 *
 * This file configures the testing environment for Vitest.
 * It sets up DOM testing utilities, real Supabase connection,
 * and global test configurations.
 *
 * IMPORTANT: This setup uses REAL Supabase credentials for integration testing.
 * Test data is cleaned up in afterAll hooks.
 */

import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';

// Real Supabase credentials for testing
export const SUPABASE_TEST_URL = 'https://vzrnxiowtshzspybrxeq.supabase.co';
export const SUPABASE_TEST_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cm54aW93dHNoenNweWJyeGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODY0NDEsImV4cCI6MjA3NDI2MjQ0MX0.CpSZhCBJYkrCGqsqVd5Qm8TKrQBBE0l8l0hN_iMLVbc';

// Test user emails - use specific test emails that won't conflict with real users
export const TEST_USER_EMAIL = 'test-vitest@oneedge.test';
export const TEST_USER_EMAIL_CONV = 'test-vitest-conv@oneedge.test';

// Create real Supabase client for tests
export const testSupabase = createClient(SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY);

/**
 * Clean up test data for a specific user email
 */
export async function cleanupTestData(userEmail: string): Promise<void> {
  try {
    // Clean up in dependency order (children first)
    await testSupabase.from('prompt_likes').delete().eq('user_email', userEmail);
    await testSupabase.from('prompt_templates').delete().eq('user_email', userEmail);
    await testSupabase.from('conversations').delete().eq('user_email', userEmail);
    await testSupabase.from('conversation_folders').delete().eq('user_email', userEmail);
    await testSupabase.from('automations').delete().eq('user_email', userEmail);
  } catch (error) {
    console.warn('Test cleanup warning:', error);
  }
}

/**
 * Create a test prompt template
 */
export async function createTestPrompt(userEmail: string, overrides = {}) {
  const { data, error } = await testSupabase
    .from('prompt_templates')
    .insert({
      user_email: userEmail,
      title: `Test Prompt ${Date.now()}`,
      content: 'Test content {{variable}}',
      description: 'Test description',
      category: 'test',
      tags: ['test', 'vitest'],
      is_public: false,
      likes_count: 0,
      uses_count: 0,
      ...overrides,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a test conversation
 */
export async function createTestConversation(userEmail: string, overrides = {}) {
  const { data, error } = await testSupabase
    .from('conversations')
    .insert({
      user_email: userEmail,
      title: `Test Conversation ${Date.now()}`,
      messages: JSON.stringify([
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Test response' },
      ]),
      pinned: false,
      shared: false,
      unread: false,
      tags: ['test'],
      settings: {},
      ...overrides,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.matchMedia for responsive tests
// Use a function-based mock to avoid undefined issues
const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Apply to both window and globalThis for robustness
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(matchMediaMock),
  });
}

if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(matchMediaMock),
  });
}

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  takeRecords = vi.fn().mockReturnValue([]);
  constructor() {}
}
window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock scrollTo
window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock crypto for UUID generation
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Use REAL Supabase credentials - no mocking
// Tests connect to actual Supabase instance for integration testing
// See .claude/SUPABASE.md for credentials reference
vi.stubGlobal('import.meta', {
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://vzrnxiowtshzspybrxeq.supabase.co',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cm54aW93dHNoenNweWJyeGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODY0NDEsImV4cCI6MjA3NDI2MjQ0MX0.CpSZhCBJYkrCGqsqVd5Qm8TKrQBBE0l8l0hN_iMLVbc',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '/api',
    VITE_MCP_API_URL: process.env.VITE_MCP_API_URL || '/api/mcp',
    VITE_ONEAI_API_KEY: process.env.VITE_ONEAI_API_KEY || '',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
  },
});

// Console error spy for debugging
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React act() warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('act(') || args[0].includes('not wrapped in act'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Export test utilities
export { vi } from 'vitest';
export { render, screen, fireEvent, waitFor } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
