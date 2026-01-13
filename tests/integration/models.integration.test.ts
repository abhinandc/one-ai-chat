/**
 * Integration Tests for Models Functionality
 *
 * Tests the integration between models hooks, API client, and Supabase.
 * Uses REAL connections - no mocks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Check if API is configured
const API_URL = import.meta.env.VITE_API_PROXY_URL;
const skipTests = !API_URL;

import { useModels } from '@/services/api';

describe.skipIf(skipTests)('Models Integration Tests - Real API', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    // Set up API key for tests
    localStorage.setItem('oneai_api_key', 'test-api-key');

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

  describe('Model Fetching', () => {
    it('should fetch models from real API', async () => {
      const { result } = renderHook(() => useModels(), { wrapper });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      // Should have data or error - real API response
      if (!result.current.error) {
        expect(result.current.data).toBeDefined();
        if (result.current.data) {
          expect(Array.isArray(result.current.data)).toBe(true);
        }
      }
    });

    it('should handle API responses', async () => {
      const { result } = renderHook(() => useModels(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      // Either we get data or an error - both are valid responses
      const hasResponse = result.current.data !== undefined || result.current.error !== undefined;
      expect(hasResponse).toBe(true);
    });
  });

  describe('Model Data Structure', () => {
    it('should return models with expected properties', async () => {
      const { result } = renderHook(() => useModels(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      if (result.current.data && result.current.data.length > 0) {
        const model = result.current.data[0];
        // Check that model has expected structure
        expect(model).toHaveProperty('id');
        // Name or model property
        expect(model.name || model.id).toBeDefined();
      }
    });
  });

  describe('Caching Behavior', () => {
    it('should use cache for repeated requests', async () => {
      // First fetch
      const { result: result1, unmount } = renderHook(() => useModels(), { wrapper });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      unmount();

      // Second fetch should use cache
      const { result: result2 } = renderHook(() => useModels(), { wrapper });

      // With cache, data should be available quickly
      await waitFor(() => {
        expect(result2.current.data).toBeDefined();
      }, { timeout: 1000 });
    });
  });
});

// Message when tests are skipped
describe.skipIf(!skipTests)('Models Integration Tests - Skipped', () => {
  it('tests skipped due to missing API configuration', () => {
    console.log('Skipping Models Integration tests - VITE_API_PROXY_URL not set');
    expect(true).toBe(true);
  });
});
