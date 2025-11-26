import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { createPlan } from "../services/studioHub.js";
import { uploadPlanMedia } from "../services/studioHub.js";

const DesignWorkspace = () => {
  const role = (() => {
    try {
      return (localStorage.getItem("role") || "associate").toLowerCase();
    } catch {
      return "associate";
    }
  })();
  const ownerType = role === "firm" ? "firm" : "associate";
  const [plan, setPlan] = useState({
    projectTitle: "",
    category: "",
    primaryStyle: "",
    description: "",
    tags: "",
  });
  const [activePlanId, setActivePlanId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleCreate = async () => {
    if (!plan.projectTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const response = await createPlan(
        {
          ...plan,
          tags: plan.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          ownerType,
        },
        ownerType
      );
      setActivePlanId(response?.planUpload?.id || response?.planUpload?._id);
      toast.success("Plan created. Upload renders next.");
    } catch (error) {
      toast.error(error.message || "Unable to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activePlanId) return;
    setUploading(true);
    try {
      await uploadPlanMedia(activePlanId, file, { ownerType, kind: "render", secure: false });
      toast.success("Media uploaded");
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600">Design workspace</p>
          <h1 className="text-3xl font-semibold">Sell design packs</h1>
          <p className="text-sm text-slate-600">Create design uploads and add renders/walkthroughs.</p>
        </header>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-600">
              Project title
              <input
                value={plan.projectTitle}
                onChange={(e) => setPlan({ ...plan, projectTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="text-xs text-slate-600">
              Category
              <input
                value={plan.category}
                onChange={(e) => setPlan({ ...plan, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
          </div>
          <label className="text-xs text-slate-600">
            Primary style
            <input
              value={plan.primaryStyle}
              onChange={(e) => setPlan({ ...plan, primaryStyle: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </label>
          <label className="text-xs text-slate-600">
            Description
            <textarea
              value={plan.description}
              onChange={(e) => setPlan({ ...plan, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </label>
          <label className="text-xs text-slate-600">
            Tags (comma separated)
            <input
              value={plan.tags}
              onChange={(e) => setPlan({ ...plan, tags: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save design plan"}
            </button>
            <label className="text-xs text-slate-600">
              Upload media
              <input type="file" className="mt-1 block text-xs" onChange={handleUpload} accept="image/*,video/*,application/pdf" />
            </label>
            {activePlanId ? <span className="text-xs text-emerald-700">Plan ready for uploads</span> : null}
            {uploading ? <span className="text-xs text-slate-500">Uploading...</span> : null}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DesignWorkspace;
