import React from "react";
import { Star, X } from "lucide-react";

const STARS = [1, 2, 3, 4, 5];

const RatingModal = ({
  open,
  targetLabel,
  score,
  comment,
  onScoreChange,
  onCommentChange,
  onClose,
  onSubmit,
  saving,
  snapshot,
}) => {
  if (!open) return null;

  const distribution = snapshot?.distribution || [];
  const total = snapshot?.count || 0;
  const averageLabel = snapshot?.average != null ? snapshot.average.toFixed(1) : "--";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Rate</p>
            <h3 className="text-xl font-semibold text-slate-900">{targetLabel}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-900"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Your rating</p>
            <div className="flex items-center gap-2">
              {STARS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onScoreChange(value)}
                  className="rounded-full p-1"
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star
                    size={28}
                    className={value <= score ? "text-amber-400 fill-amber-300" : "text-slate-300"}
                  />
                </button>
              ))}
              <span className="text-sm font-semibold text-slate-600">{score.toFixed(1)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="rating-comment" className="text-sm font-medium text-slate-700">
              Share context (optional)
            </label>
            <textarea
              id="rating-comment"
              rows={4}
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-900 focus:outline-none"
              placeholder="What stood out about this associate / firm?"
              maxLength={1000}
            />
            <p className="text-xs text-slate-400 text-right">{comment?.length || 0}/1000</p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-900">{averageLabel}</p>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Community score</p>
            </div>
            <p className="text-xs text-slate-500">Based on {total} rating{total === 1 ? '' : 's'} so far.</p>
            <div className="space-y-2">
              {[...distribution].sort((a, b) => b.score - a.score).map((entry) => {
                const percentage = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                return (
                  <div key={`bar-${entry.score}`} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-8 font-semibold">{entry.score}★</span>
                    <div className="flex-1 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-amber-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
          >
            {saving ? "Saving..." : "Submit rating"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;

