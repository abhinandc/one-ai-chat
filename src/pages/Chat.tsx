import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationList } from "@/components/chat/ConversationList";
import { Thread } from "@/components/chat/Thread";
import { Composer } from "@/components/chat/Composer";
import { InspectorPanel } from "@/components/chat/InspectorPanel";
import { ModelSwitcher, type AIModel } from "@/components/ai-elements/model-switcher";
import { ExportConversationModal } from "@/components/modals/ExportConversationModal";
import { ShareConversationModal } from "@/components/modals/ShareConversationModal";
import { useChat } from "@/hooks/useChat";
import { useModels } from "@/services/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConversations } from "@/hooks/useConversations";
import { useConversationFolders } from "@/hooks/useConversationFolders";
import { conversationService } from "@/services/conversationService";
import { analyticsService } from "@/services/analyticsService";
import { useToast } from "@/hooks/use-toast";
import { chatLogger as logger } from "@/lib/logger";
import {
  PanelLeftClose,
  PanelLeft,
  Settings2,
  Brain,
  Sparkles,
  Zap,
  Bot,
  MessageSquare,
  Plus,
  Download,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationFolder, Message } from "@/types";

/**
 * Chat Page - Reimagined for Intuitive UX
 *
 * Design patterns from:
 * - assistant-ui (https://www.assistant-ui.com)
 * - Grok clone (minimalist, smooth animations, state-based transitions)
 * - hardUIrules.md specifications
 *
 * Key principles:
 * 1. Minimal visual noise with deliberate whitespace
 * 2. Smooth state transitions (AnimatePresence)
 * 3. Focus on conversation content
 * 4. Mobile-responsive layout
 */

const Chat = () => {
  const user = useCurrentUser();
  const { toast } = useToast();
  const { models, loading: modelsLoading } = useModels();
  const {
    conversations: supabaseConversations,
    loading: conversationsLoading,
    saveConversation,
    deleteConversation,
    updateConversation: updateSupabaseConversation,
  } = useConversations(user?.email);

  const {
    folders,
    loading: foldersLoading,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useConversationFolders(user?.email);

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    regenerateLastMessage,
    stopGeneration,
    isStreaming,
  } = useChat({
    model: selectedModel,
    systemPrompt,
    temperature,
    maxTokens,
    onMessage: (message) => {
      // Track API usage
      if (user?.email && message.role === "assistant") {
        analyticsService.recordAPICall(
          user.email,
          selectedModel,
          message.metadata?.tokens || 0,
          message.metadata?.cost || 0
        );

        analyticsService.trackEvent(
          user.email,
          "message_sent",
          "chat",
          currentConversation?.id || "new",
          { model: selectedModel, tokens: message.metadata?.tokens }
        );
      }
    },
  });

  // Initialize with first available model
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  // Convert API models to AI model format for ModelSwitcher (hardUIrules.md line 243)
  const aiModels: AIModel[] = useMemo(() => {
    return models.map((model) => {
      // Determine icon based on provider/model name
      let icon;
      const modelLower = model.id.toLowerCase();
      if (modelLower.includes("claude")) {
        icon = <Brain className="size-4 text-purple-500" />;
      } else if (modelLower.includes("gpt")) {
        icon = modelLower.includes("mini") ? <Zap className="size-4 text-green-400" /> : <Sparkles className="size-4 text-green-500" />;
      } else if (modelLower.includes("gemini")) {
        icon = <Bot className="size-4 text-blue-500" />;
      } else {
        icon = <Bot className="size-4" />;
      }

      return {
        value: model.id,
        name: model.id,
        description: `Provided by ${model.owned_by}`,
        provider: model.owned_by || "Unknown",
        icon,
      };
    });
  }, [models]);

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
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          metadata: msg.metadata,
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
          maxTokens,
        },
      });
    } catch (error) {
      logger.error("Failed to save conversation", error);
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
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        model: selectedModel,
        provider: "litellm",
        temperature,
        topP: 0.9,
        maxTokens,
        stopSequences: [],
        systemPrompt,
      },
    };

    setCurrentConversation(newConversation);
    clearMessages();

    if (user?.email) {
      analyticsService.trackEvent(user.email, "conversation_created", "chat", newConversation.id);
    }
  };

  const loadConversation = async (conversationId: string) => {
    const supabaseConv = supabaseConversations.find((c) => c.id === conversationId);
    if (!supabaseConv) return;

    const conversation: Conversation = {
      id: supabaseConv.id,
      title: supabaseConv.title,
      messages: supabaseConv.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as Message["role"],
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.metadata,
      })),
      folderId: supabaseConv.folder_id,
      pinned: supabaseConv.pinned,
      shared: supabaseConv.shared,
      unread: supabaseConv.unread,
      tags: supabaseConv.tags,
      createdAt: new Date(supabaseConv.created_at),
      updatedAt: new Date(supabaseConv.updated_at),
      settings: supabaseConv.settings,
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
      analyticsService.trackEvent(user.email, "conversation_loaded", "chat", conversationId);
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
        analyticsService.trackEvent(user.email, "conversation_deleted", "chat", conversationId);
      }
    } catch (error) {
      logger.error("Failed to delete conversation", error);
      toast({
        title: "Failed to delete conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a model to send messages",
        variant: "destructive",
      });
      return;
    }

    if (!currentConversation) {
      createNewConversation();
    }

    try {
      await sendMessage(content, attachments);

      // Update conversation title if it's the first message
      if (
        currentConversation &&
        currentConversation.title === "New Conversation" &&
        content.length > 0
      ) {
        const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        setCurrentConversation((prev) => (prev ? { ...prev, title: newTitle } : null));
      }
    } catch (error) {
      logger.error("Failed to send message", error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Folder management handlers
  const handleCreateFolder = async (name: string, color: string) => {
    const folder = await createFolder(name, color);
    if (folder) {
      toast({
        title: "Folder created",
        description: `Created folder "${name}"`,
      });
    }
  };

  const handleUpdateFolder = async (id: string, updates: Partial<ConversationFolder>) => {
    const success = await updateFolder(id, updates);
    if (!success) {
      toast({
        title: "Failed to update folder",
        description: "Could not update the folder",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const success = await deleteFolder(id);
    if (success) {
      toast({
        title: "Folder deleted",
        description: "The folder has been removed",
      });
    } else {
      toast({
        title: "Failed to delete folder",
        description: "Could not delete the folder",
        variant: "destructive",
      });
    }
  };

  // Conversation management handlers
  const handleMoveToFolder = async (conversationId: string, folderId: string | null) => {
    const conv = supabaseConversations.find((c) => c.id === conversationId);
    if (!conv || !user?.email) return;

    try {
      await saveConversation({
        ...conv,
        user_email: user.email,
        folder_id: folderId,
      });

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) =>
          prev ? { ...prev, folderId: folderId || undefined } : null
        );
      }

      toast({
        title: folderId ? "Moved to folder" : "Removed from folder",
        description: folderId
          ? "Conversation moved to folder"
          : "Conversation removed from folder",
      });
    } catch (error) {
      logger.error("Failed to move conversation", error);
      toast({
        title: "Failed to move conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleTogglePin = async (conversationId: string) => {
    const conv = supabaseConversations.find((c) => c.id === conversationId);
    if (!conv || !user?.email) return;

    try {
      await saveConversation({
        ...conv,
        user_email: user.email,
        pinned: !conv.pinned,
      });

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) => (prev ? { ...prev, pinned: !prev.pinned } : null));
      }

      toast({
        title: conv.pinned ? "Unpinned" : "Pinned",
        description: conv.pinned ? "Conversation unpinned" : "Conversation pinned",
      });
    } catch (error) {
      logger.error("Failed to toggle pin", error);
      toast({
        title: "Failed to update conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = async (conversationId: string, tag: string) => {
    const conv = supabaseConversations.find((c) => c.id === conversationId);
    if (!conv || !user?.email) return;

    const newTags = [...new Set([...conv.tags, tag])];

    try {
      await saveConversation({
        ...conv,
        user_email: user.email,
        tags: newTags,
      });

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) => (prev ? { ...prev, tags: newTags } : null));
      }

      toast({
        title: "Tag added",
        description: `Added tag "${tag}"`,
      });
    } catch (error) {
      logger.error("Failed to add tag", error);
      toast({
        title: "Failed to add tag",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTag = async (conversationId: string, tag: string) => {
    const conv = supabaseConversations.find((c) => c.id === conversationId);
    if (!conv || !user?.email) return;

    const newTags = conv.tags.filter((t) => t !== tag);

    try {
      await saveConversation({
        ...conv,
        user_email: user.email,
        tags: newTags,
      });

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) => (prev ? { ...prev, tags: newTags } : null));
      }

      toast({
        title: "Tag removed",
        description: `Removed tag "${tag}"`,
      });
    } catch (error) {
      logger.error("Failed to remove tag", error);
      toast({
        title: "Failed to remove tag",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    const conv = supabaseConversations.find((c) => c.id === conversationId);
    if (!conv || !user?.email) return;

    try {
      await saveConversation({
        ...conv,
        user_email: user.email,
        title: newTitle,
      });

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) => (prev ? { ...prev, title: newTitle } : null));
      }

      toast({
        title: "Conversation renamed",
        description: `Renamed to "${newTitle}"`,
      });
    } catch (error) {
      logger.error("Failed to rename conversation", error);
      toast({
        title: "Failed to rename conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Convert Supabase conversations to UI format
  const uiConversations: Conversation[] = useMemo(() => {
    return supabaseConversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as Message["role"],
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.metadata,
      })),
      folderId: conv.folder_id,
      pinned: conv.pinned,
      shared: conv.shared,
      unread: conv.unread,
      tags: conv.tags,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      settings: conv.settings,
    }));
  }, [supabaseConversations]);

  // Initialize with new conversation if none exists
  useEffect(() => {
    if (!currentConversation && !conversationsLoading) {
      createNewConversation();
    }
  }, [conversationsLoading]);

  // Elegant loading state with skeleton UI - NO spinners per Constitution
  if (conversationsLoading || modelsLoading || foldersLoading) {
    return (
      <div className="h-full flex bg-background">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-80 border-r border-border bg-muted/30 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
        {/* Main area skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="size-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40 mx-auto rounded" />
                  <Skeleton className="h-4 w-28 mx-auto rounded" />
                </div>
              </motion.div>
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to use the chat feature</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex bg-background" data-testid="chat-container">
      {/* Conversation Sidebar - Animated collapsible */}
      <AnimatePresence mode="wait">
        {showConversations && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="border-r border-border bg-card/50 overflow-hidden shrink-0"
          >
            <div className="w-80 h-full">
              <ConversationList
                conversations={uiConversations}
                folders={folders}
                currentConversationId={currentConversation?.id}
                onSelectConversation={loadConversation}
                onDeleteConversation={handleDeleteConversation}
                onCreateNew={createNewConversation}
                onCreateFolder={handleCreateFolder}
                onUpdateFolder={handleUpdateFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveToFolder={handleMoveToFolder}
                onTogglePin={handleTogglePin}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onRenameConversation={handleRenameConversation}
                loading={conversationsLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area - Clean, focused layout */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Streamlined Header */}
        <motion.header
          layout
          className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Toggle sidebar button */}
            <Button
              onClick={() => setShowConversations(!showConversations)}
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              data-testid="button-toggle-conversations"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={showConversations ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {showConversations ? (
                    <PanelLeftClose className="size-5" />
                  ) : (
                    <PanelLeft className="size-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>

            {/* New chat button - visible when sidebar hidden */}
            {!showConversations && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={createNewConversation}
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Plus className="size-5" />
                </Button>
              </motion.div>
            )}

            {/* Conversation title with subtle animation */}
            <motion.h1
              key={currentConversation?.title || "new"}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-medium text-foreground truncate"
            >
              {currentConversation?.title || "New Conversation"}
            </motion.h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Export button - only show when conversation has messages */}
            {currentConversation && messages.length > 0 && (
              <Button
                onClick={() => setExportModalOpen(true)}
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Export conversation"
              >
                <Download className="size-5" />
              </Button>
            )}

            {/* Share button - only show when conversation has messages */}
            {currentConversation && messages.length > 0 && (
              <Button
                onClick={() => setShareModalOpen(true)}
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Share conversation"
              >
                <Share2 className="size-5" />
              </Button>
            )}

            {/* AI Model Switcher - hardUIrules.md line 243 */}
            <ModelSwitcher
              models={aiModels}
              value={selectedModel}
              onValueChange={setSelectedModel}
              className="data-testid-model-selector"
            />

            {/* Settings toggle with state indicator */}
            <Button
              onClick={() => setInspectorOpen(!inspectorOpen)}
              variant="ghost"
              size="icon"
              className={cn(
                "size-9 text-muted-foreground hover:text-foreground transition-colors",
                inspectorOpen && "bg-primary/10 text-primary"
              )}
              data-testid="button-toggle-inspector"
            >
              <Settings2 className="size-5" />
            </Button>
          </div>
        </motion.header>

        {/* Messages Thread - Main content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Thread
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onRegenerateMessage={regenerateLastMessage}
            onStopGeneration={stopGeneration}
          />
        </div>

        {/* Message Composer - Clean, floating style */}
        <div className="p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-3xl mx-auto">
            <Composer
              onSendMessage={handleSendMessage}
              disabled={isLoading || !selectedModel}
              model={selectedModel}
              placeholder={!selectedModel ? "Select a model to start chatting..." : undefined}
            />
          </div>
        </div>
      </div>

      {/* Inspector Panel - Animated */}
      <AnimatePresence mode="wait">
        {inspectorOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="border-l border-border bg-card/50 overflow-hidden shrink-0"
          >
            <div className="w-80 h-full">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Export Modal */}
    {currentConversation && user?.email && (
      <ExportConversationModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        conversationId={currentConversation.id}
        conversationTitle={currentConversation.title}
        userEmail={user.email}
      />
    )}

    {/* Share Modal */}
    {currentConversation && user?.email && (
      <ShareConversationModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        conversationId={currentConversation.id}
        conversationTitle={currentConversation.title}
        userEmail={user.email}
      />
    )}
    </>
  );
};

export default Chat;
