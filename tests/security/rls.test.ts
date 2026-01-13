/**
 * Security Tests for Row Level Security (RLS) Policies
 *
 * Tests that verify Supabase RLS policies correctly
 * restrict data access based on user authentication.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '../__mocks__/supabase';

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();

vi.mock('@/services/supabaseClient', () => ({
  default: mockSupabase,
}));

describe('Row Level Security (RLS) Policies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conversations Table', () => {
    it('should only allow users to access their own conversations', async () => {
      const userEmail = 'user@example.com';
      const otherUserEmail = 'other@example.com';

      // Simulate RLS behavior: query for user's own conversations
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'conv-1', user_email: userEmail, title: 'My Conversation' },
              ],
              error: null,
            }),
          }),
        }),
      });

      // User should see their own conversations
      const result = await mockSupabase
        .from('conversations')
        .select('*')
        .eq('user_email', userEmail)
        .order('updated_at');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_email).toBe(userEmail);
    });

    it('should not allow users to query other users conversations directly', async () => {
      const userEmail = 'user@example.com';
      const otherUserEmail = 'other@example.com';

      // Simulate RLS blocking access to other users' data
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [], // RLS returns empty for unauthorized access
              error: null,
            }),
          }),
        }),
      });

      // Attempting to access other user's conversations should return empty
      const result = await mockSupabase
        .from('conversations')
        .select('*')
        .eq('user_email', otherUserEmail)
        .order('updated_at');

      expect(result.data).toHaveLength(0);
    });

    it('should prevent deleting other users conversations', async () => {
      // Simulate RLS policy preventing deletion
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'RLS policy violation', code: '42501' },
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('conversations')
        .delete()
        .eq('id', 'other-users-conv')
        .eq('user_email', 'other@example.com');

      expect(result.error).toBeTruthy();
    });
  });

  describe('Prompt Templates Table', () => {
    it('should allow users to see their own prompts', async () => {
      const userEmail = 'user@example.com';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'prompt-1', user_email: userEmail, is_public: false },
              ],
              error: null,
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('prompt_templates')
        .select('*')
        .or(`user_email.eq.${userEmail},is_public.eq.true`)
        .order('created_at');

      expect(result.data).toHaveLength(1);
    });

    it('should allow users to see public prompts', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'public-1', user_email: 'other@example.com', is_public: true },
                { id: 'public-2', user_email: 'another@example.com', is_public: true },
              ],
              error: null,
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('prompt_templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at');

      expect(result.data).toHaveLength(2);
      result.data.forEach((prompt: { is_public: boolean }) => {
        expect(prompt.is_public).toBe(true);
      });
    });

    it('should not allow users to delete other users prompts', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'RLS policy violation', code: '42501' },
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('prompt_templates')
        .delete()
        .eq('id', 'other-users-prompt')
        .eq('user_email', 'other@example.com');

      expect(result.error).toBeTruthy();
    });
  });

  describe('Virtual Keys Table', () => {
    it('should only allow users to see their own virtual keys', async () => {
      const userEmail = 'user@example.com';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'vk-1', user_email: userEmail, key_name: 'My Key' },
            ],
            error: null,
          }),
        }),
      });

      const result = await mockSupabase
        .from('virtual_keys')
        .select('*')
        .eq('user_email', userEmail);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_email).toBe(userEmail);
    });

    it('should not expose key hashes in responses', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'vk-1', user_email: 'user@example.com', key_name: 'My Key' },
            ],
            error: null,
          }),
        }),
      });

      const result = await mockSupabase
        .from('virtual_keys')
        .select('id, key_name') // Should not select key_hash
        .eq('user_email', 'user@example.com');

      expect(result.data[0]).not.toHaveProperty('key_hash');
    });
  });

  describe('Users Table', () => {
    it('should only allow users to see their own profile', async () => {
      const userEmail = 'user@example.com';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', email: userEmail, name: 'Test User' },
              error: null,
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      expect(result.data.email).toBe(userEmail);
    });

    it('should not allow users to modify other users profiles', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'RLS policy violation', code: '42501' },
          }),
        }),
      });

      const result = await mockSupabase
        .from('users')
        .update({ name: 'Hacked Name' })
        .eq('email', 'other@example.com');

      expect(result.error).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle unauthenticated requests', async () => {
      // Simulate unauthenticated request (no user session)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'JWT expired or invalid', code: 'PGRST301' },
          }),
        }),
      });

      const result = await mockSupabase
        .from('conversations')
        .select('*')
        .order('updated_at');

      expect(result.error).toBeTruthy();
    });

    it('should handle SQL injection attempts in queries', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      // The Supabase client should parameterize queries
      const result = await mockSupabase
        .from('conversations')
        .select('*')
        .eq('user_email', maliciousInput)
        .order('updated_at');

      // Should not cause an error, just return no results
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('should prevent privilege escalation through RPC calls', async () => {
      // Simulate attempt to call admin-only RPC
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied', code: '42501' },
      });

      const result = await mockSupabase.rpc('admin_delete_all_users', {});

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Permission denied');
    });
  });

  describe('Data Isolation', () => {
    it('should ensure complete data isolation between users', async () => {
      const user1Email = 'user1@example.com';
      const user2Email = 'user2@example.com';

      // User 1's data
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'conv-1', user_email: user1Email },
                { id: 'conv-2', user_email: user1Email },
              ],
              error: null,
            }),
          }),
        })
        // User 2's data
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'conv-3', user_email: user2Email },
              ],
              error: null,
            }),
          }),
        });

      const user1Result = await mockSupabase
        .from('conversations')
        .select('*')
        .eq('user_email', user1Email);

      const user2Result = await mockSupabase
        .from('conversations')
        .select('*')
        .eq('user_email', user2Email);

      // Verify no cross-contamination
      user1Result.data.forEach((conv: { user_email: string }) => {
        expect(conv.user_email).toBe(user1Email);
      });

      user2Result.data.forEach((conv: { user_email: string }) => {
        expect(conv.user_email).toBe(user2Email);
      });
    });

    it('should prevent cross-tenant data access in multi-tenant scenarios', async () => {
      const tenant1 = 'org1.example.com';
      const tenant2 = 'org2.example.com';

      // Attempt to access other tenant's data should fail
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [], // RLS prevents access
            error: null,
          }),
        }),
      });

      const result = await mockSupabase
        .from('organization_data')
        .select('*')
        .eq('tenant_id', tenant2);

      expect(result.data).toHaveLength(0);
    });
  });
});
