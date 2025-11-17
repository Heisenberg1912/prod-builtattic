import React, { useMemo } from "react";
import { deriveProfileStats, formatCurrency } from "../../utils/associateProfile.js";

const normaliseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const normaliseProjects = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((project) =>
        typeof project === "string"
          ? project
          : `${project.title || "Untitled"} | ${project.scope || "Scope"} | ${project.year || "Year"} | ${project.role || "Role"}`
      )
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const parseProject = (entry) => {
  const [title, scope, year, role] = entry.split("|").map((part) => part.trim()).filter(Boolean);
  return {
    title: title || "Untitled project",
    scope: scope || null,
    year: year || null,
    role: role || null,
  };
};

const EmptyPortfolioState = () => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
    <p className="font-semibold text-slate-700">Portfolio preview</p>
    <p className="mt-2">
      Save your Skill Studio profile to see live portfolio links and highlight cards here.
    </p>
  </div>
);

const SectionRow = ({ label, children }) => (
  <section className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
    {children}
  </section>
);

export default function AssociatePortfolioShowcase({ profile, className = "" }) {
  const stats = useMemo(() => deriveProfileStats(profile || {}), [profile]);
  const links = useMemo(() => normaliseList(profile?.portfolioLinks), [profile]);
  const projects = useMemo(() => normaliseProjects(profile?.keyProjects), [profile]);

  if (!profile) {
    return <EmptyPortfolioState />;
  }

  return (
    <aside className={`space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Live portfolio</p>
        <h3 className="text-xl font-semibold text-slate-900">What buyers see</h3>
        <p className="text-sm text-slate-500">
          Saved changes refresh this preview instantly across Skill Studio and the marketplace.
        </p>
      </div>

      <div className="grid gap-3 text-sm text-slate-600">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Experience</p>
          <p className="text-lg font-semibold text-slate-900">{stats.years || "–"} yrs</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Projects</p>
          <p className="text-lg font-semibold text-slate-900">{stats.projects || "–"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Rate</p>
          <p className="text-lg font-semibold text-slate-900">
            {stats.hourly ? formatCurrency(stats.hourly, profile?.rates?.currency || "USD") : "Add hourly rate"}
          </p>
        </div>
      </div>

      {links.length ? (
        <SectionRow label="Portfolio links">
          <ul className="space-y-2 text-sm">
            {links.slice(0, 6).map((link) => (
              <li key={link}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-700 underline decoration-dotted hover:text-slate-900"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </SectionRow>
      ) : (
        <SectionRow label="Portfolio links">
          <p className="text-sm text-slate-500">Add URLs to case studies, socials, or booking links.</p>
        </SectionRow>
      )}

      {projects.length ? (
        <SectionRow label="Highlights">
          <ul className="space-y-3 text-sm text-slate-700">
            {projects.slice(0, 4).map((entry, index) => {
              const project = parseProject(entry);
              return (
                <li key={`${project.title}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                  {project.scope ? <p className="text-xs text-slate-500">{project.scope}</p> : null}
                  <p className="text-xs text-slate-500">
                    {[project.year, project.role].filter(Boolean).join(" · ")}
                  </p>
                </li>
              );
            })}
          </ul>
        </SectionRow>
      ) : (
        <SectionRow label="Highlights">
          <p className="text-sm text-slate-500">List your recent wins using "Title | Scope | Year | Role".</p>
        </SectionRow>
      )}
    </aside>
  );
}

