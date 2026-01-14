import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConversationList } from "@/components/chat/ConversationList";
import { Thread } from "@/components/chat/Thread";
import { Composer } from "@/components/chat/Composer";
import { InspectorPanel, type ContextFile, type ContextLink } from "@/components/chat/InspectorPanel";
import { useChat } from "@/hooks/useChat";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConversations } from "@/hooks/useConversations";
import { analyticsService } from "@/services/analyticsService";
import { useToast } from "@/hooks/use-toast";
import { PanelLeftClose, PanelLeft, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/types";

const Chat = () => {
  const user = useCurrentUser();
  const { toast } = useToast();
  const { models, loading: modelsLoading } = useModels(user?.email);
  const { conversations: supabaseConversations, loading: conversationsLoading, saveConversation, deleteConversation } = useConversations(user?.email);
  
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [contextLinks, setContextLinks] = useState<ContextLink[]>([]);

  // Build RAG context prompt from attached files and links
  const buildContextPrompt = useMemo(() => {
    if (contextFiles.length === 0 && contextLinks.length === 0) {
      return systemPrompt;
    }

    let contextPrompt = systemPrompt || "You are a helpful AI assistant.";

    if (contextFiles.length > 0 || contextLinks.length > 0) {
      contextPrompt += "\n\n--- CONTEXT ---\nThe user has provided the following context documents. Use this information to answer their questions:\n";

      contextFiles.forEach((file, index) => {
        contextPrompt += `\n### Document ${index + 1}: ${file.name}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      });

      contextLinks.forEach((link) => {
        contextPrompt += `\n### Reference Link: ${link.title}\nURL: ${link.url}\n`;
      });

      contextPrompt += "\n--- END CONTEXT ---\n\nPlease use the above context to help answer the user's questions. If the context is relevant, cite it in your response.";
    }

    return contextPrompt;
  }, [systemPrompt, contextFiles, contextLinks]);

  const handleContextChange = (files: ContextFile[], links: ContextLink[]) => {
    setContextFiles(files);
    setContextLinks(links);
  };
  
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    stopStreaming,
    isStreaming,
    streamingMessage
  } = useChat({
    model: selectedModel,
    systemPrompt: buildContextPrompt,
    temperature,
    maxTokens,
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
        messages: messages.map((msg, index) => ({
          id: `msg_${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString(),
          metadata: {}
        })),
        folder_id: currentConversation.folderId,
        pinned: currentConversation.pinned,
        shared: currentConversation.shared,
        unread: currentConversation.unread,
        tags: currentConversation.tags,
        settings: {
          model: selectedModel,
          provider: 'litellm' as const,
          temperature,
          topP: 0.9,
          maxTokens,
          stopSequences: [],
          systemPrompt
        }
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const createNewConversation = () => {
    const now = new Date();
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: "New Conversation",
      messages: [],
      pinned: false,
      shared: false,
      unread: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      settings: {
        model: selectedModel,
        provider: 'litellm',
        temperature,
        topP: 0.9,
        maxTokens,
        stopSequences: [],
        systemPrompt
      }
    };
    
    setCurrentConversation(newConversation);
    clearMessages();
    
    if (user?.email) {
      analyticsService.trackEvent({
        user_email: user.email,
        action: 'conversation_created',
        resource_type: 'chat',
        resource_id: newConversation.id,
        metadata: {}
      });
    }
  };

  const loadConversation = async (conversationId: string) => {
    const supabaseConv = supabaseConversations.find(c => c.id === conversationId);
    if (!supabaseConv) return;

    const conversation: Conversation = {
      id: supabaseConv.id,
      title: supabaseConv.title,
      messages: supabaseConv.messages.map((msg: any, index: number) => ({
        id: msg.id || `msg_${index}`,
        role: msg.role as Message['role'],
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
        metadata: msg.metadata
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
        provider: 'litellm' as const,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        stopSequences: []
      }
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
      analyticsService.trackEvent({
        user_email: user.email,
        action: 'conversation_loaded',
        resource_type: 'chat',
        resource_id: conversationId,
        metadata: {}
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
        description: "The conversation has been removed"
      });

      if (user?.email) {
        analyticsService.trackEvent({
          user_email: user.email,
          action: 'conversation_deleted',
          resource_type: 'chat',
          resource_id: conversationId,
          metadata: {}
        });
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

  const handleSendMessage = async (content: string) => {
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
      await sendMessage(content);
      
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
    return supabaseConversations.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      messages: (conv.messages || []).map((msg: any, index: number) => ({
        id: msg.id || `msg_${index}`,
        role: msg.role as Message['role'],
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
        metadata: msg.metadata
      })),
      folderId: conv.folder_id,
      pinned: conv.pinned,
      shared: conv.shared,
      unread: conv.unread,
      tags: conv.tags,
      createdAt: new Date(conv.created_at || Date.now()),
      updatedAt: new Date(conv.updated_at),
      settings: conv.settings || {
        model: '',
        provider: 'litellm' as const,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        stopSequences: []
      }
    }));
  }, [supabaseConversations]);

  // Convert ChatMessage[] to Message[] for Thread component
  const threadMessages: Message[] = useMemo(() => {
    return messages.map((msg, index) => ({
      id: `msg_${index}`,
      role: msg.role as Message['role'],
      content: msg.content,
      timestamp: new Date(),
      metadata: {}
    }));
  }, [messages]);

  // Initialize with new conversation if none exists
  useEffect(() => {
    if (!currentConversation && !conversationsLoading) {
      createNewConversation();
    }
  }, [conversationsLoading]);

  if (conversationsLoading || modelsLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Authentication Required</h2>
          <p className="text-text-secondary">Please log in to use the chat feature</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-background overflow-hidden">
      {/* Conversation Sidebar - Collapsible */}
      <div 
        className={cn(
          "border-r border-border-primary bg-surface-graphite transition-all duration-300 ease-in-out overflow-hidden",
          showConversations ? "w-80" : "w-0"
        )}
      >
        <div className="w-80 h-full">
          <ConversationList
            conversations={uiConversations}
            folders={[]}
            activeId={currentConversation?.id}
            onSelectConversation={loadConversation}
            onNewConversation={createNewConversation}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-md border-b border-border-primary bg-background">
          <div className="flex items-center gap-md">
            <Button
              onClick={() => setShowConversations(!showConversations)}
              variant="ghost"
              size="icon"
              className="text-text-secondary"
              data-testid="button-toggle-conversations"
            >
              {showConversations ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold text-text-primary">
              {currentConversation?.title || "New Conversation"}
            </h1>
          </div>

          <div className="flex items-center gap-sm">
            {/* Modern Apple-style Model Selector */}
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={modelsLoading}
            >
              <SelectTrigger 
                className="w-[200px] bg-surface-graphite/50 backdrop-blur-sm border-border-primary/50 rounded-xl text-text-primary text-sm font-medium shadow-sm"
                data-testid="select-model"
              >
                <SelectValue placeholder="Select Model..." />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-border-primary/30 rounded-xl shadow-lg">
                {models.map((model) => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    className="text-text-primary rounded-lg cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{model.id}</span>
                      <span className="text-xs text-text-tertiary">{model.owned_by}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setInspectorOpen(!inspectorOpen)}
              variant="ghost"
              size="icon"
              className={cn(
                "text-text-secondary",
                inspectorOpen && "bg-accent-blue/10 text-accent-blue"
              )}
              data-testid="button-toggle-inspector"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 min-h-0">
          <Thread
            messages={threadMessages}
            isStreaming={isStreaming}
            streamingMessage={streamingMessage}
          />
        </div>

        {/* Message Composer */}
        <div className="border-t border-border-primary bg-background">
          <Composer
            conversation={currentConversation || undefined}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={stopStreaming}
            availableModels={models}
          />
        </div>
      </div>

      {/* Inspector Panel - RAG Context */}
      {inspectorOpen && (
        <div className="w-80 shrink-0 border-l border-border-primary bg-background">
          <InspectorPanel onContextChange={handleContextChange} />
        </div>
      )}
    </div>
  );
};

export default Chat;
