import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { register as registerAccount } from "../services/auth.js";
import { uploadAsset } from "../services/portal.js";
import {
  inferRoleFromUser,
  normalizeRole,
  resolveDashboardPath,
} from "../constants/roles.js";

const firmTypeOptions = [
  "Architecture",
  "Contractor",
  "Vendor",
  "Developer",
];
const userTypeOptions = [
  "Landowner",
  "Developer",
  "Student",
  "Architect",
];
const availabilityOptions = ["Hourly", "Weekly", "Monthly"];
const workModeOptions = ["Remote", "On-site"];
const educationLevels = [
  "Diploma",
  "Bachelor's",
  "Master's",
  "Doctorate",
  "Other",
];

const withPasswords = (fields) => [
  ...fields,
  { key: "password", label: "Password", type: "password", placeholder: "Create password" },
  { key: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Repeat password" },
];

const documentUploadAccept = "application/pdf,image/*";

const baseLayouts = {
  firm: withPasswords([
    { key: "firmName", label: "Firm Name", type: "text" },
    { key: "founderName", label: "Founder / Owner", type: "text" },
    { key: "officialEmail", label: "Email", type: "email" },
    { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
    { key: "country", label: "Country", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "registrationId", label: "Registration ID", type: "text" },
    {
      key: "verificationDocument",
      label: "Verification Document (License / Certificate)",
      type: "file",
      accept: documentUploadAccept,
    },
    {
      key: "firmType",
      label: "Firm Type",
      type: "select",
      options: firmTypeOptions,
    },
    { key: "teamSize", label: "Team Size", type: "number", placeholder: "25" },
    { key: "yearsActive", label: "Years Active", type: "number", placeholder: "10" },
    {
      key: "primaryCategories",
      label: "Primary Categories",
      type: "textarea",
      placeholder: "Residential, Hospitality, Workplace",
    },
    {
      key: "primaryStyles",
      label: "Primary Styles",
      type: "textarea",
      placeholder: "Modern, Tropical, Adaptive reuse",
    },
    {
      key: "averageDesignRate",
      label: "Average Design Rate ($/sqft)",
      type: "text",
      placeholder: "$12 / sqft",
    },
    {
      key: "servicesOffered",
      label: "Services Offered",
      type: "textarea",
      placeholder: "Architecture, Interior design, BIM, Design-build",
    },
    { key: "portfolioLink", label: "Portfolio Link", type: "url", optional: true },
    {
      key: "portfolioUpload",
      label: "Portfolio Upload",
      type: "file",
      optional: true,
      accept: documentUploadAccept,
    },
  ]),
  associate: withPasswords([
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
    { key: "country", label: "Country", type: "text" },
    { key: "city", label: "City", type: "text" },
    {
      key: "educationLevel",
      label: "Education Level",
      type: "select",
      options: educationLevels,
    },
    {
      key: "verificationDocument",
      label: "Verification (Degree / ID)",
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
      label: "Primary Categories",
      type: "textarea",
      placeholder: "Residential, Hospitality",
    },
    {
      key: "primaryStyles",
      label: "Primary Styles",
      type: "textarea",
      placeholder: "Brutalist, Tropical Minimalism",
    },
    {
      key: "designRate",
      label: "Design Rate ($/sqft)",
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
      label: "Work Mode",
      type: "select",
      options: workModeOptions,
    },
    { key: "portfolioLink", label: "Portfolio Link", type: "url", optional: true },
    {
      key: "resumeUpload",
      label: "Portfolio / Resume Upload",
      type: "file",
      optional: true,
      accept: documentUploadAccept,
    },
  ]),
  user: withPasswords([
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
    { key: "country", label: "Country", type: "text" },
    { key: "city", label: "City", type: "text" },
    {
      key: "userType",
      label: "User Type",
      type: "select",
      options: userTypeOptions,
    },
    {
      key: "projectType",
      label: "Intended Project Type",
      type: "text",
      placeholder: "Farmhouse, co-living, adaptive reuse",
    },
    {
      key: "budgetRange",
      label: "Budget Range (optional)",
      type: "text",
      optional: true,
      placeholder: "$250k - $400k",
    },
  ]),
};

const roleOptions = [
  { value: "firm", label: "Firm" },
  { value: "associate", label: "Associate" },
  { value: "user", label: "User" },
];

const roleShortcuts = [
  { value: "firm", label: "Firm registration", detail: "Publish studios & services" },
  { value: "associate", label: "Associate registration", detail: "Offer specialist support" },
  { value: "user", label: "User registration", detail: "Plan or source a project" },
];

const featureHighlights = [
  { title: "Firm due diligence", description: "Upload registrations and licenses once, unlock marketplace visibility." },
  { title: "Associate spotlight", description: "Share skills, preferred work modes, and verified credentials." },
  { title: "Project-ready briefs", description: "Users detail project intent so teams can respond faster." },
];


const getLayoutForRole = (candidateRole) => baseLayouts[candidateRole] || baseLayouts.user;

const getQueryRedirect = () => {
  try {
    const u = new URL(window.location.href);
    const keys = ["redirect", "returnTo", "next", "r"];
    for (const k of keys) {
      const v = u.searchParams.get(k);
      if (v && v.startsWith("/")) return v;
    }
  } catch {}
  return null;
};

const resolveRedirect = (role, serverPath, qsPath) => {
  const q = qsPath && qsPath.startsWith("/") ? qsPath : null;
  const s = serverPath && serverPath.startsWith("/") ? serverPath : null;
  const norm = normalizeRole(role);
  return q || s || resolveDashboardPath(norm);
};

const RegisterPage = () => {
  const [role, setRole] = useState("firm");
  const initialLayout = getLayoutForRole("firm");
  const [form, setForm] = useState(() => {
    const init = {};
    initialLayout.forEach((field) => {
      init[field.key] = "";
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const completeRegistrationLogin = ({ token, user, role: responseRole, dashboardPath }) => {
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
    } catch {}
    navigate(dest, { replace: true });
  };

  const currentLayout = useMemo(() => getLayoutForRole(role), [role]);

  const resetFormForLayout = (layout) => {
    const next = {};
    layout.forEach((field) => {
      next[field.key] = "";
    });
    setForm(next);
  };

  const handleRoleChange = (event) => {
    const nextRole = event.target.value;
    setRole(nextRole);
    resetFormForLayout(getLayoutForRole(nextRole));
    setError("");
  };

  const applyRoleShortcut = (nextRole) => {
    if (!nextRole) return;
    setRole(nextRole);
    resetFormForLayout(getLayoutForRole(nextRole));
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const validate = () => {
    const issues = [];
    currentLayout.forEach((field) => {
      if (field.type === "file") {
        const fileValue = form[field.key];
        if (!field.optional) {
          const hasFile = typeof File !== 'undefined' ? fileValue instanceof File : Boolean(fileValue);
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
    currentLayout
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
      const emailField = currentLayout.find((field) => field.type === "email") || null;
      const emailFromForm = emailField ? String(form[emailField.key] || "").trim().toLowerCase() : "";
      if (!emailFromForm) {
        throw new Error("Email is required");
      }

      const profile = {};
      const filesToUpload = [];

      currentLayout.forEach((field) => {
        if (field.key === "password" || field.key === "confirmPassword") {
          return;
        }

        const raw = form[field.key];

        if (field.type === "file") {
          const FileCtor = typeof File !== 'undefined' ? File : null;
          if (FileCtor && raw instanceof FileCtor) {
            filesToUpload.push({ field, file: raw });
          }
          return;
        }

        if (raw === undefined || raw === null || String(raw).trim() === "") {
          if (!field.optional) {
            profile[field.key] = "";
          }
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
        if (asset) {
          profile[field.key] = asset.storagePath || asset.url || asset.key;
          if (asset.key) {
            profile[`${field.key}AssetKey`] = asset.key;
          }
        }
      }

      profile.roleSelection = role;

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
      toast.success("Registration successful");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const [currencyCode, setCurrencyCode] = useState(
    () => (typeof window !== "undefined" && window.currency?.code) || "INR"
  );
  useEffect(() => {
    const onChange = (event) => {
      setCurrencyCode(
        (event?.detail && event.detail.code) || window.currency?.code || "INR"
      );
    };
    window.addEventListener("currency:change", onChange);
    window.addEventListener("currency:ready", onChange);
    return () => {
      window.removeEventListener("currency:change", onChange);
      window.removeEventListener("currency:ready", onChange);
    };
  }, []);

  const formatCurrency = (amount) => {
    try {
      if (window?.currency?.format) return window.currency.format(amount, "INR");
    } catch {}
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 2,
      }).format(Number(amount || 0));
    } catch {
      return `${Number(amount || 0).toLocaleString()} ${currencyCode}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2ff] to-[#f5f5f7] px-4 py-10">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Create Account
        </h1>
        <p className="text-center text-gray-500 mt-2">
          Register to get started. Fields marked with <span className="text-red-500">*</span> are required.
        </p>

        <div className="mt-6 grid gap-4 text-left text-sm text-gray-600 md:grid-cols-3">
          {featureHighlights.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-1 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Pick a registration track</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {roleShortcuts.map((shortcut) => {
              const isActive = role === shortcut.value;
              return (
                <button
                  key={shortcut.value}
                  type="button"
                  onClick={() => applyRoleShortcut(shortcut.value)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{shortcut.label}</p>
                  <p className="text-sm">{shortcut.detail}</p>
                </button>
              );
            })}
          </div>
        </div>
        <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 max-h-[70vh] overflow-y-auto pr-1"
          >
            <div className="sticky top-0 bg-white py-3 z-10 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Registration type
              </label>
              <select
                value={role}
                onChange={handleRoleChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {currentLayout.map((field) => {
              const placeholder = field.placeholder || "";
              const commonProps = {
                name: field.key,
                value: form[field.key] || "",
                onChange: handleChange,
                required: !field.optional,
                className:
                  "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
                ...(field.inputProps || {}),
              };

              if (field.type === "file") {
                return (
                  <div key={`${role}-${field.key}`}>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {field.label} {!field.optional && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      name={field.key}
                      type="file"
                      accept={field.accept || "image/*"}
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setForm((prev) => ({ ...prev, [field.key]: file }));
                        if (error) setError("");
                      }}
                      className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                    {typeof File !== 'undefined' && form[field.key] instanceof File && (
                      <p className="mt-2 text-xs text-gray-500">Selected: {form[field.key]?.name}</p>
                    )}
                  </div>
                );
              }

              return (
                <div key={`${role}-${field.key}`}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {field.label} {!field.optional && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select {...commonProps}>
                      <option value="">Select {field.label}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                  <textarea
                    {...commonProps}
                    rows={field.rows || 3}
                    placeholder={placeholder}
                  />
                  ) : (
                    <input
                      {...commonProps}
                      type={field.type}
                      placeholder={placeholder}
                    />
                  )}
                </div>
              );
            })}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg shadow-md transition-all duration-300"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;



