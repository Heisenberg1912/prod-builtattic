import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import AssociateProfileEditor from "../components/associate/AssociateProfileEditor.jsx";
import {
  getWorkspaceCollections,
  subscribeToWorkspaceRole,
  WORKSPACE_SYNC_STORAGE_KEY,
} from "../utils/workspaceSync.js";

const StatBadge = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "-"}</p>
    {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
  </div>
);

const readinessCopy = (score) => {
  if (score >= 90) return "Looking great-keep sharing wins and availability.";
  if (score >= 70) return "Add case studies and refresh languages to reach 100%.";
  return "Complete your Skill Studio card so operations can route work.";
};

const formatTimestamp = (value) => {
  if (!value) return "Not synced yet";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formatSqft = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toLocaleString()} sqft` : "-";
};

const formatRate = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `$${numeric}/sqft` : "-";
};

const renderChipList = (items = []) => {
  if (!items.length) return <span className="text-xs text-slate-500">No data yet</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {item}
        </span>
      ))}
    </div>
  );
};

export default function AssociateWorkspace() {
  const [profile, setProfile] = useState(null);
  const [collections, setCollections] = useState(() => getWorkspaceCollections('associate'));

  const metrics = useMemo(() => {
    if (!profile) {
      return { completeness: 0, portfolio: 0, availability: "Set availability" };
    }
    const completeness = Math.min(100, Math.round(Number(profile.completeness ?? profile.readiness ?? 0)));
    const portfolio = Array.isArray(profile.portfolioLinks) ? profile.portfolioLinks.length : 0;
    const availability = profile.availability && profile.availability !== "Set availability in Skill Studio" ? profile.availability : "Set availability";
    return { completeness, portfolio, availability };
  }, [profile]);

  const planUploads = collections.planUploads || [];
  const serviceBundles = collections.serviceBundles || [];

  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceRole('associate', setCollections);
    const handleStorage = (event) => {
      if (event.key === WORKSPACE_SYNC_STORAGE_KEY) {
        setCollections(getWorkspaceCollections('associate'));
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }
    return () => {
      unsubscribe?.();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            Skill Studio
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-900">Associate workspace</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Update your Skill Studio card, sync availability, and share portfolio links so procurement teams can match you to the right briefs.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>
              Need help? Email <a href="mailto:associates@builtattic.com" className="font-semibold text-slate-900">associates@builtattic.com</a>
            </span>
            <Link to="/associates" className="font-semibold text-slate-900 underline">
              View Skill Studio marketplace
            </Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <StatBadge label="Readiness" value={`${metrics.completeness}%`} helper={readinessCopy(metrics.completeness)} />
          <StatBadge label="Portfolio links" value={metrics.portfolio} helper={metrics.portfolio ? "Live case studies" : "Add project links"} />
          <StatBadge label="Availability" value={metrics.availability} />
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-900 px-8 py-6 text-indigo-50 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Marketplace readiness</h2>
              <p className="text-sm text-indigo-100 mt-1">{readinessCopy(metrics.completeness)}</p>
            </div>
            <div className="text-xs text-indigo-200">
              Last synced {formatTimestamp(profile?.updatedAt)}
            </div>
          </div>
        </div>

        <AssociateProfileEditor
          onProfileUpdate={setProfile}
          header={(
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Profile</p>
              <h2 className="text-2xl font-semibold text-slate-900">{profile?.title || "Associate profile"}</h2>
              <p className="text-sm text-slate-500">Changes sync straight to Skill Studio as soon as they are approved.</p>
            </div>
          )}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Plan upload</p>
              <h2 className="text-lg font-semibold text-slate-900">Skill Studio plan library</h2>
              <p className="text-sm text-slate-500">Plans you sync from the portal appear here for quick QA.</p>
            </div>
            <Link to="/portal/associate" className="text-xs font-semibold text-slate-900 underline">
              Update from portal
            </Link>
          </div>
          {planUploads.length === 0 ? (
            <p className="text-sm text-slate-500">No plans hosted yet. Add a concept inside the Associate portal.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {planUploads.map((plan) => (
                <article key={plan.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {plan.category || 'Category'}{plan.subtype ? ` • ${plan.subtype}` : ''}
                    </p>
                    <h3 className="text-base font-semibold text-slate-900">{plan.projectTitle || 'Untitled plan'}</h3>
                    <p className="text-sm text-slate-500">{plan.primaryStyle || 'Add a primary style'}</p>
                  </div>
                  <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Area</dt>
                      <dd>{formatSqft(plan.areaSqft)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Floors</dt>
                      <dd>{Number(plan.floors) || '-'}</dd>
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
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>License: {plan.licenseType || 'n/a'} • Delivery: {plan.delivery || 'n/a'}</p>
                    <p>Renders: {plan.renderImages?.length || 0} {plan.walkthrough ? ' • Walkthrough ready' : ''}</p>
                    {plan.conceptPlan ? (
                      <a href={plan.conceptPlan} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                        Open concept plan
                      </a>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Materials</p>
                    {renderChipList(plan.materials)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Service bundles</p>
              <h2 className="text-lg font-semibold text-slate-900">Packaged scopes</h2>
              <p className="text-sm text-slate-500">Skill Studio buyers see these scopes once approved.</p>
            </div>
            <Link to="/portal/associate" className="text-xs font-semibold text-slate-900 underline">
              Update from portal
            </Link>
          </div>
          {serviceBundles.length === 0 ? (
            <p className="text-sm text-slate-500">No bundles have been synced yet.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {serviceBundles.map((bundle) => (
                <article key={bundle.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{bundle.cadence || 'Cadence'}</p>
                    <h3 className="text-base font-semibold text-slate-900">{bundle.bundleName || 'Unnamed bundle'}</h3>
                    <p className="text-sm text-slate-500">{bundle.scope || 'Scope pending'}</p>
                  </div>
                  <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Price</dt>
                      <dd>
                        {bundle.price && Number.isFinite(Number(bundle.price))
                          ? `$${Number(bundle.price).toLocaleString()}`
                          : bundle.price || 'Custom'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Turnaround</dt>
                      <dd>{bundle.turnaroundTime || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">File format</dt>
                      <dd>{bundle.fileFormat || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Skill level</dt>
                      <dd>{bundle.skillLevel || '-'}</dd>
                    </div>
                  </dl>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Revisions: {bundle.revisionsAllowed || 'n/a'}</p>
                    <p>Deliverables: {bundle.deliverables?.length || 0}</p>
                    {bundle.references?.length ? <p>References: {bundle.references.join(', ')}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

