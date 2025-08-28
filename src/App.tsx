import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopBar } from "@/components/shell/TopBar";
import { SideNav } from "@/components/shell/SideNav";
import { CommandPalette } from "@/components/CommandPalette";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Agents from "./pages/Agents";
import ModelsHub from "./pages/ModelsHub";
import PromptLibrary from "./pages/PromptLibrary";
import Automations from "./pages/Automations";
import Playground from "./pages/Playground";
import ToolsGallery from "./pages/ToolsGallery";
import Help from "./pages/Help";
import Theme from "./pages/Theme";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing auth token on app load
  useState(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      setIsAuthenticated(true);
    }
  });

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    // Navigate to dashboard or home
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    setIsAuthenticated(false);
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LoginPage onLogin={handleLogin} />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Main authenticated app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen w-full bg-background overflow-hidden">
            <TopBar 
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onLogout={handleLogout}
            />
            
            <div className="flex h-[calc(100vh-64px)] w-full">
              <SideNav 
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
              
              <main className="flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/models" element={<ModelsHub />} />
                  <Route path="/prompts" element={<PromptLibrary />} />
                  <Route path="/automations" element={<Automations />} />
                  <Route path="/playground" element={<Playground />} />
                  <Route path="/tools" element={<ToolsGallery />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/theme" element={<Theme />} />
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
