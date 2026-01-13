/**
 * Unit Tests for Chat Store (Zustand)
 *
 * Tests the Zustand chat store that manages conversations,
 * folders, messages, and UI state.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useChatStore,
  selectActiveConversation,
  selectConversationById,
  selectConversationsByFolder,
  selectPinnedConversations,
  selectRecentConversations,
} from '@/stores/chatStore';
import type { Conversation, Message, ConversationFolder } from '@/types';

describe('chatStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useChatStore.getState();
    act(() => {
      useChatStore.setState({
        conversations: [],
        activeConversationId: null,
        folders: [],
        isSidebarOpen: true,
        isInspectorOpen: false,
        isStreaming: false,
        streamingMessage: '',
        settings: {
          model: '',
          temperature: 0.7,
          maxTokens: 4000,
          topP: 0.9,
          systemPrompt: '',
        },
        error: null,
      });
    });
  });

  describe('Conversation Management', () => {
    it('should create a new conversation', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation('Test Conversation');
      });

      expect(newConversation).toBeDefined();
      expect(newConversation?.title).toBe('Test Conversation');
      expect(newConversation?.id).toMatch(/^conv_/);

      const state = useChatStore.getState();
      expect(state.conversations).toHaveLength(1);
      expect(state.activeConversationId).toBe(newConversation?.id);
    });

    it('should create a conversation with default title', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation();
      });

      expect(newConversation?.title).toBe('New Conversation');
    });

    it('should update a conversation', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation('Original Title');
      });

      act(() => {
        store.updateConversation(newConversation!.id, { title: 'Updated Title' });
      });

      const state = useChatStore.getState();
      const updated = state.conversations.find((c) => c.id === newConversation?.id);
      expect(updated?.title).toBe('Updated Title');
    });

    it('should delete a conversation', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation('To Delete');
      });

      expect(useChatStore.getState().conversations).toHaveLength(1);

      act(() => {
        store.deleteConversation(newConversation!.id);
      });

      expect(useChatStore.getState().conversations).toHaveLength(0);
      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

    it('should set active conversation', () => {
      const store = useChatStore.getState();

      let conv1: Conversation | undefined;
      let conv2: Conversation | undefined;
      act(() => {
        conv1 = store.createConversation('Conversation 1');
        conv2 = store.createConversation('Conversation 2');
      });

      act(() => {
        store.setActiveConversation(conv1!.id);
      });

      expect(useChatStore.getState().activeConversationId).toBe(conv1?.id);
    });

    it('should clear error when setting active conversation', () => {
      const store = useChatStore.getState();

      act(() => {
        store.setError('Some error');
      });

      expect(useChatStore.getState().error).toBe('Some error');

      act(() => {
        store.setActiveConversation(null);
      });

      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('Message Management', () => {
    it('should add a message to a conversation', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation('Test');
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello!',
        timestamp: new Date(),
      };

      act(() => {
        store.addMessage(newConversation!.id, message);
      });

      const state = useChatStore.getState();
      const conversation = state.conversations.find((c) => c.id === newConversation?.id);
      expect(conversation?.messages).toHaveLength(1);
      expect(conversation?.messages[0].content).toBe('Hello!');
    });

    it('should auto-update title from first user message', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation();
      });

      expect(useChatStore.getState().conversations[0].title).toBe('New Conversation');

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'This is a very long first message that should be truncated for the title',
        timestamp: new Date(),
      };

      act(() => {
        store.addMessage(newConversation!.id, message);
      });

      const state = useChatStore.getState();
      const conversation = state.conversations.find((c) => c.id === newConversation?.id);
      expect(conversation?.title.length).toBeLessThanOrEqual(53); // 50 + "..."
      expect(conversation?.title.endsWith('...')).toBe(true);
    });

    it('should update a message', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation('Test');
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Original content',
        timestamp: new Date(),
      };

      act(() => {
        store.addMessage(newConversation!.id, message);
        store.updateMessage(newConversation!.id, 'msg-1', { content: 'Updated content' });
      });

      const state = useChatStore.getState();
      const conversation = state.conversations.find((c) => c.id === newConversation?.id);
      expect(conversation?.messages[0].content).toBe('Updated content');
    });

    it('should delete a message', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation('Test');
      });

      const message1: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Message 1',
        timestamp: new Date(),
      };

      const message2: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Message 2',
        timestamp: new Date(),
      };

      act(() => {
        store.addMessage(newConversation!.id, message1);
        store.addMessage(newConversation!.id, message2);
      });

      expect(useChatStore.getState().conversations[0].messages).toHaveLength(2);

      act(() => {
        store.deleteMessage(newConversation!.id, 'msg-1');
      });

      const state = useChatStore.getState();
      const conversation = state.conversations.find((c) => c.id === newConversation?.id);
      expect(conversation?.messages).toHaveLength(1);
      expect(conversation?.messages[0].id).toBe('msg-2');
    });

    it('should clear all messages in a conversation', () => {
      const store = useChatStore.getState();

      let newConversation: Conversation | undefined;
      act(() => {
        newConversation = store.createConversation('Test');
      });

      act(() => {
        store.addMessage(newConversation!.id, {
          id: 'msg-1',
          role: 'user',
          content: 'Message 1',
          timestamp: new Date(),
        });
        store.addMessage(newConversation!.id, {
          id: 'msg-2',
          role: 'assistant',
          content: 'Message 2',
          timestamp: new Date(),
        });
      });

      expect(useChatStore.getState().conversations[0].messages).toHaveLength(2);

      act(() => {
        store.clearMessages(newConversation!.id);
      });

      expect(useChatStore.getState().conversations[0].messages).toHaveLength(0);
    });
  });

  describe('Folder Management', () => {
    it('should create a new folder', () => {
      const store = useChatStore.getState();

      let newFolder: ConversationFolder | undefined;
      act(() => {
        newFolder = store.createFolder('Work');
      });

      expect(newFolder).toBeDefined();
      expect(newFolder?.name).toBe('Work');
      expect(newFolder?.id).toMatch(/^folder_/);

      const state = useChatStore.getState();
      expect(state.folders).toHaveLength(1);
    });

    it('should create a folder with custom color', () => {
      const store = useChatStore.getState();

      let newFolder: ConversationFolder | undefined;
      act(() => {
        newFolder = store.createFolder('Personal', '#22C55E');
      });

      expect(newFolder?.color).toBe('#22C55E');
    });

    it('should update a folder', () => {
      const store = useChatStore.getState();

      let newFolder: ConversationFolder | undefined;
      act(() => {
        newFolder = store.createFolder('Original');
        store.updateFolder(newFolder!.id, { name: 'Updated' });
      });

      const state = useChatStore.getState();
      expect(state.folders[0].name).toBe('Updated');
    });

    it('should delete a folder and remove references from conversations', () => {
      const store = useChatStore.getState();

      let folder: ConversationFolder | undefined;
      let conversation: Conversation | undefined;

      act(() => {
        folder = store.createFolder('Work');
        conversation = store.createConversation('Test');
        store.moveToFolder(conversation!.id, folder!.id);
      });

      expect(useChatStore.getState().conversations[0].folderId).toBe(folder?.id);

      act(() => {
        store.deleteFolder(folder!.id);
      });

      const state = useChatStore.getState();
      expect(state.folders).toHaveLength(0);
      expect(state.conversations[0].folderId).toBeUndefined();
    });
  });

  describe('Move to Folder', () => {
    it('should move a conversation to a folder', () => {
      const store = useChatStore.getState();

      let folder: ConversationFolder | undefined;
      let conversation: Conversation | undefined;

      act(() => {
        folder = store.createFolder('Work');
        conversation = store.createConversation('Test');
        store.moveToFolder(conversation!.id, folder!.id);
      });

      const state = useChatStore.getState();
      const conv = state.conversations.find((c) => c.id === conversation?.id);
      expect(conv?.folderId).toBe(folder?.id);
      expect(state.folders[0].conversationIds).toContain(conversation?.id);
    });

    it('should remove conversation from previous folder when moving', () => {
      const store = useChatStore.getState();

      let folder1: ConversationFolder | undefined;
      let folder2: ConversationFolder | undefined;
      let conversation: Conversation | undefined;

      act(() => {
        folder1 = store.createFolder('Work');
        folder2 = store.createFolder('Personal');
        conversation = store.createConversation('Test');
        store.moveToFolder(conversation!.id, folder1!.id);
      });

      expect(useChatStore.getState().folders[0].conversationIds).toContain(conversation?.id);

      act(() => {
        store.moveToFolder(conversation!.id, folder2!.id);
      });

      const state = useChatStore.getState();
      const f1 = state.folders.find((f) => f.id === folder1?.id);
      const f2 = state.folders.find((f) => f.id === folder2?.id);

      expect(f1?.conversationIds).not.toContain(conversation?.id);
      expect(f2?.conversationIds).toContain(conversation?.id);
    });

    it('should remove from folder when folderId is null', () => {
      const store = useChatStore.getState();

      let folder: ConversationFolder | undefined;
      let conversation: Conversation | undefined;

      act(() => {
        folder = store.createFolder('Work');
        conversation = store.createConversation('Test');
        store.moveToFolder(conversation!.id, folder!.id);
      });

      act(() => {
        store.moveToFolder(conversation!.id, null);
      });

      const state = useChatStore.getState();
      const conv = state.conversations.find((c) => c.id === conversation?.id);
      expect(conv?.folderId).toBeUndefined();
    });
  });

  describe('Tags Management', () => {
    it('should add a tag to a conversation', () => {
      const store = useChatStore.getState();

      let conversation: Conversation | undefined;
      act(() => {
        conversation = store.createConversation('Test');
        store.addTag(conversation!.id, 'important');
      });

      const state = useChatStore.getState();
      const conv = state.conversations.find((c) => c.id === conversation?.id);
      expect(conv?.tags).toContain('important');
    });

    it('should not add duplicate tags', () => {
      const store = useChatStore.getState();

      let conversation: Conversation | undefined;
      act(() => {
        conversation = store.createConversation('Test');
        store.addTag(conversation!.id, 'important');
        store.addTag(conversation!.id, 'important');
      });

      const state = useChatStore.getState();
      const conv = state.conversations.find((c) => c.id === conversation?.id);
      expect(conv?.tags.filter((t) => t === 'important')).toHaveLength(1);
    });

    it('should remove a tag from a conversation', () => {
      const store = useChatStore.getState();

      let conversation: Conversation | undefined;
      act(() => {
        conversation = store.createConversation('Test');
        store.addTag(conversation!.id, 'important');
        store.addTag(conversation!.id, 'work');
      });

      expect(useChatStore.getState().conversations[0].tags).toHaveLength(2);

      act(() => {
        store.removeTag(conversation!.id, 'important');
      });

      const state = useChatStore.getState();
      const conv = state.conversations.find((c) => c.id === conversation?.id);
      expect(conv?.tags).not.toContain('important');
      expect(conv?.tags).toContain('work');
    });
  });

  describe('UI State', () => {
    it('should toggle sidebar', () => {
      const store = useChatStore.getState();
      expect(useChatStore.getState().isSidebarOpen).toBe(true);

      act(() => {
        store.toggleSidebar();
      });

      expect(useChatStore.getState().isSidebarOpen).toBe(false);

      act(() => {
        store.toggleSidebar();
      });

      expect(useChatStore.getState().isSidebarOpen).toBe(true);
    });

    it('should toggle inspector', () => {
      const store = useChatStore.getState();
      expect(useChatStore.getState().isInspectorOpen).toBe(false);

      act(() => {
        store.toggleInspector();
      });

      expect(useChatStore.getState().isInspectorOpen).toBe(true);
    });

    it('should set streaming state', () => {
      const store = useChatStore.getState();

      act(() => {
        store.setStreaming(true, 'Generating response...');
      });

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(true);
      expect(state.streamingMessage).toBe('Generating response...');
    });

    it('should clear streaming message when not streaming', () => {
      const store = useChatStore.getState();

      act(() => {
        store.setStreaming(true, 'Generating...');
        store.setStreaming(false);
      });

      expect(useChatStore.getState().streamingMessage).toBe('');
    });
  });

  describe('Settings', () => {
    it('should update settings', () => {
      const store = useChatStore.getState();

      act(() => {
        store.updateSettings({ model: 'gpt-4', temperature: 0.9 });
      });

      const state = useChatStore.getState();
      expect(state.settings.model).toBe('gpt-4');
      expect(state.settings.temperature).toBe(0.9);
      // Other settings should remain unchanged
      expect(state.settings.maxTokens).toBe(4000);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const store = useChatStore.getState();

      act(() => {
        store.setError('Something went wrong');
      });

      expect(useChatStore.getState().error).toBe('Something went wrong');

      act(() => {
        store.setError(null);
      });

      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('Sync Functions', () => {
    it('should load conversations from external source', () => {
      const store = useChatStore.getState();

      const externalConversations: Conversation[] = [
        {
          id: 'ext-1',
          title: 'External Conversation',
          messages: [],
          pinned: false,
          shared: false,
          unread: false,
          tags: [],
          settings: {
            model: 'gpt-4',
            provider: 'litellm',
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 4000,
            stopSequences: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      act(() => {
        store.loadConversations(externalConversations);
      });

      expect(useChatStore.getState().conversations).toEqual(externalConversations);
    });

    it('should load folders from external source', () => {
      const store = useChatStore.getState();

      const externalFolders: ConversationFolder[] = [
        {
          id: 'folder-ext-1',
          name: 'External Folder',
          color: '#FF0000',
          conversationIds: [],
          createdAt: new Date(),
        },
      ];

      act(() => {
        store.loadFolders(externalFolders);
      });

      expect(useChatStore.getState().folders).toEqual(externalFolders);
    });
  });

  describe('Selectors', () => {
    it('selectActiveConversation should return the active conversation', () => {
      const store = useChatStore.getState();

      let conversation: Conversation | undefined;
      act(() => {
        conversation = store.createConversation('Test');
      });

      const state = useChatStore.getState();
      const active = selectActiveConversation(state);
      expect(active?.id).toBe(conversation?.id);
    });

    it('selectConversationById should return the correct conversation', () => {
      const store = useChatStore.getState();

      let conv1: Conversation | undefined;
      let conv2: Conversation | undefined;
      act(() => {
        conv1 = store.createConversation('Conversation 1');
        conv2 = store.createConversation('Conversation 2');
      });

      const state = useChatStore.getState();
      const found = selectConversationById(conv1!.id)(state);
      expect(found?.title).toBe('Conversation 1');
    });

    it('selectConversationsByFolder should return conversations in a folder', () => {
      const store = useChatStore.getState();

      let folder: ConversationFolder | undefined;
      let conv1: Conversation | undefined;
      let conv2: Conversation | undefined;

      act(() => {
        folder = store.createFolder('Work');
        conv1 = store.createConversation('Work Conv');
        conv2 = store.createConversation('Personal Conv');
        store.moveToFolder(conv1!.id, folder!.id);
      });

      const state = useChatStore.getState();
      const folderConvs = selectConversationsByFolder(folder!.id)(state);
      expect(folderConvs).toHaveLength(1);
      expect(folderConvs[0].title).toBe('Work Conv');
    });

    it('selectPinnedConversations should return only pinned conversations', () => {
      const store = useChatStore.getState();

      act(() => {
        const conv1 = store.createConversation('Pinned');
        const conv2 = store.createConversation('Not Pinned');
        store.updateConversation(conv1.id, { pinned: true });
      });

      const state = useChatStore.getState();
      const pinned = selectPinnedConversations(state);
      expect(pinned).toHaveLength(1);
      expect(pinned[0].title).toBe('Pinned');
    });

    it('selectRecentConversations should return conversations sorted by updatedAt', () => {
      const store = useChatStore.getState();

      act(() => {
        const conv1 = store.createConversation('Older');
        const conv2 = store.createConversation('Newer');
        // conv2 is created after conv1, so it should be first
      });

      const state = useChatStore.getState();
      const recent = selectRecentConversations(10)(state);
      expect(recent[0].title).toBe('Newer');
      expect(recent[1].title).toBe('Older');
    });

    it('selectRecentConversations should limit results', () => {
      const store = useChatStore.getState();

      act(() => {
        for (let i = 0; i < 15; i++) {
          store.createConversation(`Conv ${i}`);
        }
      });

      const state = useChatStore.getState();
      const recent = selectRecentConversations(5)(state);
      expect(recent).toHaveLength(5);
    });
  });
});
