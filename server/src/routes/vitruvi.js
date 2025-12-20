import { Router } from "express";
import { getAnalysis, runAnalyzeAndGenerate } from "../services/vitruviService.js";
import { recordVitruviPrompt } from "../services/vitruviPromptLog.js";
import {
  assertVitruviQuota,
  recordVitruviUsage,
  getVitruviUsageSummary,
  creditVitruviUsage,
  estimateTokenUsage,
} from "../services/vitruviUsage.js";
import { authenticate, rateLimit, validatePrompt } from "../middleware/index.js";

const router = Router();
const rateLimiter = rateLimit({ windowMs: 60_000, max: 10 });

router.get("/", (_req, res) => {
  res.json({ ok: true, service: "vitruvi-ai" });
});

router.post("/analyze", authenticate, rateLimiter, validatePrompt, async (req, res) => {
  const { prompt = "", options = {} } = req.body || {};

  try {
    const started = Date.now();
    const tokensEstimate = estimateTokenUsage(prompt, { multiplier: 0.4 });
    await assertVitruviQuota(req, { prompts: 1, tokens: tokensEstimate });
    const result = await getAnalysis(prompt, options);
    const usage = await recordVitruviUsage(req, {
      prompts: 1,
      tokens: Math.max(tokensEstimate, result?.unitEconomy?.tokenEstimate || 0),
    });
    res.json({ ...result, usage });
    queuePromptLog(req, {
      prompt,
      options,
      endpoint: "analyze",
      durationMs: Date.now() - started,
      result,
    });
  } catch (err) {
    console.error("vitruvi_analyze_failed", err);
    const status = typeof err.status === "number" ? err.status : 500;
    res.status(status).json({ error: "analyze_failed", detail: err.message, usage: err.detail });
  }
});

router.post("/analyze-and-generate", authenticate, rateLimiter, validatePrompt, async (req, res) => {
  const { prompt = "", options = {} } = req.body || {};

  try {
    const started = Date.now();
    const tokensEstimate = estimateTokenUsage(prompt, { multiplier: 1, image: true });
    await assertVitruviQuota(req, { prompts: 1, tokens: tokensEstimate });
    const result = await runAnalyzeAndGenerate(prompt, options);
    const usage = await recordVitruviUsage(req, {
      prompts: 1,
      tokens: Math.max(tokensEstimate, result?.unitEconomy?.tokenEstimate || 0),
    });
    res.json({ ...result, usage });
    queuePromptLog(req, {
      prompt,
      options,
      endpoint: "analyze-and-generate",
      durationMs: Date.now() - started,
      result,
    });
  } catch (err) {
    console.error("vitruvi_compose_failed", err);
    const status = typeof err.status === "number" ? err.status : 500;
    res.status(status).json({ error: "compose_failed", detail: err.message });
  }
});

router.post("/generate", async (req, res) => {
  const { prompt = "", options = {} } = req.body || {};
  if (!prompt.trim()) {
    return res.status(400).json({ error: "prompt_required" });
  }

  try {
    const started = Date.now();
    const tokensEstimate = estimateTokenUsage(prompt, { multiplier: 1, image: true });
    await assertVitruviQuota(req, { prompts: 1, tokens: tokensEstimate });
    const result = await runAnalyzeAndGenerate(prompt, options);
    const usage = await recordVitruviUsage(req, {
      prompts: 1,
      tokens: Math.max(tokensEstimate, result?.unitEconomy?.tokenEstimate || 0),
    });
    res.json({ ...result, usage });
    queuePromptLog(req, {
      prompt,
      options,
      endpoint: "generate",
      durationMs: Date.now() - started,
      result,
    });
  } catch (err) {
    console.error("vitruvi_generate_failed", err);
    const status = typeof err.status === "number" ? err.status : 500;
    res.status(status).json({ error: "generate_failed", detail: err.message, usage: err.detail });
  }
});

router.get("/usage", async (req, res) => {
  try {
    const usage = await getVitruviUsageSummary(req);
    res.json({ ok: true, usage });
  } catch (err) {
    console.error("vitruvi_usage_fetch_failed", err);
    res.status(500).json({ error: "usage_fetch_failed", detail: err.message });
  }
});

router.post("/usage/credit", async (req, res) => {
  try {
    const usage = await creditVitruviUsage(req, req.body || {});
    res.json({ ok: true, usage });
  } catch (err) {
    console.error("vitruvi_usage_credit_failed", err);
    const status = typeof err.status === "number" ? err.status : 500;
    res.status(status).json({ error: "usage_credit_failed", detail: err.message, usage: err.detail });
  }
});

export default router;

function queuePromptLog(req, { prompt, options, endpoint, durationMs, result }) {
  try {
    const user =
      req?.user && (req.user._id || req.user.id || req.user.email)
        ? { id: req.user._id || req.user.id, email: req.user.email }
        : undefined;

    const metadata = {
      ip: req?.ip,
      userAgent: req?.headers?.["user-agent"],
    };

    recordVitruviPrompt({
      prompt,
      options,
      endpoint,
      durationMs,
      result,
      user,
      metadata,
    }).catch((err) => {
      console.error("vitruvi_prompt_log_async_failed", err);
    });
  } catch (err) {
    console.error("vitruvi_prompt_log_queue_failed", err);
  }
}
