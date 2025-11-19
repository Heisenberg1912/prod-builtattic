import React from "react";
import { CheckCircle } from "lucide-react";

const GUIDE_STEPS = [
  {
    title: "Submit vendor registration",
    detail: "Share firm documents plus compliance info so ops can vet you.",
  },
  {
    title: "Sync vendor profile",
    detail: "Upload catalog highlights, logistics signals, and contact routes.",
  },
  {
    title: "Publish SKUs",
    detail: "Draft and publish SKUs that will be surfaced in Material Studio.",
  },
  {
    title: "Go live on Material Studio",
    detail: "Once approved, procurement teams can route orders directly to you.",
  },
];

export default function VendorOnboardingGuide({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-5 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
        Vendor onboarding
      </p>
      <h3 className="text-lg font-semibold text-slate-900">Material Studio playbook</h3>
      <p className="mt-1 text-sm text-slate-500">
        Vendors ship fast by following these four steps.
      </p>
      <ul className="mt-4 space-y-3">
        {GUIDE_STEPS.map((step) => (
          <li key={step.title} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <CheckCircle className="mt-1 h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="text-xs text-slate-500">{step.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
