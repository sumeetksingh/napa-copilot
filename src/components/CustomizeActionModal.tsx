"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SuggestedAction } from "@/lib/types";

type CustomizeActionModalProps = {
  action: SuggestedAction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customizedAction: SuggestedAction) => void;
};

export default function CustomizeActionModal({
  action,
  isOpen,
  onClose,
  onSave,
}: CustomizeActionModalProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(
    new Set(action.orders?.map((o) => o.id) || [])
  );
  const [selectedReturns, setSelectedReturns] = useState<Set<string>>(
    new Set(action.returns?.map((r) => r.id) || [])
  );

  const handleSave = () => {
    const customizedAction: SuggestedAction = {
      ...action,
      orders: action.orders?.filter((o) => selectedOrders.has(o.id)),
      returns: action.returns?.filter((r) => selectedReturns.has(r.id)),
    };
    onSave(customizedAction);
    onClose();
  };

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleReturn = (returnId: string) => {
    setSelectedReturns((prev) => {
      const next = new Set(prev);
      if (next.has(returnId)) {
        next.delete(returnId);
      } else {
        next.add(returnId);
      }
      return next;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="customize-modal"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="customize-modal__header">
              <div>
                <h2 className="customize-modal__title">Customize Action</h2>
                <p className="customize-modal__subtitle">{action.title}</p>
              </div>
              <button className="customize-modal__close" onClick={onClose}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="customize-modal__body">
              {/* Store Info */}
              <div className="customize-section">
                <div className="customize-section__header">
                  <h3>Store Information</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Store ID:</span>
                    <span className="info-value">{action.storeId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{action.type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">AI Confidence:</span>
                    <span className="info-value">{action.aiConfidence}%</span>
                  </div>
                </div>
              </div>

              {/* Orders */}
              {action.orders && action.orders.length > 0 && (
                <div className="customize-section">
                  <div className="customize-section__header">
                    <h3>Orders to Place</h3>
                    <span className="selection-count">
                      {selectedOrders.size}/{action.orders.length} selected
                    </span>
                  </div>
                  <div className="item-list">
                    {action.orders.map((order) => (
                      <label key={order.id} className="customize-item">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleOrder(order.id)}
                        />
                        <div className="customize-item__content">
                          <div className="customize-item__header">
                            <span className="sku-count">{order.skuCount} SKUs</span>
                            <span className="units">{order.totalUnits} units</span>
                            <span className="cost">${order.estimatedCost.toLocaleString()}</span>
                          </div>
                          {order.vendor && (
                            <div className="customize-item__meta">Vendor: {order.vendor}</div>
                          )}
                          {order.estimatedDelivery && (
                            <div className="customize-item__meta">Delivery: {order.estimatedDelivery}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Returns */}
              {action.returns && action.returns.length > 0 && (
                <div className="customize-section">
                  <div className="customize-section__header">
                    <h3>Returns to Process</h3>
                    <span className="selection-count">
                      {selectedReturns.size}/{action.returns.length} selected
                    </span>
                  </div>
                  <div className="item-list">
                    {action.returns.map((ret) => (
                      <label key={ret.id} className="customize-item">
                        <input
                          type="checkbox"
                          checked={selectedReturns.has(ret.id)}
                          onChange={() => toggleReturn(ret.id)}
                        />
                        <div className="customize-item__content">
                          <div className="customize-item__header">
                            <span className="sku-count">{ret.skuCount} SKUs</span>
                            <span className="units">{ret.totalUnits} units</span>
                            <span className="capacity-freed">Frees {ret.capacityFreed}% capacity</span>
                          </div>
                          {ret.processingTime && (
                            <div className="customize-item__meta">Processing: {ret.processingTime}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact Summary */}
              {action.impact && (
                <div className="customize-section">
                  <div className="customize-section__header">
                    <h3>Expected Impact</h3>
                  </div>
                  <div className="impact-summary">
                    <div className="impact-item">
                      <span className="impact-label">Financial Impact:</span>
                      <span className="impact-value">
                        ${(action.impact.financial.amount / 1000).toFixed(1)}K {action.impact.financial.type}
                      </span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-label">Capacity Change:</span>
                      <span className="impact-value">
                        {action.impact.operational.capacityChange > 0 ? "+" : ""}
                        {action.impact.operational.capacityChange}%
                      </span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-label">Units Affected:</span>
                      <span className="impact-value">{action.impact.operational.unitsAffected}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="customize-modal__footer">
              <button className="modal-btn modal-btn--secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={handleSave}
                disabled={selectedOrders.size === 0 && selectedReturns.size === 0}
              >
                Save & Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
