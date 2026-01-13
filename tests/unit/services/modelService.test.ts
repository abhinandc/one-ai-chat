/**
 * Unit Tests for Model Service
 *
 * Tests the API client model-related functionality including
 * fetching models, handling responses, and error cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient from '@/lib/api';
import { mockModels, mockFetchJson, mockFetchError } from '../../__mocks__/api';

// Mock fetch globally
const originalFetch = global.fetch;

describe('Model Service (API Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('oneai_api_key', 'test-api-key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  describe('getModels', () => {
    it('should fetch and return available models', async () => {
      global.fetch = mockFetchJson({ data: mockModels });

      const models = await apiClient.getModels();

      expect(models).toEqual(mockModels);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty model list', async () => {
      global.fetch = mockFetchJson({ data: [] });

      const models = await apiClient.getModels();

      expect(models).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      global.fetch = mockFetchError('API Error', 500);

      await expect(apiClient.getModels()).rejects.toThrow();
    });

    it('should throw error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(apiClient.getModels()).rejects.toThrow('Network error');
    });

    it('should include authorization header', async () => {
      global.fetch = mockFetchJson({ data: mockModels });

      await apiClient.getModels();

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1]?.headers;

      // Headers is a class, need to check it differently
      expect(headers).toBeDefined();
      expect(headers.get('Authorization')).toBe('Bearer test-api-key');
    });
  });

  describe('listModels (alias)', () => {
    it('should be an alias for getModels', async () => {
      global.fetch = mockFetchJson({ data: mockModels });

      const models = await apiClient.listModels();

      expect(models).toEqual(mockModels);
    });
  });

  describe('Model response parsing', () => {
    it('should parse model objects correctly', async () => {
      const rawModels = [
        { id: 'gpt-4', object: 'model', created: 1677610602, owned_by: 'openai' },
        { id: 'claude-3-opus', object: 'model', created: 1677610603, owned_by: 'anthropic' },
      ];

      global.fetch = mockFetchJson({ data: rawModels });

      const models = await apiClient.getModels();

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('id', 'gpt-4');
      expect(models[0]).toHaveProperty('owned_by', 'openai');
      expect(models[1]).toHaveProperty('id', 'claude-3-opus');
      expect(models[1]).toHaveProperty('owned_by', 'anthropic');
    });

    it('should handle models with missing optional fields', async () => {
      const rawModels = [
        { id: 'minimal-model', object: 'model', created: Date.now(), owned_by: '' },
      ];

      global.fetch = mockFetchJson({ data: rawModels });

      const models = await apiClient.getModels();

      expect(models[0]).toHaveProperty('id', 'minimal-model');
      expect(models[0]).toHaveProperty('owned_by', '');
    });
  });

  describe('Error handling', () => {
    it('should handle 401 unauthorized', async () => {
      global.fetch = mockFetchError('Unauthorized', 401);

      await expect(apiClient.getModels()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      global.fetch = mockFetchError('Forbidden', 403);

      await expect(apiClient.getModels()).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      global.fetch = mockFetchError('Not Found', 404);

      await expect(apiClient.getModels()).rejects.toThrow();
    });

    it('should handle 429 rate limit', async () => {
      global.fetch = mockFetchError('Rate limit exceeded', 429);

      await expect(apiClient.getModels()).rejects.toThrow();
    });

    it('should handle 500 server error', async () => {
      global.fetch = mockFetchError('Internal Server Error', 500);

      await expect(apiClient.getModels()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      await expect(apiClient.getModels()).rejects.toThrow('Request timeout');
    });
  });

  describe('API key handling', () => {
    it('should throw error when no API key is configured', async () => {
      localStorage.removeItem('oneai_api_key');
      global.fetch = mockFetchJson({ data: mockModels });

      // Should throw error because virtual key is required
      await expect(apiClient.getModels()).rejects.toThrow('No virtual key configured');
    });

    it('should throw error when API key is removed from localStorage', async () => {
      localStorage.removeItem('oneai_api_key');
      global.fetch = mockFetchJson({ data: mockModels });

      // Should throw error because virtual key is required
      await expect(apiClient.getModels()).rejects.toThrow('No virtual key configured');
    });
  });

  describe('Response caching (if implemented)', () => {
    it('should return consistent data for same request', async () => {
      global.fetch = mockFetchJson({ data: mockModels });

      const models1 = await apiClient.getModels();
      const models2 = await apiClient.getModels();

      expect(models1).toEqual(models2);
    });
  });

  describe('Health check', () => {
    it('should return true when API is healthy', async () => {
      // Ensure API key is set for health check
      localStorage.setItem('oneai_api_key', 'test-api-key');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: () => Promise.resolve({ status: 'ok' }),
      });

      const isHealthy = await apiClient.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ status: 'error' }),
      });

      const isHealthy = await apiClient.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const isHealthy = await apiClient.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });
});

describe('Model filtering utilities', () => {
  it('should filter models by provider', () => {
    const filterByProvider = (models: typeof mockModels, provider: string) =>
      models.filter((m) => m.owned_by === provider);

    const openaiModels = filterByProvider(mockModels, 'openai');
    const anthropicModels = filterByProvider(mockModels, 'anthropic');

    expect(openaiModels.every((m) => m.owned_by === 'openai')).toBe(true);
    expect(anthropicModels.every((m) => m.owned_by === 'anthropic')).toBe(true);
  });

  it('should sort models by ID', () => {
    const sortById = (models: typeof mockModels) =>
      [...models].sort((a, b) => a.id.localeCompare(b.id));

    const sorted = sortById(mockModels);

    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].id.localeCompare(sorted[i].id)).toBeLessThanOrEqual(0);
    }
  });

  it('should filter models by ID pattern', () => {
    const filterByIdPattern = (models: typeof mockModels, pattern: RegExp) =>
      models.filter((m) => pattern.test(m.id));

    const gptModels = filterByIdPattern(mockModels, /^gpt/);
    const claudeModels = filterByIdPattern(mockModels, /^claude/);

    expect(gptModels.every((m) => m.id.startsWith('gpt'))).toBe(true);
    expect(claudeModels.every((m) => m.id.startsWith('claude'))).toBe(true);
  });
});
