"use client";

import type { SuggestedAction } from "@/lib/types";

const typeClass: Record<SuggestedAction["type"], string> = {
  capacity: "action-card__tag--capacity",
  returns: "action-card__tag--returns",
  staffing: "action-card__tag--staffing",
  ops: "action-card__tag--ops",
};

const urgencyLabel: Record<SuggestedAction["urgency"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function SuggestedActionsPanel({
  actions,
  onReview,
}: {
  actions: SuggestedAction[];
  onReview: (storeId: string) => void;
}) {
  return (
    <div className="actions-panel">
      <div className="actions-panel__header">
        <h2>Suggested actions</h2>
        <span>{actions.length} insights</span>
      </div>
      <div className="actions-panel__list">
        {actions.map((action, index) => (
          <div key={action.id} className="action-card" style={{ animationDelay: `${index * 80}ms` }}>
            <div className={`action-card__tag ${typeClass[action.type]}`}>{action.type}</div>
            <h3 className="action-card__title">{action.title}</h3>
            <p className="action-card__detail">{action.detail}</p>
            <div className="action-card__meta">
              <span>Urgency: {urgencyLabel[action.urgency]}</span>
              <button onClick={() => onReview(action.storeId)}>Review</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
