import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
            "relative flex items-end rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200",
            isFocused 
              ? "border-primary/40" 
              : "border-border/60",
            isLoading && "opacity-80"
          )}
        >
          {/* Sparkle Icon */}
          <div className="flex items-center pl-4 pb-3.5">
            <motion.div
              animate={{ 
                rotate: isFocused ? [0, 15, -15, 0] : 0,
                scale: isFocused ? 1.1 : 1
              }}
              transition={{ duration: 0.4 }}
            >
              <Sparkles className={cn(
                "h-5 w-5 transition-colors duration-200",
                isFocused ? "text-primary" : "text-muted-foreground/50"
              )} />
            </motion.div>
          </div>

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
                "w-full resize-none bg-transparent py-4 px-3 text-base",
                "placeholder:text-muted-foreground/60",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[56px] max-h-[160px]",
                "focus:outline-none"
              )}
            />
          </div>

          {/* Send Button */}
          <div className="flex items-center pr-3 pb-3">
            <motion.div
              whileHover={{ scale: canSend ? 1.05 : 1 }}
              whileTap={{ scale: canSend ? 0.95 : 1 }}
            >
              <Button
                type="button"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl transition-all duration-200",
                  canSend 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25" 
                    : "bg-muted text-muted-foreground"
                )}
                disabled={!canSend}
                onClick={handleSend}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Hint Text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground/70 mt-4"
        >
          Your query will be sent to multiple AI models for comparison
        </motion.p>
      </div>
    </motion.div>
  );
}
