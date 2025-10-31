import { Fragment, useMemo } from "react";
import { CircleDot, Hammer, Layers, Ruler, Sofa, Sparkles } from "lucide-react";
import { useApi } from "../lib/ctx";

const STAGES = [
  { key: "excavation", label: "Excavation", metricKey: "rto", Icon: Hammer },
  { key: "foundation", label: "Foundation", metricKey: "rpo", Icon: Ruler },
  { key: "structure", label: "Structure", metricKey: "uptime", Icon: Layers },
  { key: "interiors", label: "Interiors", metricKey: "mttr", Icon: Sofa },
  { key: "finishing", label: "Finishing", metricKey: "incidents", Icon: CircleDot },
];

export const computeStageScore = (kpis = {}, incidents = []) => {
  const mttr = kpis?.avg_mttr_min ?? 0;
  const incidentScore = Math.max(0, 100 - (incidents?.length || 0) * 12);
  return {
    rto: Math.round(kpis?.rto_ok_pct ?? 0),
    rpo: Math.round(kpis?.rpo_ok_pct ?? 0),
    uptime: Math.round(kpis?.uptime_pct ?? 0),
    mttr: Math.max(0, Math.min(100, Math.round(100 - Math.min(mttr, 90)))),
    incidents: incidentScore,
  };
};

const StageBadge = ({ label, Icon, score }) => {
  const safeScore = Math.max(0, Math.round(score ?? 0));
  return (
    <div className="flex min-w-[72px] flex-col items-center gap-2">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-surface-soft text-textPrimary shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-textMuted">{label}</span>
      <span className="text-sm font-semibold text-textPrimary">{safeScore}%</span>
    </div>
  );
};

export default function Milestones() {
  const { kpis, incidents } = useApi() || {};
  const stageScores = useMemo(() => computeStageScore(kpis, incidents), [kpis, incidents]);
  const values = Object.values(stageScores);
  const overall = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const clampedOverall = Math.min(100, Math.max(0, overall));

  return (
    <section className="card space-y-6 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-textMuted">
            <Sparkles className="h-4 w-4" /> Project milestones
          </p>
          <h2 className="text-lg font-semibold text-textPrimary">Execution snapshot</h2>
        </div>
        <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-textMuted">
          {clampedOverall}% overall
        </span>
      </header>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {STAGES.map(({ key, label, Icon, metricKey }, index) => (
            <Fragment key={key}>
              <StageBadge label={label} Icon={Icon} score={stageScores[metricKey]} />
              {index < STAGES.length - 1 && (
                <div className="hidden flex-1 items-center md:flex" aria-hidden="true">
                  <div className="h-px w-full bg-gradient-to-r from-border/70 via-border/40 to-border/70" />
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-textMuted">
          <span>Overall momentum</span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border/30">
            <div
              className="h-full rounded-full bg-textPrimary/80 transition-all"
              style={{ width: clampedOverall + "%" }}
            />
          </div>
          <span className="text-sm font-semibold text-textPrimary">{clampedOverall}%</span>
        </div>
      </div>
    </section>
  );
}
