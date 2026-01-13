/**
 * Unit Tests for useModels Hook
 *
 * Tests model fetching, caching, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useModels, transformModelForUI } from '@/hooks/useModels';
import { mockModels } from '../../__mocks__/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
  default: {
    getModels: vi.fn(),
  },
}));

describe('useModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('oneai_api_key', 'test-api-key');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should start with loading state', async () => {
      const apiClient = await import('@/lib/api');
      vi.mocked(apiClient.default.getModels).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useModels());

      expect(result.current.loading).toBe(true);
      expect(result.current.models).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetching models', () => {
    it('should fetch and return models on mount', async () => {
      const apiClient = await import('@/lib/api');
      vi.mocked(apiClient.default.getModels).mockResolvedValue(mockModels);

      const { result } = renderHook(() => useModels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.models).toEqual(mockModels);
      expect(result.current.error).toBeNull();
      expect(apiClient.default.getModels).toHaveBeenCalledTimes(1);
    });

    it('should handle empty model list', async () => {
      const apiClient = await import('@/lib/api');
      vi.mocked(apiClient.default.getModels).mockResolvedValue([]);

      const { result } = renderHook(() => useModels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.models).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors', async () => {
      const apiClient = await import('@/lib/api');
      vi.mocked(apiClient.default.getModels).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useModels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.models).toEqual([]);
    });

    it('should handle non-Error objects in catch', async () => {
      const apiClient = await import('@/lib/api');
      vi.mocked(apiClient.default.getModels).mockRejectedValue('String error');

      const { result } = renderHook(() => useModels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch models');
    });
  });

  describe('refetch', () => {
    it('should refetch models when called', async () => {
      const apiClient = await import('@/lib/api');
      vi.mocked(apiClient.default.getModels)
        .mockResolvedValueOnce(mockModels.slice(0, 2))
        .mockResolvedValueOnce(mockModels);

      const { result } = renderHook(() => useModels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.models).toHaveLength(2);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.models).toHaveLength(mockModels.length);
      expect(apiClient.default.getModels).toHaveBeenCalledTimes(2);
    });

    it('should reset loading state during refetch', async () => {
      const apiClient = await import('@/lib/api');
      let resolveSecondCall: (value: typeof mockModels) => void;
      const secondCallPromise = new Promise<typeof mockModels>((resolve) => {
        resolveSecondCall = resolve;
      });

      vi.mocked(apiClient.default.getModels)
        .mockResolvedValueOnce(mockModels)
        .mockImplementationOnce(() => secondCallPromise);

      const { result } = renderHook(() => useModels());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refetch but don't await
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve second call
      resolveSecondCall!(mockModels);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear error on successful refetch', async () => {
      const apiClient = await import('@/lib/api');
      vi.mocked(apiClient.default.getModels)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockModels);

      const { result } = renderHook(() => useModels());

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.models).toEqual(mockModels);
    });
  });
});

describe('transformModelForUI', () => {
  it('should transform API model to UI format', () => {
    const apiModel = {
      id: 'gpt-4',
      object: 'model',
      created: 1677610602,
      owned_by: 'openai',
    };

    const result = transformModelForUI(apiModel);

    expect(result).toEqual({
      id: 'gpt-4',
      name: 'gpt-4',
      provider: 'openai',
      description: 'Model: gpt-4',
      tags: ['llm'],
      stars: 0,
      downloads: 'N/A',
      size: 'Unknown',
      type: 'text',
      pricing: 'free',
      featured: false,
    });
  });

  it('should handle missing owned_by field', () => {
    const apiModel = {
      id: 'custom-model',
      object: 'model',
      created: 1677610602,
      owned_by: '',
    };

    const result = transformModelForUI(apiModel);

    expect(result.provider).toBe('Unknown');
  });

  it('should use model id as name', () => {
    const apiModel = {
      id: 'claude-3-opus',
      object: 'model',
      created: 1677610602,
      owned_by: 'anthropic',
    };

    const result = transformModelForUI(apiModel);

    expect(result.name).toBe('claude-3-opus');
    expect(result.description).toBe('Model: claude-3-opus');
  });

  it('should return consistent structure for all models', () => {
    mockModels.forEach((model) => {
      const result = transformModelForUI(model);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('stars');
      expect(result).toHaveProperty('downloads');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('pricing');
      expect(result).toHaveProperty('featured');
    });
  });
});
