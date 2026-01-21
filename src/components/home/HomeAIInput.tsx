import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DotsLoader } from "@/components/ai-elements/pk-loader";

interface HomeAIInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function HomeAIInput({
  onSend,
  isLoading = false,
  disabled = false,
  className,
}: HomeAIInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  const handleSend = () => {
    if (!message.trim() || disabled || isLoading) return;
    onSend(message.trim());
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("w-full relative", className)}>
      <div className="relative mx-auto max-w-3xl">
        {/* Main Input Container */}
        <div
          className={cn(
            "relative flex items-center rounded-2xl border bg-card/80 backdrop-blur-sm transition-all duration-200",
            isFocused
              ? "border-primary/40 shadow-lg shadow-primary/10"
              : "border-border/60 shadow-md",
            isLoading && "border-primary/60"
          )}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/95 backdrop-blur-sm rounded-2xl z-10">
              <div className="flex items-center gap-3">
                <DotsLoader size="md" />
                <span className="text-sm text-muted-foreground">Finding the best models...</span>
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="What would you like to accomplish today?"
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent py-5 px-6 text-lg text-center",
                "placeholder:text-muted-foreground/50 placeholder:font-light",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[64px] max-h-[160px]",
                "focus:outline-none"
              )}
            />
          </div>
        </div>

        {/* Hint Text */}
        <p className="text-center text-xs text-muted-foreground/50 mt-3">
          Press Enter to compare responses from multiple AI models
        </p>
      </div>
    </div>
  );
}
