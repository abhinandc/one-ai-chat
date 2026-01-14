import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ChatBubbleIcon,
  CubeIcon,
  LoopIcon,
  DesktopIcon,
  FileTextIcon,
  GearIcon,
  PlayIcon,
  QuestionMarkCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

const navigationItems = [
  { icon: HomeIcon, label: "Home", href: "/", shortcut: "g h" },
  { icon: ChatBubbleIcon, label: "Chat", href: "/chat", shortcut: "g c" },
  { icon: CubeIcon, label: "Agents", href: "/agents", shortcut: "g a" },
  { icon: LoopIcon, label: "Automations", href: "/automations", shortcut: "g z" },
  { icon: DesktopIcon, label: "Model Hub", href: "/models", shortcut: "g m" },
  { icon: FileTextIcon, label: "Prompts", href: "/prompts", shortcut: "g p" },
  { icon: GearIcon, label: "Tools", href: "/tools", shortcut: "g t" },
  { icon: PlayIcon, label: "Playground", href: "/playground", shortcut: "g y" },
  { icon: QuestionMarkCircledIcon, label: "Help", href: "/help", shortcut: "?" }
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
    <aside className={cn(
      "fixed top-16 left-0 bottom-12 z-40 flex flex-col",
      "bg-surface-graphite border-r border-border-primary",
      "transition-all duration-normal ease-out",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                "w-full justify-start gap-3 h-9",
                "text-text-secondary hover:text-text-primary",
                active && "bg-interactive-selected text-accent-blue font-medium",
                collapsed && "px-2 justify-center"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-left text-sm">{item.label}</span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Collapse Toggle at Bottom */}
      <div className="flex-shrink-0 p-3 border-t border-border-secondary/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapsed}
          className="w-full h-9 text-text-secondary hover:text-text-primary"
        >
          {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}