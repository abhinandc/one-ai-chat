import { useEffect, useRef, memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { AITextLoading } from "@/components/ui/ai-text-loading";
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
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingMessage]);

  // Memoize rendered messages to prevent flickering
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
              id: "streaming",
              role: "assistant",
              content: streamingMessage,
              timestamp: new Date(),
            }}
            isStreaming
          />
        )}
        
        {/* Loading indicator when waiting for response */}
        {isStreaming && !streamingMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-4"
          >
            <div className="mx-auto max-w-3xl px-4">
              <ThinkingLine text="AI is thinking" />
            </div>
          </motion.div>
        )}
        
        <div ref={endRef} />
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Animated gradient orb */}
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="relative h-24 w-24">
            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Middle layer */}
            <motion.div
              className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/40 to-primary/20"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
            
            {/* Core */}
            <motion.div
              className="absolute inset-6 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30"
              animate={{
                scale: [0.95, 1.05, 0.95]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h1 className="text-2xl font-semibold text-foreground">
            How can I help you today?
          </h1>
          <p className="text-muted-foreground">
            Ask me anything — I'm here to assist
          </p>
        </motion.div>

        {/* Suggestion chips */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group text-left p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200"
            >
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {suggestion}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
