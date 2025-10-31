import { useEffect, useMemo, useState } from "react";
import { useApi } from "../lib/ctx";

function Thumb({ label, description, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-[70px] overflow-hidden rounded-2xl border border-border transition ${
        active ? "ring-2 ring-accent" : "hover:border-accent"
      }`}
    >
      <img
        src="/matters/BCM.png"
        alt="Drill preview thumbnail"
        className="h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
      <div className="absolute bottom-1 left-1 right-1 text-left text-[10px] leading-tight text-white">
        <div className="inline-block rounded-full bg-black/60 px-1.5 py-0.5">
          {label}
        </div>
        {description && (
          <div className="mt-0.5 truncate text-gray-300">{description}</div>
        )}
      </div>
    </button>
  );
}

export default function Gallery() {
  const { drills, systems, refreshDrills } = useApi() || {};
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [drills?.length]);

  const systemLookup = useMemo(() => {
    const map = new Map();
    systems?.forEach((sys) => map.set(sys.id, sys.name));
    return map;
  }, [systems]);

  const items = useMemo(() => {
    if (Array.isArray(drills) && drills.length) {
      return drills.map((drill) => ({
        id: drill.id,
        title: drill.name,
        system: systemLookup.get(drill.system_id) || "System",
        scheduled: drill.scheduled_at ? new Date(drill.scheduled_at) : null,
        outcome: drill.outcome,
      }));
    }
    return [
      {
        id: "placeholder",
        title: "Schedule a readiness drill",
        system: "Select a system from the sidebar to fetch drills.",
        scheduled: null,
        outcome: "pending",
      },
    ];
  }, [drills, systemLookup]);

  const active = items[Math.min(index, items.length - 1)];
  const formattedDate = active?.scheduled
    ? active.scheduled.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not scheduled";
  const formattedTime = active?.scheduled
    ? active.scheduled.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % items.length);
    refreshDrills?.();
  };

  return (
    <div className="card h-auto overflow-hidden p-0 lg:h-[340px]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[2fr,1fr]">
        <div className="relative overflow-hidden">
          <img
            src="/matters/BCM.png"
            alt="Operational drill hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute left-5 top-5 text-xl font-bold text-white">
            Drill Gallery
          </div>
          <div className="absolute left-5 bottom-6 space-y-1 text-white">
            <div className="text-sm uppercase tracking-wide text-gray-300">
              {active?.system}
            </div>
            <div className="text-2xl font-extrabold">{active?.title}</div>
            <div className="text-xs text-gray-300">
              {formattedDate}
              {formattedTime ? ` | ${formattedTime}` : ""}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-emerald-300">
              Outcome: {active?.outcome || "Pending"}
            </div>
          </div>
          <div className="absolute left-[calc(100%-1px)] top-0 bottom-0 hidden w-px bg-white/40 lg:block" />
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-gray-300 bg-white/90 text-lg font-bold text-gray-900 hover:bg-white"
            title="Next drill"
          >
            &gt;
          </button>
        </div>
        <div className="grid max-h-[340px] grid-cols-2 gap-3 overflow-y-auto bg-surfaceSoft p-3 sm:grid-cols-3 lg:max-h-none">
          {items.map((item, i) => (
            <Thumb
              key={item.id || i}
              label={item.title}
              description={item.system}
              active={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

