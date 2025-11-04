const toLineString = (value) => (Array.isArray(value) ? value.join("\n") : value || "");
const toCommaString = (value) => (Array.isArray(value) ? value.join(", ") : value || "");

const splitLines = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
};

const splitComma = (value, limit) => {
  if (!value) return [];
  const entries = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
};

export const EMPTY_PROFILE_FORM = {
  title: "",
  summary: "",
  location: "",
  timezone: "",
  availability: "",
  experienceYears: "",
  completedProjects: "",
  hourlyRate: "",
  dailyRate: "",
  currency: "USD",
  languages: "",
  softwares: "",
  specialisations: "",
  certifications: "",
  portfolioLinks: "",
  keyProjects: "",
};

export const mapProfileToForm = (profile = {}) => ({
  ...EMPTY_PROFILE_FORM,
  title: profile.title || "",
  summary: profile.summary || "",
  location: profile.location || "",
  timezone: profile.timezone || "",
  availability: profile.availability || "",
  experienceYears: profile.experienceYears ?? "",
  completedProjects: profile.completedProjects ?? "",
  hourlyRate: profile.hourlyRate ?? profile?.rates?.hourly ?? "",
  dailyRate: profile?.rates?.daily ?? "",
  currency: profile?.rates?.currency || "USD",
  languages: toCommaString(profile.languages),
  softwares: toCommaString(profile.softwares),
  specialisations: toCommaString(profile.specialisations),
  certifications: toCommaString(profile.certifications),
  portfolioLinks: toLineString(profile.portfolioLinks),
  keyProjects: toLineString(
    Array.isArray(profile.keyProjects)
      ? profile.keyProjects.map((project) => {
          const parts = [project.title, project.scope, project.year, project.role].filter(Boolean);
          return parts.join(" | ");
        })
      : []
  ),
});

const sanitiseNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const formToPayload = (form = {}) => {
  const payload = {
    title: form.title.trim() || undefined,
    summary: form.summary.trim() || undefined,
    location: form.location.trim() || undefined,
    timezone: form.timezone.trim() || undefined,
    availability: form.availability.trim() || undefined,
    experienceYears: sanitiseNumber(form.experienceYears),
    completedProjects: sanitiseNumber(form.completedProjects),
    hourlyRate: sanitiseNumber(form.hourlyRate),
    rates: {
      daily: sanitiseNumber(form.dailyRate),
      currency: form.currency.trim().toUpperCase() || undefined,
    },
    languages: splitComma(form.languages, 12),
    softwares: splitComma(form.softwares, 24),
    specialisations: splitComma(form.specialisations, 24),
    certifications: splitComma(form.certifications, 20),
    portfolioLinks: splitLines(form.portfolioLinks, 15),
    keyProjects: splitLines(form.keyProjects, 12)
      .map((entry) => {
        const [title, scope, year, role] = entry.split("|").map((item) => item.trim());
        return {
          title: title || undefined,
          scope: scope || undefined,
          year: sanitiseNumber(year),
          role: role || undefined,
        };
      })
      .filter((project) => project.title),
  };

  if (!payload.rates.daily && !payload.rates.currency && !payload.rates.hourly) {
    delete payload.rates;
  }

  return payload;
};

export const deriveProfileStats = (profile = {}) => {
  const years = Number(profile.experienceYears) || 0;
  const projects = Number(profile.completedProjects) || 0;
  const hourly = Number(profile.hourlyRate || profile?.rates?.hourly) || null;
  const daily = Number(profile?.rates?.daily) || null;
  const languages = splitComma(profile.languages || toCommaString(profile.languages));
  const softwares = splitComma(profile.softwares || toCommaString(profile.softwares));
  const specialisations = splitComma(profile.specialisations || toCommaString(profile.specialisations));
  return {
    years,
    projects,
    hourly,
    daily,
    languages,
    softwares,
    specialisations,
  };
};

export const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric}`;
  }
};

export const mergeProfileWithPayload = (profile = {}, payload = {}) => ({
  ...profile,
  ...payload,
  rates: {
    ...(profile.rates || {}),
    ...(payload.rates || {}),
  },
});

