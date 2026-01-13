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
import { SiaWidget } from "@/components/sia";
import { supabase, signOut } from "@/integrations/supabase";
import { authLogger as logger } from "@/lib/logger";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import SharedConversation from "./pages/SharedConversation";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Agents from "./pages/Agents";
import ModelsHub from "./pages/ModelsHub";
import PromptLibrary from "./pages/PromptLibrary";
import Automations from "./pages/Automations";
import AIGallery from "./pages/AIGallery";
import AdminSettings from "./pages/AdminSettings";
import Help from "./pages/Help";
import Theme from "./pages/Theme";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const user = useCurrentUser();

  // Check for existing Supabase session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        logger.error("Error checking auth session", error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug("Auth state changed", { event });
        setIsAuthenticated(!!session);

        if (event === "SIGNED_OUT") {
          // Clean up on sign out
          localStorage.removeItem("oneedge_user");
          realtimeService.unsubscribeAll();
        } else if (event === "SIGNED_IN" && session?.user) {
          // Store user profile on sign in
          const user = session.user;
          const userProfile = {
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
            picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            givenName: user.user_metadata?.given_name,
            familyName: user.user_metadata?.family_name,
          };
          localStorage.setItem("oneedge_user", JSON.stringify(userProfile));
          window.dispatchEvent(new StorageEvent("storage", { key: "oneedge_user" }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Set up real-time subscriptions for authenticated users
  useEffect(() => {
    if (user?.email && isAuthenticated) {
      const unsubscribe = realtimeService.subscribeToUserEvents(user.email, (event) => {
        logger.debug("Real-time event received", { event });
        // Handle real-time updates
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user?.email, isAuthenticated]);

  const handleLogin = () => {
    // Login is handled by Supabase Auth
    // This callback is just for backward compatibility
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Cleanup is handled by onAuthStateChange
    } catch (error) {
      logger.error("Logout error", error);
      // Force cleanup even on error
      localStorage.removeItem("oneedge_user");
      realtimeService.unsubscribeAll();
      setIsAuthenticated(false);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="skeleton w-12 h-12 rounded-xl bg-primary/20 animate-pulse mx-auto" />
          <div className="skeleton w-48 h-5 rounded bg-muted animate-pulse mx-auto" />
        </div>
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
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/share/:token" element={<SharedConversation />} />
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
                  <Route path="/ai-gallery" element={<AIGallery />} />
                  <Route path="/admin" element={<AdminSettings />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/theme" element={<Theme />} />
                  <Route path="/share/:token" element={<SharedConversation />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              <Footer />
              
              <CommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
              />

              {/* Sia - ElevenLabs Conversational AI Widget (hardUIrules.md line 7) */}
              <SiaWidget className="fixed bottom-20 right-4 z-50" />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
