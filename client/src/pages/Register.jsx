import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { loginWithGoogle, register as registerAccount } from "../services/auth.js";
import { uploadAsset } from "../services/portal.js";
import VendorOnboardingGuide from "../components/vendor/VendorOnboardingGuide.jsx";
import {
  inferRoleFromUser,
  normalizeRole,
  resolveDashboardPath,
} from "../constants/roles.js";

const firmTypeOptions = ["Architecture", "Contractor", "Vendor", "Developer"];
const userTypeOptions = ["Landowner", "Developer", "Student", "Architect"];
const availabilityOptions = ["Hourly", "Weekly", "Monthly"];
const workModeOptions = ["Remote", "On-site"];
const educationLevels = ["Diploma", "Bachelor's", "Master's", "Doctorate", "Other"];

const withPasswords = (fields) => [
  ...fields,
  { key: "password", label: "Password", type: "password", placeholder: "Create password" },
  { key: "confirmPassword", label: "Confirm password", type: "password", placeholder: "Repeat password" },
];

const makeOptional = (fields) => fields.map((field) => ({ ...field, optional: true }));
const documentUploadAccept = "application/pdf,image/*";

const registrationLayouts = {
  firm: [
    {
      key: "essentials",
      title: "Studio essentials",
      description: "We only need contact + login details to create your workspace.",
      fields: withPasswords([
        { key: "firmName", label: "Firm name", type: "text" },
        { key: "founderName", label: "Founder / owner", type: "text" },
        { key: "officialEmail", label: "Work email", type: "email" },
        { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
        { key: "country", label: "Country", type: "text" },
        { key: "city", label: "City", type: "text" },
      ]),
    },
    {
      key: "profile",
      title: "Showcase & compliance",
      description: "Optional right now. Finish these from your dashboard once you land.",
      optional: true,
      fields: makeOptional([
        { key: "registrationId", label: "Registration ID", type: "text" },
        {
          key: "verificationDocument",
          label: "Verification document",
          type: "file",
          accept: documentUploadAccept,
        },
        {
          key: "firmType",
          label: "Firm type",
          type: "select",
          options: firmTypeOptions,
        },
        { key: "teamSize", label: "Team size", type: "number", placeholder: "25" },
        { key: "yearsActive", label: "Years active", type: "number", placeholder: "10" },
        {
          key: "primaryCategories",
          label: "Primary categories",
          type: "textarea",
          placeholder: "Residential, Hospitality, Workplace",
        },
        {
          key: "primaryStyles",
          label: "Primary styles",
          type: "textarea",
          placeholder: "Modern, Tropical, Adaptive reuse",
        },
        {
          key: "averageDesignRate",
          label: "Average design rate ($/sqft)",
          type: "text",
          placeholder: "$12 / sqft",
        },
        {
          key: "servicesOffered",
          label: "Services offered",
          type: "textarea",
          placeholder: "Architecture, Interior design, BIM, Design-build",
        },
        { key: "portfolioLink", label: "Portfolio link", type: "url", optional: true },
        {
          key: "portfolioUpload",
          label: "Portfolio upload",
          type: "file",
          optional: true,
          accept: documentUploadAccept,
        },
      ]),
    },
  ],
  vendor: [
    {
      key: "essentials",
      title: "Vendor essentials",
      description: "We only need contact + login details to create your workspace.",
      fields: withPasswords([
        { key: "companyName", label: "Company name", type: "text" },
        { key: "contactPerson", label: "Contact person", type: "text" },
        { key: "officialEmail", label: "Work email", type: "email" },
        { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
        { key: "country", label: "Country", type: "text" },
        { key: "city", label: "City", type: "text" },
      ]),
    },
    {
      key: "profile",
      title: "Business details",
      description: "Optional right now. Finish these from your dashboard once you land.",
      optional: true,
      fields: makeOptional([
        { key: "registrationId", label: "Business Registration ID / GSTIN", type: "text" },
        {
          key: "verificationDocument",
          label: "Verification document",
          type: "file",
          accept: documentUploadAccept,
        },
        {
          key: "materialCategories",
          label: "Material categories supplied",
          type: "textarea",
          placeholder: "Lighting, Flooring, Furniture",
        },
        { key: "yearsActive", label: "Years active", type: "number", placeholder: "10" },
        { key: "websiteUrl", label: "Company Website", type: "url", optional: true },
        {
          key: "catalogUpload",
          label: "Product catalog",
          type: "file",
          optional: true,
          accept: documentUploadAccept,
        },
      ]),
    },
  ],
  associate: [
    {
      key: "essentials",
      title: "Associate essentials",
      description: "Share the basics so we can provision your specialist dashboard.",
      fields: withPasswords([
        { key: "fullName", label: "Full name", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
        { key: "country", label: "Country", type: "text" },
        { key: "city", label: "City", type: "text" },
      ]),
    },
    {
      key: "profile",
      title: "Skills & credentials",
      description: "Add education, files, and availability now or later from the onboarding checklist.",
      optional: true,
      fields: makeOptional([
        {
          key: "educationLevel",
          label: "Education level",
          type: "select",
          options: educationLevels,
        },
        {
          key: "verificationDocument",
          label: "Verification (degree / ID)",
          type: "file",
          accept: documentUploadAccept,
        },
        {
          key: "experienceYears",
          label: "Experience (years)",
          type: "number",
          placeholder: "5",
          inputProps: { min: "0" },
        },
        {
          key: "skills",
          label: "Skills",
          type: "textarea",
          placeholder: "Revit, Rhino, FF&E sourcing",
        },
        {
          key: "primaryCategories",
          label: "Primary categories",
          type: "textarea",
          placeholder: "Residential, Hospitality",
        },
        {
          key: "primaryStyles",
          label: "Primary styles",
          type: "textarea",
          placeholder: "Brutalist, Tropical minimalism",
        },
        {
          key: "designRate",
          label: "Design rate ($/sqft)",
          type: "text",
          placeholder: "$8 / sqft",
        },
        {
          key: "availability",
          label: "Availability",
          type: "select",
          options: availabilityOptions,
        },
        {
          key: "workMode",
          label: "Work mode",
          type: "select",
          options: workModeOptions,
        },
        { key: "portfolioLink", label: "Portfolio link", type: "url", optional: true },
        {
          key: "resumeUpload",
          label: "Portfolio / resume upload",
          type: "file",
          optional: true,
          accept: documentUploadAccept,
        },
      ]),
    },
  ],
  user: [
    {
      key: "essentials",
      title: "Client essentials",
      description: "Your universal login for client dashboards and proposal tracking.",
      fields: withPasswords([
        { key: "fullName", label: "Full name", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
        { key: "country", label: "Country", type: "text" },
        { key: "city", label: "City", type: "text" },
      ]),
    },
    {
      key: "profile",
      title: "Project intent",
      description: "Optional context that speeds up matchmaking. Finish it later if you're in a hurry.",
      optional: true,
      fields: makeOptional([
        {
          key: "userType",
          label: "User type",
          type: "select",
          options: userTypeOptions,
        },
        {
          key: "projectType",
          label: "Intended project type",
          type: "text",
          placeholder: "Farmhouse, co-living, adaptive reuse",
        },
        {
          key: "budgetRange",
          label: "Budget range",
          type: "text",
          optional: true,
          placeholder: "$250k - $400k",
        },
      ]),
    },
  ],
};

const roleOptions = [
  { value: "firm", label: "Studio / firm" },
  { value: "associate", label: "Associate" },
  { value: "vendor", label: "Vendor" },
  { value: "user", label: "Client / end user" },
];

const roleShortcuts = [
  {
    value: "firm",
    label: "Studios & firms",
    detail: "Publish services, invite your team, and unlock marketplace briefs.",
    stat: "Avg setup: 4 min",
  },
  {
    value: "associate",
    label: "Associates",
    detail: "Plug into projects as a specialist or fractional teammate.",
    stat: "Best for freelancers",
  },
  {
    value: "vendor",
    label: "Vendors",
    detail: "List materials, manage inventory, and receive direct purchase orders.",
    stat: "For suppliers",
  },
  {
    value: "user",
    label: "Clients / landowners",
    detail: "Plan a build, compare proposals, and manage payouts in one place.",
    stat: "Self-serve",
  },
];

const featureHighlights = [
  {
    title: "Only essentials required",
    description: "Create credentials now. Your dashboard reminds you to upload proofs later.",
  },
  {
    title: "Google-ready onboarding",
    description: "Use your Google Workspace account and skip yet another password.",
  },
  {
    title: "Role-specific workspaces",
    description: "Studios, associates, and clients land in guided dashboards with tailored checklists.",
  },
];

const roleCopy = {
  firm: {
    badge: "Studios",
    heading: "Launch your studio HQ",
    description: "Spin up a marketplace-ready workspace and finish diligence inside your dashboard.",
  },
  associate: {
    badge: "Associates",
    heading: "Create your specialist profile",
    description: "Lock in access with basic details; complete your skill matrix once inside.",
  },
  vendor: {
    badge: "Vendors",
    heading: "Become a marketplace supplier",
    description: "Register your business and upload your material catalog after onboarding.",
  },
  user: {
    badge: "Clients",
    heading: "Plan your build in minutes",
    description: "Share intent now and enrich briefs after you land in the client console.",
  },
};

const getLayoutForRole = (candidate) => registrationLayouts[candidate] || registrationLayouts.user;
const flattenFields = (sections = []) => sections.flatMap((section) => section.fields || []);
const buildInitialFormState = (sections) => {
  const init = {};
  flattenFields(sections).forEach((field) => {
    init[field.key] = "";
  });
  return init;
};
const getDefaultExpandedSections = (sections) =>
  sections.filter((section) => !section.optional).map((section) => section.key);

const getQueryRedirect = () => {
  try {
    const u = new URL(window.location.href);
    const keys = ["redirect", "returnTo", "next", "r"];
    for (const key of keys) {
      const v = u.searchParams.get(key);
      if (v && v.startsWith("/")) return v;
    }
  } catch (error) {
    console.warn("register_redirect_parse_error", error);
  }
  return null;
};

const resolveRedirect = (role, serverPath, qsPath) => {
  const q = qsPath && qsPath.startsWith("/") ? qsPath : null;
  const s = serverPath && serverPath.startsWith("/") ? serverPath : null;
  const norm = normalizeRole(role);
  return q || s || resolveDashboardPath(norm);
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const initialSections = useMemo(() => getLayoutForRole("firm"), []);
  const [role, setRole] = useState("firm");
  const [form, setForm] = useState(() => buildInitialFormState(initialSections));
  const [expandedSections, setExpandedSections] = useState(() => getDefaultExpandedSections(initialSections));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentSections = useMemo(() => getLayoutForRole(role), [role]);
  const currentFields = useMemo(() => flattenFields(currentSections), [currentSections]);
  const roleNarrative = roleCopy[role] || roleCopy.firm;

  const syncLayoutForRole = useCallback((nextRole) => {
    const sections = getLayoutForRole(nextRole);
    setForm(buildInitialFormState(sections));
    setExpandedSections(getDefaultExpandedSections(sections));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const requestedRole = new URL(window.location.href).searchParams.get("role");
      if (requestedRole && registrationLayouts[requestedRole]) {
        setRole(requestedRole);
        syncLayoutForRole(requestedRole);
      }
    } catch (error) {
      console.warn("register_role_prefill_error", error);
    }
  }, [syncLayoutForRole]);

  const completeRegistrationLogin = useCallback(
    ({ token, user, role: responseRole, dashboardPath }) => {
      if (!token || !user) {
        throw new Error("Registration response missing session token");
      }
      const resolvedRole = inferRoleFromUser(user) || responseRole || role;
      const qsPath = getQueryRedirect();
      const dest = resolveRedirect(resolvedRole, dashboardPath, qsPath);
      try {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("role", resolvedRole);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (storageError) {
        console.warn("register_persist_error", storageError);
      }
      navigate(dest, { replace: true });
    },
    [navigate, role]
  );

  const googleButtonRef = useRef(null);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  const handleGoogleCredential = useCallback(
    async (response) => {
      try {
        if (!response?.credential) throw new Error("Google credential missing");
        const { token, user } = await loginWithGoogle(response.credential, role);
        if (!token) throw new Error("Unable to complete Google sign-in");
        completeRegistrationLogin({
          token,
          user,
          role: user?.role || role,
          dashboardPath: null,
        });
        toast.success("Signed in with Google");
      } catch (err) {
        console.error("[GOOGLE SIGNUP]", err);
        setError(err.message || "Google sign-in failed");
      }
    },
    [role, completeRegistrationLogin]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (window.google?.accounts?.id) {
      setGoogleInitialized(true);
      return;
    }
    const poll = () => {
      if (window.google?.accounts?.id) {
        setGoogleInitialized(true);
      } else {
        setTimeout(poll, 300);
      }
    };
    poll();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleInitialized || !clientId || !googleButtonRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
      });
    } catch (err) {
      console.error("[GOOGLE INIT]", err);
    }
  }, [googleInitialized, handleGoogleCredential]);

  const handleRoleChange = (event) => {
    const nextRole = event.target.value;
    setRole(nextRole);
    syncLayoutForRole(nextRole);
    setError("");
  };

  const applyRoleShortcut = (nextRole) => {
    if (!nextRole) return;
    setRole(nextRole);
    syncLayoutForRole(nextRole);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const toggleSectionVisibility = (sectionKey, optional) => {
    if (!optional) return;
    setExpandedSections((prev) => {
      if (prev.includes(sectionKey)) {
        return prev.filter((key) => key !== sectionKey);
      }
      return [...prev, sectionKey];
    });
  };

  const validate = () => {
    const issues = [];
    currentFields.forEach((field) => {
      if (field.type === "file") {
        if (!field.optional) {
          const fileValue = form[field.key];
          const FileCtor = typeof File !== "undefined" ? File : null;
          const hasFile = FileCtor && fileValue instanceof FileCtor;
          if (!hasFile) {
            issues.push(`${field.label} required`);
          }
        }
        return;
      }
      const value = form[field.key];
      if (!field.optional && (!value || String(value).trim() === "")) {
        issues.push(`${field.label} required`);
      }
    });
    currentFields
      .filter((field) => field.type === "email")
      .forEach((field) => {
        const value = form[field.key];
        if (value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value).trim())) {
          issues.push(`Invalid email in ${field.label}`);
        }
      });
    if (form.password && form.password.length < 8) {
      issues.push("Password must be at least 8 characters");
    }
    if (form.password !== form.confirmPassword) {
      issues.push("Passwords do not match");
    }
    return issues;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const issues = validate();
    if (issues.length) {
      toast.error(issues.join(", "));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const emailField = currentFields.find((field) => field.type === "email") || null;
      const emailFromForm = emailField ? String(form[emailField.key] || "").trim().toLowerCase() : "";
      if (!emailFromForm) {
        throw new Error("Email is required");
      }

      const profile = {};
      const filesToUpload = [];

      currentFields.forEach((field) => {
        if (field.key === "password" || field.key === "confirmPassword") {
          return;
        }

        const raw = form[field.key];
        if (field.type === "file") {
          const FileCtor = typeof File !== "undefined" ? File : null;
          if (FileCtor && raw instanceof FileCtor) {
            filesToUpload.push({ field, file: raw });
          }
          return;
        }

        if (raw === undefined || raw === null || String(raw).trim() === "") {
          return;
        }

        if (field.type === "number") {
          const numeric = Number(raw);
          profile[field.key] = Number.isNaN(numeric) ? raw : numeric;
        } else {
          profile[field.key] = String(raw).trim();
        }
      });

      for (const { field, file } of filesToUpload) {
        const uploadResponse = await uploadAsset(file, {
          kind: `${role}-${field.key}`.toLowerCase(),
          secure: true,
        });
        const asset = uploadResponse?.asset || uploadResponse;
        const resolved = uploadResponse?.previewUrl || uploadResponse?.url;
        const storagePath = asset?.storagePath || asset?.url || asset?.key || null;
        const finalUrl = resolved || storagePath;
        if (finalUrl) {
          profile[field.key] = finalUrl;
        }
        if (asset?.key) {
          profile[`${field.key}AssetKey`] = asset.key;
        }
      }

      profile.roleSelection = role;
      profile.profileCompletionStatus = "pending_dashboard";

      const primaryName =
        form.fullName ||
        form.firmName ||
        form.founderName ||
        form.legalName ||
        form.brandName ||
        form.companyName ||
        form.contactPerson ||
        form.displayName ||
        profile.fullName ||
        emailFromForm;

      if (primaryName) {
        profile.displayName = primaryName;
      }

      const response = await registerAccount({
        email: emailFromForm,
        password: form.password,
        role,
        profile,
      });

      completeRegistrationLogin({
        token: response.token,
        user: response.user,
        role: response.user?.role || response.role || role,
        dashboardPath: response.dashboardPath,
      });
      toast.success("You're in! Finish the remaining profile items inside your dashboard.");
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const fieldId = `${field.key}-${role}`;
    const baseClasses =
      "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/30";
    const wrapperClasses =
      field.type === "textarea" || field.type === "file" || field.fullWidth ? "md:col-span-2" : "";

    if (field.type === "file") {
      return (
        <div key={fieldId} className={wrapperClasses}>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            {field.label}{" "}
            {field.optional ? <span className="text-slate-400">(optional)</span> : <span className="text-rose-500">*</span>}
          </label>
          <input
            type="file"
            accept={field.accept || "image/*"}
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setForm((prev) => ({ ...prev, [field.key]: file }));
              if (error) setError("");
            }}
            className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {typeof File !== "undefined" && form[field.key] instanceof File && (
            <p className="mt-2 text-xs text-slate-500">Selected: {form[field.key]?.name}</p>
          )}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={fieldId} className={wrapperClasses}>
          <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-slate-600">
            {field.label} {field.optional && <span className="text-slate-400">(optional)</span>}
          </label>
          <select
            id={fieldId}
            name={field.key}
            value={form[field.key] || ""}
            onChange={handleChange}
            required={!field.optional}
            className={baseClasses}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={fieldId} className={wrapperClasses}>
          <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-slate-600">
            {field.label} {field.optional && <span className="text-slate-400">(optional)</span>}
          </label>
          <textarea
            id={fieldId}
            name={field.key}
            rows={field.rows || 3}
            value={form[field.key] || ""}
            onChange={handleChange}
            placeholder={field.placeholder || ""}
            required={!field.optional}
            className={`${baseClasses} min-h-[120px]`}
          />
        </div>
      );
    }

    return (
      <div key={fieldId} className={wrapperClasses}>
        <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-slate-600">
          {field.label} {field.optional && <span className="text-slate-400">(optional)</span>}
        </label>
        <input
          id={fieldId}
          name={field.key}
          type={field.type}
          value={form[field.key] || ""}
          onChange={handleChange}
          placeholder={field.placeholder || ""}
          required={!field.optional}
          {...(field.inputProps || {})}
          className={baseClasses}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
          <section className="rounded-3xl border border-slate-100 bg-white p-10 text-slate-900 shadow-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
              Builtattic onboarding
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Skip the massive questionnaire—share the essentials now, finish profiles later.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Dashboards for studios, associates, and clients include guided checklists so you can wrap up remaining proofs on your own time.
            </p>
            <div className="mt-8 space-y-4">
              {featureHighlights.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold tracking-wide text-slate-800">{feature.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-slate-500">
              Need help? Email <a className="underline" href="mailto:sup@builtattic.com">sup@builtattic.com</a> and we'll guide your onboarding.
            </p>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {roleNarrative.badge}
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">{roleNarrative.heading}</h2>
              <p className="mt-2 text-sm text-slate-500">{roleNarrative.description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {roleShortcuts.map((shortcut) => {
                  const isActive = role === shortcut.value;
                  return (
                    <button
                      key={shortcut.value}
                      type="button"
                      onClick={() => applyRoleShortcut(shortcut.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isActive ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{shortcut.stat}</p>
                      <p className="mt-2 text-base font-semibold">{shortcut.label}</p>
                      <p className="mt-1 text-sm opacity-80">{shortcut.detail}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <label htmlFor="role-select" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Prefer a dropdown?
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={handleRoleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-8 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prefer using Google?</div>
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <div className="flex justify-start">
                    <div ref={googleButtonRef} className="inline-flex" />
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    Add <code>VITE_GOOGLE_CLIENT_ID</code> to enable one-click Google sign-up.
                  </p>
                )}
                <p className="text-xs text-slate-400">We only request your name and verified email; the dashboard guides the rest.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700">Step 1: Account</span>
                <span className="text-slate-400">Step 2 lives inside your dashboard</span>
              </div>

              <div className="mt-6 space-y-5">
                {currentSections.map((section) => {
                  const isOpen = !section.optional || expandedSections.includes(section.key);
                  return (
                    <div key={`${role}-${section.key}`} className="rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(section.key, section.optional)}
                        className={`flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left ${
                          section.optional ? "cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                          <p className="text-xs text-slate-500">{section.description}</p>
                        </div>
                        {section.optional && (
                          <span className="text-xs font-semibold text-slate-500">{isOpen ? "Hide" : "Add now"}</span>
                        )}
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-100 px-5 py-5">
                          <div className="grid gap-5 md:grid-cols-2">{section.fields.map(renderField)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Creating your workspace..." : "Create account"}
              </button>

              <p className="mt-4 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-slate-900 underline">
                  Sign in
                </Link>
              </p>
            </form>

            {role === "vendor" ? <VendorOnboardingGuide /> : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
