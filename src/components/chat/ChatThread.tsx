import { useEffect, useRef, memo, useMemo, useCallback } from "react";
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
  const prevLengthRef = useRef(0);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((instant = false) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ 
        behavior: instant ? "instant" : "smooth", 
        block: "end" 
      });
    });
  }, []);

  // Scroll on new messages
  useEffect(() => {
    const isNewMessage = messages.length > prevLengthRef.current;
    const isInitialLoad = prevLengthRef.current === 0 && messages.length > 0;
    prevLengthRef.current = messages.length;
    
    if (isInitialLoad) {
      scrollToBottom(true); // Instant on initial load
    } else if (isNewMessage) {
      scrollToBottom(false); // Smooth for new messages
    }
  }, [messages.length, scrollToBottom]);

  // Scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom(false);
    }
  }, [isStreaming, streamingMessage, scrollToBottom]);

  // Stable message keys to prevent re-renders
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <ChatMessage
        key={message.id || `msg-${index}-${message.role}`}
        message={message}
        isStreaming={false}
      />
    ));
  }, [messages]);

  if (messages.length === 0 && !isStreaming) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="pb-32">
        {renderedMessages}
        
        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <ChatMessage
            message={{
              id: "streaming-msg",
              role: "assistant",
              content: streamingMessage,
              timestamp: new Date(),
            }}
            isStreaming
          />
        )}
        
        {/* Loading indicator when waiting for response */}
        {isStreaming && !streamingMessage && (
          <div className="w-full py-4">
            <div className="mx-auto max-w-3xl px-4">
              <ThinkingLine text="AI is thinking" />
            </div>
          </div>
        )}
        
        <div ref={scrollRef} className="h-1" />
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
      <div className="max-w-2xl w-full text-center space-y-8">
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
            Ask me anything — I&apos;m here to assist
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="group text-left p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]"
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
