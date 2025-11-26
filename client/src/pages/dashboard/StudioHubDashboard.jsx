import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { CalendarClock, CheckCircle2, CloudUpload, Files, Layers, PhoneCall, Rocket, Sparkles, Upload, Wand2, Wrench } from "lucide-react";
import RegistrStrip from "../../components/registrstrip";
import Footer from "../../components/Footer";
import {
  fetchStudioHub,
  createPlan,
  publishPlan,
  uploadPlanMedia,
  scheduleConsultation,
  saveSkillProfile,
} from "../../services/studioHub.js";
import { uploadStudioAsset } from "../../services/uploads.js";

const Card = ({ id, title, subtitle, actions, children }) => (
  <section id={id} className="scroll-mt-24 space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">{title}</p>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
    {children}
  </section>
);

const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner shadow-slate-200/80">
    <p className="text-lg font-semibold text-slate-900">{value}</p>
    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
  </div>
);

const defaultPlan = { projectTitle: "", category: "", primaryStyle: "", description: "", tags: "" };
const defaultConsult = { title: "Consultation call", scheduledFor: "", durationMinutes: 45, type: "consultation", meetingLink: "" };

const StudioHubDashboard = () => {
  const [ownerType, setOwnerType] = useState(() => {
    const stored = (localStorage.getItem("role") || "").toLowerCase();
    return stored === "firm" ? "firm" : "associate";
  });
  const [hub, setHub] = useState({ loading: true, data: null, error: null });
  const [planForm, setPlanForm] = useState(defaultPlan);
  const [consultForm, setConsultForm] = useState(defaultConsult);
  const [profileForm, setProfileForm] = useState({
    toolset: "",
    deliverables: "",
    workHistory: [],
    fullName: "",
    title: "",
    firmType: "",
    teamSize: "",
    registrationId: "",
    portfolioLink: "",
    primaryCategories: "",
    primaryStyles: "",
    avgDesignRate: "",
    servicesOffered: "",
    coverImage: "",
    profileImage: "",
    verificationDoc: "",
    portfolioUpload: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const uploadInputRef = useRef(null);
  const portfolioInputRef = useRef(null);
  const activePlan = useRef(null);
  const coverInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const verificationInputRef = useRef(null);
  const portfolioDocInputRef = useRef(null);

  const loadHub = async () => {
    setHub((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchStudioHub(ownerType);
      setHub({ loading: false, data, error: null });
      setProfileForm((prev) => ({
        ...prev,
        toolset: (data.toolset || []).join(", "),
        deliverables: (data.deliverables || []).join(", "),
        workHistory: data.workHistory || prev.workHistory,
        fullName: data.profileDetails?.fullName || prev.fullName,
        title: data.profileDetails?.title || prev.title,
        firmType: data.profileDetails?.firmType || prev.firmType,
        teamSize: data.profileDetails?.teamSize ?? prev.teamSize,
        registrationId: data.profileDetails?.registrationId || prev.registrationId,
        portfolioLink: data.profileDetails?.portfolioLink || prev.portfolioLink,
        primaryCategories: (data.profileDetails?.primaryCategories || []).join(", "),
        primaryStyles: (data.profileDetails?.primaryStyles || []).join(", "),
        avgDesignRate: data.profileDetails?.avgDesignRate ?? prev.avgDesignRate,
        servicesOffered: (data.profileDetails?.servicesOffered || []).join(", "),
        coverImage: data.profileDetails?.heroImage || prev.coverImage,
        profileImage: data.profileDetails?.profileImage || prev.profileImage,
        verificationDoc: data.profileDetails?.verificationDoc || prev.verificationDoc,
        portfolioUpload: data.profileDetails?.portfolioUpload || prev.portfolioUpload,
      }));
    } catch (error) {
      setHub({ loading: false, data: null, error: error.message || "Unable to load dashboard" });
    }
  };

  useEffect(() => {
    loadHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerType]);

const profileDetails = hub.data?.profileDetails || {};
const plans = hub.data?.planUploads || [];
const meetings = hub.data?.meetings || [];
const servicePacks = hub.data?.servicePacks || [];

  const handleCreatePlan = async () => {
    if (!planForm.projectTitle.trim()) {
      toast.error("Add a title");
      return;
    }
    try {
      await createPlan({ ...planForm, tags: planForm.tags.split(",").map((t) => t.trim()).filter(Boolean), ownerType }, ownerType);
      toast.success("Plan drafted");
      setPlanForm(defaultPlan);
      loadHub();
    } catch (error) {
      toast.error(error.message || "Unable to save plan");
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishPlan(id, ownerType);
      toast.success("Published");
      loadHub();
    } catch (error) {
      toast.error(error.message || "Publish failed");
    }
  };

  const handleUploadMedia = (planId) => {
    activePlan.current = planId;
    uploadInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    const planId = activePlan.current;
    if (!file || !planId) return;
    try {
      await uploadPlanMedia(planId, file, { ownerType, kind: "render", secure: false });
      toast.success("Uploaded to Drive + Mongo");
      loadHub();
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      event.target.value = "";
      activePlan.current = null;
    }
  };

  const handleSchedule = async () => {
    if (!consultForm.scheduledFor) return toast.error("Pick a time");
    try {
      await scheduleConsultation({ ...consultForm, ownerType });
      toast.success("Consultation scheduled");
      setConsultForm(defaultConsult);
      loadHub();
    } catch (error) {
      toast.error(error.message || "Unable to schedule");
    }
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await saveSkillProfile({
        toolset: profileForm.toolset.split(",").map((v) => v.trim()).filter(Boolean),
        deliverables: profileForm.deliverables.split(",").map((v) => v.trim()).filter(Boolean),
        workHistory: profileForm.workHistory.filter((item) => item.company),
        fullName: profileForm.fullName,
        title: profileForm.title,
        firmType: profileForm.firmType,
        teamSize: profileForm.teamSize ? Number(profileForm.teamSize) : undefined,
        registrationId: profileForm.registrationId,
        portfolioLink: profileForm.portfolioLink,
        primaryCategories: profileForm.primaryCategories.split(",").map((v) => v.trim()).filter(Boolean),
        primaryStyles: profileForm.primaryStyles.split(",").map((v) => v.trim()).filter(Boolean),
        avgDesignRate: profileForm.avgDesignRate ? Number(profileForm.avgDesignRate) : undefined,
        servicesOffered: profileForm.servicesOffered.split(",").map((v) => v.trim()).filter(Boolean),
        heroImage: profileForm.coverImage,
        profileImage: profileForm.profileImage,
        verificationDoc: profileForm.verificationDoc,
        portfolioUpload: profileForm.portfolioUpload,
      });
      toast.success("Skill Studio synced");
      loadHub();
    } catch (error) {
      toast.error(error.message || "Unable to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddHistory = () =>
    setProfileForm((prev) => ({
      ...prev,
      workHistory: [...(prev.workHistory || []), { company: "New project", role: "Designer", duration: "", summary: "" }],
    }));

  const handlePortfolioUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const upload = await uploadStudioAsset(file, { kind: "portfolio", secure: false });
      const next = [
        ...(hub.data?.portfolioMedia || []),
        { title: file.name, description: "Uploaded from dashboard", mediaUrl: upload?.url || upload?.downloadUrl, kind: file.type.startsWith("video") ? "video" : "image" },
      ];
      await saveSkillProfile({ portfolioMedia: next });
      toast.success("Portfolio updated");
      loadHub();
    } catch (error) {
      toast.error(error.message || "Unable to upload");
    } finally {
      event.target.value = "";
    }
  };

  const uploadProfileAsset = async (file, target) => {
    if (!file) return;
    try {
      const upload = await uploadStudioAsset(file, { kind: "profile", secure: false });
      setProfileForm((prev) => ({ ...prev, [target]: upload?.url || upload?.downloadUrl || prev[target] }));
    } catch (error) {
      toast.error(error.message || "Upload failed");
    }
  };

  const handleVerificationUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const upload = await uploadStudioAsset(file, { kind: "verification", secure: true });
      setProfileForm((prev) => ({ ...prev, verificationDoc: upload?.url || upload?.downloadUrl }));
      toast.success("Verification document uploaded");
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      event.target.value = "";
    }
  };

  const handlePortfolioDocUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const upload = await uploadStudioAsset(file, { kind: "portfolio-doc", secure: false });
      setProfileForm((prev) => ({ ...prev, portfolioUpload: upload?.url || upload?.downloadUrl }));
      toast.success("Portfolio file uploaded");
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-900">
      <RegistrStrip />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600">Studio hub</p>
                <p className="text-xs text-slate-500">Design + Skill Studio</p>
              </div>
              <Sparkles size={18} className="text-amber-500" />
            </div>
            <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-white shadow">
              {ownerType}
            </div>
            <nav className="space-y-2 text-sm text-slate-600">
              {[
                { href: "#profile-complete", label: "Profile" },
                { href: "#workspaces", label: "Workspaces" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="block rounded-xl border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50">
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-7">
            <Card
              id="profile-complete"
              title="Profile completion"
              subtitle="Share your name, firm details, and brand imagery. This syncs to Skill Studio and your public profile."
              actions={
                <button
                  type="button"
                  onClick={handleProfileSave}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
                  disabled={savingProfile}
                >
                  <CheckCircle2 size={14} /> {savingProfile ? "Saving..." : "Save profile"}
                </button>
              }
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-600">
                      Full name
                      <input
                        value={profileForm.fullName || profileDetails.fullName || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Title
                      <input
                        value={profileForm.title || profileDetails.title || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-600">
                      Firm type
                      <input
                        value={profileForm.firmType || profileDetails.firmType || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, firmType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Team size
                      <input
                        type="number"
                        value={profileForm.teamSize ?? profileDetails.teamSize ?? ""}
                        onChange={(e) => setProfileForm({ ...profileForm, teamSize: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-600">
                      Registration ID
                      <input
                        value={profileForm.registrationId || profileDetails.registrationId || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, registrationId: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Portfolio link
                      <input
                        value={profileForm.portfolioLink || profileDetails.portfolioLink || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, portfolioLink: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-600">
                      Primary categories (comma separated)
                      <input
                        value={profileForm.primaryCategories || (profileDetails.primaryCategories || []).join(", ")}
                        onChange={(e) => setProfileForm({ ...profileForm, primaryCategories: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Primary styles (comma separated)
                      <input
                        value={profileForm.primaryStyles || (profileDetails.primaryStyles || []).join(", ")}
                        onChange={(e) => setProfileForm({ ...profileForm, primaryStyles: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-600">
                      Average design rate ($/sqft)
                      <input
                        value={profileForm.avgDesignRate ?? profileDetails.avgDesignRate ?? ""}
                        onChange={(e) => setProfileForm({ ...profileForm, avgDesignRate: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Services offered (comma separated)
                      <input
                        value={profileForm.servicesOffered || (profileDetails.servicesOffered || []).join(", ")}
                        onChange={(e) => setProfileForm({ ...profileForm, servicesOffered: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-600">
                      Verification document
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => verificationInputRef.current?.click()}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow hover:bg-slate-50"
                        >
                          Upload document
                        </button>
                        {profileForm.verificationDoc || profileDetails.verificationDoc ? (
                          <a
                            href={profileForm.verificationDoc || profileDetails.verificationDoc}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-slate-700 underline"
                          >
                            View current
                          </a>
                        ) : null}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow">
                  <p className="text-sm font-semibold text-slate-900">Brand imagery</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-slate-600">Cover image</p>
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                      >
                        Upload cover
                      </button>
                      {(profileForm.coverImage || profileDetails.heroImage) && (
                        <img
                          src={profileForm.coverImage || profileDetails.heroImage}
                          alt="Cover"
                          className="h-32 w-full rounded-xl object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-slate-600">Profile image</p>
                      <button
                        type="button"
                        onClick={() => profileInputRef.current?.click()}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                      >
                        Upload profile
                      </button>
                      {(profileForm.profileImage || profileDetails.profileImage) && (
                        <img
                          src={profileForm.profileImage || profileDetails.profileImage}
                          alt="Profile"
                          className="h-32 w-full rounded-xl object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <label className="text-xs text-slate-600">
                    Portfolio upload
                    <button
                      type="button"
                      onClick={() => portfolioDocInputRef.current?.click()}
                      className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow hover:bg-slate-50"
                    >
                      Upload portfolio file
                    </button>
                    {profileForm.portfolioUpload || profileDetails.portfolioUpload ? (
                      <a
                        href={profileForm.portfolioUpload || profileDetails.portfolioUpload}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-xs font-semibold text-slate-700 underline"
                      >
                        View uploaded
                      </a>
                    ) : null}
                  </label>
                </div>
              </div>
            </Card>

            <Card
              id="workspaces"
              title="Workspaces"
              subtitle="Jump into the dedicated workspaces for selling services or uploading design packs."
              actions={
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Rocket size={14} /> Pick a workspace
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/workspace/studio"
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow hover:border-slate-300"
                >
                  <p className="text-sm font-semibold text-slate-900">Studio workspace</p>
                  <p className="text-xs text-slate-600">
                    Sell associate services, publish service packs, and manage consultations.
                  </p>
                </a>
                <a
                  href="/workspace/design"
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow hover:border-slate-300"
                >
                  <p className="text-sm font-semibold text-slate-900">Design workspace</p>
                  <p className="text-xs text-slate-600">
                    Upload design plans, renders, and walkthroughs for buyers.
                  </p>
                </a>
              </div>
            </Card>
            <Card
              id="design"
              title="Design Studio"
              subtitle="Host plans, working drawings, and renders. Uploads store to Drive + Mongo and show thumbnails instantly."
              actions={
                <button
                  type="button"
                  onClick={handleCreatePlan}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
                >
                  <Wand2 size={14} /> Draft plan
                </button>
              }
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-3">
                  {plans.length ? (
                    plans.map((plan) => (
                      <article key={plan.id} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{plan.projectTitle}</p>
                            <p className="text-xs text-slate-400">{plan.category || "Category"} • {plan.primaryStyle || "Style"}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleUploadMedia(plan.id)}
                              className="rounded-full border border-slate-700 px-3 py-1 text-slate-100 hover:border-slate-500"
                            >
                              Upload
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePublish(plan.id)}
                              className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-emerald-100"
                            >
                              {plan.status === "published" ? "Published" : "Publish"}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <span className="rounded-lg bg-slate-100 px-3 py-2">Media: {plan.media?.length || 0}</span>
                          <span className="rounded-lg bg-slate-100 px-3 py-2">Tags: {plan.tags?.length || 0}</span>
                        </div>
                        {plan.media?.length ? (
                          <div className="grid grid-cols-3 gap-2">
                            {plan.media.slice(0, 3).map((item) => (
                              <div key={item.id || item.url} className="h-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                {item.thumbnail ? <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" /> : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600 shadow-inner">
                      No plans yet. Draft a plan and upload renders from your machine to populate Design Studio.
                    </div>
                  )}
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow">
                  <p className="text-sm font-semibold text-slate-900">New plan</p>
                  <label className="text-xs text-slate-600">
                    Title
                    <input
                      value={planForm.projectTitle}
                      onChange={(e) => setPlanForm({ ...planForm, projectTitle: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    Category
                    <input
                      value={planForm.category}
                      onChange={(e) => setPlanForm({ ...planForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    Style
                    <input
                      value={planForm.primaryStyle}
                      onChange={(e) => setPlanForm({ ...planForm, primaryStyle: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    Description
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    Tags (comma separated)
                    <input
                      value={planForm.tags}
                      onChange={(e) => setPlanForm({ ...planForm, tags: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleCreatePlan}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Wand2 size={14} /> Save draft
                  </button>
                </div>
              </div>
            </Card>

            <Card
              id="consult"
              title="Consultations & appointments"
              subtitle="Offer consultation calls, handovers, or site visits directly from your workspace."
              actions={
                <button
                  type="button"
                  onClick={handleSchedule}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100"
                >
                  <CalendarClock size={14} /> Add slot
                </button>
              }
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-2">
                  {meetings.length ? (
                    meetings.map((meeting) => (
                      <div key={meeting.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{meeting.title}</p>
                          <p className="text-xs text-slate-400">
                            {meeting.type || "consultation"} • {meeting.meetingLink || "Set a link"} •{" "}
                            {meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : "TBD"}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">{meeting.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">No consultations yet.</div>
                  )}
                </div>
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-white">New consultation</p>
                  <label className="text-xs text-slate-300">
                    Title
                    <input
                      value={consultForm.title}
                      onChange={(e) => setConsultForm({ ...consultForm, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Date & time
                    <input
                      type="datetime-local"
                      value={consultForm.scheduledFor}
                      onChange={(e) => setConsultForm({ ...consultForm, scheduledFor: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Meeting link
                    <input
                      value={consultForm.meetingLink}
                      onChange={(e) => setConsultForm({ ...consultForm, meetingLink: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSchedule}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
                  >
                    <PhoneCall size={14} /> Schedule
                  </button>
                </div>
              </div>
            </Card>

            <Card
              id="profile"
              title="Tools, deliverables, and work history"
              subtitle="Sync the toolset and history that appear on Skill Studio and Design Studio."
              actions={
                <button
                  type="button"
                  onClick={handleProfileSave}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100"
                  disabled={savingProfile}
                >
                  <CheckCircle2 size={14} /> {savingProfile ? "Saving..." : "Sync profile"}
                </button>
              }
            >
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <label className="text-xs text-slate-300">
                    Toolset & software (comma separated)
                    <textarea
                      value={profileForm.toolset}
                      onChange={(e) => setProfileForm({ ...profileForm, toolset: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Deliverables
                    <textarea
                      value={profileForm.deliverables}
                      onChange={(e) => setProfileForm({ ...profileForm, deliverables: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-200">
                    {(hub.data?.toolset || []).slice(0, 6).map((item) => (
                      <span key={item} className="rounded-full bg-slate-800 px-3 py-1">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Work history</p>
                    <button type="button" onClick={handleAddHistory} className="text-xs font-semibold text-slate-200 underline decoration-dotted">
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(profileForm.workHistory || []).map((item, index) => (
                      <div key={`${item.company}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
                        <input
                          value={item.company}
                          onChange={(e) => {
                            const next = [...profileForm.workHistory];
                            next[index] = { ...next[index], company: e.target.value };
                            setProfileForm({ ...profileForm, workHistory: next });
                          }}
                          className="mb-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                          placeholder="Company"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={item.role || ""}
                            onChange={(e) => {
                              const next = [...profileForm.workHistory];
                              next[index] = { ...next[index], role: e.target.value };
                              setProfileForm({ ...profileForm, workHistory: next });
                            }}
                            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                            placeholder="Role"
                          />
                          <input
                            value={item.duration || ""}
                            onChange={(e) => {
                              const next = [...profileForm.workHistory];
                              next[index] = { ...next[index], duration: e.target.value };
                              setProfileForm({ ...profileForm, workHistory: next });
                            }}
                            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                            placeholder="Duration"
                          />
                        </div>
                        <textarea
                          value={item.summary || ""}
                          onChange={(e) => {
                            const next = [...profileForm.workHistory];
                            next[index] = { ...next[index], summary: e.target.value };
                            setProfileForm({ ...profileForm, workHistory: next });
                          }}
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                          placeholder="What you delivered"
                        />
                      </div>
                    ))}
                    {!profileForm.workHistory?.length ? (
                      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">Add roles and project history.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>

            <Card
              id="portfolio"
              title="Portfolio & media"
              subtitle="Upload renders, walkthroughs, or case studies from your machine. Files save to Drive and show thumbnails instantly."
              actions={
                <button
                  type="button"
                  onClick={() => portfolioInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-slate-600"
                >
                  <CloudUpload size={14} /> Upload media
                </button>
              }
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(hub.data?.portfolioMedia || []).map((item, index) => (
                    <div key={`${item.mediaUrl}-${index}`} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
                      <div className="h-32 bg-slate-900">
                        {item.mediaUrl ? <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-white">{item.title || "Untitled"}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  ))}
                  {!hub.data?.portfolioMedia?.length ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
                      Upload case studies to seed Skill Studio.
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-white">Deliverables</p>
                  <div className="space-y-1 text-xs text-slate-300">
                    {servicePacks.length ? (
                      servicePacks.map((pack) => (
                        <div key={pack.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                          <p className="text-sm font-semibold text-white">{pack.title}</p>
                          <p className="text-[11px] text-slate-400">{pack.summary}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(pack.deliverables || []).map((item) => (
                              <span key={item} className="rounded-full bg-slate-800 px-3 py-1 text-[11px]">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3">No service packs yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <input
        ref={coverInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          uploadProfileAsset(e.target.files?.[0], "coverImage");
          e.target.value = "";
        }}
      />
      <input
        ref={profileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          uploadProfileAsset(e.target.files?.[0], "profileImage");
          e.target.value = "";
        }}
      />
      <input ref={uploadInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,application/pdf" />
      <input ref={portfolioInputRef} type="file" className="hidden" onChange={handlePortfolioUpload} accept="image/*,video/*,application/pdf" />
      <input ref={verificationInputRef} type="file" className="hidden" onChange={handleVerificationUpload} />
      <input ref={portfolioDocInputRef} type="file" className="hidden" onChange={handlePortfolioDocUpload} />
    </div>
  );
};

export default StudioHubDashboard;



