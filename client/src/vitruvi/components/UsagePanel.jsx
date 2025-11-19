import React, { memo } from "react";

import Card from "./Card.jsx";

const UsageBar = ({ label, used = 0, total = 0, remainingLabel }) => {
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
        <span>{label}</span>
        <span>
          {used}/{total || 0} {remainingLabel ? `· ${remainingLabel}` : ""}
        </span>
      </div>
      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-neutral-900 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const UsagePanel = ({
  usage,
  usageLoading,
  usageError,
  usagePlanLabel,
  usageResetLabel,
  usageStats,
  onUpgrade,
  onRefresh,
}) => (
  <Card className="mb-4 p-4 space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Usage & Billing</div>
        <div className="text-lg font-semibold text-neutral-900">{usagePlanLabel}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onUpgrade}
          className="text-xs px-4 py-2 rounded-full border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"
        >
          Upgrade
        </button>
        <button
          onClick={onRefresh}
          className="text-xs px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
        >
          Refresh
        </button>
      </div>
    </div>

    {usageError ? (
      <div className="text-sm text-red-600">{usageError}</div>
    ) : usageLoading ? (
      <div className="text-sm text-neutral-500">Loading usage.</div>
    ) : usage ? (
      <>
        <UsageBar
          label="Prompts"
          used={usage.promptsUsed || 0}
          total={usage.promptAllowance || 0}
          remainingLabel={`${usageStats?.promptsRemaining || 0} left`}
        />
        <UsageBar
          label="Tokens"
          used={usage.tokensUsed || 0}
          total={usage.tokenAllowance || 0}
          remainingLabel={`${usageStats?.tokensRemaining || 0} tokens left`}
        />
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span>{usageResetLabel}</span>
          {usage.blocked && <span className="text-red-600 font-semibold">Limit reached</span>}
          <span>
            Lifetime prompts: {usage.lifetimePrompts?.toLocaleString?.() || usage.lifetimePrompts || 0} | Tokens:{" "}
            {usage.lifetimeTokens?.toLocaleString?.() || usage.lifetimeTokens || 0}
          </span>
        </div>
      </>
    ) : null}
  </Card>
);

export default memo(UsagePanel);
