import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CheckCircle, AlertCircle, Loader2, Square, Sparkles, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import apiClient, { type Model, type ChatMessage } from "@/lib/api";

type StreamStatus = "idle" | "streaming" | "completed" | "cancelled" | "error";

// Code block component with copy functionality
const CodeBlock = memo(function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
      <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={copyCode}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-3 overflow-x-auto bg-background/30 text-xs">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
});

// Image component with error handling and fallback
const ImageWithFallback = memo(function ImageWithFallback({
  imageUrl,
  altText,
  beforeImage,
  afterImage
}: {
  imageUrl: string;
  altText: string;
  beforeImage: string;
  afterImage: string;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`[ImageWithFallback] Image failed to load. URL length: ${imageUrl?.length}`);
    console.error(`[ImageWithFallback] URL starts with: ${imageUrl?.slice(0, 100)}`);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`[ImageWithFallback] Image loaded successfully`);
    setImageLoaded(true);
  };

  if (imageError) {
    return (
      <div className="my-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
        <p className="text-xs text-destructive font-medium mb-2">Image failed to load</p>
        <p className="text-xs text-muted-foreground break-all">
          URL type: {imageUrl?.startsWith('data:') ? 'base64 data URL' : 'HTTPS URL'}
        </p>
        <p className="text-xs text-muted-foreground break-all">
          Length: {imageUrl?.length || 0} characters
        </p>
        {imageUrl && !imageUrl.startsWith('data:') && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Open image in new tab
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="my-2">
      {beforeImage && <p className="text-xs text-foreground/80 mb-2">{beforeImage}</p>}
      {!imageLoaded && (
        <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg border border-border/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={altText || "Generated image"}
        className={cn(
          "max-w-full h-auto rounded-lg border border-border/50",
          !imageLoaded && "hidden"
        )}
        loading="lazy"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {afterImage && <p className="text-xs text-foreground/80 mt-2 italic">{afterImage}</p>}
    </div>
  );
});

interface ModelResponseCardProps {
  model: Model;
  query: string;
  index: number;
  onComplete: () => void;
  onSelect: (modelId: string, response: string) => void;
}

const ModelResponseCard = memo(function ModelResponseCard({
  model,
  query,
  index,
  onComplete,
  onSelect
}: ModelResponseCardProps) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle inline formatting (bold, italic, inline code)
  const renderInlineFormatting = useCallback((text: string) => {
    // Handle inline code first
    const parts = text.split(/(`[^`]+`)/);
    return parts.map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1 py-0.5 bg-muted/80 rounded text-xs font-mono text-primary"
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

  // Render markdown-like content with proper formatting
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Split content into paragraphs first
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((paragraph, pIndex) => {
      // Handle markdown images (for image generation responses)
      if (paragraph.includes("![") && paragraph.includes("](")) {
        // Use a more robust regex that handles URLs with special characters
        // Match ![alt](url) where url can contain anything except newlines, and we find the LAST ) as the closing
        const imageStart = paragraph.indexOf("![");
        if (imageStart !== -1) {
          const altStart = imageStart + 2;
          const altEnd = paragraph.indexOf("](", altStart);
          if (altEnd !== -1) {
            const urlStart = altEnd + 2;
            // Find the closing parenthesis - for data URLs or complex URLs, find the last ) that makes sense
            // Look for ) followed by end of string, newline, or space
            let urlEnd = paragraph.length;
            for (let i = paragraph.length - 1; i >= urlStart; i--) {
              if (paragraph[i] === ')') {
                urlEnd = i;
                break;
              }
            }

            const altText = paragraph.slice(altStart, altEnd);
            const imageUrl = paragraph.slice(urlStart, urlEnd);
            const beforeImage = paragraph.slice(0, imageStart);
            const afterImage = paragraph.slice(urlEnd + 1);

            // Debug log the URL
            console.log(`[MultiModelComparison] Image URL length: ${imageUrl?.length}, type: ${imageUrl?.startsWith('data:') ? 'base64' : 'url'}`);
            if (imageUrl && !imageUrl.startsWith('data:')) {
              console.log(`[MultiModelComparison] URL prefix: ${imageUrl.slice(0, 100)}...`);
            }

            return (
              <ImageWithFallback
                key={pIndex}
                imageUrl={imageUrl}
                altText={altText}
                beforeImage={beforeImage}
                afterImage={afterImage}
              />
            );
          }
        }
      }

      // Handle code blocks
      if (paragraph.includes("```")) {
        const parts = paragraph.split(/(```[\s\S]*?```)/);
        return (
          <div key={pIndex} className="my-2">
            {parts.map((part, partIndex) => {
              if (part.startsWith("```")) {
                const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                if (match) {
                  const [, language, code] = match;
                  return (
                    <CodeBlock key={partIndex} code={code.trim()} language={language || ""} />
                  );
                }
              }
              return part ? <span key={partIndex} className="whitespace-pre-wrap text-xs">{part}</span> : null;
            })}
          </div>
        );
      }

      // Handle headers (## and ###)
      if (paragraph.startsWith("### ")) {
        return (
          <h3 key={pIndex} className="text-sm font-semibold text-foreground mt-3 mb-1">
            {paragraph.slice(4)}
          </h3>
        );
      }
      if (paragraph.startsWith("## ")) {
        return (
          <h2 key={pIndex} className="text-sm font-semibold text-foreground mt-3 mb-1">
            {paragraph.slice(3)}
          </h2>
        );
      }

      // Handle bullet points
      if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
        const items = paragraph.split(/\n/).filter(Boolean);
        return (
          <ul key={pIndex} className="list-disc list-inside space-y-0.5 my-2 text-xs text-foreground/90">
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
          <ol key={pIndex} className="list-decimal list-inside space-y-0.5 my-2 text-xs text-foreground/90">
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
        <p key={pIndex} className="my-1.5 leading-relaxed text-xs text-foreground/90">
          {renderInlineFormatting(paragraph)}
        </p>
      );
    });
  }, [content, renderInlineFormatting]);

  useEffect(() => {
    if (!query) return;

    const streamResponse = async () => {
      setStatus("streaming");
      setContent("");
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const messages: ChatMessage[] = [
          { role: "user", content: query }
        ];

        const stream = await apiClient.createChatCompletionStream(
          {
            model: model.id,
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          },
          abortControllerRef.current.signal
        );

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                setStatus("completed");
                onComplete();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  setContent(prev => prev + delta);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        setStatus("completed");
        onComplete();
      } catch (err: any) {
        if (err.name === "AbortError") {
          setStatus("cancelled");
        } else {
          setStatus("error");
          setError(err.message || "Failed to get response");
          onComplete();
        }
      }
    };

    streamResponse();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [query, model.id, onComplete]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setStatus("cancelled");
  };

  const handleSelect = () => {
    onSelect(model.id, content);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "streaming":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Generating
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-accent-green/10 text-accent-green">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case "error":
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <Square className="h-3 w-3 mr-1" />
            Stopped
          </Badge>
        );
      default:
        return null;
    }
  };

  // Extract provider name from model
  const getProviderName = () => {
    if (model.owned_by) return model.owned_by;
    const parts = model.id.split('/');
    return parts.length > 1 ? parts[0] : 'AI';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="h-full"
    >
      <div className="h-full flex flex-col rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-primary/10 rounded-xl shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {model.id.split('/').pop() || model.id}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {getProviderName()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge()}
            {status === "streaming" && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleStop}
                className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
              >
                <Square className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          className="flex-1 p-4 overflow-y-auto text-sm text-muted-foreground leading-relaxed min-h-[180px] max-h-[240px]"
        >
          {status === "idle" && (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-muted-foreground/50"
              >
                Initializing...
              </motion.div>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm text-center">{error}</p>
            </div>
          )}
          {(status === "streaming" || status === "completed" || status === "cancelled") && (
            <>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderedContent}
              </div>
              {status === "streaming" && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1.5 h-4 bg-primary rounded-sm ml-0.5"
                />
              )}
            </>
          )}
        </div>

        {/* Footer - Choose Button */}
        <div className="p-4 border-t border-border/50 bg-muted/20">
          <Button
            onClick={handleSelect}
            disabled={status !== "completed" || !content}
            className={cn(
              "w-full gap-2 rounded-xl transition-all duration-300",
              status === "completed" && content
                ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/20"
                : ""
            )}
          >
            <Sparkles className="h-4 w-4" />
            Choose this response
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

interface MultiModelComparisonProps {
  query: string;
  models: Model[];
  onClose: () => void;
}

export function MultiModelComparison({ query, models, onClose }: MultiModelComparisonProps) {
  const navigate = useNavigate();
  const [completedCount, setCompletedCount] = useState(0);

  const handleComplete = useCallback(() => {
    setCompletedCount(prev => prev + 1);
  }, []);

  const handleSelectResponse = useCallback((modelId: string, response: string) => {
    // Store selected response and model for chat page
    sessionStorage.setItem('selectedModelId', modelId);
    sessionStorage.setItem('selectedResponse', response);
    sessionStorage.setItem('originalQuery', query);
    
    // Navigate to chat with the selection
    navigate('/chat', { 
      state: { 
        selectedModelId: modelId,
        selectedResponse: response,
        originalQuery: query
      }
    });
  }, [navigate, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative space-y-6"
    >
      {/* Close button - positioned at top right edge */}
      <Button
        size="icon"
        variant="outline"
        onClick={onClose}
        className="absolute -top-2 -right-2 h-12 w-12 rounded-full border-2 bg-background hover:bg-destructive/10 hover:border-destructive hover:text-destructive shadow-lg z-10 transition-all duration-200"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between gap-4 pr-14"
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-foreground truncate">
            Comparing {models.length} models
          </h2>
          <p className="text-sm text-muted-foreground truncate mt-1">
            "{query}"
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="secondary" className="px-3 py-1">
            {completedCount}/{models.length} complete
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
      
      {/* Response Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {models.map((model, index) => (
            <ModelResponseCard
              key={model.id}
              model={model}
              query={query}
              index={index}
              onComplete={handleComplete}
              onSelect={handleSelectResponse}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
