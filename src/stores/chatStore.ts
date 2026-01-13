import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import type { Conversation, Message, ConversationFolder } from '@/types';

interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
}

interface ChatState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Folders
  folders: ConversationFolder[];

  // UI State
  isSidebarOpen: boolean;
  isInspectorOpen: boolean;
  isStreaming: boolean;
  streamingMessage: string;

  // Settings
  settings: ChatSettings;

  // Error handling
  error: string | null;

  // Actions
  setActiveConversation: (id: string | null) => void;
  createConversation: (title?: string) => Conversation;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  // Message actions
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  clearMessages: (conversationId: string) => void;

  // Folder actions
  createFolder: (name: string, color?: string) => ConversationFolder;
  updateFolder: (id: string, updates: Partial<ConversationFolder>) => void;
  deleteFolder: (id: string) => void;
  moveToFolder: (conversationId: string, folderId: string | null) => void;

  // Tags
  addTag: (conversationId: string, tag: string) => void;
  removeTag: (conversationId: string, tag: string) => void;

  // UI actions
  toggleSidebar: () => void;
  toggleInspector: () => void;
  setStreaming: (isStreaming: boolean, message?: string) => void;

  // Settings actions
  updateSettings: (settings: Partial<ChatSettings>) => void;

  // Error handling
  setError: (error: string | null) => void;

  // Sync with Supabase
  loadConversations: (conversations: Conversation[]) => void;
  loadFolders: (folders: ConversationFolder[]) => void;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultSettings: ChatSettings = {
  model: '',
  temperature: 0.7,
  maxTokens: 4000,
  topP: 0.9,
  systemPrompt: '',
};

export const useChatStore = create<ChatState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          conversations: [],
          activeConversationId: null,
          folders: [],
          isSidebarOpen: true,
          isInspectorOpen: false,
          isStreaming: false,
          streamingMessage: '',
          settings: defaultSettings,
          error: null,

          // Set active conversation
          setActiveConversation: (id) => {
            set({ activeConversationId: id, error: null });
          },

          // Create new conversation
          createConversation: (title = 'New Conversation') => {
            const { settings } = get();
            const newConversation: Conversation = {
              id: `conv_${generateId()}`,
              title,
              messages: [],
              pinned: false,
              shared: false,
              unread: false,
              tags: [],
              settings: {
                model: settings.model,
                provider: 'litellm',
                temperature: settings.temperature,
                topP: settings.topP,
                maxTokens: settings.maxTokens,
                stopSequences: [],
                systemPrompt: settings.systemPrompt,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            set((state) => ({
              conversations: [newConversation, ...state.conversations],
              activeConversationId: newConversation.id,
            }));

            return newConversation;
          },

          // Update conversation
          updateConversation: (id, updates) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === id
                  ? { ...conv, ...updates, updatedAt: new Date() }
                  : conv
              ),
            }));
          },

          // Delete conversation
          deleteConversation: (id) => {
            set((state) => ({
              conversations: state.conversations.filter((conv) => conv.id !== id),
              activeConversationId:
                state.activeConversationId === id ? null : state.activeConversationId,
            }));
          },

          // Add message to conversation
          addMessage: (conversationId, message) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === conversationId
                  ? {
                      ...conv,
                      messages: [...conv.messages, message],
                      updatedAt: new Date(),
                      // Auto-update title from first user message
                      title:
                        conv.title === 'New Conversation' && message.role === 'user'
                          ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                          : conv.title,
                    }
                  : conv
              ),
            }));
          },

          // Update message
          updateMessage: (conversationId, messageId, updates) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === conversationId
                  ? {
                      ...conv,
                      messages: conv.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, ...updates } : msg
                      ),
                      updatedAt: new Date(),
                    }
                  : conv
              ),
            }));
          },

          // Delete message
          deleteMessage: (conversationId, messageId) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === conversationId
                  ? {
                      ...conv,
                      messages: conv.messages.filter((msg) => msg.id !== messageId),
                      updatedAt: new Date(),
                    }
                  : conv
              ),
            }));
          },

          // Clear all messages in conversation
          clearMessages: (conversationId) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === conversationId
                  ? { ...conv, messages: [], updatedAt: new Date() }
                  : conv
              ),
            }));
          },

          // Create folder
          createFolder: (name, color = '#0066FF') => {
            const newFolder: ConversationFolder = {
              id: `folder_${generateId()}`,
              name,
              color,
              conversationIds: [],
              createdAt: new Date(),
            };

            set((state) => ({
              folders: [...state.folders, newFolder],
            }));

            return newFolder;
          },

          // Update folder
          updateFolder: (id, updates) => {
            set((state) => ({
              folders: state.folders.map((folder) =>
                folder.id === id ? { ...folder, ...updates } : folder
              ),
            }));
          },

          // Delete folder
          deleteFolder: (id) => {
            set((state) => ({
              folders: state.folders.filter((folder) => folder.id !== id),
              // Remove folder reference from conversations
              conversations: state.conversations.map((conv) =>
                conv.folderId === id ? { ...conv, folderId: undefined } : conv
              ),
            }));
          },

          // Move conversation to folder
          moveToFolder: (conversationId, folderId) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === conversationId
                  ? { ...conv, folderId: folderId || undefined, updatedAt: new Date() }
                  : conv
              ),
              folders: state.folders.map((folder) => {
                if (folder.id === folderId) {
                  // Add to new folder
                  return {
                    ...folder,
                    conversationIds: folder.conversationIds.includes(conversationId)
                      ? folder.conversationIds
                      : [...folder.conversationIds, conversationId],
                  };
                }
                // Remove from other folders
                return {
                  ...folder,
                  conversationIds: folder.conversationIds.filter((id) => id !== conversationId),
                };
              }),
            }));
          },

          // Add tag to conversation
          addTag: (conversationId, tag) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === conversationId && !conv.tags.includes(tag)
                  ? { ...conv, tags: [...conv.tags, tag], updatedAt: new Date() }
                  : conv
              ),
            }));
          },

          // Remove tag from conversation
          removeTag: (conversationId, tag) => {
            set((state) => ({
              conversations: state.conversations.map((conv) =>
                conv.id === conversationId
                  ? { ...conv, tags: conv.tags.filter((t) => t !== tag), updatedAt: new Date() }
                  : conv
              ),
            }));
          },

          // Toggle sidebar
          toggleSidebar: () => {
            set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
          },

          // Toggle inspector
          toggleInspector: () => {
            set((state) => ({ isInspectorOpen: !state.isInspectorOpen }));
          },

          // Set streaming state
          setStreaming: (isStreaming, message = '') => {
            set({ isStreaming, streamingMessage: message });
          },

          // Update settings
          updateSettings: (newSettings) => {
            set((state) => ({
              settings: { ...state.settings, ...newSettings },
            }));
          },

          // Set error
          setError: (error) => {
            set({ error });
          },

          // Load conversations from Supabase
          loadConversations: (conversations) => {
            set({ conversations });
          },

          // Load folders from Supabase
          loadFolders: (folders) => {
            set({ folders });
          },
        }),
        {
          name: 'oneedge-chat-store',
          partialize: (state) => ({
            settings: state.settings,
            isSidebarOpen: state.isSidebarOpen,
            // Don't persist conversations - they come from Supabase
          }),
        }
      )
    ),
    { name: 'ChatStore' }
  )
);

// Selectors for common use cases
export const selectActiveConversation = (state: ChatState) =>
  state.conversations.find((c) => c.id === state.activeConversationId);

export const selectConversationById = (id: string) => (state: ChatState) =>
  state.conversations.find((c) => c.id === id);

export const selectConversationsByFolder = (folderId: string | null) => (state: ChatState) =>
  state.conversations.filter((c) => c.folderId === folderId);

export const selectPinnedConversations = (state: ChatState) =>
  state.conversations.filter((c) => c.pinned);

export const selectRecentConversations = (limit: number = 10) => (state: ChatState) =>
  [...state.conversations]
    .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
    .slice(0, limit);
