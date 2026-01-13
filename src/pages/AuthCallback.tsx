import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase";
import { authLogger as logger } from "@/lib/logger";

/**
 * AuthCallback Component
 *
 * Handles OAuth callback from Supabase Auth (Google SSO).
 * This page is hit after the user authenticates with Google.
 * Supabase automatically extracts the session from URL hash parameters.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's an error in the URL
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get("error");
        const errorDescription = params.get("error_description");

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // Supabase Auth automatically processes the callback
        // and stores the session. We just need to verify it worked.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error("No session found after authentication");
        }

        // Get user profile information
        const user = session.user;
        const email = user.email;
        const name = user.user_metadata?.full_name || user.user_metadata?.name || email;
        const picture = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        // Store user info in localStorage for backwards compatibility
        // (used by useCurrentUser hook)
        const userProfile = {
          email,
          name,
          picture,
          givenName: user.user_metadata?.given_name,
          familyName: user.user_metadata?.family_name,
        };

        localStorage.setItem("oneedge_user", JSON.stringify(userProfile));
        window.dispatchEvent(new StorageEvent("storage", { key: "oneedge_user" }));

        // Upsert user profile to app_users table
        if (email) {
          try {
            const { error: upsertError } = await supabase
              .from("app_users")
              .upsert(
                {
                  email,
                  name,
                  avatar_url: picture,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "email" }
              );

            if (upsertError) {
              logger.warn("Unable to upsert user profile to app_users", { error: upsertError });
            }
          } catch (upsertError) {
            logger.warn("Error upserting user profile", { error: upsertError });
          }
        }

        // Redirect to home page
        navigate("/", { replace: true });
      } catch (error) {
        logger.error("Authentication callback error", error);
        setError(error instanceof Error ? error.message : "Authentication failed");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-destructive">
            <svg
              className="h-12 w-12 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Authentication Failed</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="text-center space-y-4">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton w-12 h-12 rounded-xl bg-primary/20 animate-pulse" />
          <div className="skeleton w-48 h-5 rounded bg-muted animate-pulse" />
          <div className="skeleton w-64 h-4 rounded bg-muted animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Completing Sign In...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}
