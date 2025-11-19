import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  createWorkspaceDownload,
  updateWorkspaceDownload,
  deleteWorkspaceDownload,
} from "../../services/workspaceDownloads.js";

const defaultForm = {
  id: null,
  label: "",
  description: "",
  fileUrl: "",
  tag: "WD-W3",
  accessLevel: "client",
  status: "draft",
  downloadCode: "",
  expiresAt: "",
  notes: "",
};

const accessLabels = {
  internal: "Internal",
  client: "Client-facing",
  public: "Public",
};

const statusTone = {
  draft: "text-slate-700 bg-slate-100",
  released: "text-emerald-700 bg-emerald-50",
};

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function DownloadCenter({
  ownerType = "associate",
  initialDownloads = [],
  heading = "Download center",
  eyebrow = "WD W3",
  description = "Share deliverables, walkthrough files, and synced specs with buyers in a controlled channel.",
  emptyMessage = "No deliverables yet. Upload at least one WD-W3 packet to keep routing unlocked.",
}) {
  const [downloads, setDownloads] = useState(() => (Array.isArray(initialDownloads) ? initialDownloads : []));
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    setDownloads(Array.isArray(initialDownloads) ? [...initialDownloads] : []);
  }, [initialDownloads]);

  const sortedDownloads = useMemo(
    () => [...downloads].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
    [downloads],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setForm(defaultForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.label.trim()) {
      toast.error("Give the deliverable a label");
      return;
    }
    if (!form.fileUrl.trim()) {
      toast.error("Add a shareable file URL");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ownerType,
        label: form.label.trim(),
        description: form.description.trim(),
        fileUrl: form.fileUrl.trim(),
        tag: form.tag.trim() || "WD-W3",
        accessLevel: form.accessLevel,
        status: form.status,
        downloadCode: form.downloadCode.trim(),
        expiresAt: form.expiresAt || undefined,
        notes: form.notes.trim(),
      };
      let response;
      if (form.id) {
        response = await updateWorkspaceDownload(form.id, payload);
      } else {
        response = await createWorkspaceDownload(payload);
      }
      const saved = response?.download;
      if (!saved) throw new Error("Download response missing");
      setDownloads((prev) => {
        const filtered = prev.filter((item) => item.id !== saved.id);
        return [saved, ...filtered];
      });
      toast.success(form.id ? "Download updated" : "Download published");
      resetForm();
    } catch (error) {
      toast.error(error?.message || "Unable to save download");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (download) => {
    setForm({
      id: download.id,
      label: download.label || "",
      description: download.description || "",
      fileUrl: download.fileUrl || "",
      tag: download.tag || "WD-W3",
      accessLevel: download.accessLevel || "client",
      status: download.status || "draft",
      downloadCode: download.downloadCode || "",
      expiresAt: toInputDate(download.expiresAt),
      notes: download.notes || "",
    });
  };

  const handleDelete = async (download) => {
    if (!window.confirm("Delete this download?")) return;
    setBusyId(download.id);
    try {
      await deleteWorkspaceDownload(download.id, { ownerType });
      setDownloads((prev) => prev.filter((item) => item.id !== download.id));
      if (form.id === download.id) resetForm();
      toast.success("Download removed");
    } catch (error) {
      toast.error(error?.message || "Unable to delete download");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm" id="downloads">
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
        <h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr,0.9fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{form.id ? "Edit deliverable" : "Add deliverable"}</p>
              <p className="text-xs text-slate-500">
                Share WD-W3 files, walkthrough links, or encrypted ZIPs with ops.
              </p>
            </div>
            {form.id ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 underline"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Label
              <input
                name="label"
                value={form.label}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="WD-W3 Pack 01"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              File URL
              <input
                name="fileUrl"
                value={form.fileUrl}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="https://drive.google.com/..."
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Access
              <select
                name="accessLevel"
                value={form.accessLevel}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="internal">Internal</option>
                <option value="client">Client</option>
                <option value="public">Public</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="released">Released</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              WD tag
              <input
                name="tag"
                value={form.tag}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Expires at
              <input
                type="date"
                name="expiresAt"
                value={form.expiresAt}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Download code
              <input
                name="downloadCode"
                value={form.downloadCode}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="WD-W3-2025"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Notes
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Encrypted ZIP with deliverables"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-700">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              placeholder="What the buyer receives, walkthrough steps, and security notes."
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update download" : "Publish download"}
          </button>
        </form>

        <div className="space-y-3">
          {sortedDownloads.length === 0 ? (
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          ) : (
            sortedDownloads.map((download) => (
              <article
                key={download.id}
                className="rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{download.label}</p>
                    <p className="text-xs text-slate-500">{download.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[download.status] || "bg-slate-100 text-slate-600"}`}
                  >
                    {download.status === "released" ? "Released" : "Draft"}
                  </span>
                </div>
                <dl className="mt-3 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>{accessLabels[download.accessLevel] || "Client"}</span>
                    <span>Tag {download.tag || "WD-W3"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{download.downloadCode || "No code"}</span>
                    <span>Expires {formatDate(download.expiresAt)}</span>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <a
                    href={download.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    Open file
                  </a>
                  <button
                    type="button"
                    onClick={() => handleEdit(download)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(download)}
                    disabled={busyId === download.id}
                    className="rounded-full border border-rose-200 px-3 py-1 text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
