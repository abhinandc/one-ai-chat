import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ChatSettings {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  streamResponse: boolean;
}

interface ChatSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
}

export function ChatSettingsDrawer({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: ChatSettingsDrawerProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync local settings when drawer opens or settings change externally
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, open]);

  const updateLocalSetting = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto bg-background border-l-0">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-lg font-semibold">Model Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          {/* System Prompt */}
          <div className="space-y-3">
            <Label htmlFor="system-prompt" className="text-sm font-medium">
              System Prompt
            </Label>
            <Textarea
              id="system-prompt"
              value={localSettings.systemPrompt}
              onChange={(e) => updateLocalSetting("systemPrompt", e.target.value)}
              placeholder="You are a helpful AI assistant..."
              className="min-h-[140px] resize-none bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Define the AI's behavior, role, and personality for this conversation
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Temperature</Label>
              <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {localSettings.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[localSettings.temperature]}
              onValueChange={([value]) => updateLocalSetting("temperature", value)}
              min={0}
              max={2}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values = more creative, lower = more focused and deterministic
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Top P (Nucleus Sampling)</Label>
              <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {localSettings.topP.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[localSettings.topP]}
              onValueChange={([value]) => updateLocalSetting("topP", value)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls diversity - lower values make output more focused
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Max Response Length</Label>
              <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {localSettings.maxTokens.toLocaleString()} tokens
              </span>
            </div>
            <Slider
              value={[localSettings.maxTokens]}
              onValueChange={([value]) => updateLocalSetting("maxTokens", value)}
              min={256}
              max={32000}
              step={256}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of tokens in the AI response
            </p>
          </div>

          {/* Stream Response */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Stream Response</Label>
              <p className="text-xs text-muted-foreground">
                Show response as it's being generated
              </p>
            </div>
            <Switch
              checked={localSettings.streamResponse}
              onCheckedChange={(checked) => updateLocalSetting("streamResponse", checked)}
            />
          </div>

          {/* Quick Presets */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Creative", temp: 1.2, topP: 0.95, desc: "Imaginative responses" },
                { label: "Balanced", temp: 0.7, topP: 0.9, desc: "General purpose" },
                { label: "Precise", temp: 0.3, topP: 0.8, desc: "Focused answers" },
                { label: "Deterministic", temp: 0, topP: 1, desc: "Consistent output" },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto py-3 px-4 flex flex-col items-start gap-0.5 bg-muted/30 hover:bg-muted/50",
                    localSettings.temperature === preset.temp && 
                    localSettings.topP === preset.topP && 
                    "bg-primary/10 ring-1 ring-primary/30"
                  )}
                  onClick={() => {
                    updateLocalSetting("temperature", preset.temp);
                    updateLocalSetting("topP", preset.topP);
                  }}
                >
                  <span className="font-medium text-sm">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 sticky bottom-0 bg-background pb-2">
            <Button 
              className="w-full gap-2" 
              onClick={handleSave}
              disabled={!hasChanges && !saved}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            {hasChanges && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                You have unsaved changes
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
