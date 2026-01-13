/**
 * Unit Tests for useModelUsage Hook
 *
 * Tests the model usage hook that fetches and aggregates
 * usage statistics per model from Supabase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useModelUsage } from '@/hooks/useModelUsage';

// Track query results
let queryResult: { data: unknown; error: unknown } = { data: [], error: null };

vi.mock('@/services/supabaseClient', () => {
  const createChain = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const methods = ['select', 'eq', 'neq', 'gte', 'lt', 'lte', 'order', 'limit', 'single', 'maybeSingle'];

    methods.forEach(method => {
      chain[method] = vi.fn(() => {
        // Return chainable object with promise resolution
        const chainable = { ...chain };
        Object.defineProperty(chainable, 'then', {
          value: (resolve: (val: unknown) => unknown) => Promise.resolve(resolve(queryResult)),
          writable: true,
        });
        return chainable;
      });
    });

    return chain;
  };

  return {
    default: {
      from: vi.fn(() => createChain()),
    },
  };
});

describe('useModelUsage', () => {
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { data: [], error: null };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty usage when email is null', async () => {
    const { result } = renderHook(() => useModelUsage(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return empty usage when email is undefined', async () => {
    const { result } = renderHook(() => useModelUsage(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should start in loading state', () => {
    queryResult = { data: [], error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    expect(result.current.loading).toBe(true);
  });

  it('should fetch model usage successfully', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.05,
        latency_ms: 500,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.10,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-02T00:00:00Z',
      },
      {
        model: 'claude-3',
        tokens_in: 750,
        tokens_out: 750,
        cost_usd: 0.075,
        latency_ms: 550,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.usage).toHaveLength(2);
  });

  it('should aggregate usage per model correctly', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.05,
        latency_ms: 500,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.10,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-02T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const gpt4Usage = result.current.usage.find((u) => u.model === 'gpt-4');
    expect(gpt4Usage).toBeDefined();
    expect(gpt4Usage?.totalRequests).toBe(2);
    expect(gpt4Usage?.totalTokens).toBe(3000); // (500+500) + (1000+1000)
    expect(gpt4Usage?.totalCost).toBe(0.15);
  });

  it('should calculate average latency correctly', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.05,
        latency_ms: 400,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.10,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-02T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const gpt4Usage = result.current.usage.find((u) => u.model === 'gpt-4');
    expect(gpt4Usage?.avgLatency).toBe(500); // (400 + 600) / 2
  });

  it('should calculate success rate correctly', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.05,
        latency_ms: 500,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.10,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-02T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 250,
        tokens_out: 250,
        cost_usd: 0.025,
        latency_ms: 300,
        status: 'error',
        ts: '2024-01-03T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 750,
        tokens_out: 750,
        cost_usd: 0.075,
        latency_ms: 550,
        status: 'error',
        ts: '2024-01-04T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const gpt4Usage = result.current.usage.find((u) => u.model === 'gpt-4');
    expect(gpt4Usage?.successRate).toBe(50); // 2 success / 4 total = 50%
  });

  it('should handle API errors gracefully', async () => {
    queryResult = { data: null, error: { message: 'Failed to fetch model usage' } };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch model usage');
    expect(result.current.usage).toEqual([]);
  });

  it('should sort usage by total requests descending', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.05,
        latency_ms: 500,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: 'claude-3',
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.10,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: 'claude-3',
        tokens_in: 750,
        tokens_out: 750,
        cost_usd: 0.075,
        latency_ms: 550,
        status: 'success',
        ts: '2024-01-02T00:00:00Z',
      },
      {
        model: 'claude-3',
        tokens_in: 250,
        tokens_out: 250,
        cost_usd: 0.025,
        latency_ms: 400,
        status: 'success',
        ts: '2024-01-03T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // claude-3 has 3 requests, gpt-4 has 1 request
    expect(result.current.usage[0].model).toBe('claude-3');
    expect(result.current.usage[1].model).toBe('gpt-4');
  });

  it('should expose refetch function', async () => {
    queryResult = { data: [], error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle empty data correctly', async () => {
    queryResult = { data: [], error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should track last used date', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.05,
        latency_ms: 500,
        status: 'success',
        ts: '2024-01-15T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.10,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-10T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const gpt4Usage = result.current.usage.find((u) => u.model === 'gpt-4');
    // The first item in the ordered results is the most recent
    expect(gpt4Usage?.lastUsed).toBe('2024-01-15T00:00:00Z');
  });

  it('should skip items without model name', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.05,
        latency_ms: 500,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: null,
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.10,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-02T00:00:00Z',
      },
      {
        model: '',
        tokens_in: 750,
        tokens_out: 750,
        cost_usd: 0.075,
        latency_ms: 550,
        status: 'success',
        ts: '2024-01-03T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Only gpt-4 should be counted (items without model are skipped)
    expect(result.current.usage).toHaveLength(1);
    expect(result.current.usage[0].model).toBe('gpt-4');
  });

  it('should round cost to 3 decimal places', async () => {
    const mockUsageData = [
      {
        model: 'gpt-4',
        tokens_in: 500,
        tokens_out: 500,
        cost_usd: 0.0333333,
        latency_ms: 500,
        status: 'success',
        ts: '2024-01-01T00:00:00Z',
      },
      {
        model: 'gpt-4',
        tokens_in: 1000,
        tokens_out: 1000,
        cost_usd: 0.0666666,
        latency_ms: 600,
        status: 'success',
        ts: '2024-01-02T00:00:00Z',
      },
    ];

    queryResult = { data: mockUsageData, error: null };

    const { result } = renderHook(() => useModelUsage(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const gpt4Usage = result.current.usage.find((u) => u.model === 'gpt-4');
    // Total: 0.0333333 + 0.0666666 = 0.0999999, rounded to 0.1
    expect(gpt4Usage?.totalCost).toBe(0.1);
  });
});
