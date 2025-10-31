const toString = (value) => (typeof value === "string" ? value.trim() : "");

const withVitruviPath = (value) => {
  if (!value) return value;
  const appended = /\/vitruvi($|\/)/i.test(value) ? value : `${value}/vitruvi`;
  if (/^https?:\/\//i.test(appended)) {
    return appended.replace(/\/+$/, "");
  }
  const normalized = appended.replace(/\/+$/, "");
  return normalized.startsWith("/") ? normalized : `/${normalized.replace(/^\/+/, "")}`;
};

const fallbackBase = "/api/vitruvi";

const candidates = [
  toString(import.meta.env.VITE_VITRUVI_API_BASE),
  toString(import.meta.env.VITE_API_BASE_URL),
  toString(import.meta.env.VITE_API_URL),
];

let base = candidates.find(Boolean);

if (base) {
  base = withVitruviPath(base);
}

const isDev = Boolean(import.meta.env.DEV);
const isLocalWindow =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(window.location.hostname);

const isRemoteBase =
  Boolean(base) &&
  /^https?:\/\//i.test(base) &&
  !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(base);

if (!base) {
  base = fallbackBase;
} else if (isDev && isLocalWindow && isRemoteBase) {
  base = fallbackBase;
}

export const API_BASE = base || fallbackBase;
