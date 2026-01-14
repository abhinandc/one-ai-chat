import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Settings, ChevronDown, RefreshCw } from "lucide-react";
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
  
  // Only load models after key initialization is complete
  const { models, loading: modelsLoading, refetch: refetchModels } = useModels(keyInitialized ? user?.email : undefined);
  
  // Refetch models when key initialization completes
  useEffect(() => {
    if (keyInitialized && user?.email) {
      refetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyInitialized, user?.email]);
  
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
  const [chatSettings, setChatSettings] = useState({
    systemPrompt: "You are a helpful AI assistant.",
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    streamResponse: true,
  });


  const {
    messages,
    sendMessage,
    clearMessages,
    setMessages,
    stopStreaming,
    isStreaming,
    streamingMessage,
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
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel, locationState?.selectedModelId]);

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

    try {
      // TODO: Process attachments - for now just send the message
      // In a full implementation, attachments would be sent to the API
      // For images, they could be sent as base64 in a vision model request
      if (attachments && attachments.length > 0) {
        console.log("Attachments received:", attachments.map(a => ({ name: a.name, type: a.type, hasData: !!a.data })));
        // Future: integrate with vision models
      }
      
      await sendMessage(content);

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
      content: msg.content,
      timestamp: new Date(),
      metadata: {},
    }));
  }, [messages]);

  // Initialize with new conversation if none exists
  useEffect(() => {
    if (!currentConversation && !conversationsLoading) {
      createNewConversation();
    }
  }, [conversationsLoading]);

  if (conversationsLoading || modelsLoading || keyLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            {keyLoading ? 'Initializing API keys...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to use the chat feature</p>
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
              {models.length === 0 ? (
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
        />

        {/* Input - no duplicate model dropdown, it's in the header */}
        <div className="shrink-0 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
          <AdvancedAIInput
            onSend={handleSendMessage}
            isLoading={isStreaming}
            onStop={stopStreaming}
            placeholder={isStreaming ? "Thinking..." : "What's on your mind?"}
            initialMessage={pendingMessage}
            onInitialMessageConsumed={() => setPendingMessage("")}
          />
        </div>
      </main>

      {/* Settings Drawer */}
      <ChatSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={chatSettings}
        onSettingsChange={(newSettings) => {
          setChatSettings(newSettings);
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
