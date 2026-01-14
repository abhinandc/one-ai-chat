import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn("w-full relative", className)}
    >
      <div className="relative mx-auto max-w-3xl">
        {/* Main Input Container */}
        <motion.div 
          animate={{
            boxShadow: isFocused 
              ? "0 0 0 1px hsl(var(--primary) / 0.3), 0 8px 32px hsl(var(--primary) / 0.15)" 
              : "0 4px 20px rgba(0, 0, 0, 0.08)"
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative flex items-center rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200",
            isFocused 
              ? "border-primary/40" 
              : "border-border/60",
            isLoading && "opacity-80"
          )}
        >
          {/* Textarea - centered, no icons */}
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
                "placeholder:text-muted-foreground/40 placeholder:font-light placeholder:text-lg",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[64px] max-h-[160px]",
                "focus:outline-none"
              )}
            />
          </div>
        </motion.div>

        {/* Hint Text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground/50 mt-4"
        >
          Press Enter to compare responses from multiple AI models
        </motion.p>
      </div>
    </motion.div>
  );
}
