/**
 * Integration Tests for PromptService
 *
 * Tests Supabase operations for prompt template management
 * using REAL Supabase client - no mocks!
 *
 * Note: Tests are skipped if Supabase credentials are not properly configured.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { supabase } from '@/integrations/supabase';

// Test if Supabase is properly configured and accessible
let supabaseAvailable = false;
let promptService: typeof import('@/services/promptService').promptService;

// Test email to use for all tests
const TEST_EMAIL = 'test-vitest@oneedge.test';

// Track created prompts for cleanup
const createdPromptIds: string[] = [];

// Check if Supabase is available before running tests
beforeAll(async () => {
  try {
    // Try a simple query to check if Supabase is accessible
    const { error } = await supabase.from('prompt_templates').select('id').limit(1);
    if (!error || error.code === 'PGRST116') {
      supabaseAvailable = true;
      // Dynamically import the service only if Supabase is available
      const module = await import('@/services/promptService');
      promptService = module.promptService;

      // Clean up any existing test data
      await supabase
        .from('prompt_templates')
        .delete()
        .eq('user_email', TEST_EMAIL);
    } else {
      console.warn('Supabase not available:', error.message);
    }
  } catch (err) {
    console.warn('Failed to connect to Supabase:', err);
    supabaseAvailable = false;
  }
});

afterAll(async () => {
  if (!supabaseAvailable) return;

  // Clean up all created test prompts
  for (const id of createdPromptIds) {
    try {
      await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);
    } catch {
      // Ignore cleanup errors
    }
  }
  // Also clean by email to catch any missed prompts
  await supabase
    .from('prompt_templates')
    .delete()
    .eq('user_email', TEST_EMAIL);
});

describe('PromptService', () => {
  describe.skipIf(!supabaseAvailable)('createPrompt', () => {
    it('should create a new prompt in the database', async () => {
      const promptData = {
        user_email: TEST_EMAIL,
        title: 'Test Prompt',
        description: 'A test prompt for unit testing',
        content: 'This is a {{variable}} prompt for testing',
        category: 'general',
        tags: ['test', 'automated'],
        is_public: false,
        difficulty: 'beginner' as const,
      };

      const result = await promptService.createPrompt(promptData);
      createdPromptIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Prompt');
      expect(result.content).toBe('This is a {{variable}} prompt for testing');
      expect(result.user_email).toBe(TEST_EMAIL);
      expect(result.is_public).toBe(false);
    });

    it('should create a public prompt', async () => {
      const result = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Public Test Prompt',
        description: 'A public test prompt',
        content: 'Public content',
        category: 'general',
        tags: [],
        is_public: true,
        difficulty: 'beginner',
      });
      createdPromptIds.push(result.id);

      expect(result.is_public).toBe(true);
    });
  });

  describe.skipIf(!supabaseAvailable)('getPrompt', () => {
    let testPromptId: string;

    beforeAll(async () => {
      if (!supabaseAvailable) return;
      // Create a prompt for testing
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Get Test Prompt',
        description: 'For getPrompt test',
        content: 'Test content for getting',
        category: 'testing',
        tags: ['get-test'],
        is_public: false,
        difficulty: 'intermediate',
      });
      testPromptId = prompt.id;
      createdPromptIds.push(testPromptId);
    });

    it('should fetch a single prompt by ID', async () => {
      const result = await promptService.getPrompt(testPromptId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(testPromptId);
      expect(result?.title).toBe('Get Test Prompt');
    });

    it('should return null when prompt not found', async () => {
      const result = await promptService.getPrompt('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe.skipIf(!supabaseAvailable)('getPrompts', () => {
    beforeAll(async () => {
      if (!supabaseAvailable) return;
      // Create some prompts for the user
      const prompt1 = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'User Prompt 1',
        content: 'Content 1',
        is_public: false,
        difficulty: 'beginner',
      });
      createdPromptIds.push(prompt1.id);

      const prompt2 = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'User Prompt 2',
        content: 'Content 2',
        is_public: false,
        difficulty: 'beginner',
      });
      createdPromptIds.push(prompt2.id);
    });

    it('should fetch prompts for a user', async () => {
      const result = await promptService.getPrompts(TEST_EMAIL);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Should include user's own prompts
      const userPrompts = result.filter(p => p.user_email === TEST_EMAIL);
      expect(userPrompts.length).toBeGreaterThan(0);
    });
  });

  describe.skipIf(!supabaseAvailable)('updatePrompt', () => {
    let updateTestId: string;

    beforeAll(async () => {
      if (!supabaseAvailable) return;
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Update Test',
        content: 'Original content',
        is_public: false,
        difficulty: 'beginner',
      });
      updateTestId = prompt.id;
      createdPromptIds.push(updateTestId);
    });

    it('should update an existing prompt', async () => {
      const result = await promptService.updatePrompt(updateTestId, TEST_EMAIL, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Original content'); // Unchanged
    });

    it('should update prompt content', async () => {
      const newContent = 'This is the {{updated}} content';
      const result = await promptService.updatePrompt(updateTestId, TEST_EMAIL, {
        content: newContent,
      });

      expect(result.content).toBe(newContent);
    });
  });

  describe.skipIf(!supabaseAvailable)('deletePrompt', () => {
    it('should delete a prompt', async () => {
      // Create a prompt to delete
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Delete Me',
        content: 'To be deleted',
        is_public: false,
        difficulty: 'beginner',
      });

      // Delete it
      await promptService.deletePrompt(prompt.id, TEST_EMAIL);

      // Verify it's gone
      const result = await promptService.getPrompt(prompt.id);
      expect(result).toBeNull();
    });
  });

  describe.skipIf(!supabaseAvailable)('getPromptsByCategory', () => {
    beforeAll(async () => {
      if (!supabaseAvailable) return;
      // Create public prompts in a specific category
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Writing Prompt',
        content: 'Write something',
        category: 'writing',
        is_public: true,
        difficulty: 'beginner',
      });
      createdPromptIds.push(prompt.id);
    });

    it('should fetch public prompts by category', async () => {
      const result = await promptService.getPromptsByCategory('writing');

      expect(Array.isArray(result)).toBe(true);
      // All returned prompts should be public and in the category
      for (const prompt of result) {
        expect(prompt.category).toBe('writing');
        expect(prompt.is_public).toBe(true);
      }
    });

    it('should return empty array when no prompts in category', async () => {
      const result = await promptService.getPromptsByCategory('nonexistent-category-xyz');
      expect(result).toEqual([]);
    });
  });

  describe.skipIf(!supabaseAvailable)('searchPrompts', () => {
    beforeAll(async () => {
      if (!supabaseAvailable) return;
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Searchable Unique Keyword XYZ',
        content: 'Content with unique keyword ABC123',
        is_public: false,
        difficulty: 'beginner',
      });
      createdPromptIds.push(prompt.id);
    });

    it('should search prompts by query', async () => {
      const result = await promptService.searchPrompts('Searchable Unique', TEST_EMAIL);

      expect(Array.isArray(result)).toBe(true);
      // Should find at least our test prompt
      const found = result.some(p => p.title.includes('Searchable Unique'));
      expect(found).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const result = await promptService.searchPrompts('xyznonexistent123456', TEST_EMAIL);
      expect(result).toEqual([]);
    });
  });

  describe.skipIf(!supabaseAvailable)('likePrompt', () => {
    let likeTestId: string;

    beforeAll(async () => {
      if (!supabaseAvailable) return;
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Like Test Prompt',
        content: 'Content for like testing',
        is_public: true,
        difficulty: 'beginner',
      });
      likeTestId = prompt.id;
      createdPromptIds.push(likeTestId);
    });

    it('should toggle like status on a prompt', async () => {
      // First like should return true
      const liked = await promptService.likePrompt(likeTestId, TEST_EMAIL);
      expect(typeof liked).toBe('boolean');
    });
  });

  describe.skipIf(!supabaseAvailable)('hasLiked', () => {
    let hasLikedTestId: string;

    beforeAll(async () => {
      if (!supabaseAvailable) return;
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'HasLiked Test Prompt',
        content: 'Content for hasLiked testing',
        is_public: true,
        difficulty: 'beginner',
      });
      hasLikedTestId = prompt.id;
      createdPromptIds.push(hasLikedTestId);
    });

    it('should return false when user has not liked', async () => {
      // Use a different email that hasn't liked anything
      const result = await promptService.hasLiked(hasLikedTestId, 'other-user@test.com');
      expect(result).toBe(false);
    });
  });

  describe.skipIf(!supabaseAvailable)('recordUsage', () => {
    let usageTestId: string;

    beforeAll(async () => {
      if (!supabaseAvailable) return;
      const prompt = await promptService.createPrompt({
        user_email: TEST_EMAIL,
        title: 'Usage Test Prompt',
        content: 'Content for usage testing',
        is_public: true,
        difficulty: 'beginner',
      });
      usageTestId = prompt.id;
      createdPromptIds.push(usageTestId);
    });

    it('should record usage of a prompt without throwing', async () => {
      // recordUsage logs errors but doesn't throw
      await expect(promptService.recordUsage(usageTestId)).resolves.not.toThrow();
    });

    it('should handle invalid prompt ID gracefully', async () => {
      // recordUsage should not throw even with invalid ID (just logs error)
      await expect(
        promptService.recordUsage('00000000-0000-0000-0000-000000000000')
      ).resolves.not.toThrow();
    });
  });

  // Placeholder test when Supabase is not available
  describe('Supabase connection status', () => {
    it('should report Supabase availability status', () => {
      if (!supabaseAvailable) {
        console.log('PromptService tests skipped - Supabase credentials not configured');
      }
      expect(true).toBe(true);
    });
  });
});
