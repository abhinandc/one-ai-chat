import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Settings, ChevronDown, RefreshCw } from "lucide-react";
import { useQueryLogger } from "@/hooks/useQueryLogger";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { AdvancedAIInput } from "@/components/chat/AdvancedAIInput";
import { ChatSettingsDrawer } from "@/components/chat/ChatSettingsDrawer";
import { useChat } from "@/hooks/useChat";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConversations } from "@/hooks/useConversations";
import { useVirtualKeyInit, getStoredCredentials } from "@/hooks/useVirtualKeyInit";
import { analyticsService } from "@/services/analyticsService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/types";

interface LocationState {
  selectedModelId?: string;
  selectedResponse?: string;
  originalQuery?: string;
}

const Chat = () => {
  const user = useCurrentUser();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { toast } = useToast();
  
  // Auto-initialize virtual API key from employee_keys
  const { initialized: keyInitialized, loading: keyLoading, error: keyError, refreshCredentials } = useVirtualKeyInit(user?.email);

  // Query logger for context/memory
  const { logQuery, startQueryTracking, completeQueryTracking } = useQueryLogger(user?.email);
  const queryStartTimeRef = useRef<number>(0);

  // User preferences (persisted to Supabase)
  const {
    preferences,
    loading: preferencesLoading,
    updateChatPreferences,
    updateModelPreferences,
  } = useUserPreferences(user?.email);
  
  // Load models - pass email directly, useModels handles caching internally
  const { models, loading: modelsLoading, refetch: refetchModels } = useModels(user?.email);

  // Refetch models when credentials become available (in case localStorage was empty initially)
  useEffect(() => {
    if (keyInitialized && models.length === 0 && !modelsLoading) {
      console.log('[Chat] Credentials initialized, refetching models');
      refetchModels();
    }
  }, [keyInitialized, models.length, modelsLoading, refetchModels]);
  
  const {
    conversations: supabaseConversations,
    loading: conversationsLoading,
    saveConversation,
    deleteConversation,
  } = useConversations(user?.email);

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>("");
  // Mode-specific configurations
  const [chatMode, setChatMode] = useState<"thinking" | "fast" | "coding">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem("oneEdge_chat_mode") as "thinking" | "fast" | "coding") || "fast";
    }
    return "fast";
  });

  // Mode-specific system prompts
  const modeSystemPrompts: Record<string, string> = {
    thinking: `You are an advanced AI assistant capable of deep analysis and step-by-step reasoning.

When tackling complex problems:
1. Break down your thought process into clear steps
2. Show your reasoning using <thinking>...</thinking> blocks for internal deliberation
3. Consider multiple perspectives before concluding
4. Explain your logic transparently

Format your thinking as:
<thinking>
## Analysis Phase
- Key observation 1
- Key observation 2

## Reasoning
- Step-by-step logic here
</thinking>

Then provide your clear, well-reasoned response.`,
    fast: "You are a helpful AI assistant. Be concise and direct in your responses.",
    coding: `You are an expert software engineer and coding assistant.

Guidelines:
- Write clean, maintainable, and well-documented code
- Follow best practices and design patterns
- Include helpful comments for complex logic
- Consider edge cases and error handling
- Provide explanations for your code when helpful`,
  };

  const [chatSettings, setChatSettings] = useState({
    systemPrompt: modeSystemPrompts.fast,
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    streamResponse: true,
  });

  // Load settings from Supabase preferences when available
  useEffect(() => {
    if (!preferencesLoading && preferences.chat) {
      // Only update if not using mode-specific prompts (user hasn't customized mode)
      const currentModePrompt = modeSystemPrompts[chatMode];
      const isUsingModePrompt = currentModePrompt === chatSettings.systemPrompt;

      setChatSettings(prev => ({
        systemPrompt: isUsingModePrompt ? prev.systemPrompt : preferences.chat.systemPrompt,
        temperature: preferences.chat.temperature,
        maxTokens: preferences.chat.maxTokens,
        topP: preferences.chat.topP,
        streamResponse: preferences.chat.streamResponse,
      }));

      // Load preferred model if set and current model is empty
      if (!selectedModel && preferences.models.defaultModelId) {
        setSelectedModel(preferences.models.defaultModelId);
      } else if (!selectedModel && chatMode === "coding" && preferences.models.preferredCodingModel) {
        setSelectedModel(preferences.models.preferredCodingModel);
      } else if (!selectedModel && chatMode === "fast" && preferences.models.preferredChatModel) {
        setSelectedModel(preferences.models.preferredChatModel);
      }
    }
  }, [preferencesLoading, preferences]);

  // Handle mode changes
  const handleModeChange = (mode: string) => {
    const validMode = mode as "thinking" | "fast" | "coding";
    setChatMode(validMode);

    // Update system prompt based on mode
    setChatSettings(prev => ({
      ...prev,
      systemPrompt: modeSystemPrompts[validMode] || modeSystemPrompts.fast,
      // Adjust temperature based on mode
      temperature: validMode === "thinking" ? 0.3 : validMode === "coding" ? 0.2 : 0.7,
    }));
  };


  const {
    messages,
    sendMessage,
    clearMessages,
    setMessages,
    stopStreaming,
    isStreaming,
    streamingMessage,
    isThinking,
    thinkingContent,
  } = useChat({
    model: selectedModel,
    systemPrompt: chatSettings.systemPrompt,
    temperature: chatSettings.temperature,
    maxTokens: chatSettings.maxTokens,
  });

  // Initialize with first available model or from location state
  useEffect(() => {
    if (locationState?.selectedModelId) {
      setSelectedModel(locationState.selectedModelId);
    } else if (models.length > 0 && !selectedModel) {
      console.log('[Chat] Setting initial model:', models[0].id);
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel, locationState?.selectedModelId]);

  // Reset model selection when models list changes and current model isn't in list
  useEffect(() => {
    if (models.length > 0 && selectedModel && !models.find(m => m.id === selectedModel)) {
      console.log('[Chat] Model not in list, resetting to:', models[0].id);
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  // Handle incoming selection from homepage comparison
  useEffect(() => {
    if (locationState?.originalQuery && locationState?.selectedResponse) {
      // Create a new conversation with the selected response pre-loaded
      const now = new Date();
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: locationState.originalQuery.slice(0, 50) + (locationState.originalQuery.length > 50 ? "..." : ""),
        messages: [],
        pinned: false,
        shared: false,
        unread: false,
        tags: [],
        createdAt: now,
        updatedAt: now,
        settings: {
          model: locationState.selectedModelId || selectedModel,
          provider: "litellm",
          temperature: chatSettings.temperature,
          topP: chatSettings.topP,
          maxTokens: chatSettings.maxTokens,
          stopSequences: [],
          systemPrompt: chatSettings.systemPrompt,
        },
      };

      setCurrentConversation(newConversation);
      
      // Pre-populate with the user query and selected AI response
      setMessages([
        { role: 'user', content: locationState.originalQuery },
        { role: 'assistant', content: locationState.selectedResponse }
      ]);
      
      // Clear location state to prevent re-triggering
      window.history.replaceState({}, document.title);
      
      // Track the event
      if (user?.email) {
        analyticsService.trackEvent({
          user_email: user.email,
          action: "comparison_response_selected",
          resource_type: "chat",
          resource_id: newConversation.id,
          metadata: { model: locationState.selectedModelId },
        });
      }
    }
  }, [locationState]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (user?.email && messages.length > 0 && currentConversation) {
      saveCurrentConversation();
    }
  }, [messages]);

  const saveCurrentConversation = async () => {
    if (!user?.email || !currentConversation || messages.length === 0) return;

    try {
      await saveConversation({
        id: currentConversation.id,
        user_email: user.email,
        title: currentConversation.title,
        messages: messages.map((msg, index) => ({
          id: `msg_${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString(),
          metadata: {},
        })),
        folder_id: currentConversation.folderId,
        pinned: currentConversation.pinned,
        shared: currentConversation.shared,
        unread: currentConversation.unread,
        tags: currentConversation.tags,
        settings: {
          model: selectedModel,
          provider: "litellm" as const,
          temperature: chatSettings.temperature,
          topP: chatSettings.topP,
          maxTokens: chatSettings.maxTokens,
          stopSequences: [],
          systemPrompt: chatSettings.systemPrompt,
        },
      });
    } catch {
      // Silently fail - don't expose conversation errors
    }
  };

  const createNewConversation = () => {
    const now = new Date();
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New chat",
      messages: [],
      pinned: false,
      shared: false,
      unread: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      settings: {
        model: selectedModel,
        provider: "litellm",
        temperature: chatSettings.temperature,
        topP: chatSettings.topP,
        maxTokens: chatSettings.maxTokens,
        stopSequences: [],
        systemPrompt: chatSettings.systemPrompt,
      },
    };

    setCurrentConversation(newConversation);
    clearMessages();

    if (user?.email) {
      analyticsService.trackEvent({
        user_email: user.email,
        action: "conversation_created",
        resource_type: "chat",
        resource_id: newConversation.id,
        metadata: {},
      });
    }
  };

  const loadConversation = async (conversationId: string) => {
    const supabaseConv = supabaseConversations.find((c) => c.id === conversationId);
    if (!supabaseConv) return;

    const conversation: Conversation = {
      id: supabaseConv.id,
      title: supabaseConv.title,
      messages: supabaseConv.messages.map((msg: any, index: number) => ({
        id: msg.id || `msg_${index}`,
        role: msg.role as Message["role"],
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
        metadata: msg.metadata,
      })),
      folderId: supabaseConv.folder_id,
      pinned: supabaseConv.pinned,
      shared: supabaseConv.shared,
      unread: supabaseConv.unread,
      tags: supabaseConv.tags,
      createdAt: new Date(supabaseConv.created_at || Date.now()),
      updatedAt: new Date(supabaseConv.updated_at),
      settings: supabaseConv.settings || {
        model: selectedModel,
        provider: "litellm" as const,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        stopSequences: [],
      },
    };

    setCurrentConversation(conversation);

    // Load the messages into the chat
    setMessages(conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })));

    // Load saved settings from conversation
    if (conversation.settings) {
      setSelectedModel(conversation.settings.model || selectedModel);
      setChatSettings({
        systemPrompt: conversation.settings.systemPrompt || "You are a helpful AI assistant.",
        temperature: conversation.settings.temperature ?? 0.7,
        maxTokens: conversation.settings.maxTokens ?? 4000,
        topP: conversation.settings.topP ?? 0.9,
        streamResponse: true,
      });
    }

    if (user?.email) {
      analyticsService.trackEvent({
        user_email: user.email,
        action: "conversation_loaded",
        resource_type: "chat",
        resource_id: conversationId,
        metadata: {},
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);

      if (currentConversation?.id === conversationId) {
        createNewConversation();
      }

      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed",
      });

      if (user?.email) {
        analyticsService.trackEvent({
          user_email: user.email,
          action: "conversation_deleted",
          resource_type: "chat",
          resource_id: conversationId,
          metadata: {},
        });
      }
    } catch (error) {
      // Show user-friendly error without exposing details
      toast({
        title: "Failed to delete conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string, attachments?: { name: string; type: string; size: number; data?: string }[]) => {
    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a model to send messages",
        variant: "destructive",
      });
      return;
    }

    // Check if credentials are configured
    const creds = getStoredCredentials();
    if (!creds?.api_key || creds.api_key.length < 20) {
      // Show more specific error
      const errorMsg = keyError || "No API credentials found. Credentials are loaded automatically from your assigned keys.";
      toast({
        title: "API Credentials Not Loaded",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    if (!currentConversation) {
      createNewConversation();
    }

    // Start query tracking for logging
    queryStartTimeRef.current = startQueryTracking(content);

    try {
      // Send message with attachments (images will be sent to vision-capable models)
      await sendMessage(content, attachments);

      // Update conversation title if it's the first message
      if (
        currentConversation &&
        currentConversation.title === "New chat" &&
        content.length > 0
      ) {
        const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        setCurrentConversation((prev) => (prev ? { ...prev, title: newTitle } : null));
      }
    } catch (error) {
      // Show user-friendly error without logging sensitive data
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Log query when streaming completes
  useEffect(() => {
    // When streaming finishes and we have a response, log it
    if (!isStreaming && queryStartTimeRef.current > 0 && messages.length >= 2) {
      const lastUserMessage = messages[messages.length - 2];
      const lastAssistantMessage = messages[messages.length - 1];

      if (lastUserMessage?.role === "user" && lastAssistantMessage?.role === "assistant") {
        const responseContent = lastAssistantMessage.content || "";
        // Create a simple summary (first 200 chars of response)
        const responseSummary = responseContent.length > 200
          ? responseContent.slice(0, 200) + "..."
          : responseContent;

        // Determine query type based on mode
        const queryType = chatMode === "coding" ? "code" : chatMode === "thinking" ? "analysis" : "chat";

        // Log the completed query
        completeQueryTracking(queryStartTimeRef.current, {
          conversationId: currentConversation?.id,
          queryType,
          modelUsed: selectedModel,
          responseSummary,
          keyTopics: [], // Could extract topics here with NLP
        });

        queryStartTimeRef.current = 0;
      }
    }
  }, [isStreaming, messages, chatMode, selectedModel, currentConversation?.id, completeQueryTracking]);

  // Convert Supabase conversations to UI format
  const uiConversations: Conversation[] = useMemo(() => {
    return supabaseConversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      messages: (conv.messages || []).map((msg: any, index: number) => ({
        id: msg.id || `msg_${index}`,
        role: msg.role as Message["role"],
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
        metadata: msg.metadata,
      })),
      folderId: conv.folder_id,
      pinned: conv.pinned,
      shared: conv.shared,
      unread: conv.unread,
      tags: conv.tags,
      createdAt: new Date(conv.created_at || Date.now()),
      updatedAt: new Date(conv.updated_at),
      settings: conv.settings || {
        model: "",
        provider: "litellm" as const,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        stopSequences: [],
      },
    }));
  }, [supabaseConversations]);

  // Convert ChatMessage[] to Message[] for Thread component
  const threadMessages: Message[] = useMemo(() => {
    return messages.map((msg, index) => ({
      id: `msg_${index}`,
      role: msg.role as Message["role"],
      content: typeof msg.content === 'string' ? msg.content : '',
      timestamp: new Date(),
      metadata: (msg as any).metadata || {},
    }));
  }, [messages]);

  // Initialize with new conversation if none exists
  useEffect(() => {
    if (!currentConversation && !conversationsLoading) {
      createNewConversation();
    }
  }, [conversationsLoading]);

  // Show skeleton while essential data loads
  // User is guaranteed by App.tsx, but we need models to be ready
  const isInitializing = !user || (keyLoading && models.length === 0);

  if (isInitializing) {
    return (
      <div className="h-[calc(100vh-4rem-60px)] flex flex-col bg-background overflow-hidden">
        {/* Header skeleton */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
            <div className="h-8 w-36 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
        </header>

        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="h-8 w-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading chat...</p>
            </div>
          </div>

          {/* Input skeleton */}
          <div className="p-4 pb-6">
            <div className="h-12 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-[calc(100vh-4rem-60px)] flex flex-col bg-background overflow-hidden relative">
      {/* Sidebar */}
      <ChatSidebar
        conversations={uiConversations}
        activeId={currentConversation?.id}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={loadConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Model Selector - Remove hardcoded api_path */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1.5 font-medium">
                <span className="max-w-[200px] truncate">
                  {selectedModel || "Select model"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {modelsLoading ? (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">Loading models...</span>
                </DropdownMenuItem>
              ) : models.length === 0 ? (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">No models available</span>
                </DropdownMenuItem>
              ) : (
                models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={cn(
                      "flex flex-col items-start gap-0.5",
                      model.id === selectedModel && "bg-muted"
                    )}
                  >
                    <span className="font-medium">{model.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.owned_by}{model.api_path ? ` • ${model.api_path}` : ''}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuItem
                onClick={async () => {
                  await refreshCredentials();
                  refetchModels();
                  toast({ title: "Models refreshed", description: "Reloaded models from your assigned keys" });
                }}
                className="text-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh models
              </DropdownMenuItem>
              {selectedModel && (
                <DropdownMenuItem
                  onClick={async () => {
                    await updateModelPreferences({ defaultModelId: selectedModel });
                    toast({ title: "Default model set", description: `${selectedModel} will be used by default` });
                  }}
                  className="text-muted-foreground"
                >
                  Set as default model
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <ChatThread
          messages={threadMessages}
          isStreaming={isStreaming}
          streamingMessage={streamingMessage}
          onSuggestionClick={(suggestion) => setPendingMessage(suggestion)}
          chatMode={chatMode}
          isThinking={isThinking}
          thinkingContent={thinkingContent}
        />

        {/* Input - no duplicate model dropdown, it's in the header */}
        <div className="shrink-0 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
          <AdvancedAIInput
            onSend={handleSendMessage}
            isLoading={isStreaming}
            onStop={stopStreaming}
            placeholder="What's on your mind?"
            initialMessage={pendingMessage}
            onInitialMessageConsumed={() => setPendingMessage("")}
            onModeChange={handleModeChange}
          />
        </div>
      </main>

      {/* Settings Drawer */}
      <ChatSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={chatSettings}
        onSettingsChange={async (newSettings) => {
          setChatSettings(newSettings);

          // Persist to Supabase user preferences
          await updateChatPreferences({
            systemPrompt: newSettings.systemPrompt,
            temperature: newSettings.temperature,
            maxTokens: newSettings.maxTokens,
            topP: newSettings.topP,
            streamResponse: newSettings.streamResponse,
          });

          // Auto-save settings to current conversation
          if (currentConversation && user?.email) {
            saveConversation({
              id: currentConversation.id,
              user_email: user.email,
              title: currentConversation.title,
              messages: messages.map((msg, index) => ({
                id: `msg_${index}`,
                role: msg.role,
                content: msg.content,
                timestamp: new Date().toISOString(),
                metadata: {},
              })),
              folder_id: currentConversation.folderId,
              pinned: currentConversation.pinned,
              shared: currentConversation.shared,
              unread: currentConversation.unread,
              tags: currentConversation.tags,
              settings: {
                model: selectedModel,
                provider: "litellm" as const,
                temperature: newSettings.temperature,
                topP: newSettings.topP,
                maxTokens: newSettings.maxTokens,
                stopSequences: [],
                systemPrompt: newSettings.systemPrompt,
              },
            });
          }
        }}
      />
    </div>
  );
};

export default Chat;
