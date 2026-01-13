import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopBar } from "@/components/shell/TopBar";
import { SideNav } from "@/components/shell/SideNav";
import { Footer } from "@/components/ui/Footer";
import { CommandPalette } from "@/components/CommandPalette";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { realtimeService } from "@/services/realtimeService";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
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
  const user = useCurrentUser();

  // Check for existing auth token on app load
  useEffect(() => {
    const authToken = localStorage.getItem("oneedge_auth_token");
    if (authToken) {
      setIsAuthenticated(true);
    }
  }, []);

  // Set up real-time subscriptions for authenticated users
  useEffect(() => {
    if (user?.email && isAuthenticated) {
      const unsubscribe = realtimeService.subscribeToUserEvents(user.email, (event) => {
        console.log("Real-time event:", event);
        // Handle real-time updates
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user?.email, isAuthenticated]);

  const handleLogin = (token: string) => {
    localStorage.setItem("oneedge_auth_token", token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("oneedge_auth_token");
    localStorage.removeItem("oneedge_user");
    realtimeService.unsubscribeAll();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/oauth2/callback" element={<AuthCallback />} />
                <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen w-full bg-background">
              <TopBar 
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                onLogout={handleLogout}
              />
              
              <SideNav 
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
              
              <main className={cn(
                "pt-14 pb-12 min-h-screen transition-all duration-normal ease-out overflow-auto",
                sidebarCollapsed ? "pl-14" : "pl-52"
              )}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/automations" element={<Automations />} />
                  <Route path="/models" element={<ModelsHub />} />
                  <Route path="/prompts" element={<PromptLibrary />} />
                  <Route path="/playground" element={<Playground />} />
                  <Route path="/tools" element={<ToolsGallery />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/theme" element={<Theme />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              <Footer />
              
              <CommandPalette 
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
              />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
