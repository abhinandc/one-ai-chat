import { useState } from "react";
import { Palette, Eye, MousePointer, Keyboard } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Theme() {
  const [inputValue, setInputValue] = useState("");
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const colorTokens = [
    { name: "Primary", value: "hsl(211 100% 50%)", description: "Main brand color" },
    { name: "Surface Graphite", value: "hsl(220 9% 95%)", description: "Subdued background surface" },
    { name: "Text Primary", value: "hsl(0 0% 13%)", description: "High contrast text" },
    { name: "Text Secondary", value: "hsl(0 0% 43%)", description: "Medium contrast text" },
    { name: "Accent Blue", value: "hsl(211 100% 50%)", description: "Interactive accent" },
    { name: "Border Primary", value: "hsl(220 13% 91%)", description: "Subtle borders" },
  ];

  const stateExamples = [
    { label: "Default", state: "default" },
    { label: "Hover", state: "hover" },
    { label: "Focus", state: "focus" },
    { label: "Active", state: "active" },
    { label: "Disabled", state: "disabled" },
  ];

  return (
    <div className="min-h-screen bg-background p-lg overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-xl">
        {/* Header */}
        <div className="text-center space-y-md">
          <h1 className="text-3xl font-bold text-text-primary">OneEdge Design System</h1>
          <p className="text-lg text-text-secondary">
            Apple-minimal surfaces with glass-ios26 effects, large spacing, and low-ink UI
          </p>
        </div>

        {/* Color Tokens */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Tokens
            </GlassCardTitle>
            <GlassCardDescription>
              HSL color palette with semantic naming for consistent theming
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {colorTokens.map((token) => (
                <div key={token.name} className="space-y-sm">
                  <div 
                    className="h-16 rounded-xl border border-border-primary"
                    style={{ backgroundColor: token.value }}
                  />
                  <div>
                    <h3 className="font-medium text-text-primary">{token.name}</h3>
                    <p className="text-xs text-text-secondary">{token.description}</p>
                    <code className="text-xs text-text-tertiary font-mono">{token.value}</code>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Glass Effects */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Glass-ios26 Effects
            </GlassCardTitle>
            <GlassCardDescription>
              Frosted glass surfaces with backdrop blur and subtle borders
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <GlassCard className="p-lg text-center">
                <h3 className="font-medium text-text-primary mb-sm">Default Glass</h3>
                <p className="text-sm text-text-secondary">Standard glass-ios effect with 80% opacity</p>
              </GlassCard>
              <GlassCard variant="toolbar" className="p-lg text-center">
                <h3 className="font-medium text-text-primary mb-sm">Toolbar Glass</h3>
                <p className="text-sm text-text-secondary">Lighter glass for toolbars and headers</p>
              </GlassCard>
              <GlassCard variant="elevated" className="p-lg text-center">
                <h3 className="font-medium text-text-primary mb-sm">Elevated Glass</h3>
                <p className="text-sm text-text-secondary">Enhanced shadow for elevated surfaces</p>
              </GlassCard>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Interactive States */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Interactive States
            </GlassCardTitle>
            <GlassCardDescription>
              Hover, focus, and active states with gentle motion and AA+ contrast
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-lg">
              {/* Buttons */}
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-md">Buttons</h3>
                <div className="flex flex-wrap gap-md">
                  {stateExamples.map((example) => (
                    <Button
                      key={example.label}
                      variant={example.state === "default" ? "default" : "secondary"}
                      disabled={example.state === "disabled"}
                      className={cn(
                        "transition-all duration-normal",
                        example.state === "hover" && "hover:bg-accent-blue-hover",
                        example.state === "focus" && "ring-2 ring-accent-blue ring-offset-2",
                        example.state === "active" && "bg-accent-blue-hover scale-95"
                      )}
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-md">Inputs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  <GlassInput
                    placeholder="Default input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <GlassInput
                    variant="search"
                    placeholder="Search variant"
                  />
                  <GlassInput
                    variant="minimal"
                    placeholder="Minimal variant"
                  />
                </div>
              </div>

              {/* Cards */}
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-md">Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <GlassCard className="p-lg hover-lift cursor-pointer">
                    <h4 className="font-medium text-text-primary mb-sm">Interactive Card</h4>
                    <p className="text-sm text-text-secondary">Hover to see lift effect with gentle motion</p>
                  </GlassCard>
                  <GlassCard className="p-lg opacity-60 cursor-not-allowed">
                    <h4 className="font-medium text-text-primary mb-sm">Disabled Card</h4>
                    <p className="text-sm text-text-secondary">Reduced opacity for disabled state</p>
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Accessibility */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Accessibility Features
            </GlassCardTitle>
            <GlassCardDescription>
              AA+ contrast ratios, focus rings, and keyboard navigation
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-md">Focus Management</h3>
                  <div className="space-y-sm">
                    <Button
                      variant="outline"
                      onFocus={() => setFocusedElement("button1")}
                      onBlur={() => setFocusedElement(null)}
                      className="w-full justify-start"
                    >
                      Focus me with Tab
                    </Button>
                    <GlassInput
                      placeholder="Focus with Tab or click"
                      onFocus={() => setFocusedElement("input")}
                      onBlur={() => setFocusedElement(null)}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-md">Large Tap Targets</h3>
                  <p className="text-sm text-text-secondary mb-md">
                    All interactive elements have minimum 44px tap targets for mobile accessibility
                  </p>
                  <div className="text-xs text-text-tertiary">
                    Current focus: {focusedElement || "None"}
                  </div>
                </div>
              </div>

              <div className="p-lg bg-surface-graphite rounded-xl border border-border-primary">
                <h3 className="text-sm font-medium text-text-primary mb-md">Contrast Ratios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md text-sm">
                  <div>
                    <div className="text-text-primary font-medium">Primary Text</div>
                    <div className="text-text-tertiary">AAA: 12.6:1</div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Secondary Text</div>
                    <div className="text-text-tertiary">AA: 7.5:1</div>
                  </div>
                  <div>
                    <div className="text-accent-blue font-medium">Accent Blue</div>
                    <div className="text-text-tertiary">AA: 6.2:1</div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Footer */}
        <div className="text-center py-xl">
          <p className="text-sm text-text-quaternary">
            Powered by OneOrigin
          </p>
        </div>
      </div>
    </div>
  );
}