/**
 * Unit Tests for usePrompts Hook
 *
 * Tests the prompt library functionality including fetching,
 * creating, liking, and deleting prompts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrompts } from '@/hooks/usePrompts';
import { mockPromptTemplate } from '../../__mocks__/supabase';

// Use vi.hoisted to create mocks that can be used in vi.mock
const { mockSupabase, mockQueryBuilder, mockPromptService } = vi.hoisted(() => {
  const mockQueryBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq',
    'gt', 'gte', 'lt', 'lte', 'or', 'order', 'limit', 'single', 'maybeSingle',
  ];

  methods.forEach(method => {
    mockQueryBuilder[method] = vi.fn(() => mockQueryBuilder);
  });

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  };

  const mockPromptService = {
    getPrompts: vi.fn(),
    createPrompt: vi.fn(),
    likePrompt: vi.fn(),
    deletePrompt: vi.fn(),
    getPrompt: vi.fn(),
    updatePrompt: vi.fn(),
    recordUsage: vi.fn(),
  };

  return { mockSupabase, mockQueryBuilder, mockPromptService };
});

// Mock modules
vi.mock('@/services/supabaseClient', () => ({
  default: mockSupabase,
}));

vi.mock('@/services/promptService', () => ({
  promptService: mockPromptService,
}));

describe('usePrompts', () => {
  const testEmail = 'test@example.com';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockPromptService.getPrompts.mockResolvedValue([]);
    mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    (mockQueryBuilder as any).then = (resolve: (value: unknown) => void) =>
      resolve({ data: [], error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start with loading state and empty prompts', async () => {
      const { result } = renderHook(() => usePrompts(testEmail));

      expect(result.current.loading).toBe(true);
      expect(result.current.prompts).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.likedPrompts).toEqual([]);
    });

    it('should not fetch prompts if no user email provided', async () => {
      const { result } = renderHook(() => usePrompts(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockPromptService.getPrompts).not.toHaveBeenCalled();
      expect(result.current.prompts).toEqual([]);
    });
  });

  describe('fetching prompts', () => {
    it('should fetch prompts on mount when user email is provided', async () => {
      const mockPrompts = [
        mockPromptTemplate({ id: 'prompt-1', title: 'First Prompt' }),
        mockPromptTemplate({ id: 'prompt-2', title: 'Second Prompt' }),
      ];

      mockPromptService.getPrompts.mockResolvedValue(mockPrompts);
      mockQueryBuilder.eq.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockPromptService.getPrompts).toHaveBeenCalledWith(testEmail);
      expect(result.current.prompts).toEqual(mockPrompts);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      mockPromptService.getPrompts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.prompts).toEqual([]);
    });

    it('should handle non-Error objects in catch', async () => {
      mockPromptService.getPrompts.mockRejectedValue('String error');

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch prompts');
    });
  });

  describe('createPrompt', () => {
    it('should create a new prompt and refetch', async () => {
      const existingPrompts = [mockPromptTemplate({ id: 'existing-1' })];
      const newPrompt = mockPromptTemplate({ id: 'new-1', title: 'New Prompt' });

      mockPromptService.getPrompts
        .mockResolvedValueOnce(existingPrompts)
        .mockResolvedValueOnce([...existingPrompts, newPrompt]);
      mockPromptService.createPrompt.mockResolvedValue(newPrompt);

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createPrompt({
          user_email: testEmail,
          title: 'New Prompt',
          content: 'Test content',
        });
      });

      expect(mockPromptService.createPrompt).toHaveBeenCalled();
    });

    it('should throw error if no user email', async () => {
      const { result } = renderHook(() => usePrompts(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createPrompt({
          user_email: '',
          title: 'Test',
          content: 'Content',
        })
      ).rejects.toThrow('User email required');
    });
  });

  describe('likePrompt', () => {
    it('should like a prompt and refetch', async () => {
      const prompts = [mockPromptTemplate({ id: 'prompt-1', likes_count: 0 })];

      mockPromptService.getPrompts.mockResolvedValue(prompts);
      mockPromptService.likePrompt.mockResolvedValue(true);

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.likePrompt('prompt-1');
      });

      expect(mockPromptService.likePrompt).toHaveBeenCalledWith('prompt-1', testEmail);
    });

    it('should throw error if no user email when liking', async () => {
      const { result } = renderHook(() => usePrompts(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.likePrompt('prompt-1')).rejects.toThrow('User email required');
    });
  });

  describe('deletePrompt', () => {
    it('should delete a prompt and refetch', async () => {
      const prompts = [
        mockPromptTemplate({ id: 'prompt-1' }),
        mockPromptTemplate({ id: 'prompt-2' }),
      ];

      mockPromptService.getPrompts
        .mockResolvedValueOnce(prompts)
        .mockResolvedValueOnce([prompts[1]]);
      mockPromptService.deletePrompt.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deletePrompt('prompt-1');
      });

      expect(mockPromptService.deletePrompt).toHaveBeenCalledWith('prompt-1', testEmail);
    });

    it('should throw error if no user email when deleting', async () => {
      const { result } = renderHook(() => usePrompts(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.deletePrompt('prompt-1')).rejects.toThrow('User email required');
    });
  });

  describe('usePrompt', () => {
    it('should increment usage count', async () => {
      const prompts = [mockPromptTemplate({ id: 'prompt-1', uses_count: 5 })];

      mockPromptService.getPrompts.mockResolvedValue(prompts);
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.usePrompt('prompt-1');
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_prompt_uses', {
        prompt_id: 'prompt-1',
      });
    });
  });

  describe('refetch', () => {
    it('should allow manual refetch', async () => {
      const initialPrompts = [mockPromptTemplate({ id: 'prompt-1' })];
      const updatedPrompts = [
        mockPromptTemplate({ id: 'prompt-1' }),
        mockPromptTemplate({ id: 'prompt-2' }),
      ];

      mockPromptService.getPrompts
        .mockResolvedValueOnce(initialPrompts)
        .mockResolvedValueOnce(updatedPrompts);

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.prompts).toHaveLength(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockPromptService.getPrompts).toHaveBeenCalledTimes(2);
    });
  });

  describe('likedPrompts tracking', () => {
    it('should fetch liked prompts for user', async () => {
      const prompts = [
        mockPromptTemplate({ id: 'prompt-1' }),
        mockPromptTemplate({ id: 'prompt-2' }),
      ];

      mockPromptService.getPrompts.mockResolvedValue(prompts);

      // Mock the liked prompts query
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ prompt_id: 'prompt-1' }],
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => usePrompts(testEmail));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // The hook should have queried for liked prompts
      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_likes');
    });
  });
});
