import { useMemo } from "react"
import { useApi } from "../lib/ctx"

export default function ProfilePanel({ onClose }){
  const { user, systems, incidents } = useApi() || {}

  const breakdown = useMemo(()=>{
    const totalIncidents = incidents?.length || 0
    const openIncidents = incidents?.filter(inc=>!inc.resolved_at).length || 0
    return {
      totalIncidents,
      openIncidents,
      resolved: totalIncidents - openIncidents,
      topSystem: systems?.[0]?.name || "—",
    }
  }, [incidents, systems])

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[320px] border-l border-border bg-surface text-textPrimary shadow-card transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-sm text-textMuted">Signed in as</div>
          <div className="text-lg font-semibold text-textPrimary">{user?.name}</div>
          <div className="text-xs text-textMuted">{user?.email}</div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full border border-border bg-surfaceSoft text-textMuted transition hover:text-textPrimary"
        >
          ×
        </button>
      </div>
      <div className="space-y-4 px-4 py-5 text-sm text-textMuted">
        <div className="rounded-xl border border-border bg-surfaceSoft p-3">
          <div className="text-xs uppercase tracking-wide text-textMuted">Primary Role</div>
          <div className="mt-1 font-medium uppercase tracking-wide text-textPrimary">{user?.role}</div>
        </div>
        <div className="space-y-2 rounded-xl border border-border bg-surfaceSoft p-3">
          <div className="text-xs uppercase tracking-wide text-textMuted">Quick Stats</div>
          <div className="flex items-center justify-between">
            <span>Total Incidents</span>
            <span className="font-semibold text-textPrimary">{breakdown.totalIncidents}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Open Incidents</span>
            <span className="font-semibold text-amber-500">{breakdown.openIncidents}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Resolved</span>
            <span className="font-semibold text-emerald-400">{breakdown.resolved}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surfaceSoft p-3">
          <div className="text-xs uppercase tracking-wide text-textMuted">Focus System</div>
          <div className="mt-2 font-semibold text-textPrimary">{breakdown.topSystem}</div>
          <p className="mt-1 text-xs leading-relaxed text-textMuted">
            Use the sidebar to switch systems and severity filters. The dashboard refreshes KPI and incident details automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
