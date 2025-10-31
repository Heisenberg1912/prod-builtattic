import { useEffect, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, Settings2 } from "lucide-react";
import { useApi } from "../lib/ctx";

export default function Topbar({ onToggleSidebar, sidebarCollapsed = false, isDesktop = false }) {
  const {
    activeMode,
    loading,
    refreshAll,
    refreshWeather,
    locationOverride,
    setLocationOverride,
    setActiveSidebar,
  } = useApi() || {};

  const [locationInput, setLocationInput] = useState(locationOverride || "");
  useEffect(() => {
    setLocationInput(locationOverride || "");
  }, [locationOverride]);

  const submitLocation = () => {
    setLocationOverride?.(locationInput.trim());
    refreshWeather?.();
  };

  const handleLocationKey = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitLocation();
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleSidebar?.()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surfaceSoft text-textPrimary transition hover:bg-surface"
            title={
              isDesktop
                ? sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
                : "Toggle navigation"
            }
          >
            {isDesktop ? (
              sidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-accent-soft)] text-base font-black text-accent">
            M2
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-textPrimary">Matters Control</span>
            <span className="text-[11px] text-textMuted">Mode | {activeMode || "N/A"}</span>
          </div>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surfaceSoft px-3 py-1 text-xs text-textMuted">
            <span>Weather location</span>
            <input
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              onKeyDown={handleLocationKey}
              placeholder="City or lat,lon"
              className="w-32 rounded-full border border-transparent bg-transparent px-2 py-1 text-sm text-textPrimary outline-none focus:border-border"
            />
            <button
              onClick={submitLocation}
              className="rounded-full border border-border px-2 py-1 text-[11px] font-medium text-textMuted transition hover:bg-surface"
            >
              Apply
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refreshAll?.(activeMode);
                refreshWeather?.(activeMode);
              }}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-textMuted transition hover:bg-surfaceSoft"
            >
              {loading?.summary || loading?.weather ? "Syncing" : "Sync"}
            </button>
            <button
              onClick={() => setActiveSidebar?.("Settings")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surfaceSoft text-textPrimary transition hover:bg-surface"
              title="Settings"
            >
              <Settings2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

