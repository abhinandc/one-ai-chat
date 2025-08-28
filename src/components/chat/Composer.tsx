import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Zap, Settings2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
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
}

export function Composer({ conversation, onSendMessage, isStreaming, onStopStreaming, onUpdateSettings }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(conversation?.settings.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(conversation?.settings.maxTokens || 2048);
  const [stopSequences, setStopSequences] = useState(conversation?.settings.stopSequences.join(", ") || "");
  const [systemPrompt, setSystemPrompt] = useState(conversation?.settings.systemPrompt || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isStreaming) return;

    onSendMessage(message, {
      temperature,
      maxTokens,
      stopSequences: stopSequences.split(",").map(s => s.trim()).filter(Boolean),
      systemPrompt: systemPrompt || undefined,
    });
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const tokenCount = Math.ceil(message.length / 4); // Rough estimate

  return (
    <div className="border-t border-border-primary/50 bg-surface-graphite/20">
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
                onChange={(e) => setSystemPrompt(e.target.value)}
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
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
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
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
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
            <div className="absolute right-md top-md flex items-center gap-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-text-secondary hover:text-text-primary"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-text-secondary hover:text-text-primary"
              >
                <Mic className="h-4 w-4" />
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
function ModelSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const models = [
    { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
    { id: "claude-3", name: "Claude 3", provider: "Anthropic" },
    { id: "llama-2", name: "Llama 2", provider: "Meta" },
    { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
  ];

  const currentModel = models.find(m => m.id === value) || models[0];

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
              "text-card-foreground hover:bg-accent-blue/10 cursor-pointer px-3 py-3 relative",
              model.id === value && "bg-accent-blue/15 text-accent-blue"
            )}
          >
            {model.id === value && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-blue rounded-r" />
            )}
            <div className="flex flex-col ml-1">
              <span className="font-medium text-sm">{model.name}</span>
              <span className="text-xs text-text-tertiary">{model.provider}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}