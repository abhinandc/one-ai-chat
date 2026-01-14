import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Grid } from "lucide-react";

interface AutomationsLayoutProps {
  children: React.ReactNode;
}

export function AutomationsLayout({ children }: AutomationsLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground font-sf-pro">
        {/* Dot Grid Background - Using CSS variable for subtle opacity */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]" 
            style={{
              backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-1 flex-col">
           {/* Top Command Bar */}
           <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4">
             <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
             <div className="flex-1">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <Grid className="h-4 w-4" />
                 <span>Automations</span>
               </div>
             </div>
           </header>

           {/* Main Workspace */}
           <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
             <div className="mx-auto max-w-7xl h-full flex flex-col">
               {children}
             </div>
           </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
