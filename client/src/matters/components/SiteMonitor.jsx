import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, Loader2, MapPin, RefreshCcw, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import { useApi } from "../lib/ctx";

const statusDot = (status) =>
  ({
    live: "bg-emerald-500",
    warning: "bg-amber-500",
    offline: "bg-red-500",
  }[status] || "bg-slate-400");

export default function SiteMonitorPanel() {
  const {
    siteFeeds = [],
    activeFeedId,
    setActiveFeedId,
    refreshSiteFeeds,
    analyzeSiteFrame,
    feedInsights = {},
    loading,
  } = useApi() || {};

  const [prompt, setPrompt] = useState("");
  const [frameKey, setFrameKey] = useState(Date.now());
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const activeFeed = useMemo(
    () => siteFeeds.find((feed) => feed.id === activeFeedId) || siteFeeds[0],
    [siteFeeds, activeFeedId],
  );

  const insightState = feedInsights[activeFeed?.id] || {};
  const imgSrc = activeFeed ? `${activeFeed.imageUrl}?ts=${frameKey}` : "";
  const activeFeedKey = activeFeed?.id || null;

  useEffect(() => {
    if (!activeFeed) return undefined;
    const id = setInterval(() => setFrameKey(Date.now()), 15000);
    return () => clearInterval(id);
  }, [activeFeed]);

  useEffect(() => {
    if (!autoAnalyze || !activeFeedKey) return;
    analyzeSiteFrame?.({ feedId: activeFeedKey });
  }, [autoAnalyze, activeFeedKey, analyzeSiteFrame]);

  if (!siteFeeds.length) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-textMuted">
        Connect a surveillance feed to see live imagery.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-textMuted">Site monitoring</p>
          <p className="text-sm text-textSecondary">Observe live frames and dispatch AI assessments.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => refreshSiteFeeds?.()}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-textMuted hover:text-textPrimary"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading?.surveillance ? "animate-spin" : ""}`} />
            Sync feeds
          </button>
          <button
            type="button"
            onClick={() => analyzeSiteFrame?.({})}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Analyze frame
          </button>
          <button
            type="button"
            onClick={() => setAutoAnalyze((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs ${
              autoAnalyze ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10" : "text-textMuted"
            }`}
          >
            {autoAnalyze ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            Auto
          </button>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface-soft">
            {activeFeed ? (
              <img key={imgSrc} src={imgSrc} alt={activeFeed.label} loading="lazy" className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center text-textMuted">No feed selected</div>
            )}
            {activeFeed && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                <span className={`h-2 w-2 rounded-full ${statusDot(activeFeed.status)}`} />
                {activeFeed.label}
              </div>
            )}
          </div>
          {activeFeed && (
            <div className="grid gap-3 rounded-2xl border border-border/60 bg-surface-soft p-4 text-xs text-textSecondary sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {activeFeed.location}
              </div>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Last frame {formatRelativeTime(activeFeed.lastFrameAt)}
              </div>
              <div className="text-textPrimary">Temp: {activeFeed.telemetry?.temperatureC ?? "-"}°C</div>
              <div className="text-textPrimary">Wind: {activeFeed.telemetry?.windSpeedKph ?? "-"} kph</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {siteFeeds.map((feed) => (
              <button
                key={feed.id}
                type="button"
                onClick={() => setActiveFeedId?.(feed.id)}
                className={`flex-1 rounded-2xl border px-3 py-2 text-left text-xs ${
                  feed.id === activeFeed?.id
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-textPrimary"
                    : "border-border text-textMuted hover:text-textPrimary"
                }`}
              >
                <p className="font-medium text-textPrimary">{feed.label}</p>
                <p className="text-[11px] text-textMuted">{feed.location}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-inner">
            {insightState.loading ? (
              <div className="flex items-center gap-2 text-sm text-textMuted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running vision pass…
              </div>
            ) : insightState.summary ? (
              <div className="space-y-3 text-sm">
                <p className="text-textPrimary">{insightState.summary}</p>
                {insightState.hazards?.length ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Hazards</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {insightState.hazards.map((hazard, index) => (
                        <span key={`${hazard}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-600">
                          <AlertTriangle className="h-3 w-3" />
                          {hazard}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {insightState.opportunities?.length ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-textMuted">Opportunities</p>
                    <ul className="ml-4 list-disc text-xs text-textSecondary">
                      {insightState.opportunities.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p className="text-[11px] text-textMuted">
                  Confidence: {insightState.confidence || "n/a"} · Source: {insightState.source || "vision"}
                  {insightState.receivedAt ? ` · Updated ${formatRelativeTime(insightState.receivedAt)}` : ""}
                </p>
              </div>
            ) : (
                <p className="text-sm text-textMuted">Trigger AI analysis to receive live safety context.</p>
            )}

            <div className="mt-3 flex flex-col gap-2 text-xs">
              <textarea
                rows={2}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask AI to inspect specific elements (e.g., crane hook clearance)."
                className="w-full rounded-xl border border-border px-3 py-2 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-border"
              />
              <button
                type="button"
                onClick={() => analyzeSiteFrame?.({ question: prompt || undefined })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
                disabled={insightState.loading}
              >
                {insightState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {insightState.loading ? "Analyzing" : "Ask Copilot"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(iso) {
  if (!iso) return "just now";
  const ts = new Date(iso);
  if (Number.isNaN(ts.getTime())) return iso;
  const diff = Date.now() - ts.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
