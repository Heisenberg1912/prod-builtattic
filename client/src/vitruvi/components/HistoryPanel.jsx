import React from "react";

const HistoryPanel = (props) => {
  const { Icon, Section, history, onSelect, onClear, truncate, expanded = false } = props;

  return (
    <aside className={`w-full bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 ${expanded ? "pb-5" : ""}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Section title="Prompt History" right={<Icon.History />} />
        {history.length > 0 && (
          <button onClick={onClear} className="text-[11px] text-red-600 hover:text-red-700 underline">
            Clear
          </button>
        )}
      </div>
      {history.length === 0 && <div className="text-xs text-neutral-500">No prompts yet.</div>}
      {history.length > 0 && (
        expanded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((entry) => (
              <button
                key={entry.id}
                className="text-left text-xs p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 bg-white"
                onClick={() => onSelect(entry)}
                title={new Date(entry.ts).toLocaleString()}
              >
                {truncate(entry.text, 200)}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {history.map((entry) => (
              <button
                key={entry.id}
                className="min-w-[220px] text-left text-xs p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 bg-white"
                onClick={() => onSelect(entry)}
                title={new Date(entry.ts).toLocaleString()}
              >
                {truncate(entry.text, 160)}
              </button>
            ))}
          </div>
        )
      )}
    </aside>
  );
};

export default HistoryPanel;
