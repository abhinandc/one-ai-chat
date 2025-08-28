import { Search, Settings, User, Command } from "lucide-react";
import { GlassToolbar, GlassToolbarSection, GlassToolbarSeparator } from "@/components/ui/GlassToolbar";
import { GlassInput } from "@/components/ui/GlassInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

export function TopBar({ onToggleSidebar, onOpenCommandPalette }: TopBarProps) {
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
          <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </GlassToolbarSection>
    </GlassToolbar>
  );
}