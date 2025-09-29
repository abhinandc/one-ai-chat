import { useEffect } from "react";
import type { GoogleUser } from "@/services/api";

const OAUTH_BRIDGE_KEY = "oneai_oauth_bridge";
const CODE_VERIFIER_KEY = "oneai_oauth_code_verifier";
const STATE_KEY = "oneai_oauth_state";
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  "373908156464-backo99qegd190e3duh54biihe5tg6i9.apps.googleusercontent.com";

interface GoogleAuthPayload {
  type: "GOOGLE_AUTH_SUCCESS" | "GOOGLE_AUTH_ERROR";
  user?: Partial<GoogleUser>;
  tokens?: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    session?: string;
    [key: string]: unknown;
  };
  error?: string;
  raw?: unknown;
}

const writeBridgePayload = (payload: Record<string, unknown>) => {
  try {
    localStorage.setItem(
      OAUTH_BRIDGE_KEY,
      JSON.stringify({ ...payload, timestamp: Date.now() }),
    );
  } catch (error) {
    console.error("Failed to persist OAuth bridge payload:", error);
  }
};

const clearBridgePayloadSoon = () => {
  try {
    setTimeout(() => localStorage.removeItem(OAUTH_BRIDGE_KEY), 1000);
  } catch (error) {
    console.error("Failed to clear OAuth bridge payload:", error);
  }
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

const buildExchangeCandidates = (base: string): string[] => {
  const normalized = base && base !== "/" ? base.replace(/\/+$/, "") : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const candidates = new Set<string>();

  if (normalized) {
    candidates.add(`${normalized}/auth/google/exchange`);
    candidates.add(`${normalized}/api/auth/google/exchange`);
    if (!normalized.startsWith("http")) {
      candidates.add(`${origin}${normalized}/auth/google/exchange`);
      candidates.add(`${origin}${normalized}/api/auth/google/exchange`);
    }
  }

  if (origin) {
    candidates.add(`${origin}/auth/google/exchange`);
    candidates.add(`${origin}/api/auth/google/exchange`);
  }

  candidates.add("/auth/google/exchange");
  candidates.add("/api/auth/google/exchange");

  return Array.from(candidates);
};

const exchangeAuthorizationCode = async (
  code: string,
  codeVerifier: string | null,
  redirectUri: string,
): Promise<GoogleAuthPayload> => {
  const base = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const candidates = buildExchangeCandidates(base);
  const body = JSON.stringify({
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier ?? undefined,
    client_id: GOOGLE_CLIENT_ID,
  });

  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        lastError = new Error(text || `exchange_failed_${response.status}`);
        continue;
      }

      return (await response.json()) as GoogleAuthPayload;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("google_exchange_failed");
};

const emitError = (message: string) => {
  const payload = { type: "GOOGLE_AUTH_ERROR", error: message };

  if (window.opener) {
    try {
      window.opener.postMessage(payload, "*");
    } catch (error) {
      console.error("Failed to send error message via postMessage:", error);
    }
  } else {
    writeBridgePayload(payload);
    clearBridgePayloadSoon();
  }
};

const emitSuccess = (payload: GoogleAuthPayload) => {
  if (window.opener) {
    try {
      window.opener.postMessage(payload, "*");
    } catch (error) {
      console.error("Failed to send success message via postMessage:", error);
    }
  } else {
    writeBridgePayload(payload);
    clearBridgePayloadSoon();
  }
};

const closePopupSafely = () => {
  try {
    window.close();
  } catch (error) {
    console.log("Unable to close OAuth popup automatically:", error);
  }
};

export default function AuthCallback() {
  useEffect(() => {
    localStorage.removeItem(OAUTH_BRIDGE_KEY);

    const process = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      const storedState = sessionStorage.getItem(STATE_KEY);
      const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
      sessionStorage.removeItem(STATE_KEY);
      sessionStorage.removeItem(CODE_VERIFIER_KEY);

      if (error) {
        emitError(error);
        closePopupSafely();
        return;
      }

      if (!code) {
        emitError("Missing authorization code");
        closePopupSafely();
        return;
      }

      if (storedState && state !== storedState) {
        emitError("State mismatch");
        closePopupSafely();
        return;
      }

      const redirectUri = `${window.location.origin}/oauth2/callback`;

      try {
        const exchangePayload = await exchangeAuthorizationCode(code, codeVerifier, redirectUri);
        const tokens = exchangePayload.tokens ?? {};
        const claims = decodeJwt(tokens.id_token as string | undefined);
        const profile: Partial<GoogleUser> = {
          ...claims,
          ...(exchangePayload.user ?? {}),
        };

        if ((!profile.email || !profile.name) && tokens.access_token) {
          try {
            const info = await fetchUserInfo(String(tokens.access_token));
            Object.assign(profile, info);
          } catch (infoError) {
            console.warn("Unable to fetch Google profile via access token", infoError);
          }
        }

        if (!profile.email) {
          throw new Error("missing_email_claim");
        }

        emitSuccess({
          type: "GOOGLE_AUTH_SUCCESS",
          user: profile,
          tokens,
          raw: exchangePayload.raw ?? exchangePayload,
        });
      } catch (exchangeError) {
        emitError(exchangeError instanceof Error ? exchangeError.message : "exchange_failed");
      }

      closePopupSafely();
    };

    process();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-graphite/30 to-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto" />
        <h2 className="text-xl font-semibold text-text-primary">Processing Authentication...</h2>
        <p className="text-text-secondary">Please wait while we complete your sign-in.</p>
        <p className="text-sm text-text-tertiary">You can close this window once the sign-in finishes.</p>
      </div>
    </div>
  );
}

