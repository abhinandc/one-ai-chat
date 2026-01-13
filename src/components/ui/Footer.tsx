import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  sidebarCollapsed?: boolean;
}

export function Footer({ sidebarCollapsed = false }: FooterProps) {
  return (
    <footer className={cn(
      "fixed bottom-0 right-0 z-50 h-12 border-t border-border-primary bg-background transition-all duration-normal ease-out",
      sidebarCollapsed ? "left-14" : "left-52"
    )}>
      <div className="h-full flex items-center justify-center px-6">
        <p className="text-xs text-text-tertiary">
          &copy; 2026 OneOrigin Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}




