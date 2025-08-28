import { useState, useEffect } from "react";
import { Search, Settings, User, Command, Moon, Sun, LogOut } from "lucide-react";
import { GlassToolbar, GlassToolbarSection, GlassToolbarSeparator } from "@/components/ui/GlassToolbar";
import { GlassInput } from "@/components/ui/GlassInput";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onLogout?: () => void;
}

export function TopBar({ onToggleSidebar, onOpenCommandPalette, onLogout }: TopBarProps) {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDarkMode = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    
    setDarkMode(shouldUseDarkMode);
    if (shouldUseDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <GlassToolbar className="flex items-center justify-between">
      <GlassToolbarSection>
        <div className="flex items-center gap-md">
          <h1 className="text-lg font-semibold text-text-primary">OneAI</h1>
          <GlassToolbarSeparator />
          <nav className="flex items-center gap-sm">
            <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
              Home
            </Button>
            <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
              Chat
            </Button>
            <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
              Agents
            </Button>
          </nav>
        </div>
      </GlassToolbarSection>

      <GlassToolbarSection className="flex-1 max-w-md mx-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <GlassInput
            variant="search"
            placeholder="Search or press ⌘K"
            className="pl-10 pr-12"
            onClick={onOpenCommandPalette}
            readOnly
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-tertiary bg-surface-graphite border border-border-secondary rounded">
              <Command className="h-3 w-3" />
              K
            </kbd>
          </div>
        </div>
      </GlassToolbarSection>

      <GlassToolbarSection>
        <div className="flex items-center gap-sm">
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleDarkMode}
            className="text-text-secondary hover:text-text-primary"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border-primary shadow-lg z-50">
              <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite">
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite">
                <Command className="mr-2 h-4 w-4" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-secondary" />
              <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite">
                <span>API Keys</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite">
                <span>Billing</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border-primary shadow-lg z-50">
              <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite">
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-secondary" />
              <DropdownMenuItem 
                className="text-accent-red hover:bg-accent-red/10"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </GlassToolbarSection>
    </GlassToolbar>
  );
}