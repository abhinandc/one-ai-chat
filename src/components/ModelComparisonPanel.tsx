import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Square, CheckCircle, AlertCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient, { type Model, type ChatMessage } from "@/lib/api";

interface ModelComparisonPanelProps {
  model: Model;
  query: string;
  onComplete?: () => void;
}

type StreamStatus = "idle" | "streaming" | "completed" | "cancelled" | "error";

export function ModelComparisonPanel({ model, query, onComplete }: ModelComparisonPanelProps) {
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
                onComplete?.();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  setContent(prev => prev + delta);
                }
              } catch {
              }
            }
          }
        }

        setStatus("completed");
        onComplete?.();
      } catch (err: any) {
        if (err.name === "AbortError") {
          setStatus("cancelled");
        } else {
          setStatus("error");
          setError(err.message || "Failed to get response");
          onComplete?.();
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

  const getStatusIcon = () => {
    switch (status) {
      case "streaming":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-3 w-3 text-accent-green" />;
      case "cancelled":
        return <Square className="h-3 w-3 text-text-tertiary" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "streaming":
        return "Generating...";
      case "completed":
        return "Complete";
      case "cancelled":
        return "Stopped";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  };

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border-primary/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-accent-blue/10 rounded-lg shrink-0">
            <Bot className="h-4 w-4 text-accent-blue" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{model.id}</p>
            <p className="text-xs text-text-tertiary truncate">{model.owned_by}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs",
              status === "streaming" && "bg-accent-blue/10 text-accent-blue",
              status === "completed" && "bg-accent-green/10 text-accent-green",
              status === "cancelled" && "bg-surface-graphite text-text-tertiary",
              status === "error" && "bg-red-500/10 text-red-500"
            )}
          >
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
          {status === "streaming" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStop}
              className="h-7 w-7"
              data-testid={`button-stop-${model.id}`}
            >
              <Square className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div 
        ref={contentRef}
        className="flex-1 p-4 overflow-y-auto text-sm text-text-secondary leading-relaxed"
      >
        {status === "idle" && (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            Waiting to start...
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {(status === "streaming" || status === "completed" || status === "cancelled") && (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
        {status === "streaming" && (
          <span className="inline-block w-1.5 h-4 bg-accent-blue animate-pulse ml-0.5" />
        )}
      </div>
    </GlassCard>
  );
}
