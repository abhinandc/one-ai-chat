import { useState, useRef, useEffect, useCallback } from "react";
import { 
  ArrowUp, 
  Square, 
  Plus, 
  Paperclip, 
  Image as ImageIcon,
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
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { SiaConversation } from "./SiaConversation";

export interface AttachmentData {
  name: string;
  type: string;
  size: number;
  data?: string; // base64 for images
}

interface AdvancedAIInputProps {
  onSend: (message: string, attachments?: AttachmentData[]) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onModeChange?: (mode: string) => void;
}

const STORAGE_KEY_MODE = "oneEdge_chat_mode";

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
  onModeChange,
}: AdvancedAIInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  // Persist mode selection in localStorage
  const [selectedMode, setSelectedMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_MODE) || "fast";
    }
    return "fast";
  });
  
  const [siaOpen, setSiaOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = modes.find((m) => m.id === selectedMode) || modes[1];

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
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MODE, modeId);
    }
    onModeChange?.(modeId);
  };

  const handleSend = async () => {
    if (!message.trim() || disabled || isLoading) return;
    
    // Process attachments to get base64 data for images
    const processedAttachments: AttachmentData[] = await Promise.all(
      attachments.map(async (file) => {
        const attachmentData: AttachmentData = {
          name: file.name,
          type: file.type,
          size: file.size,
        };
        
        // Convert images to base64
        if (file.type.startsWith("image/")) {
          try {
            const base64 = await fileToBase64(file);
            attachmentData.data = base64;
          } catch (err) {
            console.error("Failed to convert image to base64:", err);
          }
        }
        
        return attachmentData;
      })
    );
    
    onSend(message.trim(), processedAttachments.length > 0 ? processedAttachments : undefined);
    setMessage("");
    setAttachments([]);
    setSelectedTool(null);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm border border-border/50 animate-fade-in"
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
              </div>
            ))}
          </div>
        )}

        {/* Selected Tool Badge */}
        {selectedTool && (
          <div className="flex items-center gap-2 mb-2 px-1 animate-fade-in">
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
          </div>
        )}

        {/* Main Input Container */}
        <div 
          className={cn(
            "relative flex items-end rounded-2xl border bg-background shadow-lg transition-all duration-300",
            isFocused 
              ? "border-primary/50 shadow-primary/10" 
              : "border-border",
            isLoading && "opacity-80"
          )}
          style={{
            boxShadow: isFocused 
              ? "0 0 0 1px hsl(var(--primary) / 0.2), 0 4px 20px hsl(var(--primary) / 0.1)" 
              : "0 4px 12px rgba(0, 0, 0, 0.1)"
          }}
        >
          {/* Left Actions */}
          <div className="flex items-center gap-1 pl-3 self-center">
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
          <div className="flex-1 relative flex items-center">
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
                "w-full resize-none bg-transparent py-4 px-2 text-base leading-normal",
                "placeholder:text-muted-foreground/50 placeholder:leading-normal",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[56px] max-h-[200px]",
                "focus:outline-none focus:ring-0 focus:border-none",
                "flex items-center"
              )}
              style={{ outline: 'none' }}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 pr-3 self-center">
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
                    {/* Orb */}
                    <div className="relative h-5 w-5 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 group-hover:scale-110 transition-transform" />
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
              <Button
                type="button"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-200",
                  canSend 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20" 
                    : "bg-muted text-muted-foreground"
                )}
                disabled={!canSend}
                onClick={handleSend}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          OneEdge can make mistakes. Check important info.
        </p>
      </div>

      {/* Sia Voice Modal */}
      <SiaConversation
        open={siaOpen}
        onOpenChange={setSiaOpen}
        onTranscript={handleVoiceTranscript}
      />
    </div>
  );
}