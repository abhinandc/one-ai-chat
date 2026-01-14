import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CheckCircle, AlertCircle, Loader2, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import apiClient, { type Model, type ChatMessage } from "@/lib/api";

type StreamStatus = "idle" | "streaming" | "completed" | "cancelled" | "error";

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
              <div className="whitespace-pre-wrap text-foreground/90">{content}</div>
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between gap-4"
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
