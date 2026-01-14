import { useState } from "react";
import { CopyIcon, CheckIcon, CubeIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  // Render markdown-like content
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
    <div className={cn(
      "group w-full",
      isUser ? "bg-transparent" : "bg-muted/30"
    )}>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex gap-4">
          {/* Avatar - only for assistant */}
          {isAssistant && (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-accent-green/20 text-accent-green text-xs font-medium">
                <CubeIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
          
          {/* Spacer for user messages to align with assistant */}
          {isUser && <div className="w-8 shrink-0" />}

          {/* Content */}
          <div className="flex-1 space-y-2 overflow-hidden">
            {/* Role label */}
            <div className="text-sm font-semibold text-foreground">
              {isUser ? "You" : "OneEdge"}
            </div>

            {/* Message content */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              {renderContent(message.content)}
              
              {/* Streaming indicator */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-foreground/60 animate-pulse rounded-sm" />
              )}
            </div>

            {/* Actions - only for assistant messages */}
            {isAssistant && !isStreaming && (
              <div className="flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
    <div className="my-4 rounded-lg overflow-hidden border border-border">
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
    </div>
  );
}
