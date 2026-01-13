"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Bot, Sparkles, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AIModel {
  value: string;
  name: string;
  description: string;
  provider: string;
  icon?: React.ReactNode;
}

const defaultModels: AIModel[] = [
  {
    value: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Most capable model for complex tasks",
    provider: "Anthropic",
    icon: <Brain className="size-4 text-purple-500" />,
  },
  {
    value: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    description: "Balanced performance and speed",
    provider: "Anthropic",
    icon: <Brain className="size-4 text-purple-400" />,
  },
  {
    value: "gpt-4o",
    name: "GPT-4o",
    description: "Multimodal flagship model",
    provider: "OpenAI",
    icon: <Sparkles className="size-4 text-green-500" />,
  },
  {
    value: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and cost-effective",
    provider: "OpenAI",
    icon: <Zap className="size-4 text-green-400" />,
  },
  {
    value: "gemini-pro",
    name: "Gemini Pro",
    description: "Google's advanced model",
    provider: "Google",
    icon: <Bot className="size-4 text-blue-500" />,
  },
];

export interface ModelSwitcherProps {
  models?: AIModel[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function ModelSwitcher({
  models = defaultModels,
  value,
  onValueChange,
  className,
  placeholder = "Select model...",
}: ModelSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value || models[0]?.value);

  const currentValue = value ?? internalValue;
  const selectedModel = models.find((model) => model.value === currentValue);

  const handleSelect = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-testid="model-selector"
          className={cn(
            "w-[240px] justify-between gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedModel?.icon || <Bot className="size-4" />}
            <span className="truncate">
              {selectedModel?.name || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup heading="Available Models">
              {models.map((model) => (
                <CommandItem
                  key={model.value}
                  value={model.value}
                  onSelect={handleSelect}
                  className="flex items-start gap-3 px-3 py-2"
                >
                  <div className="flex size-6 items-center justify-center shrink-0 mt-0.5">
                    {model.icon || <Bot className="size-4" />}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.provider}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {model.description}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      currentValue === model.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

ModelSwitcher.displayName = "ModelSwitcher";
