import React, { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { FormSection } from "./FormSection";
import { FormField } from "./FormField";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";

/**
 * ProfileEditor - Base component for all profile editors
 * Handles common patterns: loading, saving, offline mode, drafts
 */
export function ProfileEditor({
  // Data functions
  fetchProfile,
  saveProfile,
  loadDraft,
  emptyForm,
  mapToForm,
  mapToPayload,

  // Render functions
  renderFields,
  renderPreview,
  renderHeader,

  // Options
  showPreview = true,
  showHeader = true,
  autoSave = false,

  // Callbacks
  onProfileUpdate,
  onSaveSuccess,
  onSaveError,

  // Custom props
  className,
}) {
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm]
  );

  const applyResponse = useCallback(
    (response) => {
      const mapped = mapToForm(response.profile || {});
      setForm(mapped);
      setInitialForm(mapped);
      setOfflineMode(response.source !== "remote");
      setAuthRequired(Boolean(response.authRequired));
      setLastSynced(response.profile?.updatedAt || response.profile?.createdAt || new Date().toISOString());
      setError(response.authRequired ? "Sign in to sync your profile." : null);
      onProfileUpdate?.(response.profile || {});
    },
    [mapToForm, onProfileUpdate]
  );

  // Load profile on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchProfile({ preferDraft: true });
        if (response.ok || response.profile) {
          applyResponse(response);
        } else if (response.authRequired) {
          setAuthRequired(true);
          const draft = response.profile || (loadDraft ? loadDraft() : null);
          if (draft) {
            applyResponse({ profile: draft, source: "draft" });
          } else {
            setError("Sign in to manage your profile.");
          }
        }
      } catch (err) {
        console.error("profile_load_error", err);
        if (loadDraft) {
          const draft = loadDraft();
          if (draft) {
            applyResponse({ profile: draft, source: "draft" });
            toast("Loaded local draft", { icon: "📦" });
          } else {
            toast.error("Failed to load profile");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchProfile, loadDraft, applyResponse]);

  const handleSave = async () => {
    if (!hasChanges) {
      toast("No changes to save", { icon: "ℹ️" });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = mapToPayload(form);
      const response = await saveProfile(payload);

      if (response.ok || response.profile) {
        toast.success("Profile saved successfully");
        applyResponse(response);
        onSaveSuccess?.(response.profile);
      } else if (response.authRequired) {
        setAuthRequired(true);
        setError("Sign in to save your profile.");
        onSaveError?.(new Error("Authentication required"));
      } else {
        throw new Error(response.error?.message || "Failed to save profile");
      }
    } catch (err) {
      console.error("profile_save_error", err);
      toast.error(err.message || "Failed to save profile");
      setError(err.message);
      onSaveError?.(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(initialForm);
    toast("Changes discarded", { icon: "🔄" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {showHeader && (renderHeader ? renderHeader({ form, offlineMode, authRequired, lastSynced }) : (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile Editor</h1>
            {offlineMode && (
              <Badge variant="secondary" className="mt-2">
                Offline Mode
              </Badge>
            )}
            {authRequired && (
              <Badge variant="destructive" className="mt-2">
                Sign in required
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <Button variant="outline" onClick={handleDiscard} disabled={saving}>
                  Discard
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Fields */}
        <div className="space-y-6 lg:col-span-2">
          {renderFields({ form, setForm, saving })}
        </div>

        {/* Preview Sidebar */}
        {showPreview && renderPreview && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {renderPreview({ form })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions (mobile) */}
      {hasChanges && (
        <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4 lg:hidden">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscard} disabled={saving} className="flex-1">
              Discard
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileEditor;
