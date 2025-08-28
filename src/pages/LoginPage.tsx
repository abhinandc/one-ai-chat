import { useState } from "react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  onLogin?: (token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // Placeholder for Google OAuth integration
    // Replace with your own backend OAuth flow
    try {
      console.log("Google Sign-in initiated");
      // Your backend integration here
      setTimeout(() => {
        const mockToken = "mock-google-token";
        localStorage.setItem("auth-token", mockToken);
        onLogin?.(mockToken);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Google sign-in failed:", error);
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Email sign-in:", { email, password });
      // Your backend authentication here
      setTimeout(() => {
        const mockToken = "mock-email-token";
        localStorage.setItem("auth-token", mockToken);
        onLogin?.(mockToken);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Email sign-in failed:", error);
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-lg",
      "bg-gradient-to-br from-background via-surface-graphite/30 to-background",
      darkMode && "dark"
    )}>
      {/* Dark Mode Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDarkMode}
        className="fixed top-lg right-lg z-50"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="w-full max-w-md space-y-xl">
        {/* Logo/Branding */}
        <div className="text-center space-y-md">
          <h1 className="text-4xl font-bold text-text-primary font-display">
            OneAI
          </h1>
          <p className="text-lg text-text-secondary">
            Professional AI platform for modern workflows
          </p>
        </div>

        {/* Login Card */}
        <GlassCard variant="elevated">
          <GlassCardHeader className="text-center">
            <GlassCardTitle className="text-2xl">Welcome back</GlassCardTitle>
            <GlassCardDescription>
              Sign in to your account to continue
            </GlassCardDescription>
          </GlassCardHeader>
          
          <GlassCardContent className="space-y-lg">
            {/* Google Sign-in */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900"
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
                Continue with Google
              </div>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-divider" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-md text-text-tertiary">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-md">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-sm">
                  Email
                </label>
                <GlassInput
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-sm">
                  Password
                </label>
                <div className="relative">
                  <GlassInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="text-center space-y-sm">
              <Button variant="link" className="text-sm text-text-secondary">
                Forgot your password?
              </Button>
              <p className="text-sm text-text-tertiary">
                Don't have an account?{" "}
                <Button variant="link" className="text-accent-blue p-0 h-auto font-medium">
                  Sign up
                </Button>
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-text-quaternary">
            Powered by OneOrigin
          </p>
        </div>
      </div>
    </div>
  );
}