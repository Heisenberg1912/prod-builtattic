import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "./config";
import { FILTER_ORDER, FILTER_SETS } from "../constants/designFilters.js";


/**
 * VitruviAI — Builtattic
 * React-only front-end (fits Vite + Tailwind). Clean, modern, production-friendly.
 *
 * Layout
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ Top App Bar (reserved for your existing black header)                     │
 * └───────────────────────────────────────────────────────────────────────────┘
 * ┌───────────────┬──────────────────────────────────────────────┬───────────┐
 * │ FILTERS       │  Main Canvas                                 │ HISTORY   │
 * │ (left)        │  • Image Preview (top-left)                   │ (right)   │
 * │               │  • Suggested Design (top-right card)          │           │
 * │ bottom:       │  • Prompt Analysis Table (bottom)             │           │
 * │ Profile/      │  • Chat Composer (sticky bottom of center)    │           │
 * │ Settings/Help │                                              │           │
 * └───────────────┴──────────────────────────────────────────────┴───────────┘
 *
 * NOTES
 * - Filters do **not** directly change the analysis table. The table refreshes on SEND (prompt analysis).
 * - “Apply Filters” only appends a structured summary of selected filter chips to the current prompt draft.
 * - Replace the stubs in `simulatePromptAnalysis` / `suggestProgramFromState` with real API calls.
 */




// ------------------------------ API HELPERS ---------------------------------
async function callAnalyze(prompt, selected) {
  const body = { prompt, options: selectedToOptions(selected) };
  const r = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw await enrichError("analyze_failed", r);
  return r.json();
}


async function callAnalyzeAndGenerate(prompt, selected) {
  const body = { prompt, options: selectedToOptions(selected) };
  const r = await fetch(`${API_BASE}/analyze-and-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw await enrichError("compose_failed", r);
  return r.json();
}


async function enrichError(prefix, response) {
  let detail = "";
  try {
    const data = await response.clone().json();
    detail = data?.detail || data?.error || JSON.stringify(data);
  } catch (_) {
    try {
      detail = await response.clone().text();
    } catch (__) {
      detail = "";
    }
  }
  const suffix = detail ? `: ${response.status} (${detail})` : `: ${response.status}`;
  return new Error(`${prefix}${suffix}`);
}


function selectedToOptions(selected) {
  // Map selected chips to a compact options object
  const opt = {};
  if (selected["Typology"]?.size) opt.typology = [...selected["Typology"]][0];
  if (selected["Style"]?.size) opt.style = [...selected["Style"]][0];
  if (selected["Climate Adaptability"]?.size) opt.climate = [...selected["Climate Adaptability"]][0];
  const feats = [];
  for (const k of ["Additional Features","Sustainability","Exterior","Roof Type"]) {
    if (selected[k]?.size) feats.push(...selected[k]);
  }
  if (feats.length) opt.features = feats;
  return opt;
}


// ---------------------------- SMALL UI PRIMITIVES ---------------------------
const Icon = {
  Search: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Send: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  X: (props) => (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Chevron: ({ open }) => (
    <svg viewBox="0 0 24 24" width={16} height={16} className={`transition-transform ${open ? "rotate-90" : "rotate-0"}`}>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Paperclip: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 1 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  Mic: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  History: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <polyline points="3 3 3 8 8 8" />
      <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  User: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Cog: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.66 0 1.25-.39 1.51-1z" />
    </svg>
  ),
  Help: (props) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </svg>
  ),
};


const Section = ({ title, children, right }) => (
  <div className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-600 py-2">
    <span>{title}</span>
    {right}
  </div>
);


const Card = ({ children, className = "" }) => (
  <div className={`bg-white/90 backdrop-blur border border-neutral-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
);


const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs mr-1 mb-1">
    {label}
    {onRemove && (
      <button className="opacity-60 hover:opacity-100" onClick={onRemove} aria-label={`Remove ${label}`}>
        <Icon.X />
      </button>
    )}
  </span>
);


const Collapsible = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200 py-2">
      <button className="w-full flex items-center justify-between text-left text-sm font-medium text-neutral-800" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <Icon.Chevron open={open} />
      </button>
      <div className={`overflow-hidden transition-all ${open ? "max-h-[800px] pt-2" : "max-h-0"}`}>{children}</div>
    </div>
  );
};


const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800">
          <Icon.X />
        </button>
      </div>
      <div className="px-5 py-4 text-sm text-neutral-700 space-y-3">{children}</div>
      <div className="px-5 py-4 border-t border-neutral-200 flex justify-end">
        <button onClick={onClose} className="text-sm px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800">
          Close
        </button>
      </div>
    </div>
  </div>
);


const PinterestLoader = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-8">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-24 sm:h-28 rounded-2xl bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-400">
      <span className="inline-flex h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "-0.2s" }} />
      <span className="inline-flex h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0s" }} />
      <span className="inline-flex h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0.2s" }} />
      <span>Rendering layout</span>
    </div>
  </div>
);


const GENERATION_PHASES = [
  { key: "layout", label: "Basic layout", description: "Structuring core zoning and circulation." },
  { key: "heatmap", label: "Heatmap of plan", description: "Evaluating daylight, ventilation, and activity flow." },
  { key: "envelope", label: "Window & rules placement", description: "Positioning openings per bylaws and climate comfort." },
  { key: "furniture", label: "Placing furniture", description: "Blocking major furniture to validate scale and adjacencies." },
  { key: "training", label: "Floor plan training reference", description: "Cross-checking symbols with Floor Plan Training.pdf guidance." },
];


const ROOM_LAYOUT_PRESETS = [
  { key: "living", label: "Living & Dining", defaultValue: 22, min: 8, max: 40 },
  { key: "bedrooms", label: "Bedrooms", defaultValue: 28, min: 10, max: 50 },
  { key: "kitchen", label: "Kitchen", defaultValue: 12, min: 6, max: 25 },
  { key: "bath", label: "Bath & Utility", defaultValue: 9, min: 4, max: 20 },
  { key: "workspace", label: "Work / Flex", defaultValue: 8, min: 4, max: 18 },
  { key: "circulation", label: "Circulation", defaultValue: 15, min: 8, max: 30 },
];


const DEFAULT_SITE_AREA = 100;




// --------------------------------- DATA ------------------------------------
// ------------------------------ UTILITIES ----------------------------------
function toggleSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}


function formatSelectedChips(selected) {
  const parts = Object.entries(selected)
    .filter(([, set]) => set.size)
    .map(([k, set]) => `${k}: ${[...set].join(", ")}`);
  return parts.length ? `\nFilters → ${parts.join(" | ")}` : "";
}


function buildPromptWithFilters(promptText, selected) {
  let trimmedPrompt = promptText.trim();
  const marker = "Filters →";
  if (trimmedPrompt.includes(marker)) {
    const idx = trimmedPrompt.indexOf(marker);
    trimmedPrompt = trimmedPrompt.slice(0, idx).trimEnd();
  }
  const filtersText = formatSelectedChips(selected).trim();
  if (!filtersText) return trimmedPrompt;
  if (!trimmedPrompt) return filtersText;
  return `${trimmedPrompt}\n\n${filtersText}`;
}


function simulatePromptAnalysis(prompt, selected) {
  const lower = prompt.toLowerCase();
  const pick = (key, fallbacks = []) => {
    const options = Array.isArray(FILTER_SETS[key]) ? FILTER_SETS[key] : [];
    const pool = options.length ? options : fallbacks;
    for (const opt of pool) {
      const needle = opt.split(" - ")[0].toLowerCase();
      if (lower.includes(needle)) return opt;
    }
    if (pool.length) return pool[0];
    if (options.length) return options[0];
    if (fallbacks.length) return fallbacks[0];
    return key;
  };
  return {
    Category: pick("Category"),
    Typology: pick("Typology"),
    Style: pick("Style"),
    "Climate Adaptability": pick("Climate Adaptability"),
    Terrain: pick("Terrain"),
    "Soil Type": pick("Soil Type"),
    "Material Used": pick("Material Used"),
    "Interior Layout": pick("Interior Layout"),
    "Roof Type": pick("Roof Type"),
    Exterior: pick("Exterior"),
    "Additional Features": pick("Additional Features"),
    Sustainability: pick("Sustainability"),
  };
}


function simulateDesignInsights(promptAnalysis) {
  const value = (key, fallback) => {
    const v = promptAnalysis?.[key];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };


  return {
    "Program Fit": `Optimized for ${value("Typology", value("Category", "General use"))}.`,
    "Climate Response": `Envelope tuned for ${value("Climate Adaptability", "Temperate conditions")}.`,
    "Material Strategy": `Primary palette: ${value("Material Used", "Mixed materials")}.`,
    "Spatial Layout": `Interior layout emphasizes ${value("Interior Layout", "flexible zoning")}.`,
    "Roof & Exterior": `${value("Roof Type", "Standard roof")} with ${value("Exterior", "neutral façade treatment")}.`,
    "Sustainability Notes": `${value("Sustainability", "Baseline efficiency")} | Features: ${value("Additional Features", "Standard amenities")}.`,
  };
}


function suggestProgramFromState(selected, analysis) {
  const cat = analysis?.Category || [...(selected["Category"] || [])][0] || "Residential";
  const typo = analysis?.Typology || [...(selected["Typology"] || [])][0] || "Apartment";


  let programName = "Concept Program";
  if (/residential/i.test(cat)) {
    if (/duplex/i.test(typo)) programName = "3 BHK Duplex";
    else if (/apartment|condominium/i.test(typo)) programName = "2 BHK Apartment";
    else programName = "Custom Residence";
  } else if (/commercial/i.test(cat)) {
    programName = "Retail + Office Core";
  } else if (/industrial/i.test(cat)) {
    programName = "Light Industrial Shed";
  }


  const size = /mansion|mall|stadium/i.test(typo) ? "30,000–80,000 sq.ft"
    : /duplex|villa|bungalow|single-family/i.test(typo) ? "1,800–3,200 sq.ft"
    : "800–2,000 sq.ft";
  const direction = /tropical|hot/i.test(analysis?.["Climate Adaptability"] || "") ? "South-West optimized" : "East-facing";

  const notes = [];
  if (analysis?.Style) {
    notes.push(`${analysis.Style} expression with contextual detailing.`);
  }
  if (analysis?.["Additional Features"]) {
    notes.push(`Highlight ${analysis["Additional Features"].toLowerCase()} early in zoning.`);
  }
  if (/hot|tropical/.test((analysis?.["Climate Adaptability"] || "").toLowerCase())) {
    notes.push("Prioritise passive cooling corridors and shaded outdoor edges.");
  } else if (/cold/.test((analysis?.["Climate Adaptability"] || "").toLowerCase())) {
    notes.push("Stack services along the north face to preserve winter gain.");
  }

  const noteText = notes.length ? notes.join(" ") : "Refine circulation before detailed issue.";

  return { programName, size, direction, notes: noteText };
}


export default function App() {
  const [selected, setSelected] = useState(() => Object.fromEntries(FILTER_ORDER.map((k) => [k, new Set()])));
  const [promptDraft, setPromptDraft] = useState("");
  const [history, setHistory] = useState([]); // { id, text, ts }
  const [analysis, setAnalysis] = useState(null);
  const [designAnalysis, setDesignAnalysis] = useState(null);
  const [imgB64, setImgB64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState("");
  const [modal, setModal] = useState(null);
  const [autoApplyFilters, setAutoApplyFilters] = useState(true);
  const [phaseStates, setPhaseStates] = useState(() => createInitialPhases());
  const [nlpBreakdown, setNlpBreakdown] = useState(null);
  const [roomSplits, setRoomSplits] = useState(() => defaultRoomConfig());
  const [variationIdeas, setVariationIdeas] = useState([]);
  const [programSummary, setProgramSummary] = useState(null);
  const [actionChecklist, setActionChecklist] = useState([]);
  const [insightSource, setInsightSource] = useState(null);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const voiceTimeoutRef = useRef(null);
  const phaseTimersRef = useRef([]);


  const flushPhaseTimers = () => {
    if (!phaseTimersRef.current.length) return;
    phaseTimersRef.current.forEach(clearTimeout);
    phaseTimersRef.current = [];
  };


  const startPhaseFlow = () => {
    flushPhaseTimers();
    const base = createInitialPhases("pending").map((phase, index) => ({
      ...phase,
      status: index === 0 ? "active" : "pending",
    }));
    setPhaseStates(base);
    phaseTimersRef.current = base.map((_, index) =>
      setTimeout(() => {
        setPhaseStates((prev) =>
          prev.map((phase, idx) => {
            if (idx < index) return { ...phase, status: "complete" };
            if (idx === index) return { ...phase, status: "active" };
            return { ...phase, status: "pending" };
          })
        );
      }, index === 0 ? 0 : index * 1400)
    );
  };


  const completePhaseFlow = (errored = false) => {
    flushPhaseTimers();
    setPhaseStates((prev) =>
      prev.map((phase) => ({
        ...phase,
        status: errored ? (phase.status === "complete" ? "complete" : "error") : "complete",
      }))
    );
  };


  const chips = useMemo(() => formatSelectedChips(selected), [selected]);
  const program = useMemo(() => {
    const base = suggestProgramFromState(selected, analysis);
    if (!programSummary) {
      return base;
    }
    return {
      programName: programSummary.programName || base.programName,
      size: programSummary.size || base.size,
      direction: programSummary.direction || base.direction,
      notes: programSummary.notes || base.notes,
    };
  }, [programSummary, selected, analysis]);


  const openBuilt = useMemo(() => computeOpenBuiltFromRooms(roomSplits), [roomSplits]);


  useEffect(() => {
    document.title = "VitruviAI";
  }, []);


  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
      flushPhaseTimers();
    };
  }, []);


  const handleToggle = (section, opt) => {
    setSelected((prev) => {
      const next = { ...prev, [section]: toggleSet(prev[section], opt) };
      if (autoApplyFilters) {
        setPromptDraft((p) => buildPromptWithFilters(p, next));
      }
      return next;
    });
  };


  const handleApplyFilters = () => {
    setPromptDraft((p) => buildPromptWithFilters(p, selected));
  };


  const handleClearFilters = () => {
    const empty = Object.fromEntries(FILTER_ORDER.map((k) => [k, new Set()]));
    setSelected(empty);
    if (autoApplyFilters) {
      setPromptDraft((p) => buildPromptWithFilters(p, empty));
    }
  };


  const applyAnalyzeResult = (result, promptText, snapshot = selected) => {
    setError(result?.warning || null);


    const promptData = (result?.promptAnalysis || result?.analysis);
    const normalizedPrompt =
      promptData && typeof promptData === "object"
        ? promptData
        : simulatePromptAnalysis(promptText, snapshot);


    setAnalysis(normalizedPrompt);
    const resolvedRooms = resolveRoomConfig(result?.roomSplits, normalizedPrompt, promptText);
    setRoomSplits(resolvedRooms);
    setProgramSummary(normalizeProgramSummary(result?.programSummary));
    setInsightSource(result?.insightSource || result?.source || null);
    setNlpBreakdown(resolveNlpBreakdown(result?.nlpBreakdown, promptText, normalizedPrompt, resolvedRooms));
    setVariationIdeas(resolveVariationIdeas(result?.variationIdeas, normalizedPrompt, promptText));
    setActionChecklist(resolveActionChecklist(result?.actionChecklist, normalizedPrompt, promptText));
    setImageModalOpen(false);


    const designData = result?.designAnalysis;
    if (designData && typeof designData === "object") {
      setDesignAnalysis(designData);
    } else {
      setDesignAnalysis(simulateDesignInsights(normalizedPrompt));
    }


    if (result?.base64) {
      const dataUri = `data:${result.mime || "image/png"};base64,${result.base64}`;
      setImgB64(dataUri);
      setImageUrl(result.imageUrl || dataUri);
    } else if (result?.imageUrl) {
      setImgB64(null);
      setImageUrl(result.imageUrl);
    } else {
      setImgB64(null);
    }
    completePhaseFlow(false);
  };


  const handleSend = async () => {
    const trimmed = promptDraft.trim();
    if (!trimmed) return;


    const snapshot = selected;
    const finalPrompt = buildPromptWithFilters(trimmed, snapshot);
    const annotatedPrompt = attachment
      ? `${finalPrompt}${finalPrompt ? "\n\n" : ""}Attachment Reference: ${attachment.name}`
      : finalPrompt;


    const entry = { id: crypto.randomUUID(), text: annotatedPrompt, ts: new Date().toISOString() };
    setHistory((h) => [entry, ...h]);


    setError(null);
    setLoading(true);
    startPhaseFlow();
    setImageModalOpen(false);
    setNlpBreakdown(null);
    setVariationIdeas([]);
    setRoomSplits(defaultRoomConfig());
    setProgramSummary(null);
    setActionChecklist([]);
    setInsightSource(null);
    try {
      const result = await callAnalyzeAndGenerate(annotatedPrompt, snapshot);
      applyAnalyzeResult(result, annotatedPrompt, snapshot);
    } catch (err) {
      setError(String(err?.message || err));
      const fallbackPrompt = simulatePromptAnalysis(annotatedPrompt, snapshot);
      setAnalysis(fallbackPrompt);
      setDesignAnalysis(simulateDesignInsights(fallbackPrompt));
      const resolvedRooms = defaultRoomConfig(fallbackPrompt, annotatedPrompt);
      setRoomSplits(resolvedRooms);
      setProgramSummary(null);
      setInsightSource(null);
      setNlpBreakdown(resolveNlpBreakdown(null, annotatedPrompt, fallbackPrompt, resolvedRooms));
      setVariationIdeas(resolveVariationIdeas(null, fallbackPrompt, annotatedPrompt));
      setActionChecklist(resolveActionChecklist(null, fallbackPrompt, annotatedPrompt));
      setImgB64(null);
      setImageUrl(null);
      completePhaseFlow(true);
    }


    setPromptDraft("");
    setAttachment(null);
    setListening(false);
    setVoiceHint("");
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    setLoading(false);
  };


  const handleRoomSplitChange = (key, rawValue) => {
    const preset = ROOM_LAYOUT_PRESETS.find((item) => item.key === key);
    const numeric = Number(rawValue);
    setRoomSplits((prev) => ({
      ...prev,
      [key]: sanitizeRoomValue(Number.isFinite(numeric) ? numeric : prev[key], preset),
    }));
  };


  const handleResetRooms = () => {
    setRoomSplits(defaultRoomConfig(analysis));
  };


  const handleAdoptVariation = (idea) => {
    if (!idea) return;
    const snippet = `Variation focus: ${idea.title} - ${idea.summary}`;
    setPromptDraft((prev) => (prev ? `${prev}


${snippet}` : snippet));
  };


  const handleDownloadImage = () => {
    const source = imageUrl || imgB64;
    if (!source || typeof window === "undefined") return;
    const link = document.createElement("a");
    link.href = source;
    link.download = `vitruvi-ai-plan-${Date.now()}.png`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleDownloadDxf = () => {
    if (typeof window === "undefined") return;
    const summaryLines = buildDxfSummaryLines({ analysis, promptDraft, roomSplits });
    const dxfPayload = buildSimpleDxf(summaryLines);
    const blob = new Blob([dxfPayload], { type: "application/dxf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vitruvi-ai-plan-${Date.now()}.dxf`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };


  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachment({ name: file.name, size: file.size });
    setVoiceHint(`Attached “${file.name}”. Reference it in your brief before sending.`);
  };


  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setVoiceHint("");
  };


  const handleMicClick = () => {
    setListening((prev) => {
      const next = !prev;
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      if (next) {
        setVoiceHint("Listening… describe your brief. We'll drop a transcript shortly.");
        voiceTimeoutRef.current = setTimeout(() => {
          const simulated = "Dictated: Design a naturally ventilated duplex with a central courtyard and solar-ready roof.";
          setPromptDraft((p) => (p ? `${p}\n${simulated}` : simulated));
          setVoiceHint("Voice preview captured. Edit the transcript before sending.");
          setListening(false);
          voiceTimeoutRef.current = null;
        }, 3200);
      } else {
        setVoiceHint("");
      }
      return next;
    });
  };


  const closeModal = () => setModal(null);


  const handleHistoryReuse = (text) => {
    setPromptDraft(text);
    closeModal();
  };


  const handleClearHistory = () => {
    setHistory([]);
  };


  const copyLatestPrompt = async () => {
    const latest = history[0]?.text;
    if (!latest) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(latest);
        setVoiceHint("Latest prompt copied to clipboard.");
      }
    } catch (err) {
      console.warn("copy_failed", err);
    }
  };


  const modalDetails = () => {
    if (!modal) return null;
    switch (modal) {
      case "profile": {
        const recent = history.slice(0, 3);
        return {
          title: "Profile",
          content: (
            <>
              <p>You’re working as <strong>Studio Designer</strong>. Your recent prompts and filter selections stay on this device.</p>
              {chips ? <div className="text-xs bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 whitespace-pre-wrap">{chips}</div> : <p className="text-xs text-neutral-500">No active filters yet.</p>}
              {recent.length ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent Prompts</div>
                  {recent.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleHistoryReuse(item.text)}
                      className="w-full text-left text-xs border border-neutral-200 rounded-xl px-3 py-2 hover:bg-neutral-100"
                    >
                      {truncate(item.text, 140)}
                    </button>
                  ))}
                  <button onClick={copyLatestPrompt} className="text-xs text-neutral-600 hover:text-neutral-900 underline">
                    Copy latest prompt to clipboard
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Once you send a prompt, it’ll appear here.</p>
              )}
            </>
          ),
        };
      }
      case "settings":
        return {
          title: "Workspace Settings",
          content: (
            <>
              <label className="flex items-center justify-between text-sm">
                <span>Automatically apply filters to the prompt</span>
                <input type="checkbox" checked={autoApplyFilters} onChange={(e) => setAutoApplyFilters(e.target.checked)} className="h-4 w-4" />
              </label>
              <button onClick={handleClearHistory} className="text-xs text-red-600 hover:text-red-700 underline">
                Clear prompt history
              </button>
              <p className="text-xs text-neutral-500">Settings are stored locally for this session.</p>
            </>
          ),
        };
      case "help":
        return {
          title: "Need a hand?",
          content: (
            <>
              <p>Describe what you need, pick filters, and press Send. We’ll analyze the prompt and render a 2D plan.</p>
              <ul className="list-disc list-inside text-xs space-y-1 text-neutral-600">
                <li>Use filters to guide materials, climate, and typology.</li>
                <li>Attach references or toggle dictation to add context quickly.</li>
                <li>Review both analysis tables to validate the generated output before sharing.</li>
              </ul>
            </>
          ),
        };
      default:
        return null;
    }
  };


  const modalInfo = modalDetails();


  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">


      {modalInfo && (
        <Modal title={modalInfo.title} onClose={closeModal}>
          {modalInfo.content}
        </Modal>
      )}


      {isImageModalOpen && (imageUrl || imgB64) && (


        <Modal title="Generated plan preview" onClose={() => setImageModalOpen(false)}>


          <div className="max-h-[70vh] overflow-auto rounded-2xl border border-neutral-200">


            <img src={imageUrl || imgB64} alt="Generated plan" className="w-full" />


          </div>


          <div className="flex items-center justify-between text-xs text-neutral-500">


            <span>Reference: Floor Plan Training.pdf</span>


            <button onClick={handleDownloadImage} className="text-xs px-3 py-1 rounded-full bg-neutral-900 text-white hover:bg-neutral-800">Download image</button>


          </div>


        </Modal>


      )}






      <div className="flex flex-col xl:flex-row xl:items-start gap-6 xl:gap-0 px-4 sm:px-6 pb-10">
        {/* LEFT FILTERS */}
        <aside className="order-2 xl:order-1 w-full xl:w-[300px] bg-white/70 backdrop-blur border border-neutral-200 xl:border-r xl:border-l-0 rounded-2xl xl:rounded-none shadow-sm xl:shadow-none xl:min-h-[calc(100vh-56px)] xl:sticky xl:top-14 flex flex-col">
          <div className="p-4 flex-1 overflow-visible xl:overflow-y-auto">
{loading && <div className="hidden xl:block p-2 mb-2 text-sm bg-yellow-50 border border-yellow-200 rounded">Processing…</div>}
{error && <div className="hidden xl:block p-2 mb-2 text-sm bg-red-50 border border-red-200 rounded">{String(error)}</div>}


            <div className="mb-3">
              <div className="flex items-center gap-2 rounded-xl border bg-neutral-50 px-3 py-2 focus-within:ring-2 focus-within:ring-neutral-300">
                <Icon.Search />
                <input className="bg-transparent outline-none w-full text-sm" placeholder="Search filters" />
              </div>
            </div>


            <Section title="Filters" right={<span className="text-[10px] text-neutral-500">(Collapsible)</span>} />


            <div className="space-y-2">
              {FILTER_ORDER.map((section) => (
                <Collapsible key={section} title={section} defaultOpen={section === "Category" || section === "Typology"}>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_SETS[section].map((opt) => {
                      const active = selected[section].has(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => handleToggle(section, opt)}
                          className={`text-xs border rounded-full px-3 py-1 transition ${active ? "bg-neutral-900 text-white border-neutral-900" : "bg-white hover:bg-neutral-100 border-neutral-300"}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </Collapsible>
              ))}
            </div>


            {/* Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <button onClick={handleClearFilters} className="flex-1 text-sm border border-neutral-300 rounded-xl px-3 py-2 hover:bg-neutral-100">Clear</button>
              <button onClick={handleApplyFilters} className="flex-1 text-sm rounded-xl px-3 py-2 bg-neutral-900 text-white hover:bg-neutral-800">Apply Filters</button>
            </div>
          </div>


          {/* Bottom utilities */}
          <div className="mt-6 xl:mt-auto border-t border-neutral-200 p-4 space-y-2">
            <button onClick={() => setModal("profile")} className="w-full text-sm flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100"><Icon.User /> Profile</button>
            <button onClick={() => setModal("settings")} className="w-full text-sm flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100"><Icon.Cog /> Settings</button>
            <button onClick={() => setModal("help")} className="w-full text-sm flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100"><Icon.Help /> Help</button>
          </div>
        </aside>


        {/* CENTER */}
        <main className="order-1 xl:order-2 flex-1 xl:min-h-[calc(100vh-56px)] xl:overflow-y-auto pt-6 xl:pt-6 pb-20 xl:pb-28">
          <div className="max-w-5xl mx-auto w-full">
{loading && <div className="xl:hidden mb-4 text-sm bg-yellow-50 border border-yellow-200/80 text-yellow-900 px-4 py-3 rounded-xl">Processing…</div>}
{error && <div className="xl:hidden mb-4 text-sm bg-red-50 border border-red-200/80 text-red-800 px-4 py-3 rounded-xl">{String(error)}</div>}
            {/* Selected Chips preview */}
            <div className="mb-4 px-1">
              {Object.entries(selected).some(([, set]) => set.size > 0) ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selected).map(([k, set]) =>
                    [...set].map((v) => (
                      <Chip key={`${k}:${v}`} label={`${k}: ${v}`} onRemove={() => handleToggle(k, v)} />
                    ))
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No filters selected yet.</p>
              )}
            </div>


            {/* Top grid: Image + Suggested Design */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">


              <Card className="col-span-1 xl:col-span-8 h-64 sm:h-80 xl:h-[420px] relative overflow-hidden flex">


                <div className="relative w-full h-full flex items-center justify-center">


                  {loading ? (


                    <PinterestLoader />


                  ) : imageUrl ? (


                    <img src={imageUrl} alt="Generated plan" className="w-full h-full object-cover rounded-2xl" />


                  ) : imgB64 ? (


                    <img alt="Generated plan" src={imgB64} className="w-full h-full object-cover rounded-2xl border" />


                  ) : (


                    <div className="text-center text-neutral-500 px-6">


                      <div className="text-sm">Image Preview</div>


                      <div className="text-[12px] mt-1">Your generated concept will appear here.</div>


                      <div className="text-[11px] mt-2 text-neutral-400">Guided by Floor Plan Training.pdf symbology.</div>


                    </div>


                  )}


                  {loading && (


                    <div className="absolute bottom-3 left-3 text-[11px] uppercase tracking-wide bg-white/80 border border-neutral-200 rounded-full px-3 py-1 text-neutral-600">


                      Preparing render


                    </div>


                  )}


                  {(imageUrl || imgB64) && !loading && (


                    <div className="absolute top-3 right-3 flex gap-2">


                      <button


                        onClick={() => setImageModalOpen(true)}


                        className="rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-[12px] text-neutral-700 hover:bg-white"


                      >


                        Enlarge


                      </button>


                      <button


                        onClick={handleDownloadImage}


                        className="rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1 text-[12px] text-white hover:bg-neutral-800"


                      >


                        Download


                      </button>


                      <button


                        onClick={handleDownloadDxf}


                        className="rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-[12px] text-neutral-700 hover:bg-white"


                      >


                        Download DXF


                      </button>


                    </div>


                  )}


                </div>


              </Card>






              <Card className="col-span-1 xl:col-span-4 p-4">


                <Section title="Suggested Design" />


                <div className="space-y-3 text-sm">


                  <div className="flex items-center justify-between gap-4"><span className="text-neutral-500">Program</span><span className="font-medium text-right">{program.programName}</span></div>


                  <div className="flex items-center justify-between gap-4"><span className="text-neutral-500">Size</span><span className="font-medium text-right">{program.size}</span></div>


                  <div className="flex items-center justify-between gap-4"><span className="text-neutral-500">Orientation</span><span className="font-medium text-right">{program.direction}</span></div>


                  <div className="flex items-center justify-between gap-4"><span className="text-neutral-500">Open/Built</span><span className="font-medium text-right">{openBuilt.open}% / {openBuilt.built}%</span></div>


                </div>






                {program.notes ? (
                  <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 leading-relaxed">
                    {program.notes}
                  </div>
                ) : null}

                <div className="mt-4 text-[12px] text-neutral-500 leading-relaxed">Adjust proportions below or explore alternates to rebalance the scheme before exporting.</div>


              </Card>


            </div>






            <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">


              <Card className="col-span-1 xl:col-span-8 p-4">


                <Section
                  title="Prompt Intelligence"
                  right={
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-neutral-500">
                      <span>Detailed NLP</span>
                      {insightSource === "gemini" ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Gemini
                        </span>
                      ) : null}
                    </div>
                  }
                />


                {nlpBreakdown ? (


                  <div className="space-y-4 text-sm">


                    <p className="text-neutral-700 leading-relaxed">{nlpBreakdown.summary}</p>


                    <div className="flex flex-wrap gap-3 text-[12px] text-neutral-500">


                      <span>Words: {nlpBreakdown.wordCount}</span>


                      <span>Tone: {nlpBreakdown.tone}</span>


                      <span>Open/Built: {openBuilt.open}% / {openBuilt.built}%</span>


                      <span>Ratio: {openBuilt.ratio ?? "N/A"}</span>


                    </div>


                    {nlpBreakdown.keywords?.length ? (


                      <div>


                        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Keywords</div>


                        <div className="flex flex-wrap gap-2">


                          {nlpBreakdown.keywords.map((token) => (


                            <span key={token} className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs">{token}</span>


                          ))}


                        </div>


                      </div>


                    ) : null}


                    {nlpBreakdown.spaces?.length ? (


                      <div>


                        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Spaces flagged</div>


                        <div className="flex flex-wrap gap-2 text-xs text-neutral-600">


                          {nlpBreakdown.spaces.map((space) => (


                            <span key={space} className="px-2 py-1 rounded-full border border-neutral-200 bg-white">{space}</span>


                          ))}


                        </div>


                      </div>


                    ) : null}


                    {nlpBreakdown.compliance?.length ? (


                      <div>


                        <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Compliance notes</div>


                        <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1">


                          {nlpBreakdown.compliance.map((note, idx) => (


                            <li key={idx}>{note}</li>


                          ))}


                        </ul>


                      </div>


                    ) : null}


                  </div>


                ) : (


                  <div className="text-sm text-neutral-500">Send a prompt to unlock NLP insights, compliance cues, and open-to-built diagnostics.</div>


                )}


              </Card>






              <Card className="col-span-1 xl:col-span-4 p-4">


                <Section title="Generation Phases" right={<span className={`text-[10px] uppercase tracking-wide ${loading ? "text-amber-600" : "text-emerald-600"}`}>{loading ? "In progress" : "Ready"}</span>} />


                <div className="space-y-3">


                  {phaseStates.map((phase, index) => {


                    const isComplete = phase.status === "complete";


                    const isError = phase.status === "error";


                    const isIdle = phase.status === "idle";


                    const statusLabel = isComplete ? "Ready" : isError ? "Review" : "Preparing";


                    const badgeClass = isComplete


                      ? "border border-emerald-200 bg-emerald-50 text-emerald-600"


                      : isError


                      ? "border border-red-200 bg-red-50 text-red-600"


                      : isIdle


                      ? "border border-neutral-200 bg-neutral-100 text-neutral-500"


                      : "border border-amber-200 bg-amber-50 text-amber-600";


                    const dotClass = isComplete ? "bg-emerald-500" : isError ? "bg-red-500 animate-pulse" : isIdle ? "bg-neutral-400" : "bg-amber-500 animate-pulse";


                    return (


                      <div key={phase.key} className="border border-neutral-200 rounded-xl px-3 py-2 bg-white/80">


                        <div className="flex items-start gap-3">


                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClass}`} />


                          <div className="flex-1 space-y-1">


                            <div className="flex items-center justify-between text-sm font-medium text-neutral-800">


                              <span>{index + 1}. {phase.label}</span>


                              <span className={`${badgeClass} text-[11px] px-2 py-0.5 rounded-full`}>{statusLabel}</span>


                            </div>


                            <p className="text-xs text-neutral-500 leading-relaxed">{phase.description}</p>


                          </div>


                        </div>


                      </div>


                    );


                  })}


                </div>


                <div className="mt-4 text-[11px] text-neutral-500 leading-relaxed">Steps mirror the spans detailed in Floor Plan Training.pdf so annotations stay consistent across exports.</div>


              </Card>


            </div>






            <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">


              <Card className="col-span-1 xl:col-span-8 p-4">


                <Section title="Built Area Controls" right={<span className="text-[10px] uppercase tracking-wide text-neutral-500">Adjust proportions</span>} />


                <div className="space-y-4">


                  {ROOM_LAYOUT_PRESETS.map((preset) => (


                    <div key={preset.key} className="space-y-1">


                      <div className="flex items-center justify-between text-sm text-neutral-700">


                        <span>{preset.label}</span>


                        <span className="text-xs text-neutral-500">{roomSplits[preset.key] ?? preset.defaultValue}%</span>


                      </div>


                      <input


                        type="range"


                        min={preset.min}


                        max={preset.max}


                        step={1}


                        value={roomSplits[preset.key] ?? preset.defaultValue}


                        onChange={(e) => handleRoomSplitChange(preset.key, e.target.value)}


                        className="w-full"


                      />


                    </div>


                  ))}


                </div>


                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-600">


                  <span>Built: {openBuilt.built}%</span>


                  <span>Open: {openBuilt.open}%</span>


                  <span>Ratio: {openBuilt.ratio ?? "N/A"}</span>


                  <button onClick={handleResetRooms} className="px-3 py-1 rounded-full border border-neutral-300 hover:bg-neutral-100">Reset</button>


                </div>


                <div className="mt-2 text-[12px] text-neutral-500 leading-relaxed">Use the sliders to tune furniture-ready zones inside the built footprint while keeping outdoor areas responsive.</div>


              </Card>






              <Card className="col-span-1 xl:col-span-4 p-4">


                <Section title="Alternate Concepts" right={<span className="text-[10px] uppercase tracking-wide text-neutral-500">Variations</span>} />


                {variationIdeas.length ? (


                  <div className="space-y-3">


                    {variationIdeas.map((idea) => (


                      <div key={idea.id} className="border border-neutral-200 rounded-xl px-3 py-2 bg-white/80">


                        <div className="text-sm font-medium text-neutral-800">{idea.title}</div>


                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{idea.summary}</p>


                        <div className="mt-2 flex gap-2">


                          <button onClick={() => handleAdoptVariation(idea)} className="text-xs px-3 py-1 rounded-full bg-neutral-900 text-white hover:bg-neutral-800">Use variation</button>


                        </div>


                      </div>


                    ))}


                  </div>


                ) : (


                  <div className="text-sm text-neutral-500">Generate a design to unlock alternates aligned with the brief.</div>


                )}


                <div className="mt-3 text-[11px] text-neutral-500 leading-relaxed">Alternates reinterpret the same training cues so you can compare before locking the final plan.</div>


              </Card>


            </div>






            <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">



              <Card className="col-span-1 xl:col-span-12 p-4">



                <Section
                  title="Action Checklist"
                  right={<span className="text-[10px] uppercase tracking-wide text-neutral-500">Pre-issue tasks</span>}
                />



                {actionChecklist.length ? (



                  <ul className="mt-3 space-y-2 text-sm text-neutral-700">



                    {actionChecklist.map((item) => (



                      <li key={item.id} className="flex items-start gap-3">



                        <span className="mt-1 h-2 w-2 rounded-full bg-neutral-400" />



                        <span>{item.text}</span>



                      </li>



                    ))}



                  </ul>



                ) : (



                  <div className="text-sm text-neutral-500">Generate a brief to surface coordination tasks.</div>



                )}



                <div className="mt-3 text-[11px] text-neutral-500 leading-relaxed">
                  {insightSource === "gemini"
                    ? "Gemini highlights these coordination checkpoints so nothing slips before DD issue."
                    : "Use these checkpoints to steer coordination when AI enrichment is unavailable."}
                </div>



              </Card>



            </div>



            {/* Analysis Table */}
            <Card className="mt-4">
              <div className="p-4">
                <Section title="Prompt → Analyzed Categories" />
                {analysis ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-neutral-500 border-b">
                          <th className="py-2 pr-4">Category Title</th>
                          <th className="py-2">Detected Option</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FILTER_ORDER.map((row) => (
                        <tr key={row} className="border-b last:border-b-0">
                          <td className="py-2 pr-4 font-medium text-neutral-800">{row}</td>
                          <td className="py-2 text-neutral-700">{analysis[row]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-neutral-500">Send a prompt to see the analyzed table.</div>
              )}
            </div>
          </Card>


            {/* Output Evaluation */}
            <Card className="mt-4">
              <div className="p-4">
                <Section title="Design Output → Evaluation" />
                {designAnalysis ? (
                  <div className="space-y-3 text-sm">
                    {Object.entries(designAnalysis).map(([label, detail]) => (
                      <div key={label} className="border border-neutral-200 rounded-xl px-3 py-2 bg-white/70 backdrop-blur-sm">
                        <div className="text-neutral-600 text-xs uppercase tracking-wide">{label}</div>
                        <div className="text-neutral-800 mt-1 leading-relaxed">{detail}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">Generate a design to review the output evaluation.</div>
                )}
              </div>
            </Card>


            {/* Chat Composer (sticky bottom of center) */}
            <div className="mt-6 xl:sticky xl:bottom-0">
              <Card className="p-4 space-y-3">
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={handleAttachClick}
                      className={`rounded-xl border p-2 transition ${attachment ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300 hover:bg-neutral-100"}`}
                      title="Attach reference file"
                    >
                      <Icon.Paperclip />
                    </button>
                    <button
                      onClick={handleMicClick}
                      className={`rounded-xl border p-2 transition flex items-center gap-1 ${listening ? "border-red-500 bg-red-500/10 text-red-600" : "border-neutral-300 hover:bg-neutral-100"}`}
                      title="Voice dictation (prototype)"
                    >
                      <span className={`h-2 w-2 rounded-full ${listening ? "bg-red-500 animate-ping" : "bg-neutral-400"}`} />
                      <Icon.Mic />
                    </button>
                  </div>
                  <div className="flex-1 w-full">
                    <textarea
                      className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300 text-sm"
                      rows={2}
                      placeholder={"Describe the brief… e.g., 'Generate a 3 BHK duplex in hot & dry climate with open plan'"}
                      value={promptDraft}
                      onChange={(e) => setPromptDraft(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className={`rounded-xl px-4 py-2 text-sm flex items-center justify-center gap-2 w-full sm:w-auto ${loading ? "bg-neutral-400 cursor-not-allowed text-white" : "bg-neutral-900 text-white hover:bg-neutral-800"}`}
                  >
                    <Icon.Send /> Send
                  </button>
                </div>
                <div className="space-y-2">
                  {attachment && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-800">{attachment.name}</span>
                        <span className="text-neutral-500">{formatBytes(attachment.size)}</span>
                      </div>
                      <button onClick={handleRemoveAttachment} className="text-neutral-500 hover:text-neutral-900">
                        Remove
                      </button>
                    </div>
                  )}
                  {voiceHint && <div className="text-[12px] text-neutral-600 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">{voiceHint}</div>}
                  {!!chips && <div className="text-[12px] text-neutral-600 whitespace-pre-wrap">{chips}</div>}
                </div>
              </Card>
            </div>
          </div>
        </main>


        {/* RIGHT: PROMPT HISTORY */}
        <aside className="order-3 w-full xl:w-[320px] bg-white/70 backdrop-blur border border-neutral-200 xl:border-l xl:border-t-0 rounded-2xl xl:rounded-none shadow-sm xl:shadow-none mt-6 xl:mt-0 xl:min-h-[calc(100vh-56px)] xl:sticky xl:top-14 p-4 flex flex-col">
          <Section title="Prompt History" right={<Icon.History />} />
          <div className="space-y-2 mt-3 flex-1 overflow-auto xl:overflow-visible pr-1">
            {history.length === 0 && <div className="text-xs text-neutral-500">No prompts yet.</div>}
            {history.map((h) => (
              <button
                key={h.id}
                className="w-full text-left text-xs p-3 rounded-xl border border-neutral-200 hover:bg-neutral-100"
                onClick={() => setPromptDraft((p) => (p ? `${p}\n\n${h.text}` : h.text))}
                title={new Date(h.ts).toLocaleString()}
              >
                {truncate(h.text, 160)}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
function createInitialPhases(status = "idle") {
  return GENERATION_PHASES.map((phase) => ({
    ...phase,
    status,
  }));
}


function sanitizeRoomValue(value, preset = {}) {
  const fallback = Number.isFinite(Number(preset?.defaultValue)) ? Number(preset.defaultValue) : 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const min = Number.isFinite(Number(preset?.min)) ? Number(preset.min) : -Infinity;
  const max = Number.isFinite(Number(preset?.max)) ? Number(preset.max) : Infinity;
  return Math.min(Math.max(Math.round(numeric), min), max);
}


function defaultRoomConfig(analysis, promptText = "") {
  const config = {};
  ROOM_LAYOUT_PRESETS.forEach((preset) => {
    config[preset.key] = preset.defaultValue;
  });
  const textBlob = `${promptText || ""} ${Object.values(analysis || {}).join(" ")}`.toLowerCase();


  if (/duplex|villa|bungalow|row\s?house/.test(textBlob)) {
    config.bedrooms = sanitizeRoomValue((config.bedrooms || 0) + 4, ROOM_LAYOUT_PRESETS.find((p) => p.key === "bedrooms"));
    config.circulation = sanitizeRoomValue((config.circulation || 0) + 3, ROOM_LAYOUT_PRESETS.find((p) => p.key === "circulation"));
  }
  if (/studio|workspace|office|cowork/.test(textBlob)) {
    config.workspace = sanitizeRoomValue((config.workspace || 0) + 5, ROOM_LAYOUT_PRESETS.find((p) => p.key === "workspace"));
  }
  if (/compact|micro|affordable|tight/.test(textBlob)) {
    config.circulation = sanitizeRoomValue((config.circulation || 0) - 3, ROOM_LAYOUT_PRESETS.find((p) => p.key === "circulation"));
  }
  if (/courtyard|atrium|garden|deck|open\s?to\s?sky/.test(textBlob)) {
    config.living = sanitizeRoomValue((config.living || 0) - 2, ROOM_LAYOUT_PRESETS.find((p) => p.key === "living"));
  }
  if (/hospitality|resort|hotel/.test(textBlob)) {
    config.bedrooms = sanitizeRoomValue((config.bedrooms || 0) + 6, ROOM_LAYOUT_PRESETS.find((p) => p.key === "bedrooms"));
    config.bath = sanitizeRoomValue((config.bath || 0) + 4, ROOM_LAYOUT_PRESETS.find((p) => p.key === "bath"));
  }


  return ROOM_LAYOUT_PRESETS.reduce((acc, preset) => {
    acc[preset.key] = sanitizeRoomValue(config[preset.key], preset);
    return acc;
  }, {});
}


function resolveRoomConfig(roomSplits, analysis, promptText = "") {
  const base = defaultRoomConfig(analysis, promptText);
  if (roomSplits && typeof roomSplits === "object") {
    ROOM_LAYOUT_PRESETS.forEach((preset) => {
      const candidate = roomSplits[preset.key];
      if (Number.isFinite(Number(candidate))) {
        base[preset.key] = sanitizeRoomValue(candidate, preset);
      }
    });
  }
  return base;
}


function computeOpenBuiltFromRooms(config, siteArea = DEFAULT_SITE_AREA) {
  if (!config) return { built: 0, open: siteArea, ratio: null, note: "Awaiting inputs" };
  const built = Object.values(config).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const open = Math.max(0, siteArea - built);
  const ratio = built > 0 ? Number((open / built).toFixed(2)) : null;
  let note = "Balanced profile";
  if (ratio === null) note = "Awaiting inputs";
  else if (ratio < 0.35) note = "Dense built proportion";
  else if (ratio > 0.8) note = "Highly open profile";
  return { built: Number(built.toFixed(1)), open: Number(open.toFixed(1)), ratio, note };
}



function normalizeProgramSummary(summary) {
  if (!summary || typeof summary !== "object") return null;
  const programName = toTitleCase(summary.programName || summary.name || "");
  const size = typeof summary.size === "string" ? summary.size.trim() : "";
  const directionRaw = summary.direction || summary.orientation || "";
  const direction = typeof directionRaw === "string" ? directionRaw.trim() : "";
  const notes = typeof summary.notes === "string" ? summary.notes.trim() : "";
  if (!programName && !size && !direction && !notes) {
    return null;
  }
  return {
    programName: programName || undefined,
    size: size || undefined,
    direction: direction || undefined,
    ...(notes ? { notes } : {}),
  };
}

function buildActionChecklist(analysis, promptText = "") {
  const items = new Set();
  const climate = (analysis?.["Climate Adaptability"] || "").toLowerCase();
  const features = (analysis?.["Additional Features"] || "").toLowerCase();
  const style = (analysis?.Style || "").toLowerCase();
  const promptLower = (promptText || "").toLowerCase();

  items.add("Verify local code setbacks and fire clearances before issuing DD.");

  if (/hot|arid|tropical/.test(climate)) {
    items.add("Model shading and cross ventilation for climate resilience.");
  } else if (/cold|alpine/.test(climate)) {
    items.add("Add thermal buffer vestibules and review envelope U-values.");
  }

  if (features.includes("solar")) {
    items.add("Coordinate solar infrastructure zones with MEP routing.");
  }
  if (features.includes("rain")) {
    items.add("Lay out recharge pits aligned with rainwater strategy.");
  }
  if (style.includes("industrial")) {
    items.add("Confirm structural bay spacing with consultant early.");
  }

  if (/accessibility|universal/.test(promptLower)) {
    items.add("Audit accessibility slopes, clear widths, and lift reach.");
  }

  items.add("Review service cores with structural and MEP teams before freeze.");

  return Array.from(items)
    .filter(Boolean)
    .slice(0, 5)
    .map((text, index) => ({ id: "fallback-action-" + index, text }));
}

function resolveNlpBreakdown(serverBreakdown, promptText, analysis, rooms) {
  const fallback = createDetailedNlpBreakdown(promptText, analysis, rooms);
  if (!serverBreakdown || typeof serverBreakdown !== "object") {
    return fallback;
  }

  const summary = typeof serverBreakdown.summary === "string" && serverBreakdown.summary.trim()
    ? serverBreakdown.summary.trim()
    : fallback.summary;

  const wordCount = Number.isFinite(Number(serverBreakdown.wordCount))
    ? Math.max(0, Math.round(Number(serverBreakdown.wordCount)))
    : fallback.wordCount;

  const keywords = Array.isArray(serverBreakdown.keywords) && serverBreakdown.keywords.length
    ? serverBreakdown.keywords
        .map((token) => (typeof token === "string" ? token.trim() : ""))
        .filter(Boolean)
        .slice(0, 12)
    : fallback.keywords;

  const spaces = Array.isArray(serverBreakdown.spaces) && serverBreakdown.spaces.length
    ? serverBreakdown.spaces
        .map((token) => (typeof token === "string" ? token.trim() : ""))
        .filter(Boolean)
        .slice(0, 8)
    : fallback.spaces;

  const tone = typeof serverBreakdown.tone === "string" && serverBreakdown.tone.trim()
    ? serverBreakdown.tone.trim()
    : fallback.tone;

  const compliance = Array.isArray(serverBreakdown.compliance) && serverBreakdown.compliance.length
    ? serverBreakdown.compliance
        .map((line) => (typeof line === "string" ? line.trim() : ""))
        .filter(Boolean)
        .slice(0, 6)
    : fallback.compliance;

  return {
    ...fallback,
    summary,
    wordCount,
    keywords,
    spaces,
    tone,
    compliance,
  };
}

function resolveVariationIdeas(serverIdeas, analysis, promptText) {
  if (Array.isArray(serverIdeas) && serverIdeas.length) {
    const normalized = serverIdeas
      .map((idea, index) => {
        if (!idea) return null;
        if (typeof idea === "string") {
          const clean = idea.trim();
          if (!clean) return null;
          return {
            id: "variation-" + index,
            title: clean.length > 72 ? clean.slice(0, 69) + "..." : clean,
            summary: clean,
          };
        }
        if (typeof idea === "object") {
          const title = typeof idea.title === "string" && idea.title.trim()
            ? idea.title.trim()
            : typeof idea.name === "string" && idea.name.trim()
            ? idea.name.trim()
            : "";
          const summary = typeof idea.summary === "string" && idea.summary.trim()
            ? idea.summary.trim()
            : typeof idea.detail === "string" && idea.detail.trim()
            ? idea.detail.trim()
            : typeof idea.description === "string" && idea.description.trim()
            ? idea.description.trim()
            : "";
          if (!title && !summary) return null;
          return {
            id: idea.id || idea.key || "variation-" + index,
            title: title || toTitleCase(summary.slice(0, 64)),
            summary: summary || title,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 4);
    if (normalized.length) {
      return normalized;
    }
  }
  return buildVariationIdeas(analysis, promptText);
}

function resolveActionChecklist(serverChecklist, analysis, promptText = "") {
  if (Array.isArray(serverChecklist) && serverChecklist.length) {
    const normalized = serverChecklist
      .map((item, index) => {
        if (!item) return null;
        if (typeof item === "string") {
          const clean = item.trim();
          return clean ? { id: "action-" + index, text: clean } : null;
        }
        if (typeof item === "object") {
          const text =
            (typeof item.text === "string" && item.text.trim()) ||
            (typeof item.label === "string" && item.label.trim()) ||
            (typeof item.action === "string" && item.action.trim()) ||
            "";
          if (!text) return null;
          return {
            id: item.id || item.key || "action-" + index,
            text,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 6);
    if (normalized.length) {
      return normalized;
    }
  }
  return buildActionChecklist(analysis, promptText);
}

function createDetailedNlpBreakdown(promptText = "", analysis, rooms) {
  const clean = (promptText || "").trim();
  const sentences = clean ? clean.split(/(?<=[.!?])\s+/).filter(Boolean) : [];
  const summary =
    sentences.slice(0, 2).join(" ") ||
    `Focus on ${analysis?.Typology || analysis?.Category || "the selected program"} with ${analysis?.Style || "contextual"} expression.`;
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const keywords = extractKeywordsFromPrompt(clean, analysis);
  const spaces = deriveSpaces(clean, analysis);
  const tone = detectTone(clean);
  const compliance = buildComplianceNotes(clean, analysis, rooms);
  return { summary, wordCount, keywords, spaces, tone, compliance };
}


function extractKeywordsFromPrompt(promptText, analysis) {
  const collected = new Set();
  const addValue = (value) => {
    if (!value) return;
    collected.add(toTitleCase(String(value).split("-")[0].trim()));
  };
  if (analysis) {
    ["Typology", "Style", "Climate Adaptability", "Terrain", "Roof Type"].forEach((key) => addValue(analysis[key]));
  }
  const curated = [
    "courtyard",
    "double height",
    "atrium",
    "green roof",
    "solar",
    "passive cooling",
    "modular",
    "prefabricated",
    "flex space",
    "vaastu",
    "open plan",
    "cantilever",
    "skylight",
    "pergola",
  ];
  const lower = promptText.toLowerCase();
  curated.forEach((word) => {
    if (lower.includes(word)) {
      collected.add(toTitleCase(word));
    }
  });
  const fallbackTokens = (promptText.match(/\b[a-z]{4,}\b/gi) || []).slice(0, 6);
  fallbackTokens.forEach((token) => {
    if (collected.size >= 8) return;
    collected.add(toTitleCase(token));
  });
  return Array.from(collected).slice(0, 8);
}


function deriveSpaces(promptText, analysis) {
  const out = new Set();
  const pairs = [
    { regex: /(living|lounge|drawing)/i, label: "Living core" },
    { regex: /(dining|breakfast)/i, label: "Dining" },
    { regex: /(bed|suite)/i, label: "Sleeping suites" },
    { regex: /(study|work|office)/i, label: "Workspace" },
    { regex: /(kitchen|pantry)/i, label: "Kitchen" },
    { regex: /(utility|service|laundry)/i, label: "Service spine" },
    { regex: /(terrace|deck|balcony|veranda|verandah)/i, label: "Outdoor spillover" },
    { regex: /(parking|garage|car|drive)/i, label: "Parking" },
  ];
  pairs.forEach(({ regex, label }) => {
    if (regex.test(promptText)) out.add(label);
  });
  if (/courtyard|atrium|void/.test(promptText)) out.add("Courtyard void");
  if (analysis?.Typology?.toLowerCase().includes("duplex")) out.add("Internal stair core");
  return Array.from(out);
}


function detectTone(promptText) {
  const lower = promptText.toLowerCase();
  if (!lower) return "Neutral brief";
  if (/luxury|premium|grand|plush/.test(lower)) return "Premium aspirational tone";
  if (/compact|efficient|minimal|budget/.test(lower)) return "Compact efficiency tone";
  if (/sustainable|green|net\s?zero|passive|solar|rainwater/.test(lower)) return "Sustainability-led tone";
  if (/community|inclusive|public/.test(lower)) return "Community centric tone";
  return "Neutral brief";
}


function buildComplianceNotes(promptText, analysis, rooms) {
  const notes = [];
  const lower = promptText.toLowerCase();
  if (/vaastu|vastu/.test(lower)) notes.push("Align orientation to Vaastu cues during envelope stage.");
  if (/setback|by\s?law|code|fire|nbc|udf/i.test(lower)) {
    notes.push("Reference mentioned codes while placing windows and exits.");
  }
  if (analysis?.["Climate Adaptability"]) {
    notes.push(`Tune shading for ${analysis["Climate Adaptability"].toLowerCase()} response.`);
  }
  const ratio = computeOpenBuiltFromRooms(rooms);
  notes.push(`Open-to-built check: ${ratio.note} (${ratio.open}% open vs ${ratio.built}% built).`);
  if (!/cross ventilation|cross-ventilated/.test(lower)) {
    notes.push("Add cross-ventilation notes before final issue.");
  }
  return notes.slice(0, 4);
}


function toTitleCase(value) {
  return value
    ? value
        .toLowerCase()
        .split(/\s+/)
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
        .join(" ")
    : "";
}


function buildVariationIdeas(analysis, promptText = "") {
  const typology = analysis?.Typology || analysis?.Category || "Program";
  const style = analysis?.Style || "Contemporary";
  const climate = analysis?.["Climate Adaptability"] || "Temperate";
  const seed = Math.abs(hashCode(`${promptText}:${typology}:${style}:${climate}`));
  const variations = [
    {
      title: `Courtyard-forward ${typology}`,
      summary: `Pulls living core around a shaded courtyard to amplify ${climate.toLowerCase()} comfort.`,
    },
    {
      title: `Linear spine ${typology}`,
      summary: "Organises rooms along a single-loaded corridor for clearer service separation.",
    },
    {
      title: "Split-level focus",
      summary: "Introduces half-level shifts to tighten circulation and add drama to double heights.",
    },
    {
      title: "Perimeter green buffer",
      summary: "Wraps the plan with landscape pockets for filtered daylight and privacy.",
    },
    {
      title: "Flexible pod arrangement",
      summary: `Clusters furniture-ready pods for a ${style.toLowerCase()} vibe with easy future edits.`,
    },
  ];
  return [0, 1, 2].map((offset) => {
    const pick = variations[(seed + offset) % variations.length];
    return { ...pick, id: `variation-${offset}` };
  });
}






// ----------------------------- HELPERS -------------------------------------
function buildDxfSummaryLines({ analysis, promptDraft, roomSplits }) {
  const lines = [];
  const now = new Date();
  lines.push(`Generated by VitruviAI on ${now.toISOString()}`);
  if (analysis?.Typology) lines.push(`Typology: ${analysis.Typology}`);
  if (analysis?.Style) lines.push(`Style: ${analysis.Style}`);
  if (analysis?.Category) lines.push(`Category: ${analysis.Category}`);
  if (analysis?.["Climate Adaptability"]) lines.push(`Climate: ${analysis["Climate Adaptability"]}`);
  const totalRooms = roomSplits ? Object.entries(roomSplits).filter(([, value]) => Number(value) > 0) : [];
  if (totalRooms.length) {
    const summary = totalRooms.map(([key, value]) => `${key}:${value}`).join(", ");
    lines.push(`Room counts: ${summary}`);
  }
  if (promptDraft) {
    lines.push(`Prompt: ${truncate(String(promptDraft).replace(/\s+/g, ' '), 180)}`);
  }
  if (!lines.length) {
    lines.push('VitruviAI export');
  }
  return lines;
}

function buildSimpleDxf(lines = []) {
  const sanitized = Array.isArray(lines) ? [...lines] : [String(lines)];
  if (!sanitized.length) sanitized.push('VitruviAI export');
  const header = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1027
0
ENDSEC
`;
  const tables = `0
SECTION
2
TABLES
0
ENDSEC
`;
  const polyline = `0
LWPOLYLINE
8
0
90
4
70
1
43
0.0
10
0
20
0
10
100
20
0
10
100
20
70
10
0
20
70
`;
  const textEntities = sanitized
    .filter(Boolean)
    .map((line, index) => {
      const value = String(line).replace(/\r?\n/g, ' ').trim();
      const y = 75 - index * 5;
      return `0
TEXT
8
0
10
5
20
${y}
30
0
40
3.5
1
${value}
`;
    })
    .join('');
  const entities = `0
SECTION
2
ENTITIES
${polyline}${textEntities}0
ENDSEC
`;
  const objects = `0
SECTION
2
OBJECTS
0
ENDSEC
0
EOF
`;
  return `${header}${tables}${entities}${objects}`;
}


function truncate(str, n) {
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + "…";
}


function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}


function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}




