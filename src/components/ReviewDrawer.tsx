"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/useStore";

export default function ReviewDrawer() {
  const activeAction = useStore((state) => state.activeAction);
  const setActiveAction = useStore((state) => state.setActiveAction);
  const applyShift = useStore((state) => state.applyShift);
  const setActionStatus = useStore((state) => state.setActionStatus);
  const appendConversation = useStore((state) => state.appendConversation);
  const actionStatuses = useStore((state) => state.actionStatuses);
  const setHighlight = useStore((state) => state.setHighlight);
  const setFilters = useStore((state) => state.setFilters);
  const removeAction = useStore((state) => state.removeAction);
  const baseline = useStore((state) => state.baseline);

  const [selectedRemove, setSelectedRemove] = useState<Set<string>>(new Set());
  const [selectedAdd, setSelectedAdd] = useState<Set<string>>(new Set());

  const isOpen = Boolean(activeAction);
  const status = useMemo(
    () => (activeAction ? actionStatuses[activeAction.id] ?? "pending" : "pending"),
    [activeAction, actionStatuses],
  );

  // Reset selections when action changes
  useEffect(() => {
    if (activeAction) {
      setSelectedRemove(new Set(activeAction.remove.map(s => s.id)));
      setSelectedAdd(new Set(activeAction.add.map(s => s.id)));
    }
  }, [activeAction?.id]);

  const closeDrawer = () => {
    if (!activeAction) return;
    const currentStatus = actionStatuses[activeAction.id];
    if (currentStatus === "in_review") {
      setActionStatus(activeAction.id, "pending");
    }
    setActiveAction(null);
    setHighlight(undefined);
    setFilters({ categories: [] });
  };

  const confirmAction = () => {
    if (!activeAction) return;
    // Apply only selected SKUs
    const filteredAction = {
      ...activeAction,
      remove: activeAction.remove.filter(s => selectedRemove.has(s.id)),
      add: activeAction.add.filter(s => selectedAdd.has(s.id)),
    };
    applyShift(filteredAction);
    setActionStatus(activeAction.id, "applied");
    appendConversation({
      role: "system",
      text: `Queued ${activeAction.shiftPct}% shift from ${activeAction.sourceCategory} to ${activeAction.targetCategory}.`,
      actionId: activeAction.id,
    });
    removeAction(activeAction.id);
    setActiveAction(null);
    setHighlight(undefined);
    setFilters({ categories: [] });
  };

  const toggleRemoveSku = (id: string) => {
    setSelectedRemove(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAddSku = (id: string) => {
    setSelectedAdd(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate dynamic metrics based on selected SKUs
  const dynamicMetrics = useMemo(() => {
    if (!activeAction || !baseline) {
      return { capacityPct: 0, health: 0, capacityDelta: 0, healthDelta: 0 };
    }

    // Calculate capacity impact from selected SKUs
    const removeCapacity = activeAction.remove
      .filter(s => selectedRemove.has(s.id))
      .reduce((sum, sku) => sum + (sku.capacityPct || 0), 0);
    
    const addCapacity = activeAction.add
      .filter(s => selectedAdd.has(s.id))
      .length * 0.02; // Assume each added SKU adds ~2% capacity

    const currentCapacity = baseline.capacityPct;
    const projectedCapacity = currentCapacity - removeCapacity + addCapacity;
    const capacityDelta = projectedCapacity - currentCapacity;

    // Calculate health score (0-100)
    const calculateHealth = (capacity: number) => {
      const delta = Math.abs(capacity - 1);
      return Math.max(0, Math.min(100, Math.round(100 - delta * 500)));
    };

    const currentHealth = calculateHealth(currentCapacity);
    const projectedHealth = calculateHealth(projectedCapacity);
    const healthDelta = projectedHealth - currentHealth;

    return {
      capacityPct: projectedCapacity,
      health: projectedHealth,
      capacityDelta,
      healthDelta,
    };
  }, [activeAction, selectedRemove, selectedAdd, baseline]);

  return (
    <AnimatePresence>
      {isOpen && activeAction && (
        <>
          <motion.div
            className="review-drawer__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
          />
          <motion.aside
            className="review-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="review-drawer__header">
              <div>
                <span className="pill">{activeAction.severity.toUpperCase()}</span>
                <span className="pill pill--muted">{activeAction.type}</span>
                <span className={`pill pill--status pill--status-${status}`}>{status}</span>
              </div>
              <button type="button" className="review-drawer__close" onClick={closeDrawer}>
                Close
              </button>
            </div>
            <div className="review-drawer__body">
              <h2>{activeAction.title}</h2>
              <p className="review-drawer__summary">{activeAction.summary}</p>

              {/* Dynamic Metrics */}
              <div className="review-drawer__metrics">
                <div className="metric">
                  <span className="metric__label">Projected Capacity</span>
                  <div className="metric__value-row">
                    <span className="metric__value">{Math.round(dynamicMetrics.capacityPct * 100)}%</span>
                    <span className={`metric__delta ${
                      dynamicMetrics.capacityDelta < 0 ? "positive" : 
                      dynamicMetrics.capacityDelta > 0 ? "negative" : "neutral"
                    }`}>
                      {dynamicMetrics.capacityDelta !== 0 && (
                        <>{dynamicMetrics.capacityDelta > 0 ? "+" : ""}{Math.round(dynamicMetrics.capacityDelta * 100)}%</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="metric">
                  <span className="metric__label">Projected Health</span>
                  <div className="metric__value-row">
                    <span className={`metric__value ${
                      dynamicMetrics.health >= 80 ? "healthy" : 
                      dynamicMetrics.health >= 60 ? "warning" : "critical"
                    }`}>{dynamicMetrics.health}</span>
                    <span className={`metric__delta ${
                      dynamicMetrics.healthDelta > 0 ? "positive" : 
                      dynamicMetrics.healthDelta < 0 ? "negative" : "neutral"
                    }`}>
                      {dynamicMetrics.healthDelta !== 0 && (
                        <>{dynamicMetrics.healthDelta > 0 ? "+" : ""}{dynamicMetrics.healthDelta}</>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="review-drawer__grid">
                <div>
                  <span className="label">Shift %</span>
                  <span className="value">{activeAction.shiftPct}%</span>
                </div>
                <div>
                  <span className="label">From</span>
                  <span className="value">{activeAction.sourceCategory}</span>
                </div>
                <div>
                  <span className="label">To</span>
                  <span className="value">{activeAction.targetCategory}</span>
                </div>
              </div>

              <div className="review-drawer__skus">
                <div>
                  <span className="label">
                    Trim immediately 
                    <span className="label__count">({selectedRemove.size}/{activeAction.remove.length} selected)</span>
                  </span>
                  <ul>
                    {(activeAction.remove ?? []).map((sku) => (
                      <li key={sku.id} className="sku-item">
                        <label className="sku-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedRemove.has(sku.id)}
                            onChange={() => toggleRemoveSku(sku.id)}
                          />
                          <span className="sku-checkbox__mark" />
                        </label>
                        <div className="sku-content">
                          <strong>{sku.name}</strong>
                          <span>
                            #{sku.ranking} • {sku.reason}
                          </span>
                        </div>
                      </li>
                    ))}
                    {activeAction.remove.length === 0 && <li className="muted">No trim candidates.</li>}
                  </ul>
                </div>
                <div>
                  <span className="label">
                    Backfill candidates
                    <span className="label__count">({selectedAdd.size}/{activeAction.add.length} selected)</span>
                  </span>
                  <ul>
                    {(activeAction.add ?? []).map((sku) => (
                      <li key={sku.id} className="sku-item">
                        <label className="sku-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedAdd.has(sku.id)}
                            onChange={() => toggleAddSku(sku.id)}
                          />
                          <span className="sku-checkbox__mark" />
                        </label>
                        <div className="sku-content">
                          <strong>{sku.name}</strong>
                          <span>
                            {sku.fitScore}% fit • {sku.rationale}
                          </span>
                        </div>
                      </li>
                    ))}
                    {activeAction.add.length === 0 && <li className="muted">No backfill recommendations.</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="review-drawer__footer">
              <button type="button" className="secondary" onClick={closeDrawer}>
                Cancel
              </button>
              <button type="button" onClick={confirmAction} disabled={status === "applied"}>
                Apply action
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
