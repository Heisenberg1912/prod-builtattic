import React, { memo } from "react";

import Card from "./Card.jsx";

const UsagePanel = () => (
  <Card className="mb-4 p-4 space-y-2">
    <div className="text-xs uppercase tracking-wide text-neutral-500">Access</div>
    <div className="text-lg font-semibold text-neutral-900">VitruviAI is now free</div>
    <p className="text-sm text-neutral-600">
      Billing, usage tracking, and credit limits have been removed. Enjoy unlimited prompts and tokens without needing to upgrade.
    </p>
  </Card>
);

export default memo(UsagePanel);
