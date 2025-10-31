import { useMemo, useState } from "react";
import { HiOutlineChevronRight, HiOutlineSearch } from "react-icons/hi";
import { FILTER_ORDER, FILTER_SETS } from "../constants/designFilters.js";

const variantTokens = {
  light: {
    container: "bg-white border border-slate-200 text-slate-800",
    heading: "text-slate-900",
    subtle: "text-slate-500",
    divider: "border-slate-200",
    chipActive: "bg-slate-900 text-white border-slate-900",
    chipInactive:
      "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
    clearBtn: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    input:
      "bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200",
  },
  dark: {
    container: "bg-[#1d222b] border border-[#2d3340] text-gray-100",
    heading: "text-gray-100",
    subtle: "text-gray-400",
    divider: "border-[#2d3340]",
    chipActive: "bg-[#303747] text-white border-[#303747]",
    chipInactive:
      "bg-transparent border border-[#2d3340] text-gray-300 hover:bg-[#232937]",
    clearBtn: "border border-[#2d3340] text-gray-300 hover:bg-[#232937]",
    input:
      "bg-[#181c24] border border-[#2d3340] text-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#2d3340]",
  },
};

const Collapsible = ({
  title,
  children,
  defaultOpen = false,
  headerClass,
  dividerClass,
  isLast,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const containerClasses = ["py-3"];
  if (!isLast) containerClasses.push(`border-b ${dividerClass}`);
  return (
    <div className={containerClasses.join(' ')}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between text-left text-sm font-semibold ${headerClass}`}
      >
        <span>{title}</span>
        <HiOutlineChevronRight
          className={`h-4 w-4 transition-transform ${open ? "rotate-90" : "rotate-0"}`}
        />
      </button>
      <div className={`overflow-hidden transition-all ${open ? "max-h-[640px] pt-3" : "max-h-0"}`}>
        {children}
      </div>
    </div>
  );
};

export default function FiltersPanel({
  selected,
  onToggle,
  onClear,
  sections = FILTER_ORDER,
  variant = "light",
  className = "",
}) {
  const tokens = useMemo(() => variantTokens[variant] || variantTokens.light, [variant]);
  const [query, setQuery] = useState("");
  const queryLower = query.trim().toLowerCase();

  const sectionData = useMemo(() => {
    return sections
      .filter((section) => FILTER_SETS[section])
      .map((section) => {
        const options = FILTER_SETS[section];
        const filteredOptions = queryLower
          ? options.filter((option) => option.toLowerCase().includes(queryLower))
          : options;
        return { section, options: filteredOptions };
      })
      .filter(({ options }) => options.length > 0);
  }, [sections, queryLower]);

  return (
    <div className={`rounded-3xl ${tokens.container} ${className}`}>
      <div className="px-5 pt-5 flex items-start justify-between gap-3">
        <div>
          <h3 className={`text-base font-semibold ${tokens.heading}`}>Filters</h3>
          <p className={`text-xs ${tokens.subtle}`}>
            Refine the catalogue by typology, climate, features, and more.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className={`text-xs px-3 py-1 rounded-full transition ${tokens.clearBtn}`}
        >
          Clear
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="relative">
          <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search filters"
            className={`w-full rounded-2xl pl-8 pr-3 py-2 text-sm focus:outline-none transition ${tokens.input}`}
          />
        </div>
      </div>

      <div className="px-5 pb-5">
        {sectionData.length === 0 ? (
          <p className={`text-xs mt-4 ${tokens.subtle}`}>No filters match "{query}".</p>
        ) : (
          sectionData.map(({ section, options }, index) => (
            <Collapsible
              key={section}
              title={section}
              defaultOpen={index < 2}
              headerClass={tokens.heading}
              dividerClass={tokens.divider}
              isLast={index === sectionData.length - 1}
            >
              <div className="flex flex-wrap gap-2 pt-1">
                {options.map((option) => {
                  const isActive = selected?.[section]?.has(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onToggle(section, option)}
                      className={`text-xs rounded-full px-3 py-1 transition ${
                        isActive ? tokens.chipActive : tokens.chipInactive
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}
