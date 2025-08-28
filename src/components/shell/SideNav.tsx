import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

const navigationItems = [
  { icon: Home, label: "Home", href: "/", shortcut: "g h" },
  { icon: MessageSquare, label: "Chat", href: "/chat", shortcut: "g c" },
  { icon: Bot, label: "Agents", href: "/agents", shortcut: "g a" },
  { icon: Workflow, label: "Automations", href: "/automations", shortcut: "g z" },
  { icon: HardDrive, label: "Model Hub", href: "/models", shortcut: "g m" },
  { icon: FileText, label: "Prompts", href: "/prompts", shortcut: "g p" },
  { icon: Wrench, label: "Tools", href: "/tools", shortcut: "g t" },
  { icon: Play, label: "Playground", href: "/playground", shortcut: "g y" },
  { icon: HelpCircle, label: "Help", href: "/help", shortcut: "?" }
];

interface SideNavProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function SideNav({ collapsed = false, onToggleCollapsed }: SideNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className={cn(
      "h-full flex flex-col bg-surface-graphite/40 backdrop-blur-sm",
      "border-r border-border-primary/50",
      "transition-all duration-normal ease-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <div className="p-md border-b border-border-secondary/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapsed}
          className="w-full justify-start text-text-secondary hover:text-text-primary"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-md space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Button
              key={item.href}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full justify-start gap-3 h-10",
                "text-text-secondary hover:text-text-primary",
                active && "bg-interactive-selected text-accent-blue font-medium",
                collapsed && "px-3 justify-center"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {item.shortcut}
                  </kbd>
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-md border-t border-border-secondary/50">
        {!collapsed && (
          <div className="text-xs text-text-quaternary text-center">
            Powered by OneOrigin
          </div>
        )}
      </div>
    </div>
  );
}