import { useCallback, useEffect, useState } from "react";
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
import supabaseClient from "@/services/supabaseClient";
import type { GoogleUser } from "@/services/api";

const OAUTH_BRIDGE_KEY = "oneai_oauth_bridge";
const CODE_VERIFIER_KEY = "oneai_oauth_code_verifier";
const STATE_KEY = "oneai_oauth_state";
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  "373908156464-backo99qegd190e3duh54biihe5tg6i9.apps.googleusercontent.com";

interface LoginPageProps {
  onLogin?: (token: string) => void;
}

interface GoogleAuthPayload {
  user: Partial<GoogleUser>;
  tokens?: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    session?: string;
    [key: string]: unknown;
  };
  raw?: unknown;
}

const base64UrlEncode = (input: ArrayBuffer | Uint8Array): string => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const generateCodeVerifier = (): string => {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
};

const decodeJwt = (token?: string | null): Partial<GoogleUser> => {
  if (!token) return {};
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (error) {
    console.warn("Unable to decode id_token", error);
    return {};
  }
};

const fetchUserInfo = async (accessToken: string): Promise<Partial<GoogleUser>> => {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`userinfo_error_${response.status}`);
  }

  return (await response.json()) as Partial<GoogleUser>;
};

const upsertProfile = async (profile: {
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}) => {
  const supabase = supabaseClient;
  if (!supabase) return;

  try {
    await supabase
      .from("app_users")
      .upsert(
        {
          email: profile.email,
          display_name: profile.name ?? null,
          avatar_url: profile.picture ?? null,
          metadata_json: {
            provider: "google",
            givenName: profile.givenName ?? null,
            familyName: profile.familyName ?? null,
            updatedAt: new Date().toISOString(),
          },
        },
        { onConflict: "email" },
      );
  } catch (error) {
    console.warn("Unable to persist profile to Supabase", error);
  }
};

const storeUserLocally = (profile: {
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}) => {
  const stored = {
    email: profile.email,
    name: profile.name,
    givenName: profile.givenName,
    familyName: profile.familyName,
    picture: profile.picture,
  };

  localStorage.setItem("oneai_user", JSON.stringify(stored));
  window.dispatchEvent(new StorageEvent("storage", { key: "oneai_user" }));
};

const clearOauthArtifacts = () => {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [oauthInProgress, setOauthInProgress] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDarkMode = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setDarkMode(shouldUseDarkMode);
    if (shouldUseDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

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

  const finalizeSuccess = useCallback(
    async (payload: GoogleAuthPayload) => {
      const tokens = payload.tokens ?? {};
      const claims = decodeJwt(tokens.id_token as string | undefined);
      const merged: Partial<GoogleUser> = {
        ...claims,
        ...payload.user,
      };

      if ((!merged.email || !merged.name) && tokens.access_token) {
        try {
          const info = await fetchUserInfo(String(tokens.access_token));
          Object.assign(merged, info);
        } catch (error) {
          console.warn("Unable to load Google profile via access token", error);
        }
      }

      const email = merged.email;
      if (!email) {
        throw new Error("missing_email_claim");
      }

      const givenName = merged.given_name;
      const familyName = merged.family_name;
      const displayName =
        merged.name ?? ([givenName, familyName].filter(Boolean).join(" ") || email);
      const picture = merged.picture;

      storeUserLocally({
        email,
        name: displayName,
        givenName: givenName ?? undefined,
        familyName: familyName ?? undefined,
        picture: picture ?? undefined,
      });

      if (tokens.session) {
        sessionStorage.setItem("oneai_session_token", String(tokens.session));
      }
      if (tokens.access_token) {
        sessionStorage.setItem("oneai_google_access_token", String(tokens.access_token));
      }
      if (tokens.id_token) {
        sessionStorage.setItem("oneai_google_id_token", String(tokens.id_token));
      }

      await upsertProfile({
        email,
        name: displayName,
        givenName: givenName ?? undefined,
        familyName: familyName ?? undefined,
        picture: picture ?? undefined,
      });

      const authToken = `google_oauth_${Date.now()}`;
      localStorage.setItem("oneedge_auth_token", authToken);
      onLogin?.(authToken);
    },
    [onLogin],
  );

  const handleGoogleSignIn = useCallback(async () => {
    if (oauthInProgress || isLoading) {
      console.log("OAuth already in progress, ignoring click");
      return;
    }

    setIsLoading(true);
    setOauthInProgress(true);

    let popup: Window | null = null;
    let oauthCompleted = false;
    let messageListenerAdded = false;
    let storageListenerAdded = false;

    const cleanup = () => {
      if (messageListenerAdded) {
        window.removeEventListener("message", handleMessage);
        messageListenerAdded = false;
      }
      if (storageListenerAdded) {
        window.removeEventListener("storage", handleStorage);
        storageListenerAdded = false;
      }
      clearOauthArtifacts();
      setIsLoading(false);
      setOauthInProgress(false);
    };

    const closePopupSafely = () => {
      if (popup && !popup.closed) {
        try {
          popup.close();
        } catch (error) {
          console.log("Failed to close OAuth popup", error);
        }
      }
    };

    const finalizeError = (message: string, source: string) => {
      if (oauthCompleted) return;
      oauthCompleted = true;
      console.error(`Google OAuth error (${source}):`, message);
      alert(`Google authentication failed: ${message}`);
      cleanup();
      closePopupSafely();
    };

    const finalizeSuccessFromPayload = async (payload: GoogleAuthPayload, source: string) => {
      if (oauthCompleted) return;
      oauthCompleted = true;

      try {
        await finalizeSuccess(payload);
        cleanup();
        closePopupSafely();
      } catch (error) {
        finalizeError(error instanceof Error ? error.message : "profile_error", source);
      }
    };

    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        void finalizeSuccessFromPayload(event.data as GoogleAuthPayload, "postMessage");
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
        finalizeError(event.data.error ?? "Authentication failed", "postMessage");
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== OAUTH_BRIDGE_KEY || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue);
        if (payload.type === "GOOGLE_AUTH_SUCCESS" && payload.user) {
          void finalizeSuccessFromPayload(payload as GoogleAuthPayload, "storage");
        } else if (payload.type === "GOOGLE_AUTH_ERROR") {
          finalizeError(payload.error ?? "Authentication failed", "storage");
        }
      } catch (error) {
        console.error("Failed to parse OAuth bridge payload", error);
      }
    }

    try {
      localStorage.removeItem(OAUTH_BRIDGE_KEY);

      const codeVerifier = generateCodeVerifier();
      sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = `google-auth:${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
      sessionStorage.setItem(STATE_KEY, state);

      const redirectUri = `${window.location.origin}/oauth2/callback`;
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "select_account");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      popup = window.open(
        authUrl.toString(),
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );

      if (!popup) {
        finalizeError("Popup blocked", "popup");
        return;
      }

      window.addEventListener("message", handleMessage);
      messageListenerAdded = true;
      window.addEventListener("storage", handleStorage);
      storageListenerAdded = true;
    } catch (error) {
      finalizeError(error instanceof Error ? error.message : "oauth_setup_failed", "setup");
    }
  }, [finalizeSuccess, isLoading, oauthInProgress]);

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      console.log("Email sign-in:", { email, password });
      const mockToken = `email-login-${Date.now()}`;
      localStorage.setItem("oneedge_auth_token", mockToken);
      onLogin?.(mockToken);
    } catch (error) {
      console.error("Email sign-in failed:", error);
      alert("Email authentication failed. Please try again.");
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
        <div className="text-center space-y-md">
          <h1 className="text-4xl font-semibold text-text-primary font-display">OneEdge</h1>
          <p className="text-lg text-text-secondary">OneOrigin's Unified AI Platform</p>
        </div>

        <GlassCard variant="elevated" className="bg-card border-border-primary">
          <GlassCardHeader className="text-center">
            <GlassCardTitle className="text-2xl text-card-foreground">Welcome back</GlassCardTitle>
            <GlassCardDescription className="text-text-secondary">
              Sign in to your account to continue
            </GlassCardDescription>
          </GlassCardHeader>

          <GlassCardContent className="space-y-lg">
            <Button
              onClick={() => void handleGoogleSignIn()}
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
                Continue with Google (oneorigin.us)
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

            <div className="text-center space-y-sm">
              <Button variant="link" className="text-sm text-text-secondary hover:text-text-primary">
                Forgot your password?
              </Button>
              <p className="text-sm text-text-tertiary">
                Don't have an account?{" "}
                <Button variant="link" className="text-accent-blue p-0 h-auto font-medium hover:text-accent-blue-hover">
                  Sign up
                </Button>
              </p>
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
