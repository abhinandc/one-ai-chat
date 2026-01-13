/**
 * Unit Tests for Chat Service
 *
 * Tests the conversation service functionality including
 * CRUD operations for conversations and folders.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { conversationService } from '@/services/conversationService';
import { mockConversation } from '../../__mocks__/supabase';

// Use vi.hoisted to create mocks
const { mockSupabase, mockQueryBuilder } = vi.hoisted(() => {
  const mockQueryBuilder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq',
    'gt', 'gte', 'lt', 'lte', 'or', 'order', 'limit', 'single', 'maybeSingle',
  ];

  methods.forEach(method => {
    mockQueryBuilder[method] = vi.fn(() => mockQueryBuilder);
  });

  // Set default resolved value
  Object.assign(mockQueryBuilder, {
    then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
  });

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return { mockSupabase, mockQueryBuilder };
});

// Mock Supabase integration
vi.mock('@/integrations/supabase', () => ({
  supabase: mockSupabase,
}));

describe('ConversationService', () => {
  const testEmail = 'test@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return the query builder
    mockSupabase.from.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversations', () => {
    it('should fetch all conversations for a user', async () => {
      const mockConversations = [
        mockConversation({ id: 'conv-1', title: 'First' }),
        mockConversation({ id: 'conv-2', title: 'Second' }),
      ];

      mockQueryBuilder.order.mockResolvedValue({
        data: mockConversations,
        error: null,
      });

      const result = await conversationService.getConversations(testEmail);

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_email', testEmail);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toEqual(mockConversations);
    });

    it('should return empty array when no conversations exist', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await conversationService.getConversations(testEmail);

      expect(result).toEqual([]);
    });

    it('should throw error on fetch failure', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '500' },
      });

      await expect(conversationService.getConversations(testEmail)).rejects.toThrow(
        'Failed to fetch conversations: Database error'
      );
    });
  });

  describe('saveConversation', () => {
    it('should save a new conversation', async () => {
      const newConversation = mockConversation({
        id: 'new-conv',
        title: 'New Conversation',
      });

      mockQueryBuilder.single.mockResolvedValue({
        data: newConversation,
        error: null,
      });

      const result = await conversationService.saveConversation({
        id: 'new-conv',
        user_email: testEmail,
        title: 'New Conversation',
        messages: [],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
      expect(result).toEqual(newConversation);
    });

    it('should update an existing conversation', async () => {
      const existingConv = mockConversation({
        id: 'existing-conv',
        title: 'Updated Title',
      });

      mockQueryBuilder.single.mockResolvedValue({
        data: existingConv,
        error: null,
      });

      const result = await conversationService.saveConversation({
        id: 'existing-conv',
        user_email: testEmail,
        title: 'Updated Title',
        messages: [{ role: 'user', content: 'Hello' }],
        folder_id: null,
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {},
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw error on save failure', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Save failed', code: '500' },
      });

      await expect(
        conversationService.saveConversation({
          id: 'test-conv',
          user_email: testEmail,
          title: 'Test',
          messages: [],
          folder_id: null,
          pinned: false,
          shared: false,
          unread: false,
          tags: [],
          settings: {},
        })
      ).rejects.toThrow('Failed to save conversation: Save failed');
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      // Create a mock chain that resolves after the second eq()
      const secondEqMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const firstEqMock = vi.fn().mockReturnValue({
        eq: secondEqMock,
      });
      mockQueryBuilder.eq = firstEqMock;

      await conversationService.deleteConversation('conv-1', testEmail);

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(firstEqMock).toHaveBeenCalledWith('id', 'conv-1');
      expect(secondEqMock).toHaveBeenCalledWith('user_email', testEmail);
    });

    it('should throw error on delete failure', async () => {
      // Create a mock chain that resolves with error after the second eq()
      const secondEqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed', code: '500' },
      });
      const firstEqMock = vi.fn().mockReturnValue({
        eq: secondEqMock,
      });
      mockQueryBuilder.eq = firstEqMock;

      await expect(
        conversationService.deleteConversation('conv-1', testEmail)
      ).rejects.toThrow('Failed to delete conversation: Delete failed');
    });
  });

  describe('updateConversation', () => {
    it('should update conversation fields', async () => {
      const updatedConv = mockConversation({
        id: 'conv-1',
        title: 'Updated Title',
        pinned: true,
      });

      // Create proper mock chain: update().eq().eq().select().single()
      const singleMock = vi.fn().mockResolvedValue({
        data: updatedConv,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({
        single: singleMock,
      });
      const secondEqMock = vi.fn().mockReturnValue({
        select: selectMock,
      });
      const firstEqMock = vi.fn().mockReturnValue({
        eq: secondEqMock,
      });
      mockQueryBuilder.eq = firstEqMock;

      const result = await conversationService.updateConversation('conv-1', testEmail, {
        title: 'Updated Title',
        pinned: true,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
      expect(result.pinned).toBe(true);
    });
  });

  describe('getFolders', () => {
    it('should fetch all folders for a user', async () => {
      const mockFolders = [
        { id: 'folder-1', name: 'Work', color: '#FF0000', user_email: testEmail },
        { id: 'folder-2', name: 'Personal', color: '#00FF00', user_email: testEmail },
      ];

      // Create proper mock chain: select().eq().order()
      const orderMock = vi.fn().mockResolvedValue({
        data: mockFolders,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });
      mockQueryBuilder.eq = eqMock;

      const result = await conversationService.getFolders(testEmail);

      expect(mockSupabase.from).toHaveBeenCalledWith('conversation_folders');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('user_email', testEmail);
      expect(result).toEqual(mockFolders);
    });

    it('should return empty array when no folders exist', async () => {
      // Create proper mock chain: select().eq().order()
      const orderMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });
      mockQueryBuilder.eq = eqMock;

      const result = await conversationService.getFolders(testEmail);

      expect(result).toEqual([]);
    });
  });

  describe('createFolder', () => {
    it('should create a new folder', async () => {
      const newFolder = {
        id: 'folder-1',
        name: 'New Folder',
        color: '#0000FF',
        user_email: testEmail,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: newFolder,
        error: null,
      });

      const result = await conversationService.createFolder('New Folder', '#0000FF', testEmail);

      expect(mockSupabase.from).toHaveBeenCalledWith('conversation_folders');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_email: testEmail,
        name: 'New Folder',
        color: '#0000FF',
      });
      expect(result).toEqual(newFolder);
    });

    it('should throw error on create failure', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Create failed', code: '500' },
      });

      await expect(
        conversationService.createFolder('Test Folder', '#000', testEmail)
      ).rejects.toThrow('Failed to create folder: Create failed');
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder', async () => {
      // Create a mock chain that resolves after the second eq()
      const secondEqMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const firstEqMock = vi.fn().mockReturnValue({
        eq: secondEqMock,
      });
      mockQueryBuilder.eq = firstEqMock;

      await conversationService.deleteFolder('folder-1', testEmail);

      expect(mockSupabase.from).toHaveBeenCalledWith('conversation_folders');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(firstEqMock).toHaveBeenCalledWith('id', 'folder-1');
      expect(secondEqMock).toHaveBeenCalledWith('user_email', testEmail);
    });

    it('should throw error on delete failure', async () => {
      // Create a mock chain that resolves with error after the second eq()
      const secondEqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed', code: '500' },
      });
      const firstEqMock = vi.fn().mockReturnValue({
        eq: secondEqMock,
      });
      mockQueryBuilder.eq = firstEqMock;

      await expect(
        conversationService.deleteFolder('folder-1', testEmail)
      ).rejects.toThrow('Failed to delete folder: Delete failed');
    });
  });

  describe('migrateLocalStorageConversations', () => {
    it('should migrate localStorage conversations to Supabase', async () => {
      const localConversations = [
        {
          id: 'local-conv-1',
          title: 'Local Conversation',
          messages: [{ role: 'user', content: 'Hello' }],
          folderId: null,
          pinned: false,
          shared: false,
          unread: false,
          tags: [],
          settings: {},
        },
      ];

      const storageKey = `oneai.chat.${testEmail}`;
      localStorage.setItem(storageKey, JSON.stringify({ conversations: localConversations }));

      mockQueryBuilder.single.mockResolvedValue({
        data: mockConversation({ id: 'local-conv-1' }),
        error: null,
      });

      await conversationService.migrateLocalStorageConversations(testEmail);

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('should do nothing if no localStorage data exists', async () => {
      const storageKey = `oneai.chat.${testEmail}`;
      localStorage.removeItem(storageKey);

      await conversationService.migrateLocalStorageConversations(testEmail);

      // Should not attempt to save anything
      expect(mockQueryBuilder.upsert).not.toHaveBeenCalled();
    });

    it('should handle migration errors gracefully', async () => {
      const storageKey = `oneai.chat.${testEmail}`;
      localStorage.setItem(storageKey, 'invalid json');

      // Should not throw
      await expect(
        conversationService.migrateLocalStorageConversations(testEmail)
      ).resolves.not.toThrow();
    });
  });
});
