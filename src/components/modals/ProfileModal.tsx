import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Save, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Switch } from "@/components/ui/switch";
import supabaseClient from "@/services/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
  twoFactorAuth: boolean;
}

const splitName = (fullName?: string | null) => {
  if (!fullName) {
    return { first: "", last: "" };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }

  const [first, ...rest] = parts;
  return { first, last: rest.join(" ") };
};

const buildFallbackForm = (
  email: string,
  displayName: string,
  givenName?: string,
  familyName?: string,
): ProfileFormState => {
  const parts = splitName(displayName);
  return {
    firstName: givenName ?? parts.first ?? "",
    lastName: familyName ?? parts.last ?? "",
    email,
    phone: "",
    location: "",
    bio: "",
    emailNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
  };
};

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const currentUser = useCurrentUser();
  const supabase = supabaseClient;
  const { toast } = useToast();

  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [initialForm, setInitialForm] = useState<ProfileFormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = currentUser?.email ?? "";
  const displayName = useMemo(() => currentUser?.name ?? "", [currentUser?.name]);
  const givenName = currentUser?.givenName;
  const familyName = currentUser?.familyName;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!email) {
      setError("No authenticated user found.");
      setForm(null);
      setInitialForm(null);
      return;
    }

    if (!supabase) {
      const fallback = buildFallbackForm(email, displayName, givenName, familyName);
      setForm(fallback);
      setInitialForm(fallback);
      setError("Supabase client is not configured.");
      return;
    }

    let active = true;
    setError(null);

    const hydrate = async () => {
      try {
        const [{ data: appUser, error: appError }, { data: legacyUser, error: legacyError }] = await Promise.all([
          supabase
            .from("app_users")
            .select("email, display_name, avatar_url, metadata_json")
            .eq("email", email)
            .maybeSingle(),
          supabase
            .from("users")
            .select("name, email")
            .eq("email", email)
            .maybeSingle(),
        ]);

        if (!active) return;

        if (appError && appError.code !== "PGRST116") {
          console.warn("Failed to load app_users profile", appError.message);
        }
        if (legacyError && legacyError.code !== "PGRST116") {
          console.warn("Failed to load users profile", legacyError.message);
        }

        const nameSource = appUser?.display_name ?? legacyUser?.name ?? displayName;
        const split = splitName(nameSource);
        const metadata = (appUser?.metadata_json ?? {}) as Record<string, unknown>;

        const hydrated: ProfileFormState = {
          firstName: split.first || givenName || "",
          lastName: split.last || familyName || "",
          email,
          phone: typeof metadata.phone === "string" ? metadata.phone : "",
          location: typeof metadata.location === "string" ? metadata.location : "",
          bio: typeof metadata.bio === "string" ? metadata.bio : "",
          emailNotifications:
            typeof metadata.emailNotifications === "boolean" ? metadata.emailNotifications : true,
          marketingEmails:
            typeof metadata.marketingEmails === "boolean" ? metadata.marketingEmails : false,
          twoFactorAuth:
            typeof metadata.twoFactorAuth === "boolean" ? metadata.twoFactorAuth : false,
        };

        setForm(hydrated);
        setInitialForm(hydrated);
      } catch (err) {
        console.error("Failed to load profile", err);
        if (!active) return;
        const fallback = buildFallbackForm(email, displayName, givenName, familyName);
        setForm(fallback);
        setInitialForm(fallback);
        setError("Unable to load profile details. Please try again later.");
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, [isOpen, supabase, email, displayName, givenName, familyName]);

  const hasChanges = useMemo(() => {
    if (!form || !initialForm) {
      return false;
    }

    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  const updateField = (field: keyof ProfileFormState, value: string | boolean) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value as ProfileFormState[keyof ProfileFormState],
      };
    });
  };

  const handleCancel = () => {
    if (initialForm) {
      setForm({ ...initialForm });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form || !supabase || !email) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const normalized: ProfileFormState = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      bio: form.bio.trim(),
    };

    const displayNameValue = [normalized.firstName, normalized.lastName]
      .filter((part) => part.length > 0)
      .join(" ");

    const metadata = {
      phone: normalized.phone || null,
      location: normalized.location || null,
      bio: normalized.bio || null,
      givenName: normalized.firstName || null,
      familyName: normalized.lastName || null,
      emailNotifications: normalized.emailNotifications,
      marketingEmails: normalized.marketingEmails,
      twoFactorAuth: normalized.twoFactorAuth,
    };

    try {
      const { data: upserted, error: upsertError } = await supabase
        .from("app_users")
        .upsert(
          {
            email,
            display_name: displayNameValue,
            metadata_json: metadata,
          },
          { onConflict: "email" },
        )
        .select("display_name")
        .maybeSingle();

      if (upsertError) {
        throw upsertError;
      }

      const updatedNames = splitName(upserted?.display_name ?? displayNameValue);
      const updatedForm: ProfileFormState = {
        ...normalized,
        firstName: updatedNames.first || normalized.firstName,
        lastName: updatedNames.last || normalized.lastName,
      };

      setForm({ ...updatedForm });
      setInitialForm({ ...updatedForm });
      setIsEditing(false);

      toast({
        title: "Profile updated",
        description: "Your profile preferences have been saved.",
      });

      const updatedUser = {
        email,
        name: upserted?.display_name ?? displayNameValue,
        givenName: updatedForm.firstName || undefined,
        familyName: updatedForm.lastName || undefined,
        picture: currentUser?.picture,
      };

      window.localStorage.setItem("oneai_user", JSON.stringify(updatedUser));
      window.dispatchEvent(new StorageEvent("storage", { key: "oneai_user" }));
    } catch (saveError) {
      console.error("Failed to save profile", saveError);
      setError("Unable to save profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const ready = Boolean(form);
  const summaryName = form ? [form.firstName, form.lastName].filter(Boolean).join(" ") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <GlassCard className="p-0 shadow-2xl border border-border-primary/20">
          <div className="flex items-center justify-between p-8 border-b border-border-primary/10">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Profile</h2>
              <p className="text-sm text-text-secondary mt-1">Manage your personal information</p>
            </div>
            <div className="flex items-center gap-2">
              {ready && !isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-surface-graphite/50 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
            {!ready ? (
              <div className="flex flex-col items-center gap-4 py-20 text-text-secondary">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-blue" />
                Loading profile...
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-center gap-3 p-4 border border-accent-orange/40 bg-accent-orange/10 rounded-lg text-sm text-accent-orange">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-text-primary">{summaryName || email}</h3>
                    <p className="text-sm text-text-secondary">{form.email}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">First name</label>
                    {isEditing ? (
                      <GlassInput
                        value={form.firstName}
                        onChange={(event) => updateField("firstName", event.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-text-secondary">{form.firstName || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Last name</label>
                    {isEditing ? (
                      <GlassInput
                        value={form.lastName}
                        onChange={(event) => updateField("lastName", event.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-text-secondary">{form.lastName || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-text-primary">Email</label>
                    <GlassInput value={form.email} disabled />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Phone</label>
                    {isEditing ? (
                      <GlassInput
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-text-secondary">{form.phone || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Location</label>
                    {isEditing ? (
                      <GlassInput
                        value={form.location}
                        onChange={(event) => updateField("location", event.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-text-secondary">{form.location || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Bio</label>
                  {isEditing ? (
                    <textarea
                      className="w-full px-3 py-2 bg-surface-graphite/50 border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      rows={3}
                      value={form.bio}
                      onChange={(event) => updateField("bio", event.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-text-secondary whitespace-pre-line">{form.bio || "—"}</p>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex items-center justify-between gap-4 p-4 border border-border-primary/20 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Email notifications</p>
                      <p className="text-xs text-text-secondary">Receive important updates and alerts</p>
                    </div>
                    <Switch
                      checked={form.emailNotifications}
                      onCheckedChange={(checked) => updateField("emailNotifications", checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4 border border-border-primary/20 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Marketing emails</p>
                      <p className="text-xs text-text-secondary">Product news and tips</p>
                    </div>
                    <Switch
                      checked={form.marketingEmails}
                      onCheckedChange={(checked) => updateField("marketingEmails", checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4 border border-border-primary/20 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Two-factor auth</p>
                      <p className="text-xs text-text-secondary">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={form.twoFactorAuth}
                      onCheckedChange={(checked) => updateField("twoFactorAuth", checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-8 border-t border-border-primary/10">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
