import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Zap, Settings2, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ComposerProps {
  conversation?: Conversation;
  onSendMessage: (content: string, settings?: any) => void;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  onUpdateSettings?: (settings: any) => void;
  availableModels?: any[];
}

export function Composer({ conversation, onSendMessage, isStreaming, onStopStreaming, onUpdateSettings, availableModels = [] }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [temperature, setTemperature] = useState(conversation?.settings.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(conversation?.settings.maxTokens || 2048);
  const [stopSequences, setStopSequences] = useState(conversation?.settings.stopSequences?.join(", ") || "");
  const [systemPrompt, setSystemPrompt] = useState(conversation?.settings.systemPrompt || "");

  // Update local state when conversation changes
  useEffect(() => {
    if (conversation) {
      setTemperature(conversation.settings.temperature || 0.7);
      setMaxTokens(conversation.settings.maxTokens || 2048);
      setStopSequences(conversation.settings.stopSequences?.join(", ") || "");
      setSystemPrompt(conversation.settings.systemPrompt || "");
    }
  }, [conversation]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    try {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    } catch (error) {
      console.error('Error resizing textarea:', error);
    }
  }, [message]);

  // Update settings in conversation
  const updateSettings = () => {
    if (onUpdateSettings) {
      onUpdateSettings({
        temperature,
        maxTokens,
        stopSequences: stopSequences.split(",").map(s => s.trim()).filter(Boolean),
        systemPrompt: systemPrompt || undefined,
      });
    }
  };

  const sendMessage = () => {
    try {
      if (!message.trim() || isStreaming) return;

      // Update settings before sending
      updateSettings();

      onSendMessage(message, {
        temperature,
        maxTokens,
        stopSequences: stopSequences.split(",").map(s => s.trim()).filter(Boolean),
        systemPrompt: systemPrompt || undefined,
      });
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    try {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    } catch (error) {
      console.error('Error in handleKeyDown:', error);
    }
  };

  const tokenCount = Math.ceil(message.length / 4); // Rough estimate

  return (
    <div className="border-t border-border-primary/50 bg-surface-graphite/20">
      {/* System Prompt Indicator */}
      {systemPrompt && (
        <div className="px-lg pt-3 pb-1 flex items-center gap-2">
          <Badge variant="outline" className="text-xs flex items-center gap-1 bg-accent-blue/10 border-accent-blue/30">
            <BookOpen className="h-3 w-3" />
            System Prompt Active
          </Badge>
          <span className="text-xs text-text-tertiary truncate max-w-md">
            {systemPrompt.slice(0, 60)}...
          </span>
        </div>
      )}
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-lg border-b border-border-secondary/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* System Prompt */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-sm">
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  // Auto-save system prompt changes
                  setTimeout(() => {
                    if (onUpdateSettings) {
                      onUpdateSettings({ systemPrompt: e.target.value });
                    }
                  }, 500);
                }}
                placeholder="You are a helpful AI assistant..."
                className="w-full h-20 px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-sm">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => {
                  const newTemp = parseFloat(e.target.value);
                  setTemperature(newTemp);
                  if (onUpdateSettings) {
                    onUpdateSettings({ temperature: newTemp });
                  }
                }}
                className="w-full h-2 bg-surface-graphite rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-text-tertiary mt-1">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-sm">
                Max Tokens
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => {
                  const newMaxTokens = parseInt(e.target.value);
                  setMaxTokens(newMaxTokens);
                  if (onUpdateSettings) {
                    onUpdateSettings({ maxTokens: newMaxTokens });
                  }
                }}
                className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
                min="1"
                max="4096"
              />
            </div>

            {/* Stop Sequences */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-sm">
                Stop Sequences (comma-separated)
              </label>
              <input
                type="text"
                value={stopSequences}
                onChange={(e) => setStopSequences(e.target.value)}
                placeholder="\\n\\n, Human:, Assistant:"
                className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="p-lg">
        <form onSubmit={handleSubmit} className="space-y-md">
          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "AI is responding..." : "Type your message... (Enter to send, Shift+Enter for new line)"}
              disabled={isStreaming}
              className={cn(
                "w-full min-h-[60px] max-h-[200px] px-lg py-md pr-32",
                "bg-surface-graphite border border-border-primary rounded-xl",
                "text-text-primary placeholder:text-text-tertiary",
                "resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              rows={1}
            />

            {/* Action Buttons */}
            <div className="absolute right-md top-1/2 -translate-y-1/2 flex items-center gap-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-text-secondary hover:text-text-primary"
                onClick={() => {
                  // File attachment functionality
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,text/*,application/pdf';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      console.log('Files selected:', Array.from(files).map(f => f.name));
                      // TODO: Handle file upload
                    }
                  };
                  input.click();
                }}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 transition-all duration-200",
                  isRecording
                    ? "text-accent-red animate-pulse bg-accent-red/10"
                    : "text-text-secondary hover:text-text-primary"
                )}
                onClick={() => {
                  // Voice input functionality
                  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    const recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';

                    setIsRecording(true);

                    recognition.onresult = (event: any) => {
                      const transcript = event.results[0][0].transcript;
                      setMessage(prev => prev + (prev ? ' ' : '') + transcript);
                      setIsRecording(false);
                    };

                    recognition.onerror = (event: any) => {
                      console.error('Speech recognition error:', event.error);
                      setIsRecording(false);
                    };

                    recognition.onend = () => {
                      setIsRecording(false);
                    };

                    recognition.start();
                  } else {
                    alert('Speech recognition not supported in this browser');
                  }
                }}
              >
                <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "h-8 w-8 p-0",
                  showSettings ? "text-accent-blue" : "text-text-secondary hover:text-text-primary"
                )}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md text-xs text-text-tertiary">
              <span>~{tokenCount} tokens</span>
              {conversation && (
                <>
                  <span>•</span>
                  <ModelSelector 
                    value={conversation.settings.model}
                    onChange={(model) => onUpdateSettings && onUpdateSettings({ model })}
                    availableModels={availableModels}
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-sm">
              {isStreaming ? (
                <Button
                  type="button"
                  onClick={onStopStreaming}
                  variant="outline"
                  size="sm"
                  className="text-accent-red border-accent-red hover:bg-accent-red hover:text-white"
                >
                  Stop
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-text-primary"
                    onClick={() => {
                      // Slash commands functionality
                      if (message.trim() === '') {
                        setMessage('/');
                        // Focus the textarea
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                        }
                      } else {
                        // Show slash commands menu
                        console.log('Show slash commands menu');
                        // TODO: Implement slash commands dropdown
                      }
                    }}
                  >
                    <Zap className="h-4 w-4 mr-sm" />
                    Slash
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!message.trim()}
                    className="h-9"
                  >
                    <Send className="h-4 w-4 mr-sm" />
                    Send
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Model Selector Component
function ModelSelector({ value, onChange, availableModels = [] }: { value: string; onChange: (value: string) => void; availableModels?: any[] }) {
  // Use passed models or fallback to default
  const models = availableModels.length > 0 
    ? availableModels.map(model => ({
        id: model.id,
        name: model.id,
        provider: model.owned_by || 'vLLM'
      }))
    : [
        { id: "nemotron-9b", name: "Nemotron-9B", provider: "vLLM" },
        { id: "mamba2-1.4b", name: "Mamba2-1.4B", provider: "vLLM" }
      ];

  const currentModel = models.find(m => m.id === value) || models[0] || { id: value, name: value, provider: "Unknown" };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-text-tertiary hover:text-text-primary">
          <span>Model: {currentModel.name}</span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card border-border-primary shadow-lg z-50">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onChange(model.id)}
            className={cn(
              "text-card-foreground hover:bg-accent-blue/10 cursor-pointer px-4 py-4 relative",
              model.id === value && "bg-accent-blue/15 text-accent-blue"
            )}
          >
            {model.id === value && (
              <div className="absolute left-0 top-1 bottom-1 w-3 bg-accent-blue rounded-r" />
            )}
            <div className="flex flex-col ml-2">
              <span className="font-medium text-sm leading-tight">{model.name}</span>
              <span className="text-xs text-text-tertiary leading-tight">{model.provider}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}