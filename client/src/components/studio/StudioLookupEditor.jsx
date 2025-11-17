import React, { useEffect, useMemo, useState } from "react";
import { DEFAULT_STUDIO_LOOKUP, normalizeLookupConfig, serializeLookupDraft } from "../../utils/studioLookup.js";

const MAX_REASONS = 3;
const emptyReason = { title: "", detail: "" };

const parseTags = (value = "") =>
  String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

const buildDraft = (config) => {
  const normalized = normalizeLookupConfig(config);
  const paddedReasons = [...normalized.reasons];
  while (paddedReasons.length < MAX_REASONS) paddedReasons.push({ ...emptyReason });
  return {
    headline: normalized.headline,
    description: normalized.description,
    helper: normalized.helper,
    tagsText: normalized.tags.join(", "),
    reasons: paddedReasons.slice(0, MAX_REASONS),
  };
};

export default function StudioLookupEditor({ config, saving, error, onSave }) {
  const [draft, setDraft] = useState(() => buildDraft(config || DEFAULT_STUDIO_LOOKUP));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(buildDraft(config || DEFAULT_STUDIO_LOOKUP));
    setDirty(false);
  }, [config]);

  const handleChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleReasonChange = (index, field, value) => {
    setDraft((prev) => {
      const updated = [...prev.reasons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, reasons: updated };
    });
    setDirty(true);
  };

  const reasonHelpers = useMemo(
    () => [
      'Share why links expire or listings change frequently.',
      'Explain any access controls, such as private catalogues.',
      'Guide the user to double-check URLs or contact support.',
    ],
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = serializeLookupDraft({
      headline: draft.headline,
      description: draft.description,
      helper: draft.helper,
      tags: parseTags(draft.tagsText),
      reasons: draft.reasons,
    });
    await onSave?.(payload);
    setDirty(false);
  };

  const handleReset = () => {
    setDraft(buildDraft(DEFAULT_STUDIO_LOOKUP));
    setDirty(true);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Headline</label>
        <input
          type="text"
          maxLength={120}
          value={draft.headline}
          onChange={(event) => handleChange('headline', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          placeholder="Studio not found."
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Description</label>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(event) => handleChange('description', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          placeholder="Explain what to do when a studio link fails."
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Helper text</label>
        <textarea
          rows={2}
          value={draft.helper}
          onChange={(event) => handleChange('helper', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          placeholder="Need personalised help?..."
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Suggested tags</label>
        <input
          type="text"
          value={draft.tagsText}
          onChange={(event) => handleChange('tagsText', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          placeholder="Residential kits, Design-build partners, Plan catalogues"
        />
        <p className="mt-1 text-xs text-slate-500">Comma separated. Shown as quick filters beneath the CTAs.</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Reasons</p>
        <div className="mt-3 space-y-4">
          {draft.reasons.map((reason, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Reason {index + 1}</p>
                <p className="text-xs text-slate-400">{reasonHelpers[index]}</p>
              </div>
              <input
                type="text"
                value={reason.title}
                onChange={(event) => handleReasonChange(index, 'title', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                placeholder="The link is stale"
              />
              <textarea
                rows={2}
                value={reason.detail}
                onChange={(event) => handleReasonChange(index, 'detail', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                placeholder="Studios evolve quickly..."
              />
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          disabled={saving}
        >
          Reset to defaults
        </button>
        <button
          type="submit"
          disabled={saving || !dirty}
          className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save lookup copy'}
        </button>
        {!dirty && !saving ? (
          <span className="text-xs text-slate-500">All changes saved.</span>
        ) : null}
      </div>
    </form>
  );
}
