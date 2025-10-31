import VitruviPromptLog from "../models/VitruviPromptLog.js";

const MAX_PROMPT_LENGTH = Number.parseInt(process.env.VITRUVI_PROMPT_MAX_CHARS || "8000", 10);

function normalizePrompt(prompt) {
  if (typeof prompt !== "string") return "";
  const trimmed = prompt.trim();
  if (!trimmed) return "";
  if (Number.isFinite(MAX_PROMPT_LENGTH) && MAX_PROMPT_LENGTH > 0) {
    return trimmed.length > MAX_PROMPT_LENGTH ? trimmed.slice(0, MAX_PROMPT_LENGTH) : trimmed;
  }
  return trimmed;
}

function normalizeOptions(options) {
  if (!options || typeof options !== "object") return {};
  try {
    return JSON.parse(JSON.stringify(options));
  } catch (err) {
    console.warn("vitruvi_prompt_log_options_normalize_failed", err);
    return {};
  }
}

function sanitizeResult(result) {
  if (!result || typeof result !== "object") return undefined;
  const safe = {};
  const copyIfPresent = (key, value) => {
    if (value !== undefined) safe[key] = value;
  };

  copyIfPresent("analysis", result.analysis);
  copyIfPresent("promptAnalysis", result.promptAnalysis);
  copyIfPresent("designAnalysis", result.designAnalysis);
  copyIfPresent("source", result.source);
  copyIfPresent("warning", result.warning);
  copyIfPresent("imageUrl", result.imageUrl);
  if (typeof result.imageAvailable === "boolean") {
    safe.imageAvailable = result.imageAvailable;
  }
  copyIfPresent("mime", result.mime);
  if (result.base64) {
    safe.hasInlineImage = true;
  }
  return Object.keys(safe).length ? safe : undefined;
}

export async function recordVitruviPrompt({
  prompt,
  options,
  endpoint = "analyze",
  result,
  durationMs,
  user,
  metadata,
}) {
  const normalizedPrompt = normalizePrompt(prompt);
  if (!normalizedPrompt) {
    return null;
  }

  const payload = {
    prompt: normalizedPrompt,
    options: normalizeOptions(options),
    endpoint,
    durationMs: typeof durationMs === "number" ? Math.max(0, Math.round(durationMs)) : undefined,
    result: sanitizeResult(result),
  };

  if (user && (user.id || user._id || user.email)) {
    payload.user = {
      id: user.id || user._id || undefined,
      email: user.email || undefined,
    };
  }

  if (metadata && typeof metadata === "object" && Object.keys(metadata).length) {
    try {
      payload.metadata = JSON.parse(JSON.stringify(metadata));
    } catch (err) {
      console.warn("vitruvi_prompt_log_metadata_normalize_failed", err);
    }
  }

  try {
    const doc = await VitruviPromptLog.create(payload);
    return doc;
  } catch (err) {
    console.error("vitruvi_prompt_log_save_failed", err);
    throw err;
  }
}

