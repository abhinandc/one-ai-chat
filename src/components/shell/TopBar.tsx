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
import { PreferencesModal } from "@/components/modals/PreferencesModal";
import { ApiKeysModal } from "@/components/modals/ApiKeysModal";
import { BillingModal } from "@/components/modals/BillingModal";
import { ProfileModal } from "@/components/modals/ProfileModal";
import { AccountSettingsModal } from "@/components/modals/AccountSettingsModal";
import { ModelsSettingsModal } from "@/components/modals/ModelsSettingsModal";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onLogout?: () => void;
}

export function TopBar({ onToggleSidebar, onOpenCommandPalette, onLogout }: TopBarProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [modelsSettingsOpen, setModelsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleOpenApiKeys = (event: Event) => {
      event.preventDefault();
      setApiKeysOpen(true);
    };

    window.addEventListener('open-api-keys', handleOpenApiKeys);
    return () => {
      window.removeEventListener('open-api-keys', handleOpenApiKeys);
    };
  }, []);

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
    <>
    <GlassToolbar className="flex items-center justify-between">
      <GlassToolbarSection>
        <div className="flex items-center gap-md">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="text-text-secondary hover:text-text-primary"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Global Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <GlassInput
              placeholder="Search anything..."
              className="pl-10"
              variant="search"
            />
          </div>
        </div>
      </GlassToolbarSection>

      <GlassToolbarSeparator />

      <GlassToolbarSection>
        <div className="flex items-center gap-sm">
          {/* Command Palette */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCommandPalette}
            className="text-text-secondary hover:text-text-primary"
          >
            <Command className="h-4 w-4" />
          </Button>

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
              <Button
                variant="ghost"
                size="sm"
                className="text-text-secondary hover:text-text-primary"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border-primary shadow-lg z-50">
              <DropdownMenuItem 
                className="text-card-foreground hover:bg-surface-graphite cursor-pointer"
                onClick={() => setPreferencesOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-card-foreground hover:bg-surface-graphite cursor-pointer"
                onClick={onOpenCommandPalette}
              >
                <Command className="mr-2 h-4 w-4" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-secondary" />
              <DropdownMenuItem 
                className="text-card-foreground hover:bg-surface-graphite cursor-pointer"
                onClick={() => setApiKeysOpen(true)}
              >
                <span>API Keys</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-card-foreground hover:bg-surface-graphite cursor-pointer"
                onClick={() => setBillingOpen(true)}
              >
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-card-foreground hover:bg-surface-graphite cursor-pointer"
                onClick={() => setModelsSettingsOpen(true)}
              >
                <span>Models Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-text-secondary hover:text-text-primary"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border-primary shadow-lg z-50">
              <DropdownMenuItem 
                className="text-card-foreground hover:bg-surface-graphite cursor-pointer"
                onClick={() => setProfileOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-card-foreground hover:bg-surface-graphite cursor-pointer"
                onClick={() => setAccountSettingsOpen(true)}
              >
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-secondary" />
              <DropdownMenuItem 
                className="text-accent-red hover:bg-accent-red/10 cursor-pointer"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </GlassToolbarSection>
    </GlassToolbar>

    {/* Modals */}
    <PreferencesModal isOpen={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    <ApiKeysModal isOpen={apiKeysOpen} onClose={() => setApiKeysOpen(false)} />
    <BillingModal isOpen={billingOpen} onClose={() => setBillingOpen(false)} />
    <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    <AccountSettingsModal isOpen={accountSettingsOpen} onClose={() => setAccountSettingsOpen(false)} />
    <ModelsSettingsModal open={modelsSettingsOpen} onOpenChange={setModelsSettingsOpen} />
    </>
  );
}
