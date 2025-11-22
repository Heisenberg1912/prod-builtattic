import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Pencil, Trash2, FileText, ExternalLink, Copy, Search } from "lucide-react";
import { uploadStudioAsset } from "../../services/uploads.js";
import {
  fetchPlanUploads,
  createPlanUpload as createPlanUploadApi,
  updatePlanUpload as updatePlanUploadApi,
  deletePlanUpload as deletePlanUploadApi,
} from "../../services/collaboration.js";
import {
  replacePlanUploads,
  upsertPlanUpload as upsertWorkspacePlan,
  removePlanUpload as removeWorkspacePlan,
} from "../../utils/workspaceSync.js";

const defaultPlanForm = () => ({
  id: null,
  projectTitle: "",
  category: "",
  subtype: "",
  primaryStyle: "",
  conceptPlan: "",
  renderImages: "",
  walkthrough: "",
  areaSqft: "",
  floors: "",
  materials: "",
  climate: "",
  designRate: "",
  constructionCost: "",
  licenseType: "",
  delivery: "",
  description: "",
  tags: "",
});

const splitList = (value) => {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const stringifyList = (list = []) => (Array.isArray(list) ? list.join("\n") : "");

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const toNumberValue = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const numericString = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return String(value);
  return String(asNumber);
};

const formatMeasure = (value, suffix = "") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  const numberLabel = numeric.toLocaleString();
  return suffix ? `${numberLabel} ${suffix}` : numberLabel;
};

const formatRate = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `$${numeric}/sqft` : "-";
};

const deriveAssetMeta = (value) => {
  if (!value) return { fileName: "Uploaded file", host: null };
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const fileName = decodeURIComponent(segments.pop() || parsed.hostname || "Uploaded file");
    return {
      fileName,
      host: parsed.hostname?.replace(/^www\./, "") || null,
    };
  } catch {
    return {
      fileName: value,
      host: null,
    };
  }
};

const truncateLabel = (value, limit = 42) => {
  if (!value) return value;
  return value.length > limit ? `${value.slice(0, limit - 1)}â¦` : value;
};

const SummaryTile = ({ label, value, detail }) => (

  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>

    <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>

    {detail ? <p className="text-xs text-slate-500">{detail}</p> : null}

  </div>

);



export default function PlanUploadPanel({
  role = "associate",
  workspaceName = "Skill Studio",
  initialPlans = [],
  onPlanChange = () => {},
}) {
  const ownerType = role === "firm" ? "firm" : "associate";
  const [planUploads, setPlanUploads] = useState(initialPlans || []);
  const [form, setForm] = useState(() => defaultPlanForm());
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [mediaUploads, setMediaUploads] = useState({
    conceptPlan: false,
    renderImages: false,
    walkthrough: false,
  });
  const [linkInputsVisible, setLinkInputsVisible] = useState({
    conceptPlan: false,
    walkthrough: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const conceptPlanInputRef = useRef(null);
  const renderImagesInputRef = useRef(null);
  const walkthroughInputRef = useRef(null);

  const planMediaKindBase = role === "firm" ? "firm_plan" : "associate_plan";

  const syncPlansToWorkspace = useCallback(
    (plans = []) => {
      replacePlanUploads(ownerType, plans);
    },
    [ownerType]
  );

  useEffect(() => {
    const nextPlans = Array.isArray(initialPlans) ? initialPlans : [];
    setPlanUploads(nextPlans);
    syncPlansToWorkspace(nextPlans);
  }, [initialPlans, syncPlansToWorkspace]);

  const loadPlanUploads = useCallback(async () => {
    setListLoading(true);
    try {
      const response = await fetchPlanUploads({ ownerType });
      if (Array.isArray(response?.planUploads)) {
        setPlanUploads(response.planUploads);
        syncPlansToWorkspace(response.planUploads);
      }
    } catch (error) {
      console.error("plan_upload_fetch_error", error);
      toast.error("Unable to load plan uploads");
    } finally {
      setListLoading(false);
    }
  }, [ownerType, syncPlansToWorkspace]);

  useEffect(() => {
    loadPlanUploads();
  }, [loadPlanUploads]);

  const planHighlights = useMemo(() => {
    const totals = {
      totalPlans: planUploads.length,
      totalArea: 0,
      renderAssets: 0,
      walkthroughs: 0,
    };
    planUploads.forEach((plan) => {
      totals.totalArea += Number(plan.areaSqft) || 0;
      totals.renderAssets += Array.isArray(plan.renderImages) ? plan.renderImages.length : 0;
      if (plan.walkthrough) totals.walkthroughs += 1;
    });
    return totals;
  }, [planUploads]);

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return planUploads;
    return planUploads.filter((plan) => {
      const haystack = [
        plan.projectTitle,
        plan.category,
        plan.subtype,
        plan.primaryStyle,
        plan.description,
        ...(plan.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [planUploads, searchQuery]);

  const hasActiveSearch = searchQuery.trim().length > 0;

  const renderAssetPreview = (field, url, { label }) => {
    if (!url) return null;
    const meta = deriveAssetMeta(url);
    return (
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <FileText size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{truncateLabel(meta.fileName)}</p>
            {meta.host ? <p className="text-xs text-slate-500">{meta.host}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
            >
              <ExternalLink size={14} />
              View
            </a>
            <button
              type="button"
              onClick={() => handleCopyLink(url)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              type="button"
              onClick={() => handleClearAsset(field)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300"
            >
              Remove
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">{label}</p>
      </div>
    );
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCopyLink = async (value) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        toast.success("Link copied to clipboard");
        return;
      }
    } catch (error) {
      console.error("asset_copy_error", error);
    }
    toast.error("Unable to copy link");
  };

  const handleClearAsset = (field) => {
    setForm((prev) => ({ ...prev, [field]: "" }));
    setLinkInputsVisible((prev) => ({ ...prev, [field]: false }));
  };

  const toggleLinkInput = (field) => {
    setLinkInputsVisible((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const notifyPlanChange = () => {
    if (typeof onPlanChange === "function") {
      onPlanChange();
    }
  };

  const resetForm = () => {
    setForm(defaultPlanForm());
  };

  const handlePlanMediaUpload = async (field, files, { secure = false, kindSuffix } = {}) => {
    if (!files?.length) return;
    setMediaUploads((prev) => ({ ...prev, [field]: true }));
    try {
      const uploads = [];
      for (const file of files) {
        const { url, previewUrl } = await uploadStudioAsset(file, {
          kind: `${planMediaKindBase}_${kindSuffix || field}`,
          secure,
        });
        const resolved = previewUrl || url;
        if (!resolved) {
          throw new Error("Upload failed. Try another file.");
        }
        uploads.push(resolved);
      }
      setForm((prev) => {
        if (field === "renderImages") {
          const currentList = splitList(prev.renderImages);
          const combined = [...currentList, ...uploads];
          return { ...prev, renderImages: combined.join("\n") };
        }
        return { ...prev, [field]: uploads[0] || "" };
      });
      toast.success(uploads.length > 1 ? `${uploads.length} assets uploaded` : "Asset uploaded");
    } catch (error) {
      console.error("plan_media_upload_error", error);
      toast.error(error?.message || "Unable to upload media.");
    } finally {
      setMediaUploads((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleRenderMediaUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    await handlePlanMediaUpload("renderImages", files, {
      secure: false,
      kindSuffix: "render",
    });
  };

  const handleConceptPlanUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handlePlanMediaUpload("conceptPlan", [file], {
      secure: true,
      kindSuffix: "concept",
    });
  };

  const handleWalkthroughUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handlePlanMediaUpload("walkthrough", [file], {
      secure: false,
      kindSuffix: "walkthrough",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.projectTitle.trim()) {
      toast.error("Add a project title before syncing.");
      return;
    }
    if (!splitList(form.renderImages).length) {
      toast.error("Render images are required before publishing.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ownerType,
        projectTitle: normalizeText(form.projectTitle),
        category: normalizeText(form.category),
        subtype: normalizeText(form.subtype),
        primaryStyle: normalizeText(form.primaryStyle),
        conceptPlan: normalizeText(form.conceptPlan),
        renderImages: splitList(form.renderImages),
        walkthrough: normalizeText(form.walkthrough),
        areaSqft: toNumberValue(form.areaSqft),
        floors: toNumberValue(form.floors),
        materials: splitList(form.materials),
        climate: normalizeText(form.climate),
        designRate: toNumberValue(form.designRate),
        constructionCost: toNumberValue(form.constructionCost),
        licenseType: normalizeText(form.licenseType),
        delivery: normalizeText(form.delivery),
        description: normalizeText(form.description),
        tags: splitList(form.tags),
      };
      const response = form.id
        ? await updatePlanUploadApi(form.id, payload)
        : await createPlanUploadApi(payload);
      const savedPlan = response?.planUpload;
      if (savedPlan) {
        setPlanUploads((prev) => {
          const next = prev.filter((entry) => entry.id !== savedPlan.id);
          return [savedPlan, ...next];
        });
        upsertWorkspacePlan(ownerType, savedPlan);
        toast.success(`Plan synced to ${workspaceName}`);
        notifyPlanChange();
      }
      resetForm();
    } catch (error) {
      console.error("plan_sync_error", error);
      toast.error("Unable to sync plan. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan) => {
    setForm({
      id: plan.id,
      projectTitle: plan.projectTitle || "",
      category: plan.category || "",
      subtype: plan.subtype || "",
      primaryStyle: plan.primaryStyle || "",
      conceptPlan: plan.conceptPlan || "",
      renderImages: stringifyList(plan.renderImages),
      walkthrough: plan.walkthrough || "",
      areaSqft: numericString(plan.areaSqft),
      floors: numericString(plan.floors),
      materials: stringifyList(plan.materials),
      climate: plan.climate || "",
      designRate: numericString(plan.designRate),
      constructionCost: numericString(plan.constructionCost),
      licenseType: plan.licenseType || "",
      delivery: plan.delivery || "",
      description: plan.description || "",
      tags: stringifyList(plan.tags),
    });
  };

  const handleDelete = async (plan) => {
    if (!plan?.id) return;
    try {
      await deletePlanUploadApi(plan.id, { ownerType });
      setPlanUploads((prev) => prev.filter((entry) => entry.id !== plan.id));
      removeWorkspacePlan(ownerType, plan.id);
      toast.success("Plan removed");
      notifyPlanChange();
    } catch (error) {
      console.error("plan_delete_error", error);
      toast.error("Unable to delete plan");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Plan upload</p>
          <h2 className="text-lg font-semibold text-slate-900">Concept hosting</h2>
          <p className="text-sm text-slate-500">Capture plan specs once and reuse them inside {workspaceName}.</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Syncs instantly</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Project title
            <input
              name="projectTitle"
              value={form.projectTitle}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Eg. Canyon Residence"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Category & subtype
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <input
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Residential"
              />
              <input
                name="subtype"
                value={form.subtype}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Villa"
              />
            </div>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Primary style
            <input
              name="primaryStyle"
              value={form.primaryStyle}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Tropical modern"
            />
          </label>
          <div className="text-sm font-semibold text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span>Concept plan (PDF / DWG link)</span>
              <button
                type="button"
                onClick={() => conceptPlanInputRef.current?.click()}
                disabled={mediaUploads.conceptPlan}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mediaUploads.conceptPlan ? "Uploading..." : "Upload file"}
              </button>
            </div>
            {form.conceptPlan
              ? renderAssetPreview("conceptPlan", form.conceptPlan, {
                  label: "Secure link generated after upload",
                })
              : null}
            {form.conceptPlan ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleLinkInput("conceptPlan")}
                  className="text-xs font-semibold text-slate-600 underline"
                >
                  {linkInputsVisible.conceptPlan ? "Hide raw link" : "Paste link manually"}
                </button>
              </div>
            ) : null}
            {(!form.conceptPlan || linkInputsVisible.conceptPlan) && (
              <input
                name="conceptPlan"
                value={form.conceptPlan}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="https://files..."
              />
            )}
            <p className="mt-1 text-xs font-normal text-slate-500">
              Upload a PDF/DWG or paste a hosted link.
            </p>
            <input
              ref={conceptPlanInputRef}
              type="file"
              accept=".pdf,.dwg,.dxf,.zip,.rar,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleConceptPlanUpload}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="text-sm font-semibold text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span>Render images (one per line)</span>
              <button
                type="button"
                onClick={() => renderImagesInputRef.current?.click()}
                disabled={mediaUploads.renderImages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mediaUploads.renderImages ? "Uploading..." : "Upload media"}
              </button>
            </div>
            <textarea
              name="renderImages"
              value={form.renderImages}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={"https://example.com/render-1\nhttps://example.com/render-2"}
            />
            <p className="mt-1 text-xs font-normal text-slate-500">
              Upload images or paste hosted URLs. Multiple uploads append automatically.
            </p>
            <input
              ref={renderImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleRenderMediaUpload}
            />
          </div>
          <div className="text-sm font-semibold text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span>Walkthrough (optional)</span>
              <button
                type="button"
                onClick={() => walkthroughInputRef.current?.click()}
                disabled={mediaUploads.walkthrough}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mediaUploads.walkthrough ? "Uploading..." : "Upload clip"}
              </button>
            </div>
            {form.walkthrough
              ? renderAssetPreview("walkthrough", form.walkthrough, {
                  label: "Link used for walkthrough playback",
                })
              : null}
            {form.walkthrough ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleLinkInput("walkthrough")}
                  className="text-xs font-semibold text-slate-600 underline"
                >
                  {linkInputsVisible.walkthrough ? "Hide raw link" : "Paste link manually"}
                </button>
              </div>
            ) : null}
            {(!form.walkthrough || linkInputsVisible.walkthrough) && (
              <input
                name="walkthrough"
                value={form.walkthrough}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Video or twin link"
              />
            )}
            <p className="mt-1 text-xs font-normal text-slate-500">
              Upload MP4/WebM clips or paste an external walkthrough URL.
            </p>
            <input
              ref={walkthroughInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleWalkthroughUpload}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Area (sqft)
            <input
              name="areaSqft"
              value={form.areaSqft}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="4200"
              inputMode="numeric"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Floors
            <input
              name="floors"
              value={form.floors}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="2"
              inputMode="numeric"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Design rate $/sqft
            <input
              name="designRate"
              value={form.designRate}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="12"
              inputMode="decimal"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Construction $/sqft
            <input
              name="constructionCost"
              value={form.constructionCost}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="140"
              inputMode="decimal"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Materials used
            <textarea
              name="materials"
              value={form.materials}
              onChange={handleInputChange}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={"Laterite stone\nEngineered timber"}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Climate & terrain suitability
            <textarea
              name="climate"
              value={form.climate}
              onChange={handleInputChange}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Warm-humid | Coastal belt"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            License type
            <select
              name="licenseType"
              value={form.licenseType}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Exclusive">Exclusive</option>
              <option value="Non-exclusive">Non-exclusive</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Delivery method
            <select
              name="delivery"
              value={form.delivery}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="ZIP">ZIP</option>
              <option value="Encrypted multi-file">Encrypted multi-file</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Tags
            <input
              name="tags"
              value={form.tags}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Passive, Off-grid"
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Description / notes
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Concept narrative, delivery notes, etc."
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update plan" : "Save plan"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>



      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Hosted plans</p>
            <p className="text-sm text-slate-500">
              {planUploads.length
                ? `Share updates directly with the ${workspaceName} workspace.`
                : `Sync media to expose your first plan inside ${workspaceName}.`}
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Search title, tags, or style"
            />
          </div>
        </div>

        {planUploads.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryTile
              label="Plans live"
              value={planHighlights.totalPlans}
              detail={
                planHighlights.totalPlans === 1
                  ? "Concept ready inside workspace"
                  : `${planHighlights.totalPlans} ready concepts`
              }
            />
            <SummaryTile
              label="Total area"
              value={planHighlights.totalArea ? `${planHighlights.totalArea.toLocaleString()} sqft` : "--"}
              detail={planHighlights.totalArea ? "Based on filled plan data" : "Add area to next submission"}
            />
            <SummaryTile
              label="Media assets"
              value={planHighlights.renderAssets || 0}
              detail={
                planHighlights.walkthroughs
                  ? `${planHighlights.walkthroughs} walkthrough${planHighlights.walkthroughs === 1 ? "" : "s"}`
                  : "Add walkthrough or concept links"
              }
            />
          </div>
        ) : null}

        {listLoading ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`plan-skeleton-${index}`} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <p className="text-sm text-slate-500">
            {hasActiveSearch
              ? `No plans match "${searchQuery.trim()}".`
              : `No plans synced yet. Add your first concept to expose it inside ${workspaceName}.`}
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredPlans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {plan.category || "Category"}
                      {plan.subtype ? ` · ${plan.subtype}` : ""}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{plan.projectTitle || "Untitled plan"}</h3>
                    <p className="text-sm text-slate-500">{plan.primaryStyle || "Add a primary style"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(plan)}
                      className="rounded-full border border-slate-200 p-1 text-slate-600 hover:text-slate-900"
                      aria-label="Edit plan"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(plan)}
                      className="rounded-full border border-slate-200 p-1 text-rose-500 hover:text-rose-600"
                      aria-label="Delete plan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Area</dt>
                    <dd>{formatMeasure(plan.areaSqft, "sqft")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Floors</dt>
                    <dd>{formatMeasure(plan.floors)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Design rate</dt>
                    <dd>{formatRate(plan.designRate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Construction</dt>
                    <dd>{formatRate(plan.constructionCost)}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  {plan.renderImages?.length ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {plan.renderImages.length} render{plan.renderImages.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {plan.conceptPlan ? <span className="rounded-full bg-slate-100 px-2 py-0.5">Concept file</span> : null}
                  {plan.walkthrough ? <span className="rounded-full bg-slate-100 px-2 py-0.5">Walkthrough</span> : null}
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>
                    Lic. {plan.licenseType || "n/a"} · Delivery {plan.delivery || "n/a"}
                  </p>
                  {plan.description ? <p className="text-slate-500/80">{plan.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
