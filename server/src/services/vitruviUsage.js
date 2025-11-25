const UNLIMITED_VALUE = Number.MAX_SAFE_INTEGER;

const UNLIMITED_USAGE = Object.freeze({
  plan: "free_unlimited",
  promptsUsed: 0,
  tokensUsed: 0,
  promptAllowance: UNLIMITED_VALUE,
  tokenAllowance: UNLIMITED_VALUE,
  promptRemaining: UNLIMITED_VALUE,
  tokenRemaining: UNLIMITED_VALUE,
  resetAt: null,
  currency: "USD",
  tokenRateUsd: 0,
  freePromptLimit: UNLIMITED_VALUE,
  freeTokenLimit: UNLIMITED_VALUE,
  lifetimePrompts: 0,
  lifetimeTokens: 0,
  blocked: false,
});

const cloneUsage = () => ({ ...UNLIMITED_USAGE });

export function estimateTokenUsage(prompt = "", { multiplier = 1, image = false } = {}) {
  const promptTokens = Math.max(50, Math.round(String(prompt).length / 4));
  const responseTokens = Math.round(900 * multiplier);
  const imageTokens = image ? 1800 : 0;
  return promptTokens + responseTokens + imageTokens;
}

export async function getVitruviUsageSummary() {
  return cloneUsage();
}

export async function assertVitruviQuota() {
  return cloneUsage();
}

export async function recordVitruviUsage() {
  return cloneUsage();
}

export async function creditVitruviUsage() {
  return cloneUsage();
}
