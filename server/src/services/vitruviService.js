import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_ENABLED = String(process.env.GEMINI_ENABLED ?? "true").toLowerCase() !== "false";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-latest";
const MAX_PROMPT_CHARS = Number.parseInt(process.env.MAX_PROMPT_CHARS || "4000", 10) || 4000;

const ANALYSIS_FIELDS = [
  "Category",
  "Typology",
  "Style",
  "Climate Adaptability",
  "Terrain",
  "Soil Type",
  "Material Used",
  "Interior Layout",
  "Roof Type",
  "Exterior",
  "Additional Features",
  "Sustainability",
];

const ROOM_SPLIT_PRESETS = [
  { key: "living", min: 8, max: 40, defaultValue: 22 },
  { key: "bedrooms", min: 10, max: 50, defaultValue: 28 },
  { key: "kitchen", min: 6, max: 25, defaultValue: 12 },
  { key: "bath", min: 4, max: 20, defaultValue: 9 },
  { key: "workspace", min: 4, max: 18, defaultValue: 8 },
  { key: "circulation", min: 8, max: 30, defaultValue: 15 },
];

const DEFAULT_ROOM_SPLITS = Object.fromEntries(
  ROOM_SPLIT_PRESETS.map((preset) => [preset.key, preset.defaultValue]),
);

const MAX_VARIATION_ITEMS = 4;
const MAX_CHECKLIST_ITEMS = 6;

const genAI = GEMINI_ENABLED && GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function runAnalyzeAndGenerate(prompt, options = {}) {
  const {
    analysis,
    promptAnalysis,
    designAnalysis,
    source,
    warning,
    ...insightExtras
  } = await getAnalysis(prompt, options);

  let imagePayload = null;
  let imageWarning;

  if (genAI && source === "gemini") {
    try {
      imagePayload = await generateImageWithGemini(prompt, analysis);
    } catch (err) {
      console.warn("image_generation_failed", err);
      imageWarning = err?.message || "Gemini image generation failed";
    }
  } else if (!genAI) {
    imageWarning = "Gemini image generation disabled; API key missing";
  }

  if (!imagePayload && genAI && source === "gemini" && !imageWarning) {
    imageWarning = "Gemini image generation unavailable";
  }

  if (imagePayload?.base64 && !imagePayload.imageUrl) {
    imagePayload.imageUrl = `data:${imagePayload.mime || "image/png"};base64,${imagePayload.base64}`;
  }

  const warnings = [warning, imageWarning].filter(Boolean);

  return {
    analysis,
    promptAnalysis,
    designAnalysis,
    source,
    ...insightExtras,
    ...(warnings.length ? { warning: warnings.join(" | ") } : {}),
    ...(imagePayload ?? {}),
    imageAvailable: Boolean(imagePayload),
  };
}

export async function getAnalysis(prompt, options = {}) {
  if (typeof prompt !== "string") {
    throw new Error("prompt_required");
  }

  let analysis;
  let source = "heuristic";
  let warning;

  if (genAI) {
    try {
      analysis = await analyzeWithGemini(prompt, options);
      source = "gemini";
    } catch (err) {
      console.warn("analysis_with_gemini_failed", err);
      analysis = heuristicFallback(prompt);
      warning = err?.message || "Gemini analysis failed; using heuristic fallback.";
    }
  } else {
    analysis = heuristicFallback(prompt);
    warning = "Gemini API key not configured; using heuristic fallback.";
  }

  let insights;
  let insightWarning;

  if (genAI) {
    try {
      insights = await generateInsightBundleWithGemini(prompt, options, analysis);
    } catch (err) {
      console.warn("insight_generation_failed", err);
      insightWarning = err?.message || "Gemini insight enrichment failed; using heuristic fallback.";
    }
  }

  const designAnalysis = insights?.designAnalysis ?? deriveDesignAnalysis(analysis);

  const warnings = [];
  if (warning) warnings.push(warning);
  if (insightWarning) warnings.push(insightWarning);

  const payload = {
    analysis,
    promptAnalysis: analysis,
    designAnalysis,
    source,
  };

  if (insights?.programSummary) {
    payload.programSummary = insights.programSummary;
  }
  if (insights?.roomSplits) {
    payload.roomSplits = insights.roomSplits;
  }
  if (insights?.nlpBreakdown) {
    payload.nlpBreakdown = insights.nlpBreakdown;
  }
  if (insights?.variationIdeas) {
    payload.variationIdeas = insights.variationIdeas;
  }
  if (insights?.actionChecklist) {
    payload.actionChecklist = insights.actionChecklist;
  }
  if (insights?.insightSource) {
    payload.insightSource = insights.insightSource;
  }

  if (warnings.length) {
    payload.warning = warnings.join(" | ");
  }

  return payload;
}

function trimPrompt(input) {
  return input.length > MAX_PROMPT_CHARS ? `${input.slice(0, MAX_PROMPT_CHARS)}...` : input;
}

async function analyzeWithGemini(prompt, options) {
  if (!genAI) {
    throw new Error("Gemini client unavailable");
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const instructions = [
    "You are an architectural planning assistant.",
    "Analyze the user brief and map it onto the provided classification keys.",
    "Respond with JSON ONLY using this shape:",
    JSON.stringify({
      analysis: Object.fromEntries(ANALYSIS_FIELDS.map((key) => [key, "value"])),
    }),
  ].join(" ");

  const truncatedPrompt = trimPrompt(prompt);
  const promptText = [
    instructions,
    `User Brief:\n"""${truncatedPrompt}"""`,
    `Selected Options JSON:\n${JSON.stringify(options, null, 2)}`,
  ].join("\n\n");

  const result = await model.generateContent(promptText);
  const response = await result.response;
  const text = response.text();
  const json = extractJson(text);
  const base = Object.fromEntries(ANALYSIS_FIELDS.map((key) => [key, "Unknown"]));

  if (json?.analysis && typeof json.analysis === "object") {
    for (const key of ANALYSIS_FIELDS) {
      if (typeof json.analysis[key] === "string" && json.analysis[key].trim()) {
        base[key] = json.analysis[key].trim();
      }
    }
    return base;
  }

  return heuristicFallback(prompt);
}

async function generateImageWithGemini(prompt, analysis) {
  if (!genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_IMAGE_MODEL });
  const description = [
    "Generate a strictly top-down 2D architectural floor plan that follows professional drafting standards.",
    "Render in full color with clear fills and outlines so each room type is visually distinct.",
    "Overlay readable text labels for every room and include key dimensions or scale indicators directly on the plan.",
    "Ensure doors, windows, furniture, fixtures, and circulation paths are placed accurately and architecturally coherent.",
    "Return the rendered plan inline in the response (no external URLs).",
    `Incorporate the following program cues: ${JSON.stringify(analysis, null, 2)}`,
    `User brief: ${trimPrompt(prompt)}`,
    "Output as a single high-resolution PNG image (minimum 1200x800) with transparent background disabled.",
  ].join("\n\n");

  const response = await model.generateContent(description);
  const candidate = response?.response;
  if (!candidate) return null;

  const parts = candidate.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data && part.inlineData?.mimeType) {
      return {
        base64: part.inlineData.data,
        mime: part.inlineData.mimeType,
      };
    }
    if (part.fileData?.fileUri) {
      return {
        imageUrl: part.fileData.fileUri,
        mime: part.fileData.mimeType || "image/png",
      };
    }
  }

  return null;
}

async function generateInsightBundleWithGemini(prompt, options, analysis) {
  if (!genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const truncatedPrompt = trimPrompt(prompt);

  const schemaExample = {
    programSummary: {
      name: "3 BHK Duplex",
      size: "1,800-2,400 sq.ft",
      orientation: "South-west breezes",
      notes: "Key planning note",
    },
    roomSplits: DEFAULT_ROOM_SPLITS,
    nlpBreakdown: {
      summary: "One sentence synopsis",
      wordCount: 140,
      keywords: ["duplex", "solar"],
      spaces: ["Courtyard core"],
      tone: "Sustainability-led tone",
      compliance: ["Reference NBC exit widths"],
    },
    variationIdeas: [
      { title: "Courtyard-forward duplex", summary: "Wraps living around an open court." },
    ],
    actionChecklist: ["Validate structural grid before issue."],
    designAnalysis: deriveDesignAnalysis(analysis),
  };

  const promptBlocks = [
    "You are an architectural planning copilot generating structured insights for a concept brief.",
    "Respond with VALID JSON only and no markdown code fences.",
    "Limit lists to concise, high-signal entries (max 6 items).",
    "Percentages in roomSplits must be numbers (no strings) and stay within practical bounds.",
    "Fill fields even if you must rely on professional defaults informed by the analysis cues.",
    `JSON shape example:\n${JSON.stringify(schemaExample, null, 2)}`,
    `Current analysis JSON:\n${JSON.stringify(analysis ?? {}, null, 2)}`,
    `Selected options JSON:\n${JSON.stringify(options ?? {}, null, 2)}`,
    `User brief:\n"""${truncatedPrompt}"""`,
  ];

  const result = await model.generateContent(promptBlocks.join("\n\n"));
  const response = await result.response;
  const text = response.text();
  const json = extractJson(text);

  if (!json || typeof json !== "object") {
    throw new Error("Gemini insights returned empty payload");
  }

  const sanitized = sanitizeInsightBundle(json, analysis);
  const { insightSource, ...rest } = sanitized || {};
  if (!rest || !Object.keys(rest).length) {
    throw new Error("Gemini insights returned no usable fields");
  }

  return sanitized;
}

function sanitizeInsightBundle(candidate, analysis) {
  const bundle = {};

  const programRaw =
    candidate?.programSummary ??
    candidate?.program ??
    candidate?.programOverview;
  if (programRaw && typeof programRaw === "object") {
    const programSummary = sanitizeProgramSummary(programRaw, analysis);
    if (programSummary) {
      bundle.programSummary = programSummary;
    }
  }

  const roomSplitsRaw = candidate?.roomSplits ?? candidate?.roomMix ?? candidate?.programMix;
  const roomSplits = sanitizeRoomSplits(roomSplitsRaw);
  if (roomSplits) {
    bundle.roomSplits = roomSplits;
  }

  const nlpRaw = candidate?.nlpBreakdown ?? candidate?.promptInsights ?? candidate?.analysisSummary;
  const nlpBreakdown = sanitizeNlpBreakdown(nlpRaw);
  if (nlpBreakdown) {
    bundle.nlpBreakdown = nlpBreakdown;
  }

  const variationsRaw = candidate?.variationIdeas ?? candidate?.variations ?? candidate?.alternates;
  const variationIdeas = sanitizeVariationIdeas(variationsRaw);
  if (variationIdeas && variationIdeas.length) {
    bundle.variationIdeas = variationIdeas;
  }

  const checklistRaw = candidate?.actionChecklist ?? candidate?.checklist ?? candidate?.nextSteps;
  const actionChecklist = sanitizeActionChecklist(checklistRaw);
  if (actionChecklist.length) {
    bundle.actionChecklist = actionChecklist;
  }

  const designAnalysis = sanitizeDesignAnalysis(candidate?.designAnalysis);
  if (designAnalysis) {
    bundle.designAnalysis = designAnalysis;
  }

  bundle.insightSource = "gemini";
  return bundle;
}

function sanitizeProgramSummary(raw, analysis = {}) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const defaults = deriveProgramDefaultsFromAnalysis(analysis);
  const programName = toTrimmedString(raw.name ?? raw.programName ?? raw.title) || defaults.programName;
  const size = toTrimmedString(raw.size ?? raw.area ?? raw.footprint ?? raw.scale) || defaults.size;
  const direction =
    toTrimmedString(raw.orientation ?? raw.direction ?? raw.aspect ?? raw.facing ?? raw.solstice) ||
    defaults.direction;
  const notes = toTrimmedString(raw.notes ?? raw.summary ?? raw.detail ?? raw.comment);

  return {
    programName,
    size,
    direction,
    ...(notes ? { notes } : defaults.notes ? { notes: defaults.notes } : {}),
  };
}

function deriveProgramDefaultsFromAnalysis(analysis = {}) {
  const typology = toTrimmedString(analysis?.Typology);
  const category = toTrimmedString(analysis?.Category);
  const climate = toTrimmedString(analysis?.["Climate Adaptability"]);
  const style = toTrimmedString(analysis?.Style);

  let programName = typology || category || "Concept Program";
  const loweredProgram = programName.toLowerCase();

  let size = "1,200–2,400 sq.ft";
  if (/duplex|villa|bungalow|row house|mansion/.test(loweredProgram)) {
    size = "1,800–3,200 sq.ft";
  } else if (/apartment|studio|condo|residential/.test(loweredProgram)) {
    size = "800–2,000 sq.ft";
  } else if (/commercial|office|retail|workspace/.test(loweredProgram)) {
    size = "5,000–12,000 sq.ft";
  }

  let direction = "East-facing daylight";
  if (climate) {
    const loweredClimate = climate.toLowerCase();
    if (/hot|dry|arid/.test(loweredClimate)) {
      direction = "South-west shading strategy";
    } else if (/cold|alpine|winter/.test(loweredClimate)) {
      direction = "South-facing solar gain";
    } else if (/tropical|humid|monsoon/.test(loweredClimate)) {
      direction = "East-west breeze lanes";
    }
  }

  const notes = style ? `Expressed in ${style.toLowerCase()} language.` : "";
  return { programName, size, direction, notes };
}

function sanitizeRoomSplits(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const splits = {};
  let hasNumericEntry = false;

  ROOM_SPLIT_PRESETS.forEach((preset) => {
    const candidate = toFiniteNumber(
      raw[preset.key] ??
        raw[preset.key.toLowerCase()] ??
        raw[preset.key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()] ??
        raw[preset.key.replace(/([a-z])([A-Z])/g, "$1 $2")],
    );

    if (candidate !== null) {
      hasNumericEntry = true;
      splits[preset.key] = clampNumber(candidate, preset.min, preset.max);
    } else if (hasNumericEntry) {
      splits[preset.key] = clampNumber(preset.defaultValue, preset.min, preset.max);
    }
  });

  return hasNumericEntry ? splits : null;
}

function sanitizeNlpBreakdown(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const summary = toTrimmedString(raw.summary ?? raw.synopsis ?? raw.overview);
  const wordCount = toFiniteNumber(raw.wordCount ?? raw.words ?? raw.length);
  const keywords = sanitizeStringArray(raw.keywords ?? raw.tags ?? raw.thematic, 12);
  const spaces = sanitizeStringArray(raw.spaces ?? raw.rooms ?? raw.program, 8);
  const tone = toTrimmedString(raw.tone ?? raw.voice ?? raw.mood);
  const compliance = sanitizeStringArray(raw.compliance ?? raw.checks ?? raw.flags, 6);

  if (!summary && !keywords.length && !spaces.length && !compliance.length && !tone) {
    return null;
  }

  const payload = {
    ...(summary ? { summary } : {}),
    ...(Number.isFinite(wordCount) ? { wordCount: Math.max(0, Math.round(wordCount)) } : {}),
    keywords,
    spaces,
    ...(tone ? { tone } : {}),
    compliance,
  };

  return payload;
}

function sanitizeVariationIdeas(raw) {
  if (!Array.isArray(raw)) {
    return null;
  }

  const ideas = raw
    .map((item, index) => {
      if (!item) return null;
      if (typeof item === "string") {
        const clean = toTrimmedString(item);
        if (!clean) return null;
        return {
          title: clean.length > 72 ? `${clean.slice(0, 69)}...` : clean,
          summary: clean,
          id: `variation-${index}`,
        };
      }
      if (typeof item === "object") {
        const title = toTrimmedString(item.title ?? item.name ?? item.heading);
        const summary = toTrimmedString(item.summary ?? item.detail ?? item.description ?? item.note);
        if (!title && !summary) return null;
        return {
          title: title || (summary.length > 60 ? `${summary.slice(0, 57)}...` : summary),
          summary: summary || title,
          id: item.id || item.key || `variation-${index}`,
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, MAX_VARIATION_ITEMS);

  return ideas.length ? ideas : null;
}

function sanitizeActionChecklist(raw) {
  const source = Array.isArray(raw) ? raw : [];
  const items = source
    .map((entry, index) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        return toTrimmedString(entry);
      }
      if (typeof entry === "object") {
        return toTrimmedString(entry.action ?? entry.label ?? entry.text ?? entry.note);
      }
      return null;
    })
    .filter(Boolean)
    .map((text, index) => ({ id: `check-${index}`, text }))
    .slice(0, MAX_CHECKLIST_ITEMS);

  return items;
}

function sanitizeDesignAnalysis(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const entries = Object.entries(raw)
    .filter(([key, value]) => typeof key === "string" && typeof value === "string" && value.trim())
    .map(([key, value]) => [key, value.trim()])
    .slice(0, 12);

  return entries.length ? Object.fromEntries(entries) : null;
}

function sanitizeStringArray(value, limit) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => toTrimmedString(item))
    .filter(Boolean)
    .slice(0, limit);
}

function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) {
    return value;
  }
  if (Number.isFinite(min) && value < min) return min;
  if (Number.isFinite(max) && value > max) return max;
  return value;
}

function heuristicFallback(prompt) {
  const lower = prompt.toLowerCase();
  const pick = (pairs, defaultValue) => {
    for (const [needle, value] of pairs) {
      if (lower.includes(needle)) return value;
    }
    return defaultValue;
  };

  return Object.fromEntries([
    ["Category", pick([["residential", "Residential"], ["commercial", "Commercial"], ["industrial", "Industrial"]], "Residential")],
    ["Typology", pick([["duplex", "Residential - Duplex"], ["apartment", "Residential - Apartment"]], "Residential - Apartment")],
    ["Style", pick([["modern", "Modern"], ["traditional", "Traditional"], ["minimal", "Minimalist"]], "Contemporary")],
    ["Climate Adaptability", pick([["hot", "Hot & Dry"], ["tropical", "Tropical"], ["cold", "Cold"]], "Temperate")],
    ["Terrain", pick([["hill", "Hilly"], ["coastal", "Coastal"], ["desert", "Desert"]], "Urban Flatland")],
    ["Soil Type", pick([["clay", "Clay"], ["sand", "Sandy"], ["rock", "Rocky"]], "Mixed Soil")],
    ["Material Used", pick([["concrete", "Reinforced Concrete"], ["timber", "Timber"], ["steel", "Steel"]], "Concrete and Glass")],
    ["Interior Layout", pick([["open plan", "Open Plan"], ["courtyard", "Courtyard"], ["loft", "Loft"]], "Open Plan")],
    ["Roof Type", pick([["flat roof", "Flat Roof"], ["gable", "Gable Roof"], ["vault", "Barrel Vault"]], "Flat Roof")],
    ["Exterior", pick([["brick", "Brick Facade"], ["glass", "Curtain Wall"], ["stone", "Stone Cladding"]], "Stucco Finish")],
    ["Additional Features", pick([["solar", "Solar Panels"], ["green roof", "Green Roof"], ["rainwater", "Rainwater Harvesting"]], "Terrace Garden")],
    ["Sustainability", pick([["net zero", "Net-Zero Ready"], ["leed", "LEED Platinum"], ["passive", "Passive Strategies"]], "Efficient Envelope")],
  ]);
}

function extractJson(text) {
  if (!text) return null;
  const codeBlockMatch = text.match(/```json([\s\S]*?)```/);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : text;
  const braceMatch = candidate.match(/\{[\s\S]*\}/);
  if (!braceMatch) return null;

  try {
    return JSON.parse(braceMatch[0]);
  } catch (err) {
    console.warn("json_parse_failed", err);
    return null;
  }
}

function deriveDesignAnalysis(base = {}) {
  const value = (key, fallback = "Not specified") => {
    const raw = typeof base[key] === "string" ? base[key].trim() : "";
    return raw || fallback;
  };

  const featuresValue = () => {
    const raw = value("Additional Features", "");
    return raw && raw !== "Not specified" ? raw : "Standard amenities";
  };

  return {
    "Program Fit": `Optimized for ${value("Typology", value("Category", "General use"))}.`,
    "Climate Response": `Envelope tuned for ${value("Climate Adaptability", "Temperate conditions")}.`,
    "Material Strategy": `Primary palette: ${value("Material Used", "Mixed materials")}.`,
    "Spatial Layout": `Interior layout emphasizes ${value("Interior Layout", "flexible zoning")}.`,
    "Roof & Exterior": `${value("Roof Type", "Standard roof")} with ${value("Exterior", "neutral facade treatment")}.`,
    "Sustainability Notes": `${value("Sustainability", "Baseline efficiency")} | Features: ${featuresValue()}.`,
  };
}
