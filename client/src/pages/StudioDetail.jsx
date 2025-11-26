import React from "react";
import { Link } from "react-router-dom";

export default function StudioDetail() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-lg text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Design Studio</p>
        <h1 className="text-3xl font-semibold">Studio detail is being rebuilt</h1>
        <p className="text-sm text-slate-600">
          Slug-based studio pages are disabled while we redesign this flow. Browse the marketplace to explore live listings.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/studio"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go to marketplace
          </Link>
          <Link
            to="/portal/studio"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:border-slate-300"
          >
            Open studio workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
