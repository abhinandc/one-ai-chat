import { useState, memo, useCallback, useMemo } from "react";
import { CopyIcon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Paperclip, Image as ImageIcon, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import {
  ChainOfThought as AIChainOfThought,
  ChainOfThoughtStep as AIChainOfThoughtStep,
  ChainOfThoughtTrigger as AIChainOfThoughtTrigger,
  ChainOfThoughtContent as AIChainOfThoughtContent,
  ChainOfThoughtItem as AIChainOfThoughtItem,
} from "@/components/ai-elements/pk-chain-of-thought";
import type { Message } from "@/types";

// React Markdown imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

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

// Custom code block component with copy functionality
const CodeBlock = memo(function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-muted px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px]"
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
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '0.75rem',
          fontSize: '12px',
          lineHeight: '1.5',
          background: 'hsl(var(--background) / 0.5)',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
});

// Generated image component with proper state management
const GeneratedImage = memo(function GeneratedImage({
  imageUrl,
  altText,
}: {
  imageUrl: string;
  altText: string;
}) {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className="my-4">
      {loadState === 'error' ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive">
          <p className="text-sm font-medium">Image failed to load</p>
          <p className="text-xs mt-1 text-muted-foreground">
            {imageUrl?.startsWith('data:') ? 'Base64 data URL' : 'External URL'}
          </p>
        </div>
      ) : (
        <>
          {loadState === 'loading' && (
            <div className="flex items-center justify-center h-48 rounded-xl border border-border bg-muted/30">
              <div className="animate-pulse text-muted-foreground">Loading image...</div>
            </div>
          )}
          <img
            src={imageUrl}
            alt={altText || "Generated image"}
            className={cn(
              "max-w-full h-auto rounded-xl border border-border shadow-lg",
              loadState === 'loading' && "hidden"
            )}
            loading="lazy"
            onLoad={() => setLoadState('loaded')}
            onError={() => setLoadState('error')}
          />
        </>
      )}
    </div>
  );
});

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

  // Parse thinking blocks and clean content - memoized
  const { thinking: parsedThinking, cleanContent } = useMemo(() => {
    if (!message.content) return { thinking: [], cleanContent: '' };
    return parseThinkingBlocks(message.content);
  }, [message.content]);

  // Render markdown content using react-markdown
  const renderedContent = useMemo(() => {
    const contentToRender = cleanContent || message.content;
    if (!contentToRender) return null;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks and inline code
          code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');

            if (!inline && (match || codeContent.includes('\n'))) {
              return (
                <CodeBlock
                  code={codeContent}
                  language={match?.[1] || ''}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 bg-muted/80 rounded text-[12px] font-mono text-primary"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Headings
          h1({ children }) {
            return <h1 className="text-base font-bold text-foreground mt-4 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-[15px] font-semibold text-foreground mt-4 mb-1.5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-[14px] font-semibold text-foreground mt-3 mb-1.5">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-[13px] font-semibold text-foreground mt-2.5 mb-1">{children}</h4>;
          },
          h5({ children }) {
            return <h5 className="text-[13px] font-medium text-foreground mt-2 mb-1">{children}</h5>;
          },
          h6({ children }) {
            return <h6 className="text-[12px] font-medium text-foreground mt-2 mb-1">{children}</h6>;
          },
          // Paragraphs
          p({ children }) {
            return <p className="my-1.5 leading-relaxed text-[13px] text-foreground/90">{children}</p>;
          },
          // Lists
          ul({ children }) {
            return (
              <ul className="list-disc list-outside ml-4 space-y-0.5 my-1.5 text-[13px] text-foreground/90">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-outside ml-4 space-y-0.5 my-1.5 text-[13px] text-foreground/90">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-normal pl-1">{children}</li>;
          },
          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {children}
              </a>
            );
          },
          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-[13px] text-foreground/80 italic">
                {children}
              </blockquote>
            );
          },
          // Tables
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto">
                <table className="min-w-full text-[12px] border-collapse border border-border">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted/50">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-3 py-1.5 text-left font-medium text-foreground border border-border">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-1.5 text-foreground/90 border border-border">
                {children}
              </td>
            );
          },
          // Horizontal rule
          hr() {
            return <hr className="my-4 border-border" />;
          },
          // Strong and emphasis
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          // Images (for generated images)
          img({ src, alt }) {
            if (!src) return null;
            return <GeneratedImage imageUrl={src} altText={alt || ''} />;
          },
          // Pre tag (for code blocks)
          pre({ children }) {
            // react-markdown wraps code in pre, but we handle it in code component
            return <>{children}</>;
          },
        }}
      >
        {contentToRender}
      </ReactMarkdown>
    );
  }, [cleanContent, message.content]);

  // Render chain of thought display using enhanced ai-elements visualization
  const chainOfThoughtDisplay = useMemo(() => {
    if (parsedThinking.length === 0) return null;

    return (
      <AIChainOfThought className="mb-4">
        {parsedThinking.map((step, stepIndex) => (
          <AIChainOfThoughtStep key={stepIndex} defaultOpen={stepIndex === 0}>
            <AIChainOfThoughtTrigger
              leftIcon={<Brain className="h-4 w-4 text-primary" />}
            >
              {step.title}
            </AIChainOfThoughtTrigger>
            <AIChainOfThoughtContent>
              <div className="space-y-1.5">
                {step.items.map((item, itemIndex) => (
                  <AIChainOfThoughtItem key={itemIndex} className="text-muted-foreground">
                    {item}
                  </AIChainOfThoughtItem>
                ))}
              </div>
            </AIChainOfThoughtContent>
          </AIChainOfThoughtStep>
        ))}
      </AIChainOfThought>
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
          {/* User attachments preview - show image thumbnails like Claude/OpenAI */}
          {isUser && hasAttachments && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.metadata?.attachments?.map((attachment, index) => (
                attachment.type?.startsWith("image/") && attachment.data ? (
                  // Image thumbnail - renders actual image preview
                  <a
                    key={index}
                    href={attachment.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group/thumb cursor-pointer block"
                  >
                    <img
                      src={attachment.data}
                      alt={attachment.name}
                      className="h-20 w-20 object-cover rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                  </a>
                ) : (
                  // Non-image file attachment
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-xs border border-border/50"
                  >
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[120px]">{attachment.name}</span>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Chain of Thought display for assistant (only after streaming completes) */}
          {isAssistant && !isStreaming && chainOfThoughtDisplay}

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
              "relative z-10 px-4 py-3 text-[13px] leading-relaxed",
              "prose prose-sm dark:prose-invert max-w-none text-foreground",
              "[&>*]:transition-opacity [&>*]:duration-150"
            )}>
              {renderedContent}
              {/* Show cursor at end when streaming */}
              {isStreaming && isAssistant && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 bg-primary/70 align-middle"
                  style={{ animation: 'pulse 1s ease-in-out infinite' }}
                />
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
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.message.metadata?.attachments?.length === nextProps.message.metadata?.attachments?.length
  );
});
