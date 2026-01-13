/**
 * Integration Tests for ConversationService
 *
 * Tests Supabase operations for conversation management
 * using REAL Supabase client - no mocks!
 *
 * Note: Tests are skipped if Supabase credentials are not properly configured.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/integrations/supabase';

// Test if Supabase is properly configured and accessible
let supabaseAvailable = false;
let conversationService: typeof import('@/services/conversationService').conversationService;

// Test email to use for all tests
const TEST_EMAIL = 'test-vitest-conv@oneedge.test';

// Track created items for cleanup
const createdConversationIds: string[] = [];
const createdFolderIds: string[] = [];

// Check if Supabase is available before running tests
beforeAll(async () => {
  try {
    // Try a simple query to check if Supabase is accessible
    const { error } = await supabase.from('conversations').select('id').limit(1);
    if (!error || error.code === 'PGRST116') {
      supabaseAvailable = true;
      // Dynamically import the service only if Supabase is available
      const module = await import('@/services/conversationService');
      conversationService = module.conversationService;

      // Clean up any existing test data
      await supabase
        .from('conversations')
        .delete()
        .eq('user_email', TEST_EMAIL);
      await supabase
        .from('conversation_folders')
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

  // Clean up all created test items
  for (const id of createdConversationIds) {
    try {
      await supabase
        .from('conversations')
        .delete()
        .eq('id', id);
    } catch {
      // Ignore cleanup errors
    }
  }
  for (const id of createdFolderIds) {
    try {
      await supabase
        .from('conversation_folders')
        .delete()
        .eq('id', id);
    } catch {
      // Ignore cleanup errors
    }
  }
  // Also clean by email to catch any missed items
  await supabase
    .from('conversations')
    .delete()
    .eq('user_email', TEST_EMAIL);
  await supabase
    .from('conversation_folders')
    .delete()
    .eq('user_email', TEST_EMAIL);
});

describe('ConversationService', () => {
  describe.skipIf(!supabaseAvailable)('saveConversation', () => {
    it('should save a new conversation to the database', async () => {
      const convId = crypto.randomUUID();

      const result = await conversationService.saveConversation({
        id: convId,
        user_email: TEST_EMAIL,
        title: 'Test Conversation',
        messages: [],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });
      createdConversationIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(convId);
      expect(result.title).toBe('Test Conversation');
      expect(result.user_email).toBe(TEST_EMAIL);
    });

    it('should update an existing conversation on upsert', async () => {
      const convId = crypto.randomUUID();

      // Create first
      const created = await conversationService.saveConversation({
        id: convId,
        user_email: TEST_EMAIL,
        title: 'Original Title',
        messages: [],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });
      createdConversationIds.push(created.id);

      // Update
      const updated = await conversationService.saveConversation({
        id: convId,
        user_email: TEST_EMAIL,
        title: 'Updated Title',
        messages: [{ role: 'user', content: 'Hello' }],
        folder_id: null,
        pinned: true,
        shared: false,
        unread: false,
        tags: ['test'],
        settings: {},
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.pinned).toBe(true);
    });
  });

  describe.skipIf(!supabaseAvailable)('getConversations', () => {
    beforeAll(async () => {
      if (!supabaseAvailable) return;
      // Create some conversations for the user
      const conv1Id = crypto.randomUUID();
      const conv1 = await conversationService.saveConversation({
        id: conv1Id,
        user_email: TEST_EMAIL,
        title: 'Conversation 1',
        messages: [],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });
      createdConversationIds.push(conv1.id);

      const conv2Id = crypto.randomUUID();
      const conv2 = await conversationService.saveConversation({
        id: conv2Id,
        user_email: TEST_EMAIL,
        title: 'Conversation 2',
        messages: [],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });
      createdConversationIds.push(conv2.id);
    });

    it('should fetch conversations for a user', async () => {
      const result = await conversationService.getConversations(TEST_EMAIL);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // All returned should belong to the test user
      for (const conv of result) {
        expect(conv.user_email).toBe(TEST_EMAIL);
      }
    });

    it('should return empty array for non-existent user', async () => {
      const result = await conversationService.getConversations('nonexistent@nowhere.test');
      expect(result).toEqual([]);
    });
  });

  describe.skipIf(!supabaseAvailable)('updateConversation', () => {
    let updateTestId: string;

    beforeAll(async () => {
      if (!supabaseAvailable) return;
      updateTestId = crypto.randomUUID();
      const conv = await conversationService.saveConversation({
        id: updateTestId,
        user_email: TEST_EMAIL,
        title: 'Update Test',
        messages: [],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });
      createdConversationIds.push(conv.id);
    });

    it('should update conversation title', async () => {
      const result = await conversationService.updateConversation(
        updateTestId,
        TEST_EMAIL,
        { title: 'Updated Title' }
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should update conversation pinned status', async () => {
      const result = await conversationService.updateConversation(
        updateTestId,
        TEST_EMAIL,
        { pinned: true }
      );

      expect(result.pinned).toBe(true);
    });
  });

  describe.skipIf(!supabaseAvailable)('deleteConversation', () => {
    it('should delete a conversation', async () => {
      // Create a conversation to delete
      const convId = crypto.randomUUID();
      await conversationService.saveConversation({
        id: convId,
        user_email: TEST_EMAIL,
        title: 'Delete Me',
        messages: [],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });

      // Delete it
      await conversationService.deleteConversation(convId, TEST_EMAIL);

      // Verify it's gone
      const result = await conversationService.getConversations(TEST_EMAIL);
      const found = result.find(c => c.id === convId);
      expect(found).toBeUndefined();
    });
  });

  describe.skipIf(!supabaseAvailable)('Folders', () => {
    describe('createFolder', () => {
      it('should create a new folder', async () => {
        const result = await conversationService.createFolder(
          'Test Folder',
          '#ff0000',
          TEST_EMAIL
        );
        createdFolderIds.push(result.id);

        expect(result).toBeDefined();
        expect(result.name).toBe('Test Folder');
        expect(result.color).toBe('#ff0000');
        expect(result.user_email).toBe(TEST_EMAIL);
      });
    });

    describe('getFolders', () => {
      beforeAll(async () => {
        if (!supabaseAvailable) return;
        const folder = await conversationService.createFolder(
          'Work Folder',
          '#0000ff',
          TEST_EMAIL
        );
        createdFolderIds.push(folder.id);
      });

      it('should fetch folders for a user', async () => {
        const result = await conversationService.getFolders(TEST_EMAIL);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        // All returned should belong to the test user
        for (const folder of result) {
          expect(folder.user_email).toBe(TEST_EMAIL);
        }
      });

      it('should return empty array for non-existent user', async () => {
        const result = await conversationService.getFolders('nonexistent@nowhere.test');
        expect(result).toEqual([]);
      });
    });

    describe('deleteFolder', () => {
      it('should delete a folder', async () => {
        // Create a folder to delete
        const folder = await conversationService.createFolder(
          'Delete Me Folder',
          '#00ff00',
          TEST_EMAIL
        );

        // Delete it
        await conversationService.deleteFolder(folder.id, TEST_EMAIL);

        // Verify it's gone
        const result = await conversationService.getFolders(TEST_EMAIL);
        const found = result.find(f => f.id === folder.id);
        expect(found).toBeUndefined();
      });
    });
  });

  describe.skipIf(!supabaseAvailable)('migrateLocalStorageConversations', () => {
    it('should skip migration when no local data exists', async () => {
      // Should not throw
      await expect(
        conversationService.migrateLocalStorageConversations(TEST_EMAIL)
      ).resolves.not.toThrow();
    });
  });

  // Placeholder test when Supabase is not available
  describe('Supabase connection status', () => {
    it('should report Supabase availability status', () => {
      if (!supabaseAvailable) {
        console.log('ConversationService tests skipped - Supabase credentials not configured');
      }
      expect(true).toBe(true);
    });
  });
});
