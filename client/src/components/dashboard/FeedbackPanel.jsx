import React from "react";
import { AiFillStar } from "react-icons/ai";

const StarRow = ({ score }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <AiFillStar
        key={index}
        className={`h-4 w-4 ${Number.isFinite(score) && index < Math.round(score ?? 0) ? 'text-amber-500' : 'text-slate-300'}`}
      />
    ))}
  </div>
);

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const FeedbackPanel = ({
  sectionLabel = 'Marketplace',
  title = 'Feedback & ratings',
  subtitle = 'See how buyers are responding to your listing.',
  feedback = {},
  highlightVariant = 'dark',
  emptyMessage = 'No written reviews yet.',
  action = null,
  statusMessage = null,
  loading = false,
}) => {
  const average = Number.isFinite(feedback?.average) ? Number(feedback.average).toFixed(1) : '--';
  const count = Number(feedback?.count) || 0;
  const reviewLabel = count === 1 ? '1 review' : `${count} reviews`;
  const recent = Array.isArray(feedback?.recent) ? feedback.recent.slice(0, 4) : [];
  const highlightDark = highlightVariant !== 'light';
  const highlightWrapper = highlightDark
    ? 'rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 p-5'
    : 'rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm p-5';
  const highlightLabel = highlightDark
    ? 'text-xs uppercase tracking-[0.35em] text-white/60'
    : 'text-xs uppercase tracking-[0.35em] text-slate-500';
  const highlightBody = highlightDark ? 'text-sm text-white/80' : 'text-sm text-slate-600';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{sectionLabel}</p>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {reviewLabel}
          </span>
          {action}
        </div>
      </div>
      {statusMessage ? <p className="text-xs text-rose-600">{statusMessage}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <div className={`${highlightWrapper} animate-pulse`}>
              <div className="h-3 w-32 rounded-full bg-white/40" />
              <div className="mt-4 h-10 w-24 rounded-full bg-white/40" />
              <div className="mt-4 h-3 w-40 rounded-full bg-white/30" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-2xl border border-slate-200 bg-slate-100/80 animate-pulse"
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={highlightWrapper}>
              <p className={highlightLabel}>Overall rating</p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-4xl font-semibold">{average}</p>
                <div className="pb-1">
                  <StarRow score={feedback?.average} />
                  <p className={highlightBody}>{count > 0 ? reviewLabel : 'Awaiting first review'}</p>
                </div>
              </div>
              <p className={`${highlightBody} mt-3`}>
                Keep delighting buyers—fresh reviews surface your profile higher across Builtattic.
              </p>
            </div>
            <div className="space-y-3">
              {recent.length ? (
                recent.map((entry) => (
                  <div
                    key={entry.id || entry.updatedAt || entry.comment}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StarRow score={entry.score} />
                      <span className="text-xs text-slate-400">{formatDate(entry.updatedAt)}</span>
                    </div>
                    <p className="mt-2 text-slate-700">{entry.comment || 'No comment provided.'}</p>
                    <p className="mt-2 text-xs text-slate-500">- {entry.author || 'Marketplace buyer'}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  {emptyMessage}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeedbackPanel;
