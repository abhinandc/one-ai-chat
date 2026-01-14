import { useState, memo, useCallback } from "react";
import { CopyIcon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThinkingLine } from "@/components/ui/shimmer-text";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  isFirstMessage?: boolean;
}

// Memoize to prevent unnecessary re-renders that cause flickering
export const ChatMessage = memo(function ChatMessage({ 
  message, 
  isStreaming,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isEmpty = !message.content || message.content.trim() === "";

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  // Render markdown-like content with proper formatting
  const renderContent = useCallback((content: string) => {
    if (!content) return null;

    // Split content into paragraphs first
    const paragraphs = content.split(/\n\n+/);
    
    return paragraphs.map((paragraph, pIndex) => {
      // Handle code blocks
      if (paragraph.includes("```")) {
        const parts = paragraph.split(/(```[\s\S]*?```)/);
        return (
          <div key={pIndex} className="my-2">
            {parts.map((part, index) => {
              if (part.startsWith("```")) {
                const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                if (match) {
                  const [, language, code] = match;
                  return (
                    <CodeBlock key={index} code={code.trim()} language={language || ""} />
                  );
                }
              }
              return part ? <span key={index} className="whitespace-pre-wrap">{part}</span> : null;
            })}
          </div>
        );
      }

      // Handle headers (## and ###)
      if (paragraph.startsWith("### ")) {
        return (
          <h3 key={pIndex} className="text-base font-semibold text-foreground mt-4 mb-2">
            {paragraph.slice(4)}
          </h3>
        );
      }
      if (paragraph.startsWith("## ")) {
        return (
          <h2 key={pIndex} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {paragraph.slice(3)}
          </h2>
        );
      }

      // Handle bullet points
      if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
        const items = paragraph.split(/\n/).filter(Boolean);
        return (
          <ul key={pIndex} className="list-disc list-inside space-y-1 my-2 text-foreground/90">
            {items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {renderInlineFormatting(item.replace(/^-\s*/, ""))}
              </li>
            ))}
          </ul>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(paragraph)) {
        const items = paragraph.split(/\n/).filter(Boolean);
        return (
          <ol key={pIndex} className="list-decimal list-inside space-y-1 my-2 text-foreground/90">
            {items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {renderInlineFormatting(item.replace(/^\d+\.\s*/, ""))}
              </li>
            ))}
          </ol>
        );
      }

      // Regular paragraph with inline formatting
      return (
        <p key={pIndex} className="my-2 leading-relaxed text-foreground/90">
          {renderInlineFormatting(paragraph)}
        </p>
      );
    });
  }, []);

  // Handle inline formatting (bold, italic, inline code)
  const renderInlineFormatting = (text: string) => {
    // Handle inline code first
    const parts = text.split(/(`[^`]+`)/);
    return parts.map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 bg-muted/80 rounded text-sm font-mono text-primary"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Handle bold
      if (part.includes("**")) {
        return part.split(/(\*\*[^*]+\*\*)/).map((subpart, i) => {
          if (subpart.startsWith("**") && subpart.endsWith("**")) {
            return <strong key={i} className="font-semibold text-foreground">{subpart.slice(2, -2)}</strong>;
          }
          return subpart;
        });
      }
      return part;
    });
  };

  // Show AI loading state for empty assistant messages
  if (isAssistant && isEmpty && isStreaming) {
    return (
      <div className="w-full py-4">
        <div className="mx-auto max-w-3xl px-4">
          <ThinkingLine text="AI is thinking" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group w-full py-4",
        isUser ? "bg-transparent" : "bg-gradient-to-r from-muted/20 via-muted/10 to-transparent"
      )}
    >
      <div className="mx-auto max-w-3xl px-4 flex justify-start">
        <div className="flex flex-col gap-2 max-w-[85%]">
          {/* Message content */}
          <div 
            className={cn(
              "relative overflow-hidden",
              isUser && "rounded-2xl rounded-tl-sm bg-primary/10 backdrop-blur-sm",
              isAssistant && "rounded-2xl"
            )}
          >
            {/* Subtle gradient background for assistant messages */}
            {isAssistant && (
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)/0.1) 0%, hsl(var(--accent)/0.05) 50%, transparent 100%)"
                }}
              />
            )}
            
            <div className={cn(
              "relative z-10 px-4 py-3",
              "prose prose-sm dark:prose-invert max-w-none text-foreground"
            )}>
              {renderContent(message.content)}
              
              {/* Streaming indicator - simple CSS animation, no motion */}
              {isStreaming && !isEmpty && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                </span>
              )}
            </div>
          </div>

          {/* Actions - only for completed assistant messages */}
          {isAssistant && !isStreaming && !isEmpty && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});

const CodeBlock = memo(function CodeBlock({ code, language }: { code: string; language: string }) {
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
});