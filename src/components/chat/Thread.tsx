import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, RotateCcw, Square, Trash2, MoreVertical, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Reasoning component for AI thinking mode - hardUIrules.md line 241
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { cn } from "@/lib/utils";
import type { Message, ToolRun } from "@/types";

/**
 * Thread Component - Reimagined Message Display
 *
 * Design patterns from:
 * - assistant-ui (ChatGPT-style UX)
 * - Grok clone (minimal visual noise, deliberate whitespace)
 * - hardUIrules.md specifications
 *
 * Key improvements:
 * 1. Cleaner message bubbles with better spacing
 * 2. Smooth entry animations for new messages
 * 3. Better visual hierarchy between user/assistant
 * 4. Intuitive empty state with onboarding
 */

interface ThreadProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingMessage?: string;
  onRegenerateMessage?: () => void;
  onStopGeneration?: () => void;
  onDeleteMessage?: (messageId: string) => void;
}

// Animation variants for smooth message entry
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

export function Thread({
  messages,
  isLoading,
  isStreaming,
  streamingMessage,
  onRegenerateMessage,
  onStopGeneration,
  onDeleteMessage,
}: ThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages with smooth behavior
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, streamingMessage]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto scroll-smooth"
      data-testid="chat-thread"
    >
      {/* Message container with centered max-width for readability */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <MessageItem
                message={message}
                onDelete={onDeleteMessage}
                isLast={index === messages.length - 1}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming message with animation */}
        <AnimatePresence>
          {isStreaming && streamingMessage && (
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <MessageItem
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
        </AnimatePresence>

        {/* Loading indicator with Reasoning component - hardUIrules.md line 241 */}
        <AnimatePresence>
          {isLoading && !streamingMessage && (
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex gap-4"
            >
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <Card className="flex-1 p-4 bg-muted/50 border-border/50">
                <Reasoning isStreaming={true} defaultOpen={true}>
                  <ReasoningTrigger />
                  <ReasoningContent>
                    Processing your request...
                  </ReasoningContent>
                </Reasoning>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state - Intuitive onboarding */}
        {messages.length === 0 && !isLoading && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center justify-center min-h-[50vh] py-12 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
            >
              <Bot className="size-8 text-primary" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              How can I help you today?
            </h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Ask me anything - from answering questions and explaining concepts
              to writing code and creative content.
            </p>

            {/* Quick start suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["Explain a concept", "Write code", "Brainstorm ideas", "Analyze data"].map((suggestion, i) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.3 + i * 0.1 }}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-full transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action buttons when streaming */}
        <AnimatePresence>
          {isStreaming && onStopGeneration && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center pt-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onStopGeneration}
                className="gap-2 shadow-sm"
              >
                <Square className="size-3" />
                Stop generating
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Regenerate button after last assistant message */}
        {!isLoading && !isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && onRegenerateMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center pt-2"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerateMessage}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Regenerate response
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onDelete?: (messageId: string) => void;
  isLast?: boolean;
}

function MessageItem({ message, isStreaming, onDelete, isLast }: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // System messages - minimal inline display
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("group flex gap-4", isUser && "flex-row-reverse")}>
      {/* Avatar - Clean circular design */}
      <div
        className={cn(
          "size-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 min-w-0 space-y-1", isUser && "flex flex-col items-end")}>
        {/* Message bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3 max-w-full",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/50 text-foreground rounded-tl-sm border border-border/50"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer content={message.content} />
            </div>
          )}

          {/* Tool Runs - Cleaner chips */}
          {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-2">
              {message.metadata.toolCalls.map((toolRun) => (
                <ToolRunChip key={toolRun.id} toolRun={toolRun} />
              ))}
            </div>
          )}

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 rounded-full" />
          )}
        </div>

        {/* Message metadata - Subtle footer */}
        <div
          className={cn(
            "flex items-center gap-2 px-1 text-[11px] text-muted-foreground/70",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span>
            {message.timestamp
              ? message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
          </span>

          {message.metadata?.model && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="font-medium">{message.metadata.model}</span>
            </>
          )}

          {message.metadata?.tokens && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span>{message.metadata.tokens} tokens</span>
            </>
          )}

          {/* Action buttons - Appear on hover */}
          <div className={cn(
            "flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser && "flex-row-reverse mr-1 ml-0"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="size-6 p-0 hover:bg-muted"
              title="Copy message"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={copied ? "check" : "copy"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {copied ? (
                    <Check className="size-3 text-green-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>

            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 hover:bg-muted"
                  >
                    <MoreVertical className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isUser ? "end" : "start"} className="w-40">
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolRunChip({ toolRun }: { toolRun: ToolRun }) {
  const getStatusStyles = () => {
    switch (toolRun.status) {
      case "pending":
        return "bg-accent-orange/10 border-accent-orange/30 text-accent-orange";
      case "running":
        return "bg-accent-blue/10 border-accent-blue/30 text-accent-blue";
      case "completed":
        return "bg-accent-green/10 border-accent-green/30 text-accent-green";
      case "error":
        return "bg-destructive/10 border-destructive/30 text-destructive";
      default:
        return "bg-surface-graphite border-border-primary text-text-secondary";
    }
  };

  const getStatusIcon = () => {
    switch (toolRun.status) {
      case "pending":
        return <div className="w-2 h-2 bg-accent-orange rounded-full" />;
      case "running":
        return <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />;
      case "completed":
        return <Check className="h-3 w-3 text-accent-green" />;
      case "error":
        return <div className="w-2 h-2 bg-destructive rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border",
        getStatusStyles()
      )}
    >
      {getStatusIcon()}
      <span className="font-medium">{toolRun.name}</span>
      {toolRun.duration && (
        <span className="opacity-70">({toolRun.duration}ms)</span>
      )}
    </div>
  );
}
