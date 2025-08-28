import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  MessageSquare,
  Bot,
  Workflow,
  HardDrive,
  FileText,
  Wrench,
  Play,
  HelpCircle,
  Search,
  Settings,
  User
} from "lucide-react";

const navigationCommands = [
  { icon: Home, label: "Go to Home", href: "/", shortcut: "g h" },
  { icon: MessageSquare, label: "Go to Chat", href: "/chat", shortcut: "g c" },
  { icon: Bot, label: "Go to Agents", href: "/agents", shortcut: "g a" },
  { icon: Workflow, label: "Go to Automations", href: "/automations", shortcut: "g z" },
  { icon: HardDrive, label: "Go to Model Hub", href: "/models", shortcut: "g m" },
  { icon: FileText, label: "Go to Prompts", href: "/prompts", shortcut: "g p" },
  { icon: Wrench, label: "Go to Tools", href: "/tools", shortcut: "g t" },
  { icon: Play, label: "Go to Playground", href: "/playground", shortcut: "g y" },
  { icon: HelpCircle, label: "Show Help", href: "/help", shortcut: "?" }
];

const actionCommands = [
  { icon: MessageSquare, label: "New Chat", action: "new-chat" },
  { icon: Bot, label: "Create Agent", action: "create-agent" },
  { icon: FileText, label: "New Prompt", action: "new-prompt" },
  { icon: Settings, label: "Open Settings", action: "settings" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      
      if (e.key === "?" && !open) {
        e.preventDefault();
        navigate("/help");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange, navigate]);

  const handleSelect = (value: string) => {
    const navCommand = navigationCommands.find(cmd => cmd.href === value);
    const actionCommand = actionCommands.find(cmd => cmd.action === value);
    
    if (navCommand) {
      navigate(navCommand.href);
      onOpenChange(false);
    } else if (actionCommand) {
      // Handle action commands
      console.log("Action:", actionCommand.action);
      onOpenChange(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="glass-ios border-0">
        <CommandInput 
          placeholder="Type a command or search..." 
          value={search}
          onValueChange={setSearch}
          className="border-0 bg-transparent text-text-primary placeholder:text-text-tertiary"
        />
        <CommandList className="max-h-96">
          <CommandEmpty className="py-6 text-center text-text-secondary">
            No results found.
          </CommandEmpty>
          
          <CommandGroup heading="Navigation" className="text-text-secondary">
            {navigationCommands.map((command) => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.href}
                  value={command.href}
                  onSelect={handleSelect}
                  className="flex items-center gap-3 px-lg py-md text-text-primary hover:bg-interactive-hover cursor-pointer"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{command.label}</span>
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    {command.shortcut}
                  </kbd>
                </CommandItem>
              );
            })}
          </CommandGroup>
          
          <CommandSeparator className="bg-divider" />
          
          <CommandGroup heading="Actions" className="text-text-secondary">
            {actionCommands.map((command) => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.action}
                  value={command.action}
                  onSelect={handleSelect}
                  className="flex items-center gap-3 px-lg py-md text-text-primary hover:bg-interactive-hover cursor-pointer"
                >
                  <Icon className="h-4 w-4" />
                  <span>{command.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}