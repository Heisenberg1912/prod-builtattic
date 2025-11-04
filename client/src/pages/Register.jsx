import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../services/auth.js";
import { uploadAsset } from "../services/portal.js";

const preferredContactOptions = ["Email", "Phone", "WhatsApp"];
const industryOptions = [
  "Real Estate",
  "Developer",
  "Contractor",
  "Interior",
  "PMC",
  "Urban Planning / Design",
];
const procurementCategories = [
  "Infrastructure",
  "Healthcare",
  "Education",
  "Housing",
  "Civic",
  "Industrial",
];

const withPasswords = (fields) => [
  ...fields,
  { key: "password", label: "Password", type: "password", placeholder: "Create password" },
  { key: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Repeat password" },
];

const baseLayouts = {
  user: withPasswords([
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "displayName", label: "Display Name / Username", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
    {
      key: "preferredContact",
      label: "Preferred Contact",
      type: "select",
      options: preferredContactOptions,
    },
    { key: "country", label: "Country", type: "text" },
    { key: "stateRegion", label: "State / Region", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "address", label: "Address", type: "textarea", optional: true },
    { key: "website", label: "Website (optional)", type: "url", optional: true },
    { key: "profileImage", label: "Profile Image", type: "file", optional: true, accept: "image/*" },
    { key: "notes", label: "Notes", type: "textarea", optional: true },
  ]),
  firm: withPasswords([
    { key: "legalName", label: "Legal / Registered Firm Name", type: "text" },
    { key: "brandName", label: "Brand / Trading Name", type: "text", optional: true },
    { key: "officialEmail", label: "Official Email", type: "email" },
    { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
    {
      key: "preferredContact",
      label: "Preferred Contact",
      type: "select",
      options: preferredContactOptions,
    },
    { key: "country", label: "Country", type: "text" },
    { key: "stateRegion", label: "State / Region", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "registeredAddress", label: "Registered Address", type: "textarea" },
    { key: "website", label: "Website / Portfolio", type: "url", optional: true },
    { key: "brandLogo", label: "Brand Logo", type: "file", optional: true, accept: "image/*" },
    { key: "coaNumber", label: "COA Registration Number", type: "text", optional: true },
    { key: "foundedYear", label: "Founded Year", type: "number", optional: true, placeholder: "2015" },
    { key: "teamSize", label: "Team Size (optional)", type: "number", optional: true },
    { key: "primaryServices", label: "Primary Services", type: "text", placeholder: "Architecture | Interior | Landscape" },
    { key: "serviceRegions", label: "Service Regions (States / Countries)", type: "text" },
    { key: "hourlyRate", label: "Hourly Rate (currency)", type: "text", optional: true, placeholder: "USD 150 / hour" },
    { key: "notes", label: "Notes", type: "textarea", optional: true },
  ]),
  associate: withPasswords([
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
    {
      key: "preferredContact",
      label: "Preferred Contact",
      type: "select",
      options: preferredContactOptions,
    },
    { key: "country", label: "Country", type: "text" },
    { key: "stateRegion", label: "State / Region", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "address", label: "Address (optional)", type: "textarea", optional: true },
    { key: "portfolioUrl", label: "Portfolio / Website", type: "url" },
    { key: "profileImage", label: "Profile Image", type: "file", optional: true, accept: "image/*" },
    { key: "skillsSoftware", label: "Skills & Software (comma-separated)", type: "text" },
    { key: "availability", label: "Availability (hrs/week)", type: "number", optional: true },
    { key: "notes", label: "Notes", type: "textarea", optional: true },
  ]),
  vendor: withPasswords([
    { key: "companyName", label: "Company / Brand Name", type: "text" },
    { key: "contactPerson", label: "Primary Contact Name", type: "text" },
    { key: "officialEmail", label: "Official Email", type: "email" },
    { key: "phone", label: "Phone (E.164)", type: "tel", placeholder: "+91 98765 43210" },
    {
      key: "preferredContact",
      label: "Preferred Contact",
      type: "select",
      options: preferredContactOptions,
    },
    { key: "country", label: "Country", type: "text" },
    { key: "stateRegion", label: "State / Region", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "warehouseLocations", label: "Warehousing / Supply Regions", type: "text" },
    {
      key: "primaryCategory",
      label: "Primary Category",
      type: "select",
      options: procurementCategories,
    },
    {
      key: "industryType",
      label: "Industry Type (optional)",
      type: "select",
      options: industryOptions,
      optional: true,
    },
    { key: "catalogUrl", label: "Catalogue or Website", type: "url", optional: true },
    { key: "brandLogo", label: "Brand Logo", type: "file", optional: true, accept: "image/*" },
    { key: "gstin", label: "GSTIN / Tax ID (optional)", type: "text", optional: true },
    { key: "notes", label: "Notes", type: "textarea", optional: true },
  ]),
};

const roleOptions = [
  { value: "user", label: "User" },
  { value: "firm", label: "Firms" },
  { value: "associate", label: "Associate" },
  { value: "vendor", label: "Vendor" },
];

const featureHighlights = [
  { title: 'Built for collaborators', description: 'Invite associates and manage studios in one workspace.' },
  { title: 'Secure onboarding', description: 'Documents stay private and are reviewed by the Builtattic team.' },
  { title: 'Fast publishing', description: 'Push updates live with a couple of clicks once approved.' },
];

const getLayoutForRole = (candidateRole) => baseLayouts[candidateRole] || baseLayouts.user;

const RegisterPage = () => {
  const [role, setRole] = useState("user");
  const initialLayout = getLayoutForRole("user");
  const [form, setForm] = useState(() => {
    const init = {};
    initialLayout.forEach((field) => {
      init[field.key] = "";
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();

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
    setOk(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (ok) setOk(false);
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

      await apiRegister({
        email: emailFromForm,
        password: form.password,
        role,
        profile,
      });

      toast.success("Registered successfully");
      setOk(true);
      setTimeout(() => navigate("/login"), 1200);
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

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 max-h-[70vh] overflow-y-auto pr-1"
        >
          <div className="sticky top-0 bg-white py-3 z-10 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Select Role
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
            const placeholder =
              field.key === "hourlyRate"
                ? formatCurrency(750)
                : field.placeholder || "";
            const commonProps = {
              name: field.key,
              value: form[field.key] || "",
              onChange: handleChange,
              required: !field.optional,
              className:
                "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
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
                      if (ok) setOk(false);
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
                    rows={3}
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
          {ok && (
            <p className="text-green-600 text-sm text-center">
              Registered successfully. Redirecting...
            </p>
          )}

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
