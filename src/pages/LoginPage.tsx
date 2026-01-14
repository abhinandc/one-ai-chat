import { useEffect, useState } from "react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";

interface LoginPageProps {
  onLogin?: (token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDarkMode = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setDarkMode(shouldUseDarkMode);
    if (shouldUseDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Store user info for the app
        localStorage.setItem("oneedge_user", JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          picture: session.user.user_metadata?.avatar_url,
        }));
        localStorage.setItem("oneedge_auth_token", session.access_token);
        onLogin?.(session.access_token);
      }
    };

    checkSession();

    // Listen for auth state changes (handles OAuth callback)
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        localStorage.setItem("oneedge_user", JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          picture: session.user.user_metadata?.avatar_url,
        }));
        localStorage.setItem("oneedge_auth_token", session.access_token);
        onLogin?.(session.access_token);
      }
    }) ?? { subscription: null };

    return () => {
      subscription?.unsubscribe();
    };
  }, [onLogin]);

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

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError("Supabase is not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // If successful, the page will redirect to Google
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        localStorage.setItem("oneedge_user", JSON.stringify({
          email: data.user?.email,
          name: data.user?.user_metadata?.full_name || email.split("@")[0],
        }));
        localStorage.setItem("oneedge_auth_token", data.session.access_token);
        onLogin?.(data.session.access_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-lg bg-gradient-to-br from-background via-surface-graphite/30 to-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDarkMode}
        className="fixed top-lg right-lg z-50 text-text-secondary hover:text-text-primary"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="w-full max-w-md space-y-xl">
        <div className="flex flex-col items-center justify-center space-y-md w-full">
          <img
            src={darkMode ? "/logo-dark.svg" : "/logo-light.svg"}
            alt="OneEdge"
            className="h-32 w-auto"
          />
          <p className="text-lg text-text-secondary text-center">OneOrigin's Unified AI Platform</p>
        </div>

        <GlassCard variant="elevated" className="bg-card border-border-primary">
          <GlassCardHeader className="text-center">
            <GlassCardTitle className="text-2xl text-card-foreground">Welcome back</GlassCardTitle>
            <GlassCardDescription className="text-text-secondary">
              Sign in to your account to continue
            </GlassCardDescription>
          </GlassCardHeader>

          <GlassCardContent className="space-y-lg">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-card text-card-foreground border border-border-primary hover:bg-surface-graphite-hover"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? "Signing in..." : "Continue with Google (oneorigin.us)"}
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-divider" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-md text-text-tertiary">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-md">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-sm">
                  Email
                </label>
                <GlassInput
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="bg-card text-card-foreground border-border-primary"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-sm">
                  Password
                </label>
                <div className="relative">
                  <GlassInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-12 bg-card text-card-foreground border-border-primary"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-text-secondary hover:text-text-primary"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading || !email || !password}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" className="text-sm text-text-secondary hover:text-text-primary">
                Forgot your password?
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        <div className="text-center">
          <p className="text-sm text-text-quaternary">Powered by OneOrigin</p>
        </div>
      </div>
    </div>
  );
}
