import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopBar } from "@/components/shell/TopBar";
import { SideNav } from "@/components/shell/SideNav";
import { CommandPalette } from "@/components/CommandPalette";
import Index from "./pages/Index";
import Theme from "./pages/Theme";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen w-full bg-background">
            <TopBar 
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            />
            
            <div className="flex h-[calc(100vh-64px)] w-full">
              <SideNav 
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
              
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/theme" element={<Theme />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            
            <CommandPalette 
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
            />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
