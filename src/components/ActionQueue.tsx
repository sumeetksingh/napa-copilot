"use client";

import { useMemo } from "react";
import ActionCard from "@/components/ActionCard";
import type { SuggestedAction } from "@/lib/types";

type ActionQueueProps = {
  actions: SuggestedAction[];
  onApprove: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
  onCustomize: (actionId: string) => void;
  onReview: (actionId: string) => void;
};

export default function ActionQueue({
  actions,
  onApprove,
  onDismiss,
  onCustomize,
  onReview,
}: ActionQueueProps) {
  const groupedActions = useMemo(() => {
    const critical: SuggestedAction[] = [];
    const important: SuggestedAction[] = [];
    const routine: SuggestedAction[] = [];

    actions.forEach((action) => {
      const urgency = action.impact?.timeSensitivity.urgency || "routine";
      if (urgency === "critical") critical.push(action);
      else if (urgency === "important") important.push(action);
      else routine.push(action);
    });

    return { critical, important, routine };
  }, [actions]);

  return (
    <div className="action-queue">
      {/* Critical Actions */}
      {groupedActions.critical.length > 0 && (
        <div className="action-queue__section">
          <div className="action-queue__section-header">
            <h2 className="action-queue__section-title">
              🔴 CRITICAL ACTIONS
              <span className="action-queue__count">({groupedActions.critical.length})</span>
            </h2>
            <p className="action-queue__section-subtitle">
              Immediate attention required - Revenue or capacity at risk
            </p>
          </div>
          <div className="action-queue__list">
            {groupedActions.critical.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={onApprove}
                onDismiss={onDismiss}
                onCustomize={onCustomize}
                onReview={onReview}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Important Actions */}
      {groupedActions.important.length > 0 && (
        <div className="action-queue__section">
          <div className="action-queue__section-header">
            <h2 className="action-queue__section-title">
              🟡 IMPORTANT ACTIONS
              <span className="action-queue__count">({groupedActions.important.length})</span>
            </h2>
            <p className="action-queue__section-subtitle">
              High impact optimizations - 24-48 hour window
            </p>
          </div>
          <div className="action-queue__list">
            {groupedActions.important.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={onApprove}
                onDismiss={onDismiss}
                onCustomize={onCustomize}
                onReview={onReview}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Routine Actions */}
      {groupedActions.routine.length > 0 && (
        <div className="action-queue__section">
          <div className="action-queue__section-header">
            <h2 className="action-queue__section-title">
              🟢 ROUTINE OPTIMIZATIONS
              <span className="action-queue__count">({groupedActions.routine.length})</span>
            </h2>
            <p className="action-queue__section-subtitle">
              Continuous improvements and maintenance
            </p>
          </div>
          <div className="action-queue__list">
            {groupedActions.routine.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={onApprove}
                onDismiss={onDismiss}
                onCustomize={onCustomize}
                onReview={onReview}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {actions.length === 0 && (
        <div className="action-queue__empty">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3>All Clear!</h3>
          <p>No pending actions at this time. Your network is running smoothly.</p>
        </div>
      )}
    </div>
  );
}
