import { useMemo } from 'react'
import { useApi } from '../lib/ctx'

function Weather(){
  const { drills, systems } = useApi() || {}
  const upcoming = drills?.[0]
  const systemLookup = useMemo(()=>{
    const map = new Map()
    systems?.forEach(sys=>map.set(sys.id, sys.name))
    return map
  },[systems])
  if(!upcoming){
    return (
      <div className="h-auto rounded-2xl p-4 text-white transition-colors duration-300 lg:h-[160px]" style={{background:'linear-gradient(135deg,#65c7f7 0%, #0052d4 100%)'}}>
        <div className="text-lg font-semibold">No drills scheduled</div>
        <div className="mt-2 text-[12px] opacity-90">Use the gallery controls to request the latest readiness exercises.</div>
      </div>
    )
  }
  const scheduled = new Date(upcoming.scheduled_at)
  const dateLabel = scheduled.toLocaleDateString(undefined,{ weekday:'long', month:'short', day:'numeric' })
  const timeLabel = scheduled.toLocaleTimeString(undefined,{ hour:'2-digit', minute:'2-digit' })
  return (
    <div className="h-auto rounded-2xl p-4 text-white transition-colors duration-300 lg:h-[160px]" style={{background:'linear-gradient(135deg,#65c7f7 0%, #0052d4 100%)'}}>
      <div className="text-xs uppercase opacity-80">Next Drill</div>
      <div className="mt-1 text-2xl font-bold leading-none">{upcoming.name}</div>
      <div className="mt-2 text-xs">{dateLabel} • {timeLabel}</div>
      <div className="text-xs">{systemLookup.get(upcoming.system_id) || "System"}</div>
      <div className="mt-3 text-[11px] opacity-90">Outcome: {upcoming.outcome || "Pending"} | Track progress in the insights panel.</div>
    </div>
  )
}

function Status(){
  const { kpis } = useApi() || {}
  const format = (value, digits=0, suffix="")=>{
    if(value === null || value === undefined) return "—"
    const num = Number(value)
    if(Number.isNaN(num)) return "—"
    return `${num.toFixed(digits)}${suffix}`
  }
  const tiles = [
    { label: "Uptime", value: format(kpis?.uptime_pct, 2, "%"), sub: "Last window" },
    { label: "Avg MTTR", value: format(kpis?.avg_mttr_min, 1, "m"), sub: "Recovery" },
    { label: "RTO OK", value: format(kpis?.rto_ok_pct, 1, "%"), sub: "Target ≥ 95%" },
    { label: "Incidents", value: kpis?.incidents_30d ?? "—", sub: "Past 30 days" },
  ]
  return (
    <div className="card flex h-auto flex-col overflow-hidden lg:h-[160px]">
      <div className="p-3 pb-0 title">Matters Status</div>
      <div className="grid grid-cols-2 gap-2 p-3 text-center text-xs">
        {tiles.map(tile=>(
          <div key={tile.label} className="rounded-xl bg-surfaceSoft py-3 px-2 text-textPrimary">
            <div className="text-xl font-semibold">{tile.value}</div>
            <div className="text-[10px] text-textMuted">{tile.label}</div>
            <div className="mt-1 text-[9px] uppercase tracking-wide text-textMuted">{tile.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WeatherStatus(){
  return <div className="flex w-full flex-col gap-4 lg:w-[340px]"><Weather/><Status/></div>
}
