import { useState, memo, useCallback, useMemo } from "react";
import { CopyIcon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StreamingText } from "@/components/ui/typing-animation";
import { ThinkingLine } from "@/components/ui/shimmer-text";
import { AIThinkingDisplay, type ToolStep } from "./AIThinkingDisplay";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtTrigger,
  ChainOfThoughtStep,
  ChainOfThoughtStepItem,
} from "@/components/prompt-kit/chain-of-thought";
import type { Message } from "@/types";

// Types for chain-of-thought reasoning
interface ThinkingStep {
  title: string;
  items: string[];
}

// Parse thinking blocks from content
function parseThinkingBlocks(content: string): { thinking: ThinkingStep[]; cleanContent: string } {
  const thinkingSteps: ThinkingStep[] = [];
  let cleanContent = content;

  // Match <thinking>...</thinking> blocks
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
  const matches = content.matchAll(thinkingRegex);

  for (const match of matches) {
    const thinkingContent = match[1].trim();
    // Parse into steps - each line starting with "- " or numbered
    const lines = thinkingContent.split('\n').filter(Boolean);
    
    let currentStep: ThinkingStep | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Headers start with ## or are standalone titles
      if (trimmed.startsWith('##') || (trimmed.length < 60 && !trimmed.startsWith('-') && !trimmed.match(/^\d+\./))) {
        if (currentStep && currentStep.items.length > 0) {
          thinkingSteps.push(currentStep);
        }
        currentStep = {
          title: trimmed.replace(/^#+\s*/, ''),
          items: [],
        };
      } else if (trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
        const item = trimmed.replace(/^[-\d.]+\s*/, '');
        if (currentStep) {
          currentStep.items.push(item);
        } else {
          currentStep = { title: 'Thinking', items: [item] };
        }
      } else if (trimmed && currentStep) {
        currentStep.items.push(trimmed);
      }
    }
    
    if (currentStep && currentStep.items.length > 0) {
      thinkingSteps.push(currentStep);
    }
    
    // Remove the thinking block from displayed content
    cleanContent = cleanContent.replace(match[0], '').trim();
  }

  return { thinking: thinkingSteps, cleanContent };
}

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  thinkingSteps?: ToolStep[];
  isDeepThinking?: boolean;
}

// Memoize to prevent unnecessary re-renders that cause flickering
export const ChatMessage = memo(function ChatMessage({ 
  message, 
  isStreaming,
  thinkingSteps = [],
  isDeepThinking = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isEmpty = !message.content || message.content.trim() === "";
  const hasAttachments = message.metadata?.attachments && message.metadata.attachments.length > 0;

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  // Handle inline formatting (bold, italic, inline code)
  const renderInlineFormatting = useCallback((text: string) => {
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
  }, []);

  // Parse thinking blocks and clean content - memoized
  const { thinking: parsedThinking, cleanContent } = useMemo(() => {
    if (!message.content) return { thinking: [], cleanContent: '' };
    return parseThinkingBlocks(message.content);
  }, [message.content]);

  // Render markdown-like content with proper formatting - memoized
  const renderedContent = useMemo(() => {
    const contentToRender = cleanContent || message.content;
    if (!contentToRender) return null;

    // Split content into paragraphs first
    const paragraphs = contentToRender.split(/\n\n+/);
    
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
  }, [cleanContent, message.content, renderInlineFormatting]);

  // Render chain of thought display
  const chainOfThoughtDisplay = useMemo(() => {
    if (parsedThinking.length === 0) return null;

    return (
      <ChainOfThought className="mb-4">
        <ChainOfThoughtContent>
          {parsedThinking.map((step, stepIndex) => (
            <ChainOfThoughtItem key={stepIndex} defaultOpen={stepIndex === 0}>
              <ChainOfThoughtTrigger>
                {step.title}
              </ChainOfThoughtTrigger>
              <ChainOfThoughtStep>
                {step.items.map((item, itemIndex) => (
                  <ChainOfThoughtStepItem key={itemIndex}>
                    {item}
                  </ChainOfThoughtStepItem>
                ))}
              </ChainOfThoughtStep>
            </ChainOfThoughtItem>
          ))}
        </ChainOfThoughtContent>
      </ChainOfThought>
    );
  }, [parsedThinking]);

  // Show AI loading state for empty assistant messages
  if (isAssistant && isEmpty && isStreaming) {
    return (
      <div className="w-full py-4">
        <div className="mx-auto max-w-3xl px-4 space-y-3">
          {/* Deep thinking display */}
          {(isDeepThinking || thinkingSteps.length > 0) && (
            <AIThinkingDisplay
              steps={thinkingSteps}
              isThinking={isDeepThinking}
              thinkingText="Deep thinking"
            />
          )}
          {!isDeepThinking && thinkingSteps.length === 0 && (
            <ThinkingLine text="AI is thinking" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group w-full py-4",
        isUser ? "bg-transparent" : "bg-muted/5"
      )}
    >
      <div className="mx-auto max-w-3xl px-4 flex justify-start">
        <div className="flex flex-col gap-2 max-w-[85%] w-full">
          {/* User attachments preview */}
          {isUser && hasAttachments && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.metadata?.attachments?.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-xs border border-border/50"
                >
                  {attachment.type?.startsWith("image/") ? (
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="truncate max-w-[120px]">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chain of Thought display for assistant */}
          {isAssistant && !isStreaming && chainOfThoughtDisplay}

          {/* Deep thinking display for assistant */}
          {isAssistant && (isDeepThinking || thinkingSteps.length > 0) && (
            <AIThinkingDisplay
              steps={thinkingSteps}
              isThinking={isDeepThinking && isStreaming}
              thinkingText="Processing your request"
              className="mb-2"
            />
          )}
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
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)/0.1) 0%, hsl(var(--accent)/0.05) 50%, transparent 100%)"
                }}
              />
            )}
            
            <div className={cn(
              "relative z-10 px-4 py-3",
              "prose prose-sm dark:prose-invert max-w-none text-foreground"
            )}>
              {isStreaming && isAssistant ? (
                <StreamingText content={message.content} showCursor />
              ) : (
                renderedContent
              )}
            </div>
          </div>

          {/* Actions - only for completed assistant messages */}
          {isAssistant && !isStreaming && !isEmpty && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
