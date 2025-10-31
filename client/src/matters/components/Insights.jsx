import { useEffect, useMemo, useState } from "react"
import { useApi } from "../lib/ctx"

function formatDate(value){
  if(!value) return "—"
  const date = new Date(value)
  return date.toLocaleString(undefined,{ month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })
}

function DetailModal({ item, onClose }){
  if(!item) return null
  const isIncident = item.type === "incident"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface text-textPrimary shadow-card transition-colors duration-300">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-textMuted">{item.type === "incident" ? "Incident summary" : "Risk details"}</div>
            <div className="text-lg font-semibold text-textPrimary">{item.title}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full border border-border bg-surfaceSoft text-textMuted transition hover:text-textPrimary">×</button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm text-textMuted">
          <div className="rounded-xl border border-border bg-surfaceSoft p-3">
            <div className="text-xs uppercase tracking-wide text-textMuted">Primary</div>
            <div className="mt-1 text-textPrimary font-semibold">{item.headline}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-textMuted">{item.description}</p>
          </div>
          {isIncident ? (
            <>
              <div className="flex items-center justify-between text-[12px] text-textMuted">
                <span>Started</span>
                <span>{formatDate(item.meta?.started_at)}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-textMuted">
                <span>Resolved</span>
                <span>{item.meta?.resolved_at ? formatDate(item.meta?.resolved_at) : "In progress"}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-textMuted">
                <span>MTTR (min)</span>
                <span>{item.meta?.mttr_min?.toFixed?.(1) ?? "—"}</span>
              </div>
            </>
          ):(
            <>
              <div className="flex items-center justify-between text-[12px] text-textMuted">
                <span>Likelihood</span>
                <span>{item.meta?.likelihood}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-textMuted">
                <span>Impact</span>
                <span>{item.meta?.impact}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-textMuted">
                <span>Owner</span>
                <span>{item.meta?.owner}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Insights({ highlightRiskId }){
  const {
    incidents,
    risks,
    systems,
    updateRiskStatus,
    refreshRisks,
  } = useApi() || {}
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState("")
  const systemLookup = useMemo(()=>{
    const map = new Map()
    systems?.forEach(sys=>map.set(sys.id, sys.name))
    return map
  },[systems])

  const cards = useMemo(()=>{
    const incidentCards = (incidents || []).slice(0,3).map(incident=>({
      id: incident.id,
      type: "incident",
      title: systemLookup.get(incident.system_id) || "Incident",
      headline: `${incident.severity} impact`,
      description: incident.cause || "Cause under investigation.",
      meta: incident,
      badge: "Live",
      buttonText: "View incident",
    }))
    const riskCards = (risks || []).slice(0,3).map(risk=>({
      id: risk.id,
      type: "risk",
      title: risk.title,
      headline: `Risk score ${risk.score}`,
      description: `Owner: ${risk.owner}`,
      meta: risk,
      badge: risk.status === "open" ? "Open" : risk.status,
      buttonText: "Mark mitigated",
    }))
    return [...incidentCards, ...riskCards].slice(0,6)
  },[incidents, risks, systemLookup])

  const handleAction = async (card)=>{
    if(card.type === "incident"){
      setSelected(card)
      return
    }
    try{
      await updateRiskStatus?.(card.id, { status: "mitigated" })
      setMessage("Risk marked as mitigated.")
      refreshRisks?.()
    }catch(err){
      console.error(err)
      setMessage("Unable to update risk right now.")
    }
  }

  useEffect(()=>{
    if(!message) return
    const timer = setTimeout(()=>setMessage(""), 3000)
    return ()=>clearTimeout(timer)
  },[message])

  return (
    <>
      <div className="card relative h-auto overflow-x-auto p-3 lg:h-[240px]">
        {message && (
          <div
            className="absolute right-3 top-3 rounded-full border px-3 py-1 text-[11px] text-textPrimary"
            style={{ borderColor: "var(--color-accent-strong)", backgroundColor: "var(--color-accent-soft)" }}
          >
            {message}
          </div>
        )}
        <div className="flex h-full gap-3">
          {cards.map(card=>(
            <div key={`${card.type}-${card.id}`} className={`min-w-[280px] h-full overflow-hidden rounded-xl border border-border bg-surface text-textPrimary transition-transform duration-300 ${highlightRiskId && card.id===highlightRiskId ? "ring-2 ring-accent" : ""}`}>
              <div className="relative h-[140px]">
                <img src="/matters/BCM.png" className="absolute inset-0 w-full h-full object-cover" alt="Matters backdrop"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                {card.badge && (
                  <span className={`absolute right-2 top-2 badge ${card.type==="risk" ? "bg-amber-500 text-black" : "bg-blue-600 text-white"}`}>
                    {card.badge}
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-sm uppercase tracking-wide text-white/80">{card.title}</div>
                  <div className="text-xl font-extrabold text-white leading-tight">{card.headline}</div>
                  <div className="mt-1 text-[10px] text-white/70">{formatDate(card.type === "incident" ? card.meta?.started_at : card.meta?.updated_at)}</div>
                </div>
              </div>
              <div className="p-3">
                <p className="h-[40px] overflow-hidden text-[12px] text-textMuted">{card.description}</p>
                <button
                  onClick={()=>handleAction(card)}
                  className={`mt-2 rounded-lg px-3 py-1 text-sm transition ${
                    card.type==="risk" ? "bg-accent text-textPrimary hover:brightness-110" : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {card.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DetailModal item={selected} onClose={()=>setSelected(null)}/>
    </>
  )
}
