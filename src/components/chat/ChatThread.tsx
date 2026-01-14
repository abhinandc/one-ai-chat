import { useEffect, useRef } from "react";
import { motion } from "motion/react";
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
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.05,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            <ChatMessage message={message} />
          </motion.div>
        ))}
        
        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChatMessage
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingMessage,
                timestamp: new Date(),
              }}
              isStreaming
            />
          </motion.div>
        )}
        
        {/* Loading indicator when waiting for response */}
        {isStreaming && !streamingMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-8 py-6"
          >
            <div className="flex gap-1.5">
              <motion.div 
                className="w-2 h-2 rounded-full bg-primary/60"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-primary/60"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-primary/60"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </motion.div>
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
          <div className="relative h-20 w-20">
            <motion.div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center backdrop-blur-sm">
              <motion.div 
                className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </div>
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
            What's on your mind?
          </h1>
          <p className="text-muted-foreground">
            Start a conversation or try one of these suggestions
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