"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { SuggestedAction } from "@/lib/types";
import CustomizeActionModal from "@/components/CustomizeActionModal";

type ActionCardProps = {
  action: SuggestedAction;
  onApprove: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
  onCustomize: (actionId: string) => void;
  onReview: (actionId: string) => void;
  index: number;
};

const urgencyConfig = {
  critical: {
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.1)",
    border: "rgba(248, 113, 113, 0.3)",
    icon: "🔴",
  },
  important: {
    color: "#facc15",
    bg: "rgba(250, 204, 21, 0.1)",
    border: "rgba(250, 204, 21, 0.3)",
    icon: "🟡",
  },
  routine: {
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.1)",
    border: "rgba(52, 211, 153, 0.3)",
    icon: "🟢",
  },
};

export default function ActionCard({
  action,
  onApprove,
  onDismiss,
  onCustomize,
  onReview,
  index,
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const urgency = action.impact?.timeSensitivity.urgency || "routine";
  const config = urgencyConfig[urgency];

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(action.id);
    setIsProcessing(false);
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    await onDismiss(action.id);
    setIsProcessing(false);
  };

  const handleCustomizeSave = (customizedAction: SuggestedAction) => {
    // TODO: Update action with customizations
    console.log('Customized action:', customizedAction);
    onApprove(customizedAction.id);
  };

  return (
    <motion.div
      className="action-card-enhanced"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      style={{
        borderColor: config.border,
      }}
    >
      {/* Header */}
      <div className="action-card-enhanced__header">
        <div className="action-card-enhanced__header-left">
          <span className="urgency-badge" style={{ backgroundColor: config.bg, color: config.color }}>
            {config.icon} {urgency.toUpperCase()}
          </span>
          <span className="type-badge">{action.type}</span>
          {action.aiConfidence && (
            <span className="confidence-badge">
              AI: {action.aiConfidence}%
            </span>
          )}
        </div>
        <div className="action-card-enhanced__header-right">
          <span className="store-id">{action.storeId}</span>
        </div>
      </div>

      {/* Title and Description */}
      <div className="action-card-enhanced__content">
        <h3 className="action-card-enhanced__title">{action.title}</h3>
        <p className="action-card-enhanced__detail">{action.detail}</p>

        {/* Impact Metrics */}
        {action.impact && (
          <div className="impact-metrics">
            <div className="impact-metric">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="impact-metric__label">
                {action.impact.financial.type === "savings" ? "Saves" : "Impact"}:
              </span>
              <span className="impact-metric__value" style={{ color: action.impact.financial.type === "revenue" || action.impact.financial.type === "savings" ? "#34d399" : "#f87171" }}>
                ${(action.impact.financial.amount / 1000).toFixed(1)}K
              </span>
            </div>

            <div className="impact-metric">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span className="impact-metric__label">Capacity:</span>
              <span className="impact-metric__value" style={{ color: action.impact.operational.capacityChange < 0 ? "#34d399" : "#facc15" }}>
                {action.impact.operational.capacityChange > 0 ? "+" : ""}
                {action.impact.operational.capacityChange}%
              </span>
            </div>

            {action.impact.operational.unitsAffected > 0 && (
              <div className="impact-metric">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span className="impact-metric__label">Units:</span>
                <span className="impact-metric__value">{action.impact.operational.unitsAffected}</span>
              </div>
            )}

            {action.impact.timeSensitivity.hoursToCritical && (
              <div className="impact-metric impact-metric--warning">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="impact-metric__label">Critical in:</span>
                <span className="impact-metric__value">{action.impact.timeSensitivity.hoursToCritical}h</span>
              </div>
            )}
          </div>
        )}

        {/* Orders/Returns Summary */}
        {(action.orders || action.returns) && (
          <div className="action-summary">
            {action.orders && action.orders.length > 0 && (
              <div className="summary-item">
                <span className="summary-label">📦 Orders:</span>
                <span className="summary-value">
                  {action.orders.reduce((sum, o) => sum + o.skuCount, 0)} SKUs
                </span>
              </div>
            )}
            {action.returns && action.returns.length > 0 && (
              <div className="summary-item">
                <span className="summary-label">🔄 Returns:</span>
                <span className="summary-value">
                  {action.returns.reduce((sum, r) => sum + r.skuCount, 0)} SKUs
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="action-card-enhanced__actions">
        <button
          className="action-btn action-btn--approve"
          onClick={handleApprove}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </button>
        <button
          className="action-btn action-btn--customize"
          onClick={() => setShowCustomizeModal(true)}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Customize
        </button>
        <button
          className="action-btn action-btn--store"
          onClick={() => onReview(action.id)}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Go to Store
        </button>
        <button
          className="action-btn action-btn--dismiss"
          onClick={handleDismiss}
          disabled={isProcessing}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Dismiss
        </button>
      </div>

      {/* Expand for details */}
      {(action.orders || action.returns) && (
        <button
          className="action-card-enhanced__expand"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show Details"}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          className="action-card-enhanced__details"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          {action.orders && action.orders.length > 0 && (
            <div className="details-section">
              <h4>Order Details</h4>
              {action.orders.map((order) => (
                <div key={order.id} className="detail-item">
                  <div className="detail-item__row">
                    <span>SKUs: {order.skuCount}</span>
                    <span>Units: {order.totalUnits}</span>
                    <span>Cost: ${order.estimatedCost.toLocaleString()}</span>
                  </div>
                  {order.vendor && <div className="detail-item__meta">Vendor: {order.vendor}</div>}
                  {order.estimatedDelivery && (
                    <div className="detail-item__meta">Delivery: {order.estimatedDelivery}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {action.returns && action.returns.length > 0 && (
            <div className="details-section">
              <h4>Return Details</h4>
              {action.returns.map((ret) => (
                <div key={ret.id} className="detail-item">
                  <div className="detail-item__row">
                    <span>SKUs: {ret.skuCount}</span>
                    <span>Units: {ret.totalUnits}</span>
                    <span>Frees: {ret.capacityFreed}% capacity</span>
                  </div>
                  {ret.processingTime && (
                    <div className="detail-item__meta">Processing time: {ret.processingTime}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Customize Modal */}
      <CustomizeActionModal
        action={action}
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onSave={handleCustomizeSave}
      />
    </motion.div>
  );
}
