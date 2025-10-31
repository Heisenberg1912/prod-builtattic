import { useMemo } from "react"
import { useApi } from "../lib/ctx"

function formatDate(value){
  if(!value) return "—"
  const date = new Date(value)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function HistoryPanel({ onClose }){
  const { incidents, systems } = useApi() || {}
  const systemLookup = useMemo(()=>{
    const map = new Map()
    systems?.forEach(system=>map.set(system.id, system.name))
    return map
  },[systems])

  const ordered = useMemo(()=>{
    return [...(incidents || [])].sort((a,b)=>new Date(b.started_at) - new Date(a.started_at))
  },[incidents])

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-full max-w-[360px] border-r border-border bg-surface text-textPrimary shadow-card transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-textMuted">Incident History</div>
          <div className="text-lg font-semibold text-textPrimary">Last {ordered.length} records</div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full border border-border bg-surfaceSoft text-textMuted transition hover:text-textPrimary"
        >
          ×
        </button>
      </div>
      <div className="h-[calc(100%-64px)] space-y-3 overflow-y-auto px-4 py-4">
        {ordered.map((incident)=>(
          <div key={incident.id} className="rounded-xl border border-border bg-surfaceSoft p-3 text-textMuted">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-textMuted">{incident.severity}</span>
              <span className="text-[11px]">{formatDate(incident.started_at)}</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-textPrimary">{systemLookup.get(incident.system_id) || "Unknown System"}</div>
            <div className="mt-1 text-[12px] leading-relaxed">{incident.cause || "Cause pending triage."}</div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span>Resolved</span>
              <span>{incident.resolved_at ? formatDate(incident.resolved_at) : "In progress"}</span>
            </div>
          </div>
        ))}
        {ordered.length===0 && (
          <div className="pt-8 text-center text-sm text-textMuted">
            No incidents match the current filters. Use the sidebar to widen your selection.
          </div>
        )}
      </div>
    </div>
  )
}
