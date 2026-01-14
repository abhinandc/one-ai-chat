import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Paperclip, X, Square, Plus, Mic, Globe, ImageIcon, Sparkles, Zap, Brain, Code2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInputModal } from "./VoiceInputModal";

interface AIInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onOpenSettings?: () => void;
  onModeChange?: (mode: string) => void;
}

const tools = [
  { id: "search", label: "Search the web", icon: Globe },
  { id: "image", label: "Generate image", icon: ImageIcon },
  { id: "reason", label: "Deep reasoning", icon: Sparkles },
];

const modelModes = [
  { id: "thinking", label: "Thinking", icon: Brain, description: "Deep analysis & reasoning" },
  { id: "fast", label: "Fast", icon: Zap, description: "Quick responses" },
  { id: "coding", label: "Coding", icon: Code2, description: "Optimized for code" },
];

export function AIInput({
  onSend,
  isLoading = false,
  onStop,
  placeholder = "Message OneEdge...",
  disabled = false,
  className,
  onOpenSettings,
  onModeChange,
}: AIInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState("fast");
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = modelModes.find((m) => m.id === selectedMode) || modelModes[1];

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
    onModeChange?.(modeId);
  };

  const handleSend = () => {
    if (!message.trim() || disabled || isLoading) return;
    onSend(message.trim());
    setMessage("");
    setAttachments([]);
    setSelectedTool(null);
    
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceTranscript = (text: string) => {
    setMessage((prev) => prev + (prev ? " " : "") + text);
    textareaRef.current?.focus();
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative mx-auto max-w-3xl">
        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 mb-2 px-1"
            >
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Tool Badge */}
        <AnimatePresence>
          {selectedTool && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 mb-2 px-1"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                {tools.find(t => t.id === selectedTool)?.icon && (
                  <span className="h-3 w-3">
                    {(() => {
                      const Icon = tools.find(t => t.id === selectedTool)?.icon;
                      return Icon ? <Icon className="h-3 w-3" /> : null;
                    })()}
                  </span>
                )}
                {tools.find(t => t.id === selectedTool)?.label}
                <button
                  onClick={() => setSelectedTool(null)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Container */}
        <div className="relative flex items-center rounded-2xl border border-border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow">
          {/* Left Actions */}
          <div className="flex items-center gap-1 pl-2">
            {/* Plus Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,text/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Model Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                >
                  <currentMode.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{currentMode.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-popover">
                {modelModes.map((mode) => (
                  <DropdownMenuItem
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={cn(
                      "flex items-start gap-3 py-2.5",
                      selectedMode === mode.id && "bg-muted"
                    )}
                  >
                    <mode.icon className={cn(
                      "h-4 w-4 mt-0.5",
                      selectedMode === mode.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex flex-col gap-0.5">
                      <span className={cn(
                        "text-sm font-medium",
                        selectedMode === mode.id && "text-primary"
                      )}>
                        {mode.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {mode.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Mode affects response style
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent py-3 px-2 text-sm outline-none",
              "placeholder:text-muted-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[48px] max-h-[200px]"
            )}
          />

          {/* Right Actions */}
          <div className="flex items-center gap-1 pr-2">
            {/* Voice Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={() => setVoiceModalOpen(true)}
            >
              <Mic className="h-5 w-5" />
            </Button>

            {/* Send/Stop Button */}
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg"
                onClick={onStop}
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-colors",
                  canSend 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                disabled={!canSend}
                onClick={handleSend}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          OneEdge can make mistakes. Check important info.
        </p>
      </div>

      {/* Voice Input Modal */}
      <VoiceInputModal
        open={voiceModalOpen}
        onOpenChange={setVoiceModalOpen}
        onTranscript={handleVoiceTranscript}
      />
    </div>
  );
}