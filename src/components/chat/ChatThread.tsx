import { useEffect, useRef, memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { Shimmer } from "@/components/ai-elements/shimmer";
import type { Message } from "@/types";

interface ChatThreadProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingMessage?: string;
  onSuggestionClick?: (suggestion: string) => void;
  chatMode?: "thinking" | "fast" | "coding";
  isThinking?: boolean; // True when AI is outputting <thinking> block
  thinkingContent?: string; // Content inside thinking block
}

export const ChatThread = memo(function ChatThread({
  messages,
  isStreaming,
  streamingMessage,
  onSuggestionClick,
  chatMode = "fast",
  isThinking = false,
  thinkingContent = ""
}: ChatThreadProps) {
  // Detect if we're in deep thinking mode
  const isDeepThinking = chatMode === "thinking" && isStreaming;
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

  // Stable message keys to prevent re-renders - use stable IDs only
  const renderedMessages = useMemo(() => {
    return messages.map((message) => (
      <ChatMessage
        key={message.id}
        message={message}
        isStreaming={false}
      />
    ));
  }, [messages]);

  if (messages.length === 0 && !isStreaming) {
    return <EmptyState onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="pb-32">
        {renderedMessages}

        {/* Streaming/Loading state - shimmer display */}
        {isStreaming && !streamingMessage && (
          <div className="w-full py-4">
            <div className="mx-auto max-w-3xl px-4">
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isThinking || chatMode === "thinking"
                  ? "bg-gradient-to-br from-primary/8 to-primary/3 border-primary/20"
                  : "bg-muted/20 border-border/40"
              }`}>
                {/* Small animated orb */}
                <div className="relative w-5 h-5 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
                  <div className="absolute inset-1 rounded-full bg-primary/60 animate-orb-pulse" />
                </div>

                {/* Shimmer text */}
                <span className="text-sm font-medium text-foreground">
                  <Shimmer duration={1.5} spread={2}>
                    {isThinking ? "Deep thinking..." : chatMode === "coding" ? "Writing code..." : "Thinking..."}
                  </Shimmer>
                </span>
              </div>

              {/* Show live thinking content if available */}
              {isThinking && thinkingContent && (
                <div className="mt-3 mx-1 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed max-h-32 overflow-y-auto">
                    {thinkingContent.slice(0, 500)}
                    {thinkingContent.length > 500 && "..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Streaming message - shows as content arrives */}
        {isStreaming && streamingMessage && (
          <ChatMessage
            message={{
              id: "streaming-msg",
              role: "assistant",
              content: streamingMessage,
              timestamp: new Date(),
            }}
            isStreaming
            isDeepThinking={chatMode === "thinking"}
          />
        )}
        
        <div ref={scrollRef} className="h-1" />
      </div>
    </ScrollArea>
  );
});

const SUGGESTIONS = [
  "Explain how AI models work",
  "Write a Python sorting function",
  "Help me with machine learning",
  "Best practices for prompts",
  "Create a REST API endpoint",
  "Write a React component",
];

interface EmptyStateProps {
  onSuggestionClick?: (suggestion: string) => void;
}

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  const handleClick = (suggestion: string) => {
    onSuggestionClick?.(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto"
    >
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated gradient orb with pulse rings */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="relative h-24 w-24">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-orb-ring" />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-orb-ring" style={{ animationDelay: '0.7s' }} />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-orb-ring" style={{ animationDelay: '1.4s' }} />

            {/* Gradient layers */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-orb-pulse" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/30 to-primary/15" />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 animate-orb-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-semibold text-foreground">
            How can I help you today?
          </h1>
          <p className="text-muted-foreground">
            Ask me anything — I&apos;m here to assist
          </p>
        </motion.div>
      </div>

      {/* Suggestion cards - scrolling marquee */}
      <div className="w-full mt-8 overflow-hidden">
        <div
          className="flex gap-4 animate-marquee-left hover:[animation-play-state:paused]"
          style={{
            width: 'max-content',
            '--marquee-duration': '25s',
            '--marquee-gap': '1rem'
          } as React.CSSProperties}
        >
          {/* Duplicate for seamless loop */}
          {[...SUGGESTIONS, ...SUGGESTIONS].map((suggestion, idx) => (
            <button
              key={`${suggestion}-${idx}`}
              onClick={() => handleClick(suggestion)}
              className="group flex-shrink-0 px-8 py-5 rounded-2xl bg-card border border-border/60 hover:bg-muted/80 hover:border-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
