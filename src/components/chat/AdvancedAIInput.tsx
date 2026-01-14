import { useState, useRef, useEffect, useCallback } from "react";
import { 
  ArrowUp, 
  Square, 
  Plus, 
  Paperclip, 
  Image as ImageIcon,
  Mic,
  ChevronDown,
  X,
  Sparkles,
  Zap,
  Brain,
  Code,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { SiaConversation } from "./SiaConversation";

interface Model {
  id: string;
  name: string;
  provider?: string;
  api_path?: string;
}

interface AdvancedAIInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  models?: Model[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  onModeChange?: (mode: string) => void;
}

const modes = [
  { 
    id: "thinking", 
    label: "Thinking", 
    icon: Brain, 
    description: "Deep analysis & reasoning",
    gradient: "from-purple-500 to-indigo-500"
  },
  { 
    id: "fast", 
    label: "Fast", 
    icon: Zap, 
    description: "Quick responses",
    gradient: "from-amber-500 to-orange-500"
  },
  { 
    id: "coding", 
    label: "Coding", 
    icon: Code, 
    description: "Optimized for code",
    gradient: "from-emerald-500 to-teal-500"
  },
];

const tools = [
  { id: "search", label: "Search the web", icon: Globe },
  { id: "image", label: "Generate image", icon: ImageIcon },
  { id: "reason", label: "Deep reasoning", icon: Sparkles },
];

export function AdvancedAIInput({
  onSend,
  isLoading = false,
  onStop,
  placeholder = "What's on your mind?",
  disabled = false,
  className,
  models = [],
  selectedModel,
  onModelChange,
  onModeChange,
}: AdvancedAIInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState("fast");
  const [siaOpen, setSiaOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = modes.find((m) => m.id === selectedMode) || modes[1];
  const currentModel = models.find((m) => m.id === selectedModel);

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
    <div className={cn("w-full relative z-50", className)}>
      <div className="relative mx-auto max-w-3xl">
        {/* Model Selector - Top Left */}
        {models.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3 pl-1"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 px-3 bg-muted/50 hover:bg-muted border border-border/50 rounded-lg"
                >
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {currentModel?.name || selectedModel || "Select model"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onModelChange?.(model.id)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 py-2",
                      model.id === selectedModel && "bg-muted"
                    )}
                  >
                    <span className="font-medium text-sm">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.provider} • {model.api_path || '/v1/chat/completions'}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mode Badge */}
            <AnimatedBadge variant="shimmer" className="cursor-pointer">
              <currentMode.icon className="h-3 w-3" />
              {currentMode.label}
            </AnimatedBadge>
          </motion.div>
        )}

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
                <motion.div
                  key={index}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm border border-border/50"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-destructive/20"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
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
              <AnimatedBadge variant="glow">
                {(() => {
                  const tool = tools.find(t => t.id === selectedTool);
                  const Icon = tool?.icon;
                  return Icon ? <Icon className="h-3 w-3" /> : null;
                })()}
                {tools.find(t => t.id === selectedTool)?.label}
                <button
                  onClick={() => setSelectedTool(null)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </AnimatedBadge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Container */}
        <motion.div 
          className={cn(
            "relative flex items-end rounded-2xl border bg-background shadow-lg transition-all duration-300",
            isFocused 
              ? "border-primary/50 shadow-primary/10" 
              : "border-border",
            isLoading && "opacity-80"
          )}
          animate={{
            boxShadow: isFocused 
              ? "0 0 0 2px hsl(var(--primary) / 0.1), 0 4px 20px hsl(var(--primary) / 0.1)" 
              : "0 4px 12px rgba(0, 0, 0, 0.1)"
          }}
        >
          {/* Shimmer border effect when focused */}
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/20" />
              <motion.div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.1), transparent)",
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          )}

          {/* Left Actions */}
          <div className="flex items-center gap-1 pl-3 pb-3">
            {/* Plus Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload image
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {tools.map((tool) => (
                  <DropdownMenuItem 
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <tool.icon className="h-4 w-4 mr-2" />
                    {tool.label}
                  </DropdownMenuItem>
                ))}
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

            {/* Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground rounded-xl"
                >
                  <currentMode.icon className="h-4 w-4" />
                  <span className="text-sm hidden sm:inline">{currentMode.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {modes.map((mode) => (
                  <DropdownMenuItem
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={cn(
                      "flex items-start gap-3 py-2.5",
                      selectedMode === mode.id && "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg bg-gradient-to-br",
                      mode.gradient
                    )}>
                      <mode.icon className="h-3.5 w-3.5 text-white" />
                    </div>
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
              </DropdownMenuContent>
            </DropdownMenu>
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
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent py-4 px-2 text-base outline-none",
                "placeholder:text-muted-foreground/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[56px] max-h-[200px]"
              )}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 pr-3 pb-3">
            {/* Voice Orb Button - Talk to Sia */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl relative overflow-hidden group"
                    onClick={() => setSiaOpen(true)}
                  >
                    {/* Animated gradient background */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{
                        background: [
                          "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))",
                          "linear-gradient(225deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))",
                          "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {/* Orb */}
                    <div className="relative h-5 w-5 flex items-center justify-center">
                      <motion.div 
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-primary/20"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative h-3 w-3 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm shadow-primary/30" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Talk to Sia</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Send/Stop Button */}
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={onStop}
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-xl transition-all duration-200",
                    canSend 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20" 
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  disabled={!canSend}
                  onClick={handleSend}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-center text-xs text-muted-foreground/60"
        >
          OneEdge can make mistakes. Check important info.
        </motion.p>
      </div>

      {/* Sia Voice Conversation Modal */}
      <SiaConversation
        open={siaOpen}
        onOpenChange={setSiaOpen}
        onTranscript={handleVoiceTranscript}
      />
    </div>
  );
}
