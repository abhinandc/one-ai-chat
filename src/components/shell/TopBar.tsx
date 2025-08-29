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
    <header className="fixed-header glass-toolbar border-b border-border-primary bg-surface-graphite/95 backdrop-blur-xl">
      <div className="max-w-8xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary">
                <span className="text-sm font-bold text-primary-foreground">AI</span>
              </div>
              <h1 className="text-xl font-bold text-text-primary">OneAI</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-text-secondary hover:text-accent-blue hover:bg-surface-graphite-hover transition-all duration-normal"
                onClick={() => window.location.href = '/'}
              >
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-text-secondary hover:text-accent-blue hover:bg-surface-graphite-hover transition-all duration-normal"
                onClick={() => window.location.href = '/chat'}
              >
                Chat
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-text-secondary hover:text-accent-blue hover:bg-surface-graphite-hover transition-all duration-normal"
                onClick={() => window.location.href = '/agents'}
              >
                Agents
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-text-secondary hover:text-accent-blue hover:bg-surface-graphite-hover transition-all duration-normal"
                onClick={() => window.location.href = '/automations'}
              >
                Automations
              </Button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <GlassInput
                variant="search"
                placeholder="Search anything..."
                className="pl-10 pr-12 glass-ios hover:glow-primary transition-all duration-normal"
                onClick={onOpenCommandPalette}
                readOnly
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-tertiary bg-surface-graphite border border-border-secondary rounded-md">
                  <Command className="h-3 w-3" />
                  K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleDarkMode}
              className="text-text-secondary hover:text-accent-blue hover:bg-surface-graphite-hover hover:scale-110 transition-all duration-normal rounded-lg"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-text-secondary hover:text-accent-blue hover:bg-surface-graphite-hover hover:scale-110 transition-all duration-normal rounded-lg"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-ios border-border-primary shadow-lg z-50 glow-primary">
                <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite-hover transition-colors duration-normal">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite-hover transition-colors duration-normal">
                  <Command className="mr-2 h-4 w-4" />
                  <span>Keyboard Shortcuts</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border-secondary" />
                <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite-hover transition-colors duration-normal">
                  <span>API Keys</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite-hover transition-colors duration-normal">
                  <span>Billing</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-text-secondary hover:text-accent-blue hover:bg-surface-graphite-hover hover:scale-110 transition-all duration-normal rounded-lg"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-ios border-border-primary shadow-lg z-50 glow-primary">
                <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite-hover transition-colors duration-normal">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-card-foreground hover:bg-surface-graphite-hover transition-colors duration-normal">
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border-secondary" />
                <DropdownMenuItem 
                  className="text-accent-red hover:bg-accent-red/10 transition-colors duration-normal"
                  onClick={onLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
        </div>
      </div>
    </header>
  );
}