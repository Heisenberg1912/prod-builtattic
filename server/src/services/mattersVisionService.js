import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY =
  process.env.MATTERS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const MATTERS_VISION_MODEL =
  process.env.MATTERS_VISION_MODEL || "gemini-1.5-flash-latest";
const MAX_IMAGE_BYTES = Number.parseInt(
  process.env.MATTERS_VISION_IMAGE_LIMIT || "4000000",
  10,
);

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const FEEDS = [
  {
    id: "north-crane",
    label: "North Tower Crane",
    mode: "construction",
    location: "Block A • 42nd floor core",
    imageUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80",
    lastFrameAt: "2025-01-02T08:15:00.000Z",
    status: "live",
    highlights: ["Wind shear", "Payload hook clear"],
    telemetry: {
      temperatureC: 32,
      humidity: 48,
      windSpeedKph: 19,
      crewCount: 6,
    },
  },
  {
    id: "podium-west",
    label: "Podium West Deck",
    mode: "construction",
    location: "Podium deck • West canopy",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
    lastFrameAt: "2025-01-02T08:18:00.000Z",
    status: "live",
    highlights: ["Materials staging", "Crew PPE"],
    telemetry: {
      temperatureC: 29,
      humidity: 58,
      windSpeedKph: 11,
      crewCount: 9,
    },
  },
  {
    id: "atrium-monitor",
    label: "Atrium Interior",
    mode: "design",
    location: "Interior atrium • Level 12",
    imageUrl:
      "https://images.unsplash.com/photo-1451471016731-e963a8588be8?auto=format&fit=crop&w=1400&q=80",
    lastFrameAt: "2025-01-02T08:10:00.000Z",
    status: "live",
    highlights: ["MEP rough-in", "Scaffold nets"],
    telemetry: {
      temperatureC: 26,
      humidity: 52,
      windSpeedKph: 2,
      crewCount: 12,
    },
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function listSiteFeeds({ mode } = {}) {
  const filtered = mode ? FEEDS.filter((feed) => feed.mode === mode) : FEEDS;
  return clone(filtered);
}

export function getSiteFeed(id) {
  const match = FEEDS.find((feed) => feed.id === id);
  if (!match) return null;
  return clone(match);
}

export async function analyzeSiteFeedFrame({
  feedId,
  imageUrl,
  question,
  mode,
}) {
  const feed = feedId ? getSiteFeed(feedId) : null;
  const targetImage = imageUrl || feed?.imageUrl;
  if (!targetImage) {
    throw new Error("image_url_required");
  }

  const telemetry = feed?.telemetry || {};
  const context = {
    mode: mode || feed?.mode,
    feed: feed?.id,
    location: feed?.location,
    telemetry,
  };

  let analysis;
  if (genAI) {
    try {
      analysis = await runGeminiVision({
        imageUrl: targetImage,
        feed,
        question,
      });
    } catch (err) {
      console.warn("matters_vision_gemini_failed", err);
      analysis = null;
    }
  }

  if (!analysis) {
    analysis = fallbackAnalysis(feed, question);
  }

  return {
    ...analysis,
    feedId: feed?.id ?? null,
    imageUrl: targetImage,
    context,
  };
}

async function runGeminiVision({ imageUrl, feed, question }) {
  if (!genAI) return null;
  const inlineData = await fetchImageAsInlineData(imageUrl);
  if (!inlineData) return null;
  const model = genAI.getGenerativeModel({ model: MATTERS_VISION_MODEL });
  const instructions = [
    "You are a site safety and progress analyst reviewing a live construction camera frame.",
    "Respond with JSON using the exact schema: { summary: string, hazards: string[], opportunities: string[], weatherHints: string[], confidence: string }.",
    "Focus on visible cranes, crews, scaffolding, or environmental cues. Mention PPE or anomalies when relevant.",
    feed?.label ? `Feed label: ${feed.label}` : null,
    feed?.location ? `Location: ${feed.location}` : null,
    feed?.highlights?.length
      ? `Watchlist hints: ${feed.highlights.join(", ")}`
      : null,
    feed?.telemetry
      ? `Telemetry snapshot: ${JSON.stringify(feed.telemetry)}`
      : null,
    question ? `Operator question: ${question}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: instructions },
          inlineData,
        ],
      },
    ],
  });
  const response = await result.response;
  const text = response.text();
  const parsed = parseJsonSafe(text);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.summary !== "string"
  ) {
    return {
      summary: text.slice(0, 320),
      hazards: [],
      opportunities: [],
      weatherHints: [],
      confidence: "low",
      source: "gemini-freeform",
    };
  }
  return {
    summary: parsed.summary,
    hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
    opportunities: Array.isArray(parsed.opportunities)
      ? parsed.opportunities
      : [],
    weatherHints: Array.isArray(parsed.weatherHints)
      ? parsed.weatherHints
      : [],
    confidence: parsed.confidence || "medium",
    source: "gemini",
  };
}

async function fetchImageAsInlineData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`image_fetch_failed_${res.status}`);
    }
    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
      throw new Error("image_too_large");
    }
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error("image_too_large");
    }
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    };
  } catch (err) {
    console.warn("matters_fetch_image_failed", err.message);
    return null;
  }
}

function parseJsonSafe(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.warn("matters_vision_json_parse_failed", err.message);
    return null;
  }
}

function fallbackAnalysis(feed, question) {
  const baseSummary = feed
    ? `Monitoring ${feed.label || "site feed"} with ${
        feed.telemetry?.crewCount || "several"
      } crew visible.`
    : "Monitoring site feed.";
  const reasons = [];
  if (feed?.telemetry?.windSpeedKph > 25) {
    reasons.push("Wind gusts trending high, secure loose materials.");
  }
  if ((feed?.telemetry?.crewCount || 0) > 10) {
    reasons.push("High crew density – remind teams on clear walkways.");
  }
  if (feed?.highlights?.length) {
    reasons.push(`Watchlist: ${feed.highlights.join(", ")}.`);
  }
  if (question) {
    reasons.push(`Operator asked: ${question}`);
  }
  return {
    summary: `${baseSummary} ${reasons.join(" ")}`.trim(),
    hazards: feed?.highlights?.slice(0, 3) || [],
    opportunities: ["No AI analysis (using heuristic summary)."],
    weatherHints: feed?.telemetry
      ? [
          `Temp ${feed.telemetry.temperatureC}°C`,
          `Wind ${feed.telemetry.windSpeedKph} kph`,
        ]
      : [],
    confidence: "heuristic",
    source: "heuristic",
  };
}
