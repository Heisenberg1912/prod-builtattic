import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import AssociateProfileEditor from "../components/associate/AssociateProfileEditor.jsx";
import AssociatePortfolioShowcase from "../components/associate/AssociatePortfolioShowcase.jsx";
import PortfolioMediaPlayer from "../components/associate/PortfolioMediaPlayer.jsx";
import { deriveProfileStats, formatCurrency } from "../utils/associateProfile.js";
import { fetchAssociatePortalProfile } from "../services/portal.js";

const ResourceCard = ({ title, description, action }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
    {action}
  </article>
);

const SkillStudio = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const stats = useMemo(() => deriveProfileStats(profile || {}), [profile]);
  const hourlyLabel = stats.hourly ? formatCurrency(stats.hourly, profile?.rates?.currency || "USD") : null;
  const experienceLabel = stats.years ? `${stats.years} yrs` : null;
  const completeness = profile?.completeness || stats.completeness || 0;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchAssociatePortalProfile({ preferDraft: true });
        if (mounted) {
          setProfile(response.profile || null);
        }
      } catch {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const heroStats = [
    { label: "Profile completeness", value: `${Math.min(Math.max(Number(completeness) || 0, 0), 100)}%` },
    { label: "Hourly rate", value: hourlyLabel || "Set rate" },
    { label: "Experience", value: experienceLabel || "Add years" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <RegistrStrip />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
              Skill Studio
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Your associate profile + portfolio workspace</h1>
              <p className="text-slate-600 text-base">
                Publish trusted bios, rates, and case studies without waiting on the marketplace team. Every save updates
                your Skill Studio card and associate marketplace profile in real time.
              </p>
              {loading && <p className="text-sm font-semibold text-amber-600">Syncing your latest profile data…</p>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              {heroStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard/associate/edit"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Edit marketplace profile
              </Link>
              <Link
                to="/dashboard/associate/listing"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-300"
              >
                Preview listing
              </Link>
              <Link
                to="/dashboard/associate"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-300"
              >
                Open associate dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
          <AssociateProfileEditor
            onProfileUpdate={setProfile}
            showPreview={false}
            header={
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900">Update your Skill Studio listing</h2>
                <p className="text-sm text-slate-600">Fill the form on the left and hit save to sync across the marketplace instantly.</p>
              </div>
            }
          />
          <div className="space-y-6">
            <AssociatePortfolioShowcase profile={profile} />
            <PortfolioMediaPlayer
              items={profile?.portfolioMedia}
              title="Portfolio tiles"
              subtitle="Click any tile to preview what buyers see on your Skill Studio page."
            />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <ResourceCard
            title="Need marketplace access?"
            description="Request the associate dashboard to track leads, earnings, and notifications."
            action={
              <Link
                to="/associateportal"
                className="inline-flex items-center text-sm font-semibold text-slate-900 underline decoration-dotted"
              >
                Visit associate portal
              </Link>
            }
          />
          <ResourceCard
            title="Share your portfolio kit"
            description="Drop your case study PDFs or hero renders via partnerships@builtattic.com for editorial features."
            action={<a href="mailto:partnerships@builtattic.com" className="text-sm font-semibold text-slate-900">Email partner success</a>}
          />
          <ResourceCard
            title="Questions about rates?"
            description={`Your current hourly ${hourlyLabel || "isn't set yet"}. The support team can review benchmarks for your region.`}
            action={<a href="mailto:support@builtattic.com" className="text-sm font-semibold text-slate-900">Contact support</a>}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SkillStudio;
