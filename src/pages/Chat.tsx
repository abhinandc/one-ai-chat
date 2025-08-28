import { useState, useEffect, useRef } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/components/chat/ConversationList";
import { Thread } from "@/components/chat/Thread";
import { Composer } from "@/components/chat/Composer";
import { Inspector } from "@/components/chat/Inspector";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationFolder, Message, Citation } from "@/types";

// Mock data
const mockFolders: ConversationFolder[] = [
  {
    id: "1",
    name: "Work Projects",
    color: "bg-accent-blue",
    conversationIds: ["1", "2"],
    createdAt: new Date(),
  },
  {
    id: "2", 
    name: "Personal",
    color: "bg-accent-green",
    conversationIds: ["3"],
    createdAt: new Date(),
  },
];

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Project Planning Discussion",
    messages: [
      {
        id: "1",
        role: "user",
        content: "Can you help me plan a new mobile app project?",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: "2",
        role: "assistant",
        content: "I'd be happy to help you plan your mobile app project! Let's start by discussing the core features and target audience. What type of app are you building?",
        timestamp: new Date(Date.now() - 3550000),
        metadata: {
          model: "gpt-4",
          provider: "litellm",
          tokens: 45,
        },
      },
    ],
    folderId: "1",
    pinned: false,
    shared: false,
    unread: false,
    tags: ["planning", "mobile"],
    settings: {
      model: "gpt-4",
      provider: "litellm",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
      stopSequences: [],
      systemPrompt: "You are a helpful project planning assistant.",
      tools: ["web_search"],
    },
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3550000),
  },
  {
    id: "2",
    title: "Code Review Help",
    messages: [
      {
        id: "3",
        role: "user",
        content: "Can you review this React component?\n\n```jsx\nfunction UserCard({ user }) {\n  return (\n    <div className=\"card\">\n      <h3>{user.name}</h3>\n      <p>{user.email}</p>\n    </div>\n  );\n}\n```",
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
    folderId: "1",
    pinned: true,
    shared: false,
    unread: true,
    tags: ["code", "react"],
    settings: {
      model: "claude-3",
      provider: "openwebui",
      temperature: 0.3,
      topP: 0.8,
      maxTokens: 1024,
      stopSequences: [],
      tools: ["code_interpreter"],
    },
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 1800000),
  },
  {
    id: "3",
    title: "Workout Planning",
    messages: [
      {
        id: "4",
        role: "user",
        content: "Create a weekly workout plan for me",
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        id: "5",
        role: "assistant",
        content: "I'll create a balanced weekly workout plan for you. Could you tell me about your current fitness level and any specific goals?",
        timestamp: new Date(Date.now() - 86350000),
        metadata: {
          model: "gpt-3.5-turbo",
          tokens: 32,
        },
      },
    ],
    folderId: "2",
    pinned: false,
    shared: true,
    unread: false,
    tags: ["fitness", "health"],
    settings: {
      model: "gpt-3.5-turbo",
      provider: "litellm",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1500,
      stopSequences: [],
    },
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86350000),
  },
];

const mockCitations: Citation[] = [
  {
    id: "1",
    source: "React Documentation",
    title: "React Component Best Practices",
    url: "https://react.dev/learn/thinking-in-react",
    snippet: "Components should be pure functions that only depend on their props and state...",
    relevance: 0.95,
  },
  {
    id: "2",
    source: "MDN Web Docs",
    title: "JavaScript Best Practices",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    snippet: "Use const and let instead of var for better scoping...",
    relevance: 0.82,
  },
];

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [folders] = useState<ConversationFolder[]>(mockFolders);
  const [activeConversationId, setActiveConversationId] = useState<string>("1");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [provider, setProvider] = useState<"litellm" | "openwebui">("litellm");
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      pinned: false,
      shared: false,
      unread: false,
      tags: [],
      settings: {
        model: "gpt-4",
        provider,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 2048,
        stopSequences: [],
        tools: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  };

  const sendMessage = async (content: string, settings?: any) => {
    if (!activeConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    // Update conversation with user message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? {
            ...conv,
            messages: [...conv.messages, userMessage],
            settings: settings ? { ...conv.settings, ...settings } : conv.settings,
            title: conv.messages.length === 0 ? content.slice(0, 50) + "..." : conv.title,
            updatedAt: new Date(),
          }
        : conv
    ));

    setIsStreaming(true);
    setStreamingMessage("");

    try {
      // For now, we'll use mock responses since we don't have a backend
      // Replace this with actual API calls to your backend
      const mockResponse = provider === "litellm" 
        ? "I'm a mock LiteLLM response. This would connect to your actual LiteLLM backend and stream real AI responses."
        : "I'm a mock OpenWebUI response. This would connect to your actual OpenWebUI backend and stream real AI responses.";

      // Simulate streaming
      let assistantMessage = "";
      const words = mockResponse.split(" ");
      
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        assistantMessage += (i > 0 ? " " : "") + words[i];
        setStreamingMessage(assistantMessage);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add final assistant message
      const finalMessage: Message = {
        id: Date.now().toString(),
        role: "assistant", 
        content: assistantMessage || streamingMessage,
        timestamp: new Date(),
        metadata: {
          model: activeConversation.settings.model,
          provider,
          tokens: Math.ceil((assistantMessage || streamingMessage).length / 4),
        },
      };

      setConversations(prev => prev.map(conv =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage, finalMessage],
              updatedAt: new Date(),
            }
          : conv
      ));

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Chat error:", error);
        // Show error message
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
      abortControllerRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingMessage("");
  };

  const updateConversationSettings = (settings: any) => {
    if (!activeConversation) return;

    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, settings: { ...conv.settings, ...settings } }
        : conv
    ));
  };

  return (
    <div className="h-full flex bg-background">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          folders={folders}
          activeId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={createNewConversation}
        />
      </div>

      {/* Center - Chat Thread */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border-primary/50 p-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {activeConversation?.title || "Select a conversation"}
              </h1>
              {activeConversation && (
                <p className="text-sm text-text-secondary">
                  {activeConversation.settings.model} • {activeConversation.messages.length} messages
                </p>
              )}
            </div>

            {/* Provider Toggle */}
            <div className="flex items-center gap-md">
              <span className="text-sm text-text-secondary">Backend:</span>
              <Button
                variant="ghost"
                onClick={() => setProvider(provider === "litellm" ? "openwebui" : "litellm")}
                className={cn(
                  "flex items-center gap-sm px-md py-sm rounded-lg transition-colors",
                  provider === "litellm" 
                    ? "bg-accent-blue/10 text-accent-blue" 
                    : "bg-accent-green/10 text-accent-green"
                )}
              >
                {provider === "litellm" ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                <span className="font-medium">{provider === "litellm" ? "LiteLLM" : "OpenWebUI"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Thread */}
        {activeConversation ? (
          <>
            <Thread
              messages={activeConversation.messages}
              isStreaming={isStreaming}
              streamingMessage={streamingMessage}
            />
            <Composer
              conversation={activeConversation}
              onSendMessage={sendMessage}
              isStreaming={isStreaming}
              onStopStreaming={stopStreaming}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-lg">💬</div>
              <h2 className="text-xl font-semibold text-text-primary mb-md">Welcome to Chat</h2>
              <p className="text-text-secondary mb-lg">Select a conversation or start a new one</p>
              <Button onClick={createNewConversation}>
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Inspector */}
      <Inspector
        conversation={activeConversation}
        citations={mockCitations}
        onUpdateSettings={updateConversationSettings}
      />
    </div>
  );
}