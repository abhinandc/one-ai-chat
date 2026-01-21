import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatPreferences {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  streamResponse: boolean;
}

export interface ModelPreferences {
  defaultModelId: string | null;
  preferredCodingModel: string | null;
  preferredChatModel: string | null;
  preferredImageModel: string | null;
}

export interface UIPreferences {
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
}

export interface UserPreferences {
  chat: ChatPreferences;
  models: ModelPreferences;
  ui: UIPreferences;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  chat: {
    systemPrompt: "You are a helpful AI assistant.",
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    streamResponse: true,
  },
  models: {
    defaultModelId: null,
    preferredCodingModel: null,
    preferredChatModel: null,
    preferredImageModel: null,
  },
  ui: {
    theme: "system",
    sidebarCollapsed: false,
  },
};

export function useUserPreferences(userEmail: string | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load preferences from Supabase on mount
  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_email", userEmail)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned, which is expected for new users
          console.error("[UserPreferences] Error loading:", error);
          return;
        }

        if (data) {
          setPreferences({
            chat: {
              systemPrompt: data.chat_system_prompt || DEFAULT_PREFERENCES.chat.systemPrompt,
              temperature: data.chat_temperature ?? DEFAULT_PREFERENCES.chat.temperature,
              maxTokens: data.chat_max_tokens ?? DEFAULT_PREFERENCES.chat.maxTokens,
              topP: data.chat_top_p ?? DEFAULT_PREFERENCES.chat.topP,
              streamResponse: data.chat_stream_response ?? DEFAULT_PREFERENCES.chat.streamResponse,
            },
            models: {
              defaultModelId: data.default_model_id || null,
              preferredCodingModel: data.preferred_coding_model || null,
              preferredChatModel: data.preferred_chat_model || null,
              preferredImageModel: data.preferred_image_model || null,
            },
            ui: {
              theme: (data.theme as "light" | "dark" | "system") || DEFAULT_PREFERENCES.ui.theme,
              sidebarCollapsed: data.sidebar_collapsed ?? DEFAULT_PREFERENCES.ui.sidebarCollapsed,
            },
          });
        }
      } catch (err) {
        console.error("[UserPreferences] Exception loading:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userEmail]);

  // Save preferences to Supabase
  const savePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>): Promise<boolean> => {
      if (!userEmail) return false;

      setSaving(true);
      try {
        const updatedPrefs = {
          ...preferences,
          ...newPreferences,
          chat: { ...preferences.chat, ...(newPreferences.chat || {}) },
          models: { ...preferences.models, ...(newPreferences.models || {}) },
          ui: { ...preferences.ui, ...(newPreferences.ui || {}) },
        };

        const dbData = {
          user_email: userEmail,
          chat_system_prompt: updatedPrefs.chat.systemPrompt,
          chat_temperature: updatedPrefs.chat.temperature,
          chat_max_tokens: updatedPrefs.chat.maxTokens,
          chat_top_p: updatedPrefs.chat.topP,
          chat_stream_response: updatedPrefs.chat.streamResponse,
          default_model_id: updatedPrefs.models.defaultModelId,
          preferred_coding_model: updatedPrefs.models.preferredCodingModel,
          preferred_chat_model: updatedPrefs.models.preferredChatModel,
          preferred_image_model: updatedPrefs.models.preferredImageModel,
          theme: updatedPrefs.ui.theme,
          sidebar_collapsed: updatedPrefs.ui.sidebarCollapsed,
        };

        const { error } = await supabase
          .from("user_preferences")
          .upsert(dbData, { onConflict: "user_email" });

        if (error) {
          console.error("[UserPreferences] Error saving:", error);
          return false;
        }

        setPreferences(updatedPrefs);
        setLastSaved(new Date());
        return true;
      } catch (err) {
        console.error("[UserPreferences] Exception saving:", err);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userEmail, preferences]
  );

  // Update chat preferences
  const updateChatPreferences = useCallback(
    async (chatPrefs: Partial<ChatPreferences>): Promise<boolean> => {
      return savePreferences({ chat: { ...preferences.chat, ...chatPrefs } });
    },
    [savePreferences, preferences.chat]
  );

  // Update model preferences
  const updateModelPreferences = useCallback(
    async (modelPrefs: Partial<ModelPreferences>): Promise<boolean> => {
      return savePreferences({ models: { ...preferences.models, ...modelPrefs } });
    },
    [savePreferences, preferences.models]
  );

  // Update UI preferences
  const updateUIPreferences = useCallback(
    async (uiPrefs: Partial<UIPreferences>): Promise<boolean> => {
      return savePreferences({ ui: { ...preferences.ui, ...uiPrefs } });
    },
    [savePreferences, preferences.ui]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  return {
    preferences,
    loading,
    saving,
    lastSaved,
    savePreferences,
    updateChatPreferences,
    updateModelPreferences,
    updateUIPreferences,
    resetToDefaults,
  };
}
