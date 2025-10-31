import { useApi } from '../lib/ctx'

function clampPercent(value) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function Donut({ value = 70, label = 'Uptime' }){
  const safeValue = clampPercent(value)
  const angle = safeValue * 3.6
  const accent = 'var(--color-accent)'
  const track = 'var(--color-border)'
  return (
    <div className="relative inline-block">
      <div className="h-24 w-24 rounded-full" style={{background:`conic-gradient(${accent} ${angle}deg, ${track} ${angle}deg)`}}/>
      <div className="absolute inset-2 grid place-items-center rounded-full border border-border bg-surface">
        <div className="text-center leading-tight text-textPrimary">
          <div className="text-xs font-bold">{safeValue}%</div>
          <div className="text-[10px] text-textMuted">{label}</div>
        </div>
      </div>
    </div>
  )
}

export function BudgetCard(){
  const { kpis } = useApi() || {}
  const uptime = Math.round(kpis?.uptime_pct ?? 0)
  const metrics = [
    { label: "RTO Met", value: kpis?.rto_ok_pct != null ? `${Math.round(kpis.rto_ok_pct)}%` : "—" },
    { label: "RPO Met", value: kpis?.rpo_ok_pct != null ? `${Math.round(kpis.rpo_ok_pct)}%` : "—" },
    { label: "Avg MTTR", value: kpis?.avg_mttr_min != null ? `${kpis.avg_mttr_min} min` : "—" },
    { label: "Incidents (30d)", value: kpis?.incidents_30d != null ? kpis.incidents_30d : "—" },
  ]
  return (
    <div className="card h-auto p-4 lg:h-[300px]">
      <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-textMuted">Budget Overview</div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Donut value={uptime}/>
        <ul className="w-full space-y-2 text-xs text-textMuted">
          {metrics.map(metric=>(
            <li key={metric.label} className="flex items-center justify-between border-b border-border/60 pb-1.5 last:border-b-0 last:pb-0">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{backgroundColor:'var(--color-accent)'}}></span>
                {metric.label}
              </span>
              <span className="font-semibold text-textPrimary">{metric.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-textMuted">
        Uptime is derived from weighted downtime across active incidents in the selected reporting window.
      </p>
    </div>
  )
}

export function InventoryCard(){
  const { incidents, systems } = useApi() || {}
  const systemNames = new Map((systems || []).map(sys=>[sys.id, sys.name]))
  const counts = (incidents || []).reduce((acc, incident)=>{
    const key = incident.system_id
    acc.set(key, (acc.get(key) || 0) + 1)
    return acc
  }, new Map())
  const rows = Array.from(counts.entries())
    .sort((a,b)=>b[1]-a[1])
    .slice(0,4)
    .map(([id,count])=>[systemNames.get(id) || `System ${id}`, `${count} incident${count===1?"":"s"}`])
  return (
    <div className="card h-auto p-4 lg:h-[340px]">
      <div className="text-sm font-semibold uppercase tracking-wide text-textMuted">Incident Inventory</div>
      <div className="mt-1 text-[11px] text-textMuted">
        Active incident load <b className="text-textPrimary">{incidents?.length || 0}</b> events
      </div>
      {rows.length>0 ? (
        <ul className="mt-3 space-y-2 text-sm text-textPrimary">
          {rows.map((r,i)=>(
            <li key={`${r[0]}-${i}`} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{backgroundColor:'var(--color-accent)'}}></span>{r[0]}</span>
              <span className="text-textMuted">{r[1]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 text-center text-sm text-textMuted">
          No incidents in the current selection.
        </div>
      )}
    </div>
  )
}

export default function LeftColumn(){
  return <div className="flex w-full flex-col gap-4 xl:w-[300px]"><BudgetCard/><InventoryCard/></div>
}
