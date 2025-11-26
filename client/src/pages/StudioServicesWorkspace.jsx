import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { CalendarClock, Edit3, FileText, Layers, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import {
  createPlanUpload,
  createServicePack,
  deleteMeeting,
  deletePlanUpload,
  deleteServicePack,
  scheduleMeeting,
  updateMeeting,
  updatePlanUpload,
  updateServicePack,
} from "../services/collaboration.js";
import { fetchSkillStudioWorkspace, saveSkillProfile } from "../services/studioHub.js";
import { hasAssociateAccess } from "../services/portal.js";

const Stat = ({ label, value, helper, icon: Icon }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-emerald-500/10 backdrop-blur">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
      {Icon ? <Icon size={18} /> : null}
    </div>
    <div>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/80">{label}</p>
      {helper ? <p className="text-xs text-slate-200/80">{helper}</p> : null}
    </div>
  </div>
);

const Pill = ({ children, tone = "slate" }) => {
  const palette = {
    slate: "bg-white/10 text-slate-50 border border-white/10",
    outline: "border border-white/25 text-slate-50",
    green: "bg-emerald-500/20 text-emerald-50 border border-emerald-400/40",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${palette[tone] || palette.slate}`}>
      {children}
    </span>
  );
};

const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Set price";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(numeric);
};

const defaultPack = {
  title: "",
  summary: "",
  price: "",
  deliverables: "",
  duration: "",
  availability: "",
  meetingPrep: "",
  status: "draft",
};

const defaultPlan = {
  projectTitle: "",
  category: "",
  primaryStyle: "",
  tags: "",
  description: "",
  status: "draft",
};

const defaultMeeting = {
  title: "Consultation call",
  scheduledFor: "",
  meetingLink: "",
  notes: "",
  status: "scheduled",
  type: "consultation",
};

const defaultProfile = {
  fullName: "",
  firmName: "",
  title: "",
  summary: "",
  location: "",
  hourlyRate: "",
  currency: "USD",
  languages: "",
  toolset: "",
  heroImage: "",
  profileImage: "",
};

const TABS = ["profile", "plans", "packs", "media", "publish"];

const StudioServicesWorkspace = () => {
  const role = (localStorage.getItem("role") || "associate").toLowerCase();
  const ownerType = role === "firm" ? "firm" : "associate";

  const [packs, setPacks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [editingPackId, setEditingPackId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [packForm, setPackForm] = useState(defaultPack);
  const [planForm, setPlanForm] = useState(defaultPlan);
  const [meetingForm, setMeetingForm] = useState(defaultMeeting);
  const [profileForm, setProfileForm] = useState(defaultProfile);
  const [authRequired, setAuthRequired] = useState(false);
  const [savingPack, setSavingPack] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [publishConfirm, setPublishConfirm] = useState({ open: false, type: null, targetId: null, nextStatus: null });

  const loadWorkspace = async () => {
    setLoading(true);
    setProfileLoading(true);
    if (!hasAssociateAccess()) {
      setAuthRequired(true);
      setLoading(false);
      setProfileLoading(false);
      return;
    }
    setAuthRequired(false);
    try {
      const data = await fetchSkillStudioWorkspace(ownerType);
      setPacks(data?.servicePacks || []);
      setPlans(data?.planUploads || []);
      setMeetings(data?.meetings || []);
      hydrateProfileForm(data?.profileDetails || data?.profile || {});
      setEditingPackId(null);
      setEditingPlanId(null);
      setEditingMeetingId(null);
    } catch (error) {
      toast.error(error?.message || "Unable to load workspace");
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    resetPackForm();
    resetPlanForm();
    resetMeetingForm();
    setProfileForm(defaultProfile);
    loadWorkspace();
  }, [ownerType]);

  const metrics = useMemo(
    () => ({
      packs: packs.length,
      publishedPacks: packs.filter((p) => p.status === "published").length,
      plans: plans.length,
      publishedPlans: plans.filter((p) => p.status === "published").length,
      upcomingMeetings: meetings.filter((m) => m.status === "scheduled").length,
    }),
    [packs, plans, meetings]
  );
  const profileReady =
    Boolean(profileForm.title && profileForm.summary && profileForm.heroImage && profileForm.profileImage);

  const resetPackForm = () => {
    setPackForm(defaultPack);
    setEditingPackId(null);
  };

  const handleSavePack = async () => {
    if (!packForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSavingPack(true);
    const payload = {
      ...packForm,
      price: packForm.price ? Number(packForm.price) : undefined,
      deliverables: packForm.deliverables
        .split(/[,\n]+/)
        .map((d) => d.trim())
        .filter(Boolean),
      ownerType,
    };
    try {
      if (editingPackId) {
        await updateServicePack(editingPackId, payload);
        toast.success("Service pack updated");
      } else {
        await createServicePack(payload);
        toast.success("Service pack saved");
      }
      resetPackForm();
      loadWorkspace();
    } catch (error) {
      toast.error(error.message || "Unable to save service pack");
    } finally {
      setSavingPack(false);
    }
  };

  const handleEditPack = (pack) => {
    setEditingPackId(pack.id);
    setPackForm({
      title: pack.title || "",
      summary: pack.summary || "",
      price: pack.price ?? "",
      deliverables: (pack.deliverables || []).join(", "),
      duration: pack.duration || "",
      availability: pack.availability || "",
      meetingPrep: pack.meetingPrep || "",
      status: pack.status || "draft",
    });
  };

  const handleDeletePack = async (id) => {
    if (!id) return;
    try {
      await deleteServicePack(id, { ownerType });
      toast.success("Service pack deleted");
      if (editingPackId === id) {
        resetPackForm();
      }
      loadWorkspace();
    } catch (error) {
      toast.error(error.message || "Unable to delete pack");
    }
  };

  const handlePublishPack = (id, nextStatus) => {
    setPublishConfirm({ open: true, type: "pack", targetId: id, nextStatus });
  };

  const resetPlanForm = () => {
    setPlanForm(defaultPlan);
    setEditingPlanId(null);
  };

  const handleSavePlan = async () => {
    if (!planForm.projectTitle.trim()) {
      toast.error("Plan title is required");
      return;
    }
    setSavingPlan(true);
    const payload = {
      ...planForm,
      tags: planForm.tags
        .split(/[,\n]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      ownerType,
    };
    try {
      if (editingPlanId) {
        await updatePlanUpload(editingPlanId, payload);
        toast.success("Plan updated");
      } else {
        await createPlanUpload(payload);
        toast.success("Plan saved");
      }
      resetPlanForm();
      loadWorkspace();
    } catch (error) {
      toast.error(error.message || "Unable to save plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      projectTitle: plan.projectTitle || "",
      category: plan.category || "",
      primaryStyle: plan.primaryStyle || "",
      tags: (plan.tags || []).join(", "),
      description: plan.description || "",
      status: plan.status || "draft",
    });
  };

  const handleDeletePlan = async (id) => {
    if (!id) return;
    try {
      await deletePlanUpload(id, { ownerType });
      toast.success("Plan deleted");
      if (editingPlanId === id) {
        resetPlanForm();
      }
      loadWorkspace();
    } catch (error) {
      toast.error(error.message || "Unable to delete plan");
    }
  };

  const handlePublishPlan = async (id, nextStatus) => {
    setPublishConfirm({ open: true, type: "plan", targetId: id, nextStatus });
  };

  const resetMeetingForm = () => {
    setMeetingForm(defaultMeeting);
    setEditingMeetingId(null);
  };

  const handleScheduleMeeting = async () => {
    if (!meetingForm.title.trim() || !meetingForm.scheduledFor) {
      toast.error("Title and time are required");
      return;
    }
    setSavingMeeting(true);
    const payload = { ...meetingForm, ownerType };
    try {
      if (editingMeetingId) {
        await updateMeeting(editingMeetingId, payload);
        toast.success("Consultation updated");
      } else {
        await scheduleMeeting(payload);
        toast.success("Consultation scheduled");
      }
      resetMeetingForm();
      loadWorkspace();
    } catch (error) {
      toast.error(error.message || "Unable to schedule");
    } finally {
      setSavingMeeting(false);
    }
  };

  const toDateInput = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 16);
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeetingId(meeting.id);
    setMeetingForm({
      title: meeting.title || "",
      scheduledFor: toDateInput(meeting.scheduledFor),
      meetingLink: meeting.meetingLink || "",
      notes: meeting.notes || "",
      status: meeting.status || "scheduled",
      type: meeting.type || "consultation",
    });
  };

  const handleMeetingStatusChange = async (id, status) => {
    try {
      await updateMeeting(id, { status, ownerType });
      toast.success(`Marked ${status}`);
      loadWorkspace();
    } catch (error) {
      toast.error(error.message || "Unable to update meeting");
    }
  };

  const confirmPublish = async () => {
    const { type, targetId, nextStatus } = publishConfirm;
    try {
      if (type === "plan") {
        await updatePlanUpload(targetId, { status: nextStatus, ownerType });
      } else if (type === "pack") {
        await updateServicePack(targetId, { status: nextStatus, ownerType });
      }
      toast.success(nextStatus === "published" ? "Published" : "Moved to draft");
      loadWorkspace();
    } catch (error) {
      toast.error(error?.message || "Unable to update publish status");
    } finally {
      setPublishConfirm({ open: false, type: null, targetId: null, nextStatus: null });
    }
  };

  const cancelPublish = () => setPublishConfirm({ open: false, type: null, targetId: null, nextStatus: null });

  const handleDeleteMeeting = async (id) => {
    if (!id) return;
    try {
      await deleteMeeting(id, { ownerType });
      toast.success("Meeting deleted");
      if (editingMeetingId === id) {
        resetMeetingForm();
      }
      loadWorkspace();
    } catch (error) {
      toast.error(error.message || "Unable to delete meeting");
    }
  };

  const hydrateProfileForm = (profile = {}) => {
    setProfileForm({
      fullName: profile.fullName || profile.title || "",
      firmName: profile.firmName || profile.company || "",
      title: profile.title || "",
      summary: profile.summary || "",
      location: profile.location || "",
      hourlyRate: profile.rates?.hourly ?? profile.hourlyRate ?? "",
      currency: profile.rates?.currency || "USD",
      languages: Array.isArray(profile.languages) ? profile.languages.join(", ") : "",
      toolset: Array.isArray(profile.toolset) ? profile.toolset.join(", ") : Array.isArray(profile.softwares) ? profile.softwares.join(", ") : "",
      heroImage: profile.heroImage || profile.coverImage || "",
      profileImage: profile.profileImage || profile.avatar || "",
    });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        fullName: profileForm.fullName || undefined,
        firmName: profileForm.firmName || undefined,
        title: profileForm.title || undefined,
        summary: profileForm.summary || undefined,
        location: profileForm.location || undefined,
        hourlyRate: profileForm.hourlyRate ? Number(profileForm.hourlyRate) : undefined,
        rates: {
          hourly: profileForm.hourlyRate ? Number(profileForm.hourlyRate) : undefined,
          currency: profileForm.currency || "USD",
        },
        languages: profileForm.languages
          .split(/[,\n]+/)
          .map((l) => l.trim())
          .filter(Boolean),
        toolset: profileForm.toolset
          .split(/[,\n]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        heroImage: profileForm.heroImage || undefined,
        profileImage: profileForm.profileImage || undefined,
        coverImage: profileForm.heroImage || undefined,
      };
      await saveSkillProfile(payload);
      toast.success("Profile updated for Skill Studio");
      loadWorkspace();
    } catch (error) {
      toast.error(error?.message || "Unable to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const renderNav = () => (
    <aside className="hidden w-60 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-emerald-500/10 backdrop-blur lg:block">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200 mb-3">Workspace</p>
      <div className="space-y-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold ${
              activeTab === tab ? "bg-emerald-400 text-slate-950 shadow shadow-emerald-500/40" : "text-slate-200 hover:bg-white/5"
            }`}
          >
            {tab === "profile" && "Profile"}
            {tab === "plans" && "Plan tiles"}
            {tab === "packs" && "Service packs"}
            {tab === "media" && "Media library"}
            {tab === "publish" && "Publish queue"}
          </button>
        ))}
      </div>
    </aside>
  );

  const renderPublishModal = () =>
    publishConfirm.open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/10 p-6 text-slate-50 shadow-2xl backdrop-blur">
          <h3 className="text-lg font-semibold text-white">Confirm publish change</h3>
          <p className="mt-2 text-sm text-slate-200/80">
            {publishConfirm.nextStatus === "published"
              ? "This will publish the item to your public Skill Studio card."
              : "This will move the item back to draft and hide it from your card."}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={cancelPublish}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-50 hover:border-emerald-200/60"
            >
              Cancel
            </button>
            <button
              onClick={confirmPublish}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow shadow-emerald-500/40 hover:bg-emerald-300"
            >
              {publishConfirm.nextStatus === "published" ? "Publish" : "Set draft"}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    authRequired ? (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-lg space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200">Skill Studio</p>
          <h1 className="text-2xl font-semibold text-white">Sign in to manage your workspace</h1>
          <p className="text-sm text-slate-200/80">
            Use an associate or firm account to edit Skill Studio packs, plans, and profile details.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-300"
          >
            Go to login
          </a>
        </div>
      </div>
    ) : (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50">
      {renderPublishModal()}
      <div className="pointer-events-none absolute inset-0 select-none bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.08),transparent_20%)]" />
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-20 pt-12 sm:px-6 lg:px-10">
        <header className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-2xl shadow-emerald-500/10 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200">
                <Sparkles size={14} className="text-emerald-300" /> Studio workspace
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Publish Skill Studio services</h1>
              <p className="text-sm text-slate-200/90 sm:text-base">
                Draft and publish service packs, plan tiles, and consultation slots. Changes instantly power Skill Studio tiles and the associate profile.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right text-xs text-slate-200/80">
              <div>
                <p className="font-semibold text-white">Workspace scope</p>
                <p className="uppercase tracking-[0.2em] text-emerald-200">{ownerType}</p>
                <p>Role picked from your current session.</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={loadWorkspace}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-100 hover:border-emerald-200/60"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
                <a
                  href="/workspace/studio"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-emerald-400/80 px-3 py-1 font-semibold text-slate-950 hover:bg-emerald-300"
                >
                  Open Skill Studio
                </a>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Service packs" value={metrics.packs} helper={`${metrics.publishedPacks} published`} icon={FileText} />
            <Stat label="Plan tiles" value={metrics.plans} helper={`${metrics.publishedPlans} published`} icon={Layers} />
            <Stat label="Consultations" value={metrics.upcomingMeetings} helper="Upcoming" icon={CalendarClock} />
            <Stat label="Role" value={ownerType} helper="Workspace scope" icon={Sparkles} />
          </div>

          {!loading && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/90 shadow-inner shadow-emerald-500/10">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Profile</p>
                <p className="mt-1 font-semibold text-white">{profileReady ? "Ready to publish" : "Add basics"}</p>
                <p className="text-xs text-slate-200/70">
                  {profileReady
                    ? "Cover, avatar, title, and summary set. Save to sync to your tile."
                    : "Add title, summary, and both images to publish your tile."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/90 shadow-inner shadow-blue-500/10">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Plan tiles</p>
                <p className="mt-1 font-semibold text-white">
                  {metrics.publishedPlans ? `${metrics.publishedPlans} live` : "No published tiles"}
                </p>
                <p className="text-xs text-slate-200/70">
                  Save and publish plan tiles to show projects on your Skill Studio card.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/90 shadow-inner shadow-emerald-500/10">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Service packs</p>
                <p className="mt-1 font-semibold text-white">
                  {metrics.publishedPacks ? `${metrics.publishedPacks} live` : "No published packs"}
                </p>
                <p className="text-xs text-slate-200/70">
                  Publish packs to expose pricing and deliverables on your card.
                </p>
              </div>
            </div>
          )}
        </header>

        <div className="flex flex-col gap-6 lg:flex-row">
          {renderNav()}
          {loading ? (
            <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 shadow-lg shadow-emerald-500/10 backdrop-blur">
              Loading workspace...
            </div>
          ) : (
            <div className="flex-1 space-y-6">
              <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/15 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Tile & profile</p>
                    <p className="text-sm text-slate-200/90">
                      Edit marketplace tile + profile fields (name, firm, rate, languages, tools, imagery) right from the workspace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300 disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                </div>
                {profileLoading ? (
                  <p className="text-sm text-slate-200/80">Loading profile...</p>
                ) : (
                  <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-slate-200">
                          Display name
                          <input
                            value={profileForm.fullName}
                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                          />
                        </label>
                        <label className="text-xs text-slate-200">
                          Firm name
                          <input
                            value={profileForm.firmName}
                            onChange={(e) => setProfileForm({ ...profileForm, firmName: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                          />
                        </label>
                      </div>
                      <label className="text-xs text-slate-200">
                        Title / headline
                        <input
                          value={profileForm.title}
                          onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                      <label className="text-xs text-slate-200">
                        Summary / bio
                        <textarea
                          value={profileForm.summary}
                          onChange={(e) => setProfileForm({ ...profileForm, summary: e.target.value })}
                          rows={3}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                        />
                      </label>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="text-xs text-slate-200">
                          Location
                          <input
                            value={profileForm.location}
                            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                          />
                        </label>
                        <label className="text-xs text-slate-200">
                          Hourly rate
                          <input
                            type="number"
                            value={profileForm.hourlyRate}
                            onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                          />
                        </label>
                        <label className="text-xs text-slate-200">
                          Currency
                          <input
                            value={profileForm.currency}
                            onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value.toUpperCase() })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-slate-200">
                          Languages (comma separated)
                          <input
                            value={profileForm.languages}
                            onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                          />
                        </label>
                        <label className="text-xs text-slate-200">
                          Toolset / software (comma separated)
                          <input
                            value={profileForm.toolset}
                            onChange={(e) => setProfileForm({ ...profileForm, toolset: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-slate-200">
                          Cover image URL
                          <input
                            value={profileForm.heroImage}
                            onChange={(e) => setProfileForm({ ...profileForm, heroImage: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                            placeholder="https://..."
                          />
                        </label>
                        <label className="text-xs text-slate-200">
                          Profile image URL
                          <input
                            value={profileForm.profileImage}
                            onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                            placeholder="https://..."
                          />
                        </label>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200/80">
                        <p className="font-semibold text-white">Tile preview mapping</p>
                        <p>Name, firm, rate, languages, tools, and imagery feed the Skill Studio marketplace tile and the associate profile header.</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200/80 space-y-2">
                        <p className="text-sm font-semibold text-white">Profile preview</p>
                        <p className="text-xs text-slate-200/70">What buyers see on your card.</p>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-slate-50 space-y-2">
                          <p className="text-lg font-semibold">{profileForm.title || "Associate headline"}</p>
                          <p className="text-sm text-slate-200/80">{profileForm.summary || "Add a concise summary"}</p>
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-200/70">
                            {profileForm.location ? <Pill tone="outline">{profileForm.location}</Pill> : null}
                            {profileForm.languages ? <Pill tone="outline">{profileForm.languages}</Pill> : null}
                            {profileForm.toolset ? <Pill tone="outline">{profileForm.toolset}</Pill> : null}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                          <p className="text-sm font-semibold text-white">Publishing</p>
                          <p className="text-xs text-slate-200/70">Save updates as draft. Use publish queue to push live.</p>
                          <div className="mt-2 space-y-1 text-slate-200/80">
                            <p>Profile status: {profileReady ? "Ready" : "Draft"}</p>
                            <p>Plan tiles: {metrics.publishedPlans} published / {metrics.plans} total</p>
                            <p>Service packs: {metrics.publishedPacks} published / {metrics.packs} total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/15 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200">Service packs</p>
                    <p className="text-sm text-slate-200/90">Packages that show on your Skill Studio tile and profile.</p>
                    {editingPackId ? (
                      <p className="text-xs text-emerald-100/80">Editing an existing pack; save to update the live tile or cancel to start fresh.</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {editingPackId ? (
                      <button
                        type="button"
                        onClick={resetPackForm}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-100 hover:border-emerald-200/50"
                      >
                        Cancel edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSavePack}
                      disabled={savingPack}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-300 disabled:opacity-60"
                    >
                      {savingPack ? (editingPackId ? "Updating..." : "Saving...") : editingPackId ? "Update pack" : "Save pack"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-slate-200">
                    Title
                    <input
                      value={packForm.title}
                      onChange={(e) => setPackForm({ ...packForm, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-200">
                    Price
                    <input
                      type="number"
                      value={packForm.price}
                      onChange={(e) => setPackForm({ ...packForm, price: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="text-xs text-slate-200">
                  Summary
                  <textarea
                    value={packForm.summary}
                    onChange={(e) => setPackForm({ ...packForm, summary: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-slate-200">
                  Deliverables (comma or line separated)
                  <textarea
                    value={packForm.deliverables}
                    onChange={(e) => setPackForm({ ...packForm, deliverables: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs text-slate-200">
                    Duration / cadence
                    <input
                      value={packForm.duration}
                      onChange={(e) => setPackForm({ ...packForm, duration: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-200">
                    Availability
                    <input
                      value={packForm.availability}
                      onChange={(e) => setPackForm({ ...packForm, availability: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-200">
                    Pre-call prep
                    <input
                      value={packForm.meetingPrep}
                      onChange={(e) => setPackForm({ ...packForm, meetingPrep: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-200">
                    Status
                    <select
                      value={packForm.status}
                      onChange={(e) => setPackForm({ ...packForm, status: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 focus:border-emerald-300 focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {packs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-200">
                      No packs yet. Draft your first scope and publish it to Skill Studio.
                    </div>
                  ) : (
                    packs.map((pack) => (
                      <article key={pack.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-emerald-500/10">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{pack.title}</p>
                            <p className="text-xs text-slate-200/80">{pack.summary}</p>
                          </div>
                          <Pill tone={pack.status === "published" ? "green" : "outline"}>{pack.status}</Pill>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200/90">
                          <Pill tone="outline">{formatCurrency(pack.price, pack.currency)}</Pill>
                          {pack.duration ? <Pill tone="outline">{pack.duration}</Pill> : null}
                          {pack.availability ? <Pill tone="outline">{pack.availability}</Pill> : null}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-200/80">
                          {(pack.deliverables || []).slice(0, 4).map((d) => (
                            <Pill key={d}>{d}</Pill>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleEditPack(pack)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1 font-semibold text-slate-50 hover:border-emerald-300/60"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPublishConfirm({
                                open: true,
                                type: "pack",
                                targetId: pack.id,
                                nextStatus: pack.status === "published" ? "draft" : "published",
                              })
                            }
                            className="rounded-lg border border-white/20 px-3 py-1 font-semibold text-slate-50 hover:border-emerald-300/60"
                          >
                            {pack.status === "published" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePack(pack.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200/40 bg-rose-500/10 px-3 py-1 font-semibold text-rose-100 hover:border-rose-200/80"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-blue-200">Plan tiles</p>
                  <p className="text-sm text-slate-200/90">Upload concepts that show on your Skill Studio card.</p>
                  {editingPlanId ? (
                    <p className="text-xs text-blue-100/80">Editing an existing tile. Save to overwrite or cancel to start a new draft.</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {editingPlanId ? (
                    <button
                      type="button"
                      onClick={resetPlanForm}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-blue-100 hover:border-blue-200/50"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSavePlan}
                    disabled={savingPlan}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/30 transition hover:bg-blue-300 disabled:opacity-60"
                  >
                    {savingPlan ? (editingPlanId ? "Updating..." : "Saving...") : editingPlanId ? "Update plan" : "Save plan"}
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-200">
                  Project title
                  <input
                    value={planForm.projectTitle}
                    onChange={(e) => setPlanForm({ ...planForm, projectTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-slate-200">
                  Category
                  <input
                    value={planForm.category}
                    onChange={(e) => setPlanForm({ ...planForm, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-200">
                  Style
                  <input
                    value={planForm.primaryStyle}
                    onChange={(e) => setPlanForm({ ...planForm, primaryStyle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-slate-200">
                  Tags (comma separated)
                  <input
                    value={planForm.tags}
                    onChange={(e) => setPlanForm({ ...planForm, tags: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
                  />
                </label>
              </div>
              <label className="text-xs text-slate-200">
                Status
                <select
                  value={planForm.status}
                  onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 focus:border-blue-300 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="text-xs text-slate-200">
                Description
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
                />
              </label>

              <div className="space-y-3">
                {plans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-200">
                    No plan tiles yet. Save one to preview in Skill Studio.
                  </div>
                ) : (
                  plans.map((plan) => (
                    <article key={plan.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-blue-500/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{plan.projectTitle}</p>
                          <p className="text-xs text-slate-200/80">{plan.category}</p>
                        </div>
                        <Pill tone="outline">{plan.status || "draft"}</Pill>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-200/90">
                        {plan.primaryStyle ? <Pill tone="outline">{plan.primaryStyle}</Pill> : null}
                        {(plan.tags || []).map((tag) => (
                          <Pill key={tag}>{tag}</Pill>
                        ))}
                      </div>
                      {plan.description ? <p className="text-xs text-slate-200/80 line-clamp-2">{plan.description}</p> : null}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleEditPlan(plan)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1 font-semibold text-slate-50 hover:border-blue-300/60"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePublishPlan(plan.id, plan.status === "published" ? "draft" : "published")}
                          className="rounded-lg border border-white/20 px-3 py-1 font-semibold text-slate-50 hover:border-blue-300/60"
                        >
                          {plan.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200/40 bg-rose-500/10 px-3 py-1 font-semibold text-rose-100 hover:border-rose-200/80"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-indigo-200">Consultations</p>
              <p className="text-sm text-slate-200/90">Log discovery calls that buyers book from your Skill Studio tile.</p>
              {editingMeetingId ? (
                <p className="text-xs text-indigo-100/80">Editing a slot. Update timing, link, or status, or cancel to add a new slot.</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {editingMeetingId ? (
                <button
                  type="button"
                  onClick={resetMeetingForm}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-indigo-100 hover:border-indigo-200/50"
                >
                  Cancel edit
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleScheduleMeeting}
                disabled={savingMeeting}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-300 disabled:opacity-60"
              >
                {savingMeeting ? (editingMeetingId ? "Updating..." : "Saving...") : editingMeetingId ? "Update slot" : "Add slot"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_1fr]">
            <div className="space-y-3">
              {meetings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-200">
                  No consultations yet. Requests from Skill Studio will appear here.
                </div>
              ) : (
                meetings.map((meeting) => (
                  <article key={meeting.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-indigo-500/10">
                    <div>
                      <p className="text-sm font-semibold text-white">{meeting.title}</p>
                      <p className="text-xs text-slate-200/80">
                        {meeting.type || "consultation"} - {meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : "TBD"}
                      </p>
                      {meeting.meetingLink ? (
                        <a
                          href={meeting.meetingLink}
                          className="text-xs font-semibold text-blue-100 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open meeting link
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Pill tone={meeting.status === "completed" ? "green" : "outline"}>{meeting.status}</Pill>
                      <div className="flex flex-wrap justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleEditMeeting(meeting)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1 font-semibold text-slate-50 hover:border-indigo-300/60"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMeetingStatusChange(meeting.id, meeting.status === "completed" ? "scheduled" : "completed")}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-100 hover:border-emerald-200/80"
                        >
                          {meeting.status === "completed" ? "Reopen" : "Mark done"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMeetingStatusChange(meeting.id, "cancelled")}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200/40 bg-amber-500/10 px-3 py-1 font-semibold text-amber-100 hover:border-amber-200/80"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200/40 bg-rose-500/10 px-3 py-1 font-semibold text-rose-100 hover:border-rose-200/80"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner shadow-indigo-500/10">
              <p className="text-sm font-semibold text-white">New consultation</p>
              <label className="text-xs text-slate-200">
                Title
                <input
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none"
                />
              </label>
              <label className="text-xs text-slate-200">
                Date & time
                <input
                  type="datetime-local"
                  value={meetingForm.scheduledFor}
                  onChange={(e) => setMeetingForm({ ...meetingForm, scheduledFor: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none"
                />
              </label>
              <label className="text-xs text-slate-200">
                Meeting link
                <input
                  value={meetingForm.meetingLink}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none"
                  placeholder="Zoom / Meet / Teams link"
                />
              </label>
              <label className="text-xs text-slate-200">
                Status
                <select
                  value={meetingForm.status}
                  onChange={(e) => setMeetingForm({ ...meetingForm, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-50 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="text-xs text-slate-200">
                Notes
                <textarea
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none"
                  placeholder="Prep notes, agenda, or attendee emails"
                />
              </label>
            </div>
          </div>
        </section>

          </div>
        )}

        </div>
      </main>
    </div>
    )
  );
};

export default StudioServicesWorkspace;
