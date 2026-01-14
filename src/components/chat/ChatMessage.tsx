import { useState } from "react";
import { CopyIcon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render markdown-like content with proper formatting
  const renderContent = (content: string) => {
    // Handle code blocks
    if (content.includes("```")) {
      const parts = content.split(/(```[\s\S]*?```)/);
      return parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, language, code] = match;
            return (
              <CodeBlock key={index} code={code.trim()} language={language || ""} />
            );
          }
        }
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      });
    }

    // Handle inline code
    if (content.includes("`")) {
      return content.split(/(`[^`]+`)/).map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      });
    }

    return <span className="whitespace-pre-wrap">{content}</span>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { duration: 0.3 }
      }}
      className={cn(
        "group w-full py-4",
        isUser ? "bg-transparent" : "bg-gradient-to-r from-muted/20 via-muted/10 to-transparent"
      )}
    >
      <div className={cn(
        "mx-auto max-w-3xl px-4",
        isUser ? "flex justify-start" : "flex justify-start"
      )}>
        <div className="flex flex-col gap-2 max-w-[85%]">
          {/* Message content with shader-like gradient border for assistant */}
          <motion.div 
            initial={{ opacity: 0, x: isUser ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={cn(
              "relative overflow-hidden",
              isUser && "rounded-2xl rounded-tl-sm bg-primary/10 backdrop-blur-sm",
              isAssistant && "rounded-2xl"
            )}
          >
            {/* Shader-like animated gradient background for assistant messages */}
            {isAssistant && (
              <motion.div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)/0.1) 0%, hsl(var(--accent)/0.05) 50%, transparent 100%)"
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear"
                }}
              />
            )}
            
            <div className={cn(
              "relative z-10 px-4 py-3",
              "prose prose-sm dark:prose-invert max-w-none text-foreground"
            )}>
              {renderContent(message.content)}
              
              {/* Streaming indicator with pulse animation */}
              {isStreaming && (
                <motion.span 
                  className="inline-flex items-center gap-1 ml-2"
                >
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  />
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Actions - only for assistant messages */}
          {isAssistant && !isStreaming && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <ReloadIcon className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="my-4 rounded-lg overflow-hidden border border-border"
    >
      <div className="flex items-center justify-between bg-muted px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={copyCode}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto bg-background/50">
        <code className="text-sm font-mono text-foreground">{code}</code>
      </pre>
    </motion.div>
  );
}