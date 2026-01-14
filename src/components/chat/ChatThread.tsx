import { useEffect, useRef, memo, useMemo, useLayoutEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ThinkingLine } from "@/components/ui/shimmer-text";
import type { Message } from "@/types";

interface ChatThreadProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingMessage?: string;
}

export const ChatThread = memo(function ChatThread({ 
  messages, 
  isStreaming, 
  streamingMessage 
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const isInitialMount = useRef(true);

  // Smooth scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  // Scroll on new messages (not on initial load to prevent jump)
  useLayoutEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    
    if (isNewMessage) {
      // Use RAF to ensure DOM is painted before scrolling
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    }
  }, [messages.length]);

  // Scroll when streaming updates
  useEffect(() => {
    if (isStreaming && streamingMessage) {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    }
  }, [isStreaming, streamingMessage]);

  // Initial scroll to bottom (instant, no animation)
  useEffect(() => {
    if (messages.length > 0 && isInitialMount.current) {
      isInitialMount.current = false;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
      });
    }
  }, [messages.length]);

  // Memoize rendered messages to prevent re-renders
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <div 
        key={message.id || `msg-${index}`}
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both"
        style={{ animationDelay: `${Math.min(index * 20, 100)}ms` }}
      >
        <ChatMessage
          message={message}
          isStreaming={false}
        />
      </div>
    ));
  }, [messages]);

  if (messages.length === 0 && !isStreaming) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="flex-1" ref={containerRef}>
      <div className="pb-32">
        {renderedMessages}
        
        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <div className="animate-in fade-in-0 duration-200">
            <ChatMessage
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingMessage,
                timestamp: new Date(),
              }}
              isStreaming
            />
          </div>
        )}
        
        {/* Loading indicator when waiting for response */}
        {isStreaming && !streamingMessage && (
          <div className="w-full py-4 animate-in fade-in-0 duration-200">
            <div className="mx-auto max-w-3xl px-4">
              <ThinkingLine text="AI is thinking" />
            </div>
          </div>
        )}
        
        <div ref={scrollRef} className="h-px" />
      </div>
    </ScrollArea>
  );
});

function EmptyState() {
  const suggestions = [
    "Explain how AI models work",
    "Write a Python function to sort a list",
    "Help me understand machine learning",
    "What are the best practices for prompts?",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in-0 duration-500">
        {/* Animated gradient orb */}
        <div className="flex justify-center">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 animate-pulse" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/40 to-primary/20" />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            How can I help you today?
          </h1>
          <p className="text-muted-foreground">
            Ask me anything — I'm here to assist
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="group text-left p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
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
