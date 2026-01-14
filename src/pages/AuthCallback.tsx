import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) {
        setError("Supabase is not configured");
        return;
      }

      try {
        // Supabase automatically handles the OAuth callback
        // The session will be set via the URL hash/query params
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session?.user) {
          // Store user info for the app
          localStorage.setItem("oneedge_user", JSON.stringify({
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
            picture: session.user.user_metadata?.avatar_url,
          }));
          localStorage.setItem("oneedge_auth_token", session.access_token);

          // Redirect to home
          navigate("/", { replace: true });
        } else {
          // No session yet, wait for auth state change
          // This handles the case where the callback URL has the tokens
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        localStorage.setItem("oneedge_user", JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          picture: session.user.user_metadata?.avatar_url,
        }));
        localStorage.setItem("oneedge_auth_token", session.access_token);
        navigate("/", { replace: true });
      }
    }) ?? { subscription: null };

    handleCallback();

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-graphite/30 to-background">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="text-destructive text-6xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-text-primary">Authentication Error</h2>
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-graphite/30 to-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto" />
        <h2 className="text-xl font-semibold text-text-primary">Processing Authentication...</h2>
        <p className="text-text-secondary">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
}
