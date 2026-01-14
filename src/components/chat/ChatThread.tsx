import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/types";

interface ChatThreadProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingMessage?: string;
}

export function ChatThread({ messages, isStreaming, streamingMessage }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  if (messages.length === 0 && !isStreaming) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="pb-32">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <ChatMessage
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingMessage,
              timestamp: new Date(),
            }}
            isStreaming
          />
        )}
        
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}

function EmptyState() {
  const suggestions = [
    "Explain how AI models work",
    "Write a Python function to sort a list",
    "Help me understand machine learning",
    "What are the best practices for prompts?",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            How can I help you today?
          </h1>
          <p className="text-muted-foreground">
            Start a conversation or try one of these suggestions
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="group text-left p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
