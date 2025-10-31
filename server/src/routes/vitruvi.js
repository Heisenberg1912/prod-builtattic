import { Router } from "express";
import { getAnalysis, runAnalyzeAndGenerate } from "../services/vitruviService.js";
import { recordVitruviPrompt } from "../services/vitruviPromptLog.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, service: "vitruvi-ai" });
});

router.post("/analyze", async (req, res) => {
  const { prompt = "", options = {} } = req.body || {};
  if (!prompt.trim()) {
    return res.status(400).json({ error: "prompt_required" });
  }

  try {
    const started = Date.now();
    const result = await getAnalysis(prompt, options);
    res.json(result);
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
    res.status(status).json({ error: "analyze_failed", detail: err.message });
  }
});

router.post("/analyze-and-generate", async (req, res) => {
  const { prompt = "", options = {} } = req.body || {};
  if (!prompt.trim()) {
    return res.status(400).json({ error: "prompt_required" });
  }

  try {
    const started = Date.now();
    const result = await runAnalyzeAndGenerate(prompt, options);
    res.json(result);
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
    const result = await runAnalyzeAndGenerate(prompt, options);
    res.json(result);
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
    res.status(status).json({ error: "generate_failed", detail: err.message });
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
