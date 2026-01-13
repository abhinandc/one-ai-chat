import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Square, ArrowUp, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Composer Component - Reimagined Prompt Input
 *
 * Design patterns from:
 * - Grok clone (state-based icon transitions, minimal UI)
 * - assistant-ui (intuitive chat input)
 * - hardUIrules.md specifications
 *
 * Key improvements:
 * 1. State-based button that cycles: Mic -> Send -> Stop
 * 2. Clean, borderless design with subtle ring on focus
 * 3. Smooth scale/opacity transitions
 * 4. Auto-resize textarea
 */

interface ComposerProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  model?: string;
  placeholder?: string;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
}

export function Composer({
  onSendMessage,
  disabled = false,
  model,
  placeholder,
  isStreaming = false,
  onStopStreaming,
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || disabled || isStreaming) return;
    onSendMessage(message.trim());
    setMessage("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported");
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => prev + (prev ? " " : "") + transcript);
      textareaRef.current?.focus();
    };

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleAttachment = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,text/*,application/pdf";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        console.log("Files selected:", Array.from(files).map((f) => f.name));
        // File attachments feature - implement when backend support is added
      }
    };
    input.click();
  };

  // Determine the action button state
  const hasText = message.trim().length > 0;
  const actionButtonState = isStreaming ? "stop" : hasText ? "send" : "mic";

  const handleActionClick = () => {
    if (isStreaming && onStopStreaming) {
      onStopStreaming();
    } else if (hasText) {
      handleSubmit();
    } else {
      handleVoiceInput();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border bg-card transition-all duration-200",
          isFocused
            ? "border-primary/50 ring-2 ring-primary/20"
            : "border-border hover:border-border/80"
        )}
      >
        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleAttachment}
          disabled={disabled}
          aria-label="Attach file"
          className="size-10 shrink-0 ml-1 mb-1 text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="size-5" />
        </Button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || "Message..."}
          disabled={disabled || isStreaming}
          rows={1}
          data-testid="message-input"
          aria-label="Message input"
          className={cn(
            "flex-1 min-h-[44px] max-h-[200px] py-3 pr-2 bg-transparent resize-none",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />

        {/* Action button - State-based (Mic/Send/Stop) */}
        <div className="shrink-0 mr-1 mb-1">
          <Button
            type="button"
            onClick={handleActionClick}
            disabled={disabled && !isStreaming}
            size="icon"
            data-testid="send-button"
            aria-label={
              isStreaming
                ? "Stop generation"
                : hasText
                ? "Send message"
                : "Start voice input"
            }
            className={cn(
              "size-10 rounded-xl transition-all duration-200",
              isStreaming
                ? "bg-destructive hover:bg-destructive/90"
                : hasText
                ? "bg-primary hover:bg-primary/90"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={actionButtonState}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isStreaming ? (
                  <Square className="size-4 text-destructive-foreground" />
                ) : hasText ? (
                  <ArrowUp className="size-4 text-primary-foreground" />
                ) : isRecording ? (
                  <MicOff className="size-4 text-destructive" />
                ) : (
                  <Mic className="size-4 text-muted-foreground" />
                )}
              </motion.div>
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-[11px] text-muted-foreground/60">
          {model && <span className="font-medium">{model}</span>}
        </span>
        <span className="text-[11px] text-muted-foreground/60">
          Enter to send, Shift+Enter for new line
        </span>
      </div>
    </form>
  );
}

export default Composer;
