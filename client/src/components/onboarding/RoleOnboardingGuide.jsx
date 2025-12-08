import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Circle, Sparkles } from "lucide-react";
import { normalizeRole } from "../../constants/roles.js";

const ROLE_STEPS = {
  firm: {
    heading: "Launch your studio workspace",
    helper: "Complete the quick wins now so briefs, packs, and teammates land in one place.",
    steps: [
      {
        id: "studio-profile",
        title: "Complete your studio profile",
        description: "Add brand info, compliance documents, and categories so clients can trust your listing.",
        action: { label: "Open studio portal", href: "/portal/studio" },
      },
      {
        id: "publish-pack",
        title: "Publish a service pack",
        description: "Draft at least one pack clients can request or buy to unlock the marketplace rails.",
        action: { label: "Create a pack", href: "/studio/portal" },
      },
      {
        id: "review-dashboard",
        title: "Monitor your studio workspace",
        description: "Track leads, invites, and pack status from the studio portal once you land.",
        action: { label: "Open studio workspace", href: "/portal/studio" },
      },
    ],
  },
  vendor: {
    heading: "Fast-track your vendor onboarding",
    helper: "Follow the playbook to start receiving orders from Material Studio.",
    steps: [
      {
        id: "vendor-profile",
        title: "Verify vendor profile",
        description: "Upload GSTIN/registration proof plus logistics terms so ops can clear you faster.",
        action: { label: "Open vendor portal", href: "/portal/vendor" },
      },
      {
        id: "publish-sku",
        title: "Publish your first SKU",
        description: "List at least one material with price and stock so buyers can add it to cart.",
        action: { label: "List a material", href: "/portal/vendor" },
      },
      {
        id: "vendor-dashboard",
        title: "Review workspace status",
        description: "Orders, catalogue status, and onboarding progress live inside the vendor portal.",
        action: { label: "Open vendor portal", href: "/portal/vendor" },
      },
    ],
  },
  associate: {
    heading: "Get ready for assignments",
    helper: "Finish essentials and showcase skills so project owners can route work to you.",
    steps: [
      {
        id: "associate-profile",
        title: "Complete your profile",
        description: "Upload resume, set rates and availability, and add verification docs.",
        action: { label: "Open associate portal", href: "/portal/associate" },
      },
      {
        id: "publish-capability",
        title: "Showcase your capabilities",
        description: "Add at least one specialization card that studios can request.",
        action: { label: "Share your skills", href: "/associateportfolio" },
      },
      {
        id: "associate-dashboard",
        title: "Track your associate workspace",
        description: "Pitches, schedules, and onboarding status live together in the associate portal.",
        action: { label: "Open associate portal", href: "/portal/associate" },
      },
    ],
  },
  user: {
    heading: "Start buying with confidence",
    helper: "Finish these quick steps so orders, savings, and support stay in sync.",
    steps: [
      {
        id: "user-profile",
        title: "Complete account basics",
        description: "Add phone, location, and project intent for better proposals and delivery accuracy.",
        action: { label: "Update profile", href: "/account" },
      },
      {
        id: "first-cart",
        title: "Add your first item to cart",
        description: "Browse materials or services and place a starter order to test the flow.",
        action: { label: "Browse marketplace", href: "/products" },
      },
      {
        id: "user-dashboard",
        title: "Track your orders",
        description: "Keep an eye on purchases and saved studios from your account pages.",
        action: { label: "View orders", href: "/orders" },
      },
    ],
  },
};

const resolveRoleKey = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "client") return "user";
  return ROLE_STEPS[normalized] ? normalized : "user";
};

const storageKeyForRole = (roleKey) => `builtattic:onboarding:${roleKey}`;

const loadCompletedSteps = (roleKey) => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKeyForRole(roleKey));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch (error) {
    console.warn("onboarding_progress_load_error", error);
  }
  return new Set();
};

const persistCompletedSteps = (roleKey, completed) => {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify(Array.from(completed));
    window.localStorage.setItem(storageKeyForRole(roleKey), payload);
  } catch (error) {
    console.warn("onboarding_progress_persist_error", error);
  }
};

export default function RoleOnboardingGuide({ role = "user", className = "", dense = false }) {
  const normalizedRole = normalizeRole(role);
  const roleKey = resolveRoleKey(normalizedRole);
  const { heading, helper, steps } = useMemo(() => ROLE_STEPS[roleKey] || ROLE_STEPS.user, [roleKey]);
  const [completed, setCompleted] = useState(() => loadCompletedSteps(roleKey));

  useEffect(() => {
    setCompleted(loadCompletedSteps(roleKey));
  }, [roleKey]);

  useEffect(() => {
    persistCompletedSteps(roleKey, completed);
  }, [roleKey, completed]);

  const toggleStep = (id) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const completionCount = completed.size;
  const totalSteps = steps.length || 1;
  const percent = Math.round((completionCount / totalSteps) * 100);

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${dense ? "p-5" : "p-7"} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Guided onboarding</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{heading}</h3>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {completionCount}/{totalSteps} done
          </span>
          <div className="mt-2 h-2 w-28 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {steps.map((step) => {
          const done = completed.has(step.id);
          return (
            <li
              key={step.id}
              className={`flex gap-3 rounded-2xl border px-4 py-3 transition ${
                done ? "border-emerald-100 bg-emerald-50/70" : "border-slate-100 bg-slate-50/60"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleStep(step.id)}
                aria-label={done ? "Mark as not done" : "Mark step as done"}
                className="mt-0.5 text-slate-600 transition hover:text-slate-900"
              >
                {done ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
              </button>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="text-xs text-slate-500">{step.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    to={step.action.href}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white transition hover:bg-slate-800"
                  >
                    {step.action.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    {done ? "Undo" : "Mark done"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-slate-500">
        Progress saves locally so you can pick up where you left off.
      </p>
    </div>
  );
}
