import crypto from "node:crypto";

import VitruviUsage from "../models/VitruviUsage.js";

const FREE_PROMPTS = Number.parseInt(process.env.VITRUVI_FREE_PROMPTS || "5", 10);
const FREE_TOKENS = Number.parseInt(process.env.VITRUVI_FREE_TOKENS || "12000", 10);
const TOKEN_RATE_USD = Number.parseFloat(process.env.VITRUVI_TOKEN_RATE_USD || "0.0025");
const RESET_DAYS = Number.parseInt(process.env.VITRUVI_USAGE_RESET_DAYS || "30", 10);

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizePositive(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric);
}

function hashValue(value) {
  try {
    return crypto.createHash("sha256").update(value || "anonymous").digest("hex");
  } catch {
    return String(value || "anonymous");
  }
}

function identifyOwner(req) {
  if (req?.user?._id) {
    return { ownerType: "user", ownerId: String(req.user._id), label: req.user.email || "account" };
  }
  const ip = req?.ip || req?.connection?.remoteAddress || req?.headers?.["x-forwarded-for"] || "guest";
  return { ownerType: "ip", ownerId: hashValue(ip), label: "guest" };
}

async function loadUsage(owner) {
  const query = {
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
  };
  let doc = await VitruviUsage.findOne(query);
  if (!doc) {
    try {
      doc = await VitruviUsage.create({ ...owner });
    } catch (err) {
      if (err?.code === 11000) {
        doc = await VitruviUsage.findOne(query);
      } else {
        throw err;
      }
    }
  }
  const resetWindow = Number.isFinite(RESET_DAYS) && RESET_DAYS > 0 ? RESET_DAYS * DAY_MS : 0;
  if (resetWindow && doc.lastResetAt && Date.now() - doc.lastResetAt.getTime() > resetWindow) {
    doc.promptsUsed = 0;
    doc.tokensUsed = 0;
    doc.lastResetAt = new Date();
  }
  return doc;
}

function resolveLimits(doc) {
  const freePromptLimit = Number.isFinite(doc.freePromptLimit)
    ? doc.freePromptLimit
    : Number.isFinite(FREE_PROMPTS)
    ? FREE_PROMPTS
    : 5;
  const freeTokenLimit = Number.isFinite(doc.freeTokenLimit)
    ? doc.freeTokenLimit
    : Number.isFinite(FREE_TOKENS)
    ? FREE_TOKENS
    : 12000;

  const promptAllowance = freePromptLimit + (doc.promptCredits || 0);
  const tokenAllowance = freeTokenLimit + (doc.tokenCredits || 0);

  const promptRemaining = Math.max(0, promptAllowance - doc.promptsUsed);
  const tokenRemaining = Math.max(0, tokenAllowance - doc.tokensUsed);

  return {
    freePromptLimit,
    freeTokenLimit,
    promptAllowance,
    tokenAllowance,
    promptRemaining,
    tokenRemaining,
  };
}

function buildSummary(doc) {
  const limits = resolveLimits(doc);
  return {
    plan: doc.plan || "free",
    promptsUsed: doc.promptsUsed,
    tokensUsed: doc.tokensUsed,
    promptAllowance: limits.promptAllowance,
    tokenAllowance: limits.tokenAllowance,
    promptRemaining: limits.promptRemaining,
    tokenRemaining: limits.tokenRemaining,
    resetAt: doc.lastResetAt,
    currency: doc.currency || "USD",
    tokenRateUsd: Number.isFinite(TOKEN_RATE_USD) ? TOKEN_RATE_USD : 0.0025,
    freePromptLimit: limits.freePromptLimit,
    freeTokenLimit: limits.freeTokenLimit,
    lifetimePrompts: doc.lifetimePrompts || 0,
    lifetimeTokens: doc.lifetimeTokens || 0,
    blocked: limits.promptRemaining <= 0 || limits.tokenRemaining <= 0,
  };
}

export function estimateTokenUsage(prompt = "", { multiplier = 1, image = false } = {}) {
  const promptTokens = Math.max(50, Math.round(String(prompt).length / 4));
  const responseTokens = Math.round(900 * multiplier);
  const imageTokens = image ? 1800 : 0;
  return promptTokens + responseTokens + imageTokens;
}

export async function getVitruviUsageSummary(req) {
  const owner = identifyOwner(req);
  const usage = await loadUsage(owner);
  return buildSummary(usage);
}

export async function assertVitruviQuota(req, consumption = {}) {
  const owner = identifyOwner(req);
  const usage = await loadUsage(owner);
  const summary = buildSummary(usage);
  const prompts = normalizePositive(consumption.prompts);
  const tokens = normalizePositive(consumption.tokens);

  if ((prompts && summary.promptRemaining < prompts) || (tokens && summary.tokenRemaining < tokens)) {
    const err = new Error("usage_limit_reached");
    err.status = 402;
    err.detail = summary;
    throw err;
  }

  return summary;
}

export async function recordVitruviUsage(req, consumption = {}) {
  const owner = identifyOwner(req);
  const usage = await loadUsage(owner);

  const prompts = normalizePositive(consumption.prompts);
  const tokens = normalizePositive(consumption.tokens);

  if (prompts) {
    usage.promptsUsed += prompts;
    usage.lifetimePrompts += prompts;
  }
  if (tokens) {
    usage.tokensUsed += tokens;
    usage.lifetimeTokens += tokens;
  }

  await usage.save();
  return buildSummary(usage);
}

export async function creditVitruviUsage(req, credits = {}) {
  if (!req?.user?._id) {
    const err = new Error("auth_required");
    err.status = 401;
    throw err;
  }
  const owner = { ownerType: "user", ownerId: String(req.user._id) };
  const usage = await loadUsage(owner);
  const promptCredit = normalizePositive(credits.prompts || credits.promptCredits);
  const tokenCredit = normalizePositive(credits.tokens || credits.tokenCredits);
  if (promptCredit) usage.promptCredits += promptCredit;
  if (tokenCredit) usage.tokenCredits += tokenCredit;
  if (promptCredit || tokenCredit) {
    usage.plan = credits.plan || "credit";
  }
  await usage.save();
  return buildSummary(usage);
}
