import React, { useCallback, useMemo } from "react";
import { ExternalLink, Copy } from "lucide-react";
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

const resolveLinkMeta = (url) => {
  if (!url) {
    return { url: "", host: null, label: "" };
  }
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, "");
    const friendlyMap = {
      "behance.net": "Behance",
      "dribbble.com": "Dribbble",
      "linkedin.com": "LinkedIn",
      "notion.so": "Notion",
      "github.com": "GitHub",
      "youtube.com": "YouTube",
      "vimeo.com": "Vimeo",
      "figma.com": "Figma",
    };
    const friendlyLabel = friendlyMap[host] || host.split(".").slice(-2, -1)[0] || host;
    return { url: parsed.href, host, label: friendlyLabel };
  } catch {
    return { url, host: null, label: url };
  }
};

export default function AssociatePortfolioShowcase({ profile, className = "" }) {
  const stats = useMemo(() => deriveProfileStats(profile || {}), [profile]);
  const links = useMemo(() => normaliseList(profile?.portfolioLinks).map((link) => resolveLinkMeta(link)), [profile]);
  const projects = useMemo(() => normaliseProjects(profile?.keyProjects), [profile]);
  const handleCopyLink = useCallback(async (url) => {
    if (!url || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore copy errors
    }
  }, []);

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
          <div className="space-y-2">
            {links.slice(0, 6).map((link) => (
              <div
                key={link.url}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <div>
                  <p className="font-semibold text-slate-900">{link.label || "Portfolio link"}</p>
                  <p className="text-xs text-slate-500">{link.host || link.url}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(link.url)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                  >
                    <Copy size={12} /> Copy
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Visit <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
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

