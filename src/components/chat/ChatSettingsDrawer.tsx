import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const updateSetting = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chat Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={settings.systemPrompt}
              onChange={(e) => updateSetting("systemPrompt", e.target.value)}
              placeholder="You are a helpful AI assistant..."
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Define the AI's behavior and personality
            </p>
          </div>

          <Separator />

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.temperature]}
              onValueChange={([value]) => updateSetting("temperature", value)}
              min={0}
              max={2}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values make output more random, lower values more focused
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Top P</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.topP.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.topP]}
              onValueChange={([value]) => updateSetting("topP", value)}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls diversity via nucleus sampling
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Tokens</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {settings.maxTokens.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[settings.maxTokens]}
              onValueChange={([value]) => updateSetting("maxTokens", value)}
              min={256}
              max={32000}
              step={256}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum length of the response
            </p>
          </div>

          <Separator />

          {/* Stream Response */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Stream Response</Label>
              <p className="text-xs text-muted-foreground">
                Show response as it's being generated
              </p>
            </div>
            <Switch
              checked={settings.streamResponse}
              onCheckedChange={(checked) => updateSetting("streamResponse", checked)}
            />
          </div>

          <Separator />

          {/* Preset Prompts */}
          <div className="space-y-3">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Creative", temp: 1.2, topP: 0.95 },
                { label: "Balanced", temp: 0.7, topP: 0.9 },
                { label: "Precise", temp: 0.3, topP: 0.8 },
                { label: "Deterministic", temp: 0, topP: 1 },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    updateSetting("temperature", preset.temp);
                    updateSetting("topP", preset.topP);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}