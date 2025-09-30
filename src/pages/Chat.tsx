import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/components/chat/ConversationList";
import { Thread } from "@/components/chat/Thread";
import { Composer } from "@/components/chat/Composer";
import { InspectorPanel } from "@/components/chat/InspectorPanel";
import { useChat } from "@/hooks/useChat";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConversations } from "@/hooks/useConversations";
import { conversationService } from "@/services/conversationService";
import { analyticsService } from "@/services/analyticsService";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, ConversationFolder, Message, Citation } from "@/types";

const Chat = () => {
  const user = useCurrentUser();
  const { toast } = useToast();
  const { models, loading: modelsLoading } = useModels();
  const { conversations: supabaseConversations, loading: conversationsLoading, saveConversation, deleteConversation } = useConversations(user?.email);
  
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    regenerateLastMessage,
    stopGeneration,
    isStreaming
  } = useChat({
    model: selectedModel,
    systemPrompt,
    temperature,
    maxTokens,
    onMessage: (message) => {
      // Track API usage
      if (user?.email && message.role === 'assistant') {
        analyticsService.recordAPICall(
          user.email,
          selectedModel,
          message.metadata?.tokens || 0,
          message.metadata?.cost || 0
        );
        
        analyticsService.trackEvent(
          user.email,
          'message_sent',
          'chat',
          currentConversation?.id || 'new',
          { model: selectedModel, tokens: message.metadata?.tokens }
        );
      }
    }
  });

  // Initialize with first available model
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (user?.email && messages.length > 0) {
      saveCurrentConversation();
    }
  }, [messages, user?.email]);

  const saveCurrentConversation = async () => {
    if (!user?.email || !currentConversation || messages.length === 0) return;

    try {
      await saveConversation({
        id: currentConversation.id,
        user_email: user.email,
        title: currentConversation.title,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          metadata: msg.metadata
        })),
        folder_id: currentConversation.folderId,
        pinned: currentConversation.pinned,
        shared: currentConversation.shared,
        unread: currentConversation.unread,
        tags: currentConversation.tags,
        settings: {
          model: selectedModel,
          systemPrompt,
          temperature,
          maxTokens
        }
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: "New Conversation",
      messages: [],
      pinned: false,
      shared: false,
      unread: false,
      tags: [],
      lastActivity: new Date(),
      settings: {
        model: selectedModel,
        systemPrompt,
        temperature,
        maxTokens
      }
    };
    
    setCurrentConversation(newConversation);
    clearMessages();
    
    if (user?.email) {
      analyticsService.trackEvent(
        user.email,
        'conversation_created',
        'chat',
        newConversation.id
      );
    }
  };

  const loadConversation = async (conversationId: string) => {
    const supabaseConv = supabaseConversations.find(c => c.id === conversationId);
    if (!supabaseConv) return;

    const conversation: Conversation = {
      id: supabaseConv.id,
      title: supabaseConv.title,
      messages: supabaseConv.messages.map(msg => ({
        id: msg.id,
        role: msg.role as Message['role'],
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.metadata
      })),
      folderId: supabaseConv.folder_id,
      pinned: supabaseConv.pinned,
      shared: supabaseConv.shared,
      unread: supabaseConv.unread,
      tags: supabaseConv.tags,
      lastActivity: new Date(supabaseConv.updated_at),
      settings: supabaseConv.settings
    };

    setCurrentConversation(conversation);
    
    // Load conversation settings
    if (conversation.settings) {
      setSelectedModel(conversation.settings.model || selectedModel);
      setSystemPrompt(conversation.settings.systemPrompt || "");
      setTemperature(conversation.settings.temperature || 0.7);
      setMaxTokens(conversation.settings.maxTokens || 4000);
    }

    if (user?.email) {
      analyticsService.trackEvent(
        user.email,
        'conversation_loaded',
        'chat',
        conversationId
      );
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
        description: "The conversation has been removed"
      });

      if (user?.email) {
        analyticsService.trackEvent(
          user.email,
          'conversation_deleted',
          'chat',
          conversationId
        );
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        title: "Failed to delete conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a model to send messages",
        variant: "destructive"
      });
      return;
    }

    if (!currentConversation) {
      createNewConversation();
    }

    try {
      await sendMessage(content, attachments);
      
      // Update conversation title if it's the first message
      if (currentConversation && currentConversation.title === "New Conversation" && content.length > 0) {
        const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Convert Supabase conversations to UI format
  const uiConversations: Conversation[] = useMemo(() => {
    return supabaseConversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        role: msg.role as Message['role'],
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.metadata
      })),
      folderId: conv.folder_id,
      pinned: conv.pinned,
      shared: conv.shared,
      unread: conv.unread,
      tags: conv.tags,
      lastActivity: new Date(conv.updated_at),
      settings: conv.settings
    }));
  }, [supabaseConversations]);

  // Initialize with new conversation if none exists
  useEffect(() => {
    if (!currentConversation && !conversationsLoading) {
      createNewConversation();
    }
  }, [conversationsLoading]);

  if (conversationsLoading || modelsLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Authentication Required</h2>
          <p className="text-text-secondary">Please log in to use the chat feature</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      {/* Conversation Sidebar */}
      {showConversations && (
        <div className="w-80 border-r border-border-primary bg-surface-secondary">
          <ConversationList
            conversations={uiConversations}
            folders={[]} // TODO: Implement folders
            currentConversationId={currentConversation?.id}
            onSelectConversation={loadConversation}
            onDeleteConversation={handleDeleteConversation}
            onCreateNew={createNewConversation}
            loading={conversationsLoading}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-md border-b border-border-primary bg-surface-primary">
          <div className="flex items-center gap-md">
            <Button
              onClick={() => setShowConversations(!showConversations)}
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary"
            >
              ?
            </Button>
            <h1 className="text-lg font-semibold text-text-primary">
              {currentConversation?.title || "New Conversation"}
            </h1>
          </div>

          <div className="flex items-center gap-sm">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary text-sm"
              disabled={modelsLoading}
            >
              <option value="">Select Model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>

            <Button
              onClick={() => setInspectorOpen(!inspectorOpen)}
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary"
            >
              Inspector
            </Button>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 min-h-0">
          <Thread
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onRegenerateMessage={regenerateLastMessage}
            onStopGeneration={stopGeneration}
          />
        </div>

        {/* Message Composer */}
        <div className="border-t border-border-primary bg-surface-primary">
          <Composer
            onSendMessage={handleSendMessage}
            disabled={isLoading || !selectedModel}
            model={selectedModel}
            placeholder={!selectedModel ? "Select a model to start chatting..." : undefined}
          />
        </div>
      </div>

      {/* Inspector Panel */}
      {inspectorOpen && (
        <div className="w-80 border-l border-border-primary bg-surface-secondary">
          <InspectorPanel
            conversation={currentConversation}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            models={models}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
