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
import { supabase } from "@/services/supabaseClient";
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
  const [isLoading, setIsLoading] = useState(true);
  const user = useCurrentUser();

  // Check for Supabase session on app load
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        localStorage.setItem("oneedge_user", JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          picture: session.user.user_metadata?.avatar_url,
        }));
        localStorage.setItem("oneedge_auth_token", session.access_token);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        localStorage.setItem("oneedge_user", JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          picture: session.user.user_metadata?.avatar_url,
        }));
        localStorage.setItem("oneedge_auth_token", session.access_token);
        setIsAuthenticated(true);
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("oneedge_auth_token");
        localStorage.removeItem("oneedge_user");
        setIsAuthenticated(false);
      }
    }) ?? { subscription: null };

    return () => {
      subscription?.unsubscribe();
    };
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

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("oneedge_auth_token");
    localStorage.removeItem("oneedge_user");
    realtimeService.unsubscribeAll();
    setIsAuthenticated(false);
  };

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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

  // Check if current route should hide footer
  const shouldHideFooter = window.location.pathname === '/chat';

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent 
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              commandPaletteOpen={commandPaletteOpen}
              setCommandPaletteOpen={setCommandPaletteOpen}
              onLogout={handleLogout}
            />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Separate component to use useLocation
const AppContent = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  commandPaletteOpen,
  setCommandPaletteOpen,
  onLogout,
}: {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  onLogout: () => void;
}) => {
  const location = window.location;
  const isChat = location.pathname === '/chat';

  return (
    <div className="min-h-screen w-full bg-background">
      <TopBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onLogout={onLogout}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      <SideNav 
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-normal ease-out",
        sidebarCollapsed ? "pl-14" : "pl-52",
        isChat ? "" : "pb-12 overflow-auto"
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
      
      {!isChat && <Footer sidebarCollapsed={sidebarCollapsed} />}
      
      <CommandPalette 
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
};

export default App;
