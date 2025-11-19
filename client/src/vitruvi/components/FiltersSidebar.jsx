import React from "react";

import { FILTER_ORDER, FILTER_SETS } from "../../constants/designFilters.js";

const FiltersSidebar = ({
  Icon,
  Section,
  Collapsible,
  selected,
  loading,
  error,
  onToggle,
  onClear,
  onApply,
  onOpenModal,
}) => (
  <aside className="order-2 xl:order-1 w-full xl:w-[300px] bg-white/70 backdrop-blur border border-neutral-200 xl:border-r xl:border-l-0 rounded-2xl xl:rounded-none shadow-sm xl:shadow-none xl:min-h-[calc(100vh-56px)] xl:sticky xl:top-14 flex flex-col">
    <div className="p-4 flex-1 overflow-visible xl:overflow-y-auto">
      {loading && <div className="hidden xl:block p-2 mb-2 text-sm bg-yellow-50 border border-yellow-200 rounded">Processing…</div>}
      {error && (
        <div className="hidden xl:block p-2 mb-2 text-sm bg-red-50 border border-red-200 rounded">
          {String(error)}
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center gap-2 rounded-xl border bg-neutral-50 px-3 py-2 focus-within:ring-2 focus-within:ring-neutral-300">
          <Icon.Search />
          <input className="bg-transparent outline-none w-full text-sm" placeholder="Search filters" />
        </div>
      </div>

      <Section title="Filters" right={<span className="text-[10px] text-neutral-500">(Collapsible)</span>} />

      <div className="space-y-2">
        {FILTER_ORDER.map((section) => (
          <Collapsible key={section} title={section} defaultOpen={section === "Category" || section === "Typology"}>
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
          </Collapsible>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 text-sm border border-neutral-300 rounded-xl px-3 py-2 hover:bg-neutral-100"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 text-sm rounded-xl px-3 py-2 bg-neutral-900 text-white hover:bg-neutral-800"
        >
          Apply Filters
        </button>
      </div>
    </div>

    <div className="mt-6 xl:mt-auto border-t border-neutral-200 p-4 space-y-2">
      <button
        onClick={() => onOpenModal("profile")}
        className="w-full text-sm flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100"
      >
        <Icon.User /> Profile
      </button>
      <button
        onClick={() => onOpenModal("settings")}
        className="w-full text-sm flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100"
      >
        <Icon.Cog /> Settings
      </button>
      <button
        onClick={() => onOpenModal("help")}
        className="w-full text-sm flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100"
      >
        <Icon.Help /> Help
      </button>
    </div>
  </aside>
);

export default FiltersSidebar;
