import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/components/chat/ConversationList";
import { Thread } from "@/components/chat/Thread";
import { Composer } from "@/components/chat/Composer";
import { InspectorPanel } from "@/components/chat/InspectorPanel";
import { useChat } from "@/hooks/useChat";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Conversation, ConversationFolder, Message, Citation } from "@/types";

const STORAGE_PREFIX = "oneai.chat.";

interface StoredMessage {
  id: string;
  role: Message["role"];
  content: string;
  timestamp: string;
  metadata?: Message["metadata"];
}

interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  folderId?: string;
  pinned: boolean;
  shared: boolean;
  unread: boolean;
  tags: string[];
  settings: Conversation["settings"];
  createdAt: string;
  updatedAt: string;
}

interface StoredState {
  conversations: StoredConversation[];
  activeConversationId: string | null;
  selectedModel: string | null;
  provider: Conversation["settings"]["provider"];
}

const serializeConversation = (conversation: Conversation): StoredConversation => ({
  id: conversation.id,
  title: conversation.title,
  folderId: conversation.folderId,
  pinned: conversation.pinned,
  shared: conversation.shared,
  unread: conversation.unread,
  tags: conversation.tags,
  settings: conversation.settings,
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
  messages: conversation.messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
    metadata: message.metadata,
  })),
});

const deserializeConversation = (stored: StoredConversation): Conversation => {
  const baseCreatedAt = new Date(stored.createdAt);
  const baseUpdatedAt = new Date(stored.updatedAt);
  const createdAt = Number.isNaN(baseCreatedAt.getTime()) ? new Date() : baseCreatedAt;
  const updatedAt = Number.isNaN(baseUpdatedAt.getTime()) ? createdAt : baseUpdatedAt;

  const storedSettings = stored.settings ?? {
    model: "",
    provider: "litellm" as const,
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 2048,
    stopSequences: [],
    tools: [],
  };

  return {
    id: stored.id,
    title: stored.title ?? "Conversation",
    folderId: stored.folderId,
    pinned: Boolean(stored.pinned),
    shared: Boolean(stored.shared),
    unread: Boolean(stored.unread),
    tags: Array.isArray(stored.tags) ? stored.tags : [],
    settings: {
      ...storedSettings,
      stopSequences: Array.isArray(storedSettings.stopSequences) ? storedSettings.stopSequences : [],
      tools: Array.isArray(storedSettings.tools) ? storedSettings.tools : [],
    },
    createdAt,
    updatedAt,
    messages: Array.isArray(stored.messages)
      ? stored.messages.map((message) => {
          const parsedTimestamp = new Date(message.timestamp);
          const timestamp = Number.isNaN(parsedTimestamp.getTime()) ? updatedAt : parsedTimestamp;
          return {
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp,
            metadata: message.metadata,
          };
        })
      : [],
  };
};

export default function Chat() {
  const user = useCurrentUser();
  const storageKey = useMemo(
    () => (user?.email ? `${STORAGE_PREFIX}${user.email}` : null),
    [user?.email],
  );

  const { models, loading: modelsLoading } = useModels();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders] = useState<ConversationFolder[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [provider, setProvider] = useState<Conversation["settings"]["provider"]>("litellm");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  const paramsRef = useRef<{ prompt?: string; title?: string; model?: string } | null>(null);
  const previousConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    paramsRef.current = {
      prompt: urlParams.get("prompt") ?? undefined,
      title: urlParams.get("title") ?? undefined,
      model: urlParams.get("model") ?? undefined,
    };
  }, []);

  const chat = useChat({
    model: selectedModel,
    temperature: 0.7,
    maxTokens: 2048,
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const {
    clearMessages: resetChatMessages,
    setMessages: syncChatMessages,
    stopStreaming: haltStreaming,
  } = chat;

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  useEffect(() => {
    setConversations([]);
    setActiveConversationId(null);
    setProvider("litellm");
    setSelectedModel("");

    if (!storageKey) {
      setHydrated(true);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        const hydratedConversations = Array.isArray(parsed.conversations)
          ? parsed.conversations
              .map((item) => {
                try {
                  return deserializeConversation(item);
                } catch (error) {
                  console.warn("Skipping invalid stored conversation", error);
                  return null;
                }
              })
              .filter((conversation): conversation is Conversation => Boolean(conversation))
          : [];

        if (hydratedConversations.length > 0) {
          setConversations(hydratedConversations);

          const preferredId =
            parsed.activeConversationId &&
            hydratedConversations.some((conversation) => conversation.id === parsed.activeConversationId)
              ? parsed.activeConversationId
              : hydratedConversations[0].id;

          setActiveConversationId(preferredId);
          previousConversationIdRef.current = preferredId;

          const storedProvider = parsed.provider === "openwebui" ? "openwebui" : "litellm";
          setProvider(storedProvider);

          const storedModel =
            parsed.selectedModel ??
            hydratedConversations.find((conversation) => conversation.id === preferredId)?.settings.model ??
            "";

          setSelectedModel(storedModel ?? "");
        }
      }
    } catch (error) {
      console.warn("Failed to hydrate chat history:", error);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (conversations.length === 0) {
      const params = paramsRef.current;
      const now = new Date();
      const preferredModel =
        (params?.model && params.model.trim().length > 0 ? params.model : "") ||
        selectedModel ||
        (models.length > 0 ? models[0].id : "");

      if (preferredModel && !selectedModel) {
        setSelectedModel(preferredModel);
      }

      const newConversation: Conversation = {
        id: `${Date.now()}`,
        title: params?.title ? `${params.title} Session` : "New Conversation",
        messages: [],
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        settings: {
          model: preferredModel,
          provider,
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 2048,
          stopSequences: [],
          tools: [],
          systemPrompt: params?.prompt ?? undefined,
        },
        createdAt: now,
        updatedAt: now,
      };

      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
      previousConversationIdRef.current = newConversation.id;
      paramsRef.current = null;
      haltStreaming();
      resetChatMessages();
    }
  }, [hydrated, conversations.length, provider, selectedModel, models, haltStreaming, resetChatMessages]);

  useEffect(() => {
    if (!hydrated || models.length === 0) {
      return;
    }

    setSelectedModel((prev) => {
      if (prev && models.some((model) => model.id === prev)) {
        return prev;
      }

      const activeModel = activeConversation?.settings.model;
      if (activeModel && models.some((model) => model.id === activeModel)) {
        return activeModel;
      }

      return models[0].id;
    });
  }, [hydrated, models, activeConversation]);

  useEffect(() => {
    if (!storageKey || !hydrated) {
      return;
    }

    try {
      const payload: StoredState = {
        conversations: conversations.map(serializeConversation),
        activeConversationId,
        selectedModel: selectedModel || null,
        provider,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to persist chat history:", error);
    }
  }, [storageKey, hydrated, conversations, activeConversationId, selectedModel, provider]);

  useEffect(() => {
    if (previousConversationIdRef.current === activeConversationId) {
      return;
    }
    previousConversationIdRef.current = activeConversationId;

    if (!activeConversationId) {
      haltStreaming();
      resetChatMessages();
      return;
    }

    const conversation = conversations.find((item) => item.id === activeConversationId);
    if (!conversation) {
      haltStreaming();
      resetChatMessages();
      return;
    }

    haltStreaming();
    resetChatMessages();
    if (conversation.messages.length > 0) {
      syncChatMessages(
        conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      );
    }

    if (conversation.settings.model) {
      setSelectedModel(conversation.settings.model);
    }
    setProvider(conversation.settings.provider);
  }, [activeConversationId, conversations, haltStreaming, resetChatMessages, syncChatMessages]);

  useEffect(() => {
    if (!hydrated || !activeConversationId || !selectedModel) {
      return;
    }

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== activeConversationId) {
          return conversation;
        }
        if (conversation.settings.model && conversation.settings.model.length > 0) {
          return conversation;
        }
        return {
          ...conversation,
          settings: {
            ...conversation.settings,
            model: selectedModel,
          },
        };
      }),
    );
  }, [hydrated, activeConversationId, selectedModel]);

  const createNewConversation = () => {
    const fallbackModel =
      selectedModel || (models.length > 0 ? models[0].id : "");

    if (!selectedModel && fallbackModel) {
      setSelectedModel(fallbackModel);
    }

    const now = new Date();
    const newConversation: Conversation = {
      id: `${Date.now()}`,
      title: "New Conversation",
      messages: [],
      pinned: false,
      shared: false,
      unread: false,
      tags: [],
      settings: {
        model: fallbackModel,
        provider,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 2048,
        stopSequences: [],
        tools: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    previousConversationIdRef.current = newConversation.id;
    haltStreaming();
    resetChatMessages();
  };

  const sendMessage = async (content: string, settings?: Partial<Conversation["settings"]>) => {
    if (!activeConversationId || !content.trim()) {
      return;
    }

    const conversation = conversations.find((item) => item.id === activeConversationId);
    if (!conversation) {
      return;
    }

    let targetModel = settings?.model ?? conversation.settings.model ?? selectedModel;
    if (!targetModel) {
      if (modelsLoading) {
        console.warn("Models are still loading. Please wait before sending a message.");
        return;
      }
      if (models.length === 0) {
        console.warn("No models available to handle the chat request.");
        return;
      }
      targetModel = models[0].id;
      setSelectedModel(targetModel);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    const nextSettings: Conversation["settings"] = {
      ...conversation.settings,
      ...settings,
      model: targetModel,
    };

    setConversations((prev) =>
      prev.map((item) =>
        item.id === activeConversationId
          ? {
              ...item,
              messages: [...item.messages, userMessage],
              settings: nextSettings,
              title:
                item.messages.length === 0
                  ? `${content.slice(0, 50)}${content.length > 50 ? "..." : ""}`
                  : item.title,
              updatedAt: new Date(),
            }
          : item,
      ),
    );

    setSelectedModel(targetModel);
    setProvider(nextSettings.provider);
    haltStreaming();

    try {
      await chat.sendMessage(content, {
        model: targetModel,
        systemPrompt: nextSettings.systemPrompt,
        temperature: nextSettings.temperature,
        maxTokens: nextSettings.maxTokens,
        topP: nextSettings.topP,
      });
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  useEffect(() => {
    if (!activeConversation || chat.isStreaming || chat.isLoading) {
      return;
    }

    if (chat.messages.length <= activeConversation.messages.length) {
      return;
    }

    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") {
      return;
    }

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: `${conversation.id}-${Date.now()}`,
                  role: lastMessage.role,
                  content: lastMessage.content ?? "",
                  timestamp: new Date(),
                  metadata: {
                    model: selectedModel,
                    provider,
                    tokens: lastMessage.content ? Math.ceil(lastMessage.content.length / 4) : undefined,
                  },
                },
              ],
              updatedAt: new Date(),
            }
          : conversation,
      ),
    );
  }, [chat.messages, chat.isStreaming, chat.isLoading, activeConversation, provider, selectedModel]);

  const stopStreaming = () => {
    haltStreaming();
  };

  const updateConversationSettings = (settings: Partial<Conversation["settings"]>) => {
    if (!activeConversationId) {
      return;
    }

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              settings: {
                ...conversation.settings,
                ...settings,
              },
            }
          : conversation,
      ),
    );

    if (settings.model) {
      setSelectedModel(settings.model);
    }
    if (settings.provider) {
      setProvider(settings.provider);
    }
  };

  const emptyCitations = useMemo<Citation[]>(() => [], []);

  if (chat.error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">??</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Chat Error</h2>
          <p className="text-text-secondary mb-4">{chat.error}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background overflow-hidden">
      <div className="w-80 flex-shrink-0 overflow-hidden">
        <ConversationList
          conversations={conversations}
          folders={folders}
          activeId={activeConversationId || ""}
          onSelectConversation={setActiveConversationId}
          onNewConversation={createNewConversation}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border-primary/50 p-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {activeConversation?.title || "Select a conversation"}
              </h1>
              {activeConversation && (
                <p className="text-sm text-text-secondary">
                  {activeConversation.messages.length} messages
                </p>
              )}
            </div>
          </div>
        </div>

        {activeConversation ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <Thread
                messages={activeConversation.messages}
                isStreaming={chat.isStreaming}
                streamingMessage={chat.streamingMessage}
              />
            </div>
            <div className="flex-shrink-0">
              <Composer
                conversation={activeConversation}
                onSendMessage={sendMessage}
                isStreaming={chat.isStreaming}
                onStopStreaming={stopStreaming}
                onUpdateSettings={updateConversationSettings}
                availableModels={models}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-lg">??</div>
              <h2 className="text-xl font-semibold text-text-primary mb-md">Welcome to Chat</h2>
              <p className="text-text-secondary mb-lg">Select a conversation or start a new one</p>
              <Button onClick={createNewConversation}>Start New Conversation</Button>
            </div>
          </div>
        )}
      </div>

      <InspectorPanel
        conversation={activeConversation}
        citations={emptyCitations}
        onUpdateSettings={updateConversationSettings}
      />
    </div>
  );
}
