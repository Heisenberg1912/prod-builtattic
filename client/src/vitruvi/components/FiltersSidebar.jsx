import React, { useState } from "react";

import { FILTER_ORDER, FILTER_SETS } from "../../constants/designFilters.js";

const FiltersSidebar = (props) => {
  const { Icon, selected, loading, error, onToggle, onClear, onOpenModal } = props;

  const [openMap, setOpenMap] = useState(() =>
    Object.fromEntries(FILTER_ORDER.map((section) => [section, false]))
  );

  const handleToggleSection = (section) => {
    setOpenMap((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const expandAllSections = () => {
    setOpenMap(Object.fromEntries(FILTER_ORDER.map((section) => [section, true])));
  };

  return (
    <aside className="w-full bg-white border border-neutral-200 rounded-2xl shadow-sm">
      <div className="p-4 space-y-3">
        {loading && <div className="text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-2">Processing.</div>}
        {error && (
          <div className="text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            {String(error)}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">VitruviAI</h3>
          <button
            type="button"
            onClick={onClear}
            className="text-sm border border-neutral-200 rounded-full px-3 py-1.5 hover:bg-neutral-50"
          >
            Clear filters
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-neutral-50 px-3 py-2 focus-within:ring-2 focus-within:ring-neutral-200">
          <Icon.Search />
          <input className="bg-transparent outline-none w-full text-sm" placeholder="Search filters" />
        </div>

        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500">
          <span>Filters</span>
          <div className="flex items-center gap-3">
            <span>(collapsible)</span>
            <button
              type="button"
              onClick={expandAllSections}
              className="text-[11px] text-neutral-600 hover:text-neutral-800 underline underline-offset-2"
            >
              Expand all
            </button>
          </div>
        </div>

        <div className="pb-2">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {FILTER_ORDER.map((section) => {
              const open = !!openMap[section];
              return (
                <div key={section} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 space-y-2 transition-shadow hover:shadow-sm">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-neutral-700 uppercase tracking-wide"
                    onClick={() => handleToggleSection(section)}
                    aria-expanded={open}
                    aria-controls={`filter-panel-${section}`}
                  >
                    <span>{section}</span>
                    <Icon.Chevron open={open} />
                  </button>
                  <div
                    id={`filter-panel-${section}`}
                    className={`overflow-hidden transition-all duration-300 ease-out ${open ? "max-h-[480px] pt-2" : "max-h-0"}`}
                  >
                    <div className="flex flex-wrap gap-2">
                      {FILTER_SETS[section].map((opt) => {
                        const active = selected?.[section]?.has(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => onToggle(section, opt)}
                            className={`text-xs border rounded-full px-3 py-1 transition ${
                              active ? "bg-neutral-900 text-white border-neutral-900" : "bg-white hover:bg-neutral-100 border-neutral-300"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FiltersSidebar;
