import { API_BASE } from "./config";

function selectedToOptions(selected) {
  const opt = {};
  if (selected["Typology"]?.size) opt.typology = [...selected["Typology"]][0];
  if (selected["Style"]?.size) opt.style = [...selected["Style"]][0];
  if (selected["Climate Adaptability"]?.size) opt.climate = [...selected["Climate Adaptability"]][0];
  const feats = [];
  for (const k of ["Additional Features", "Sustainability", "Exterior", "Roof Type"]) {
    if (selected[k]?.size) feats.push(...selected[k]);
  }
  if (feats.length) opt.features = feats;
  return opt;
}

async function enrichError(prefix, response) {
  let detail = "";
  let data;
  try {
    data = await response.clone().json();
    detail = data?.detail || data?.error || JSON.stringify(data);
  } catch (_) {
    try {
      detail = await response.clone().text();
    } catch (__) {
      detail = "";
    }
  }
  const suffix = detail ? `: ${response.status} (${detail})` : `: ${response.status}`;
  const error = new Error(`${prefix}${suffix}`);
  error.status = response.status;
  if (data?.usage) {
    error.usage = data.usage;
  }
  if (data) {
    error.payload = data;
  }
  return error;
}

export async function analyzePrompt(prompt, selected) {
  const body = { prompt, options: selectedToOptions(selected) };
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await enrichError("analyze_failed", response);
  return response.json();
}

export async function analyzeAndGenerate(prompt, selected) {
  const body = { prompt, options: selectedToOptions(selected) };
  const response = await fetch(`${API_BASE}/analyze-and-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await enrichError("compose_failed", response);
  return response.json();
}

export async function fetchUsageSummary() {
  const response = await fetch(`${API_BASE}/usage`, { method: "GET" });
  if (!response.ok) throw await enrichError("usage_fetch_failed", response);
  const payload = await response.json();
  return payload?.usage || null;
}

export async function creditUsage({ tokens = 4000, prompts = 8 } = {}) {
  const response = await fetch(`${API_BASE}/usage/credit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens, prompts }),
  });
  if (!response.ok) throw await enrichError("usage_credit_failed", response);
  const payload = await response.json();
  return payload?.usage || null;
}

export default {
  analyzePrompt,
  analyzeAndGenerate,
  fetchUsageSummary,
  creditUsage,
};
