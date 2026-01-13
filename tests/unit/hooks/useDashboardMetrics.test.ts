/**
 * Integration Tests for useDashboardMetrics Hook
 *
 * Tests the dashboard metrics hook that fetches and aggregates
 * usage data from REAL Supabase for display on the dashboard.
 *
 * No mocks - uses actual Supabase connection.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { supabase } from '@/integrations/supabase';

// Test email for metrics tests
const TEST_EMAIL = 'test-vitest-metrics@oneedge.test';

describe('useDashboardMetrics', () => {
  // Cleanup test data before and after all tests
  beforeAll(async () => {
    // Clean up any existing test data
    await supabase
      .from('usage')
      .delete()
      .eq('email', TEST_EMAIL);
    await supabase
      .from('conversations')
      .delete()
      .eq('user_email', TEST_EMAIL);
    await supabase
      .from('virtual_keys')
      .delete()
      .eq('email', TEST_EMAIL);
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('usage')
      .delete()
      .eq('email', TEST_EMAIL);
    await supabase
      .from('conversations')
      .delete()
      .eq('user_email', TEST_EMAIL);
    await supabase
      .from('virtual_keys')
      .delete()
      .eq('email', TEST_EMAIL);
  });

  it('should return default metrics when email is null', async () => {
    const { result } = renderHook(() => useDashboardMetrics(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics.today.messages).toBe(0);
    expect(result.current.metrics.today.tokens).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should return default metrics when email is undefined', async () => {
    const { result } = renderHook(() => useDashboardMetrics(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics.today.messages).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should start in loading state', () => {
    const { result } = renderHook(() => useDashboardMetrics(TEST_EMAIL));

    expect(result.current.loading).toBe(true);
  });

  it('should handle empty data correctly with real Supabase', async () => {
    const { result } = renderHook(() => useDashboardMetrics(TEST_EMAIL));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 10000 });

    // No test data created, so should be defaults
    expect(result.current.metrics.today.messages).toBe(0);
    expect(result.current.metrics.today.tokens).toBe(0);
    expect(result.current.metrics.today.cost).toBe(0);
  });

  it('should provide daily trend data with 7 days', async () => {
    const { result } = renderHook(() => useDashboardMetrics(TEST_EMAIL));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 10000 });

    expect(result.current.metrics.trends.daily).toBeDefined();
    expect(Array.isArray(result.current.metrics.trends.daily)).toBe(true);
    expect(result.current.metrics.trends.daily.length).toBe(7);
  });

  it('should expose refetch function', async () => {
    const { result } = renderHook(() => useDashboardMetrics(TEST_EMAIL));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 10000 });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return correct structure for metrics object', async () => {
    const { result } = renderHook(() => useDashboardMetrics(TEST_EMAIL));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 10000 });

    // Verify structure exists
    expect(result.current.metrics.today).toBeDefined();
    expect(result.current.metrics.thisWeek).toBeDefined();
    expect(result.current.metrics.trends).toBeDefined();
    expect(result.current.metrics.budget).toBeDefined();

    // Verify today structure
    expect(typeof result.current.metrics.today.messages).toBe('number');
    expect(typeof result.current.metrics.today.tokens).toBe('number');
    expect(typeof result.current.metrics.today.cost).toBe('number');

    // Verify thisWeek structure
    expect(typeof result.current.metrics.thisWeek.conversations).toBe('number');
    expect(Array.isArray(result.current.metrics.thisWeek.modelsUsed)).toBe(true);
    expect(typeof result.current.metrics.thisWeek.totalRequests).toBe('number');

    // Verify trends structure
    expect(Array.isArray(result.current.metrics.trends.daily)).toBe(true);
    expect(typeof result.current.metrics.trends.weeklyChange).toBe('number');

    // Verify budget structure
    expect(typeof result.current.metrics.budget.used).toBe('number');
    expect(typeof result.current.metrics.budget.percentage).toBe('number');
  });

  it('should return loading, error, and refetch in result', async () => {
    const { result } = renderHook(() => useDashboardMetrics(TEST_EMAIL));

    // Check initial state has all properties
    expect(result.current).toHaveProperty('metrics');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refetch');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 10000 });
  });

  it('should return no error for valid email with real Supabase', async () => {
    const { result } = renderHook(() => useDashboardMetrics(TEST_EMAIL));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 10000 });

    // With real Supabase connection, there should be no error
    expect(result.current.error).toBeNull();
  });
});
