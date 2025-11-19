import React from "react";

const HistoryPanel = ({ Icon, Section, history, onSelect, onClear, truncate }) => (
  <aside className="order-3 w-full xl:w-[320px] bg-white/70 backdrop-blur border border-neutral-200 xl:border-l xl:border-t-0 rounded-2xl xl:rounded-none shadow-sm xl:shadow-none mt-6 xl:mt-0 xl:min-h-[calc(100vh-56px)] xl:sticky xl:top-14 p-4 flex flex-col">
    <div className="flex items-center justify-between gap-2">
      <Section title="Prompt History" right={<Icon.History />} />
      {history.length > 0 && (
        <button onClick={onClear} className="text-[11px] text-red-600 hover:text-red-700 underline">
          Clear
        </button>
      )}
    </div>
    <div className="space-y-2 mt-3 flex-1 overflow-auto xl:overflow-visible pr-1">
      {history.length === 0 && <div className="text-xs text-neutral-500">No prompts yet.</div>}
      {history.map((entry) => (
        <button
          key={entry.id}
          className="w-full text-left text-xs p-3 rounded-xl border border-neutral-200 hover:bg-neutral-100"
          onClick={() => onSelect(entry)}
          title={new Date(entry.ts).toLocaleString()}
        >
          {truncate(entry.text, 160)}
        </button>
      ))}
    </div>
  </aside>
);

export default HistoryPanel;
