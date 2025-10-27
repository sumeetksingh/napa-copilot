"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
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

  const isOpen = Boolean(activeAction);
  const status = useMemo(
    () => (activeAction ? actionStatuses[activeAction.id] ?? "pending" : "pending"),
    [activeAction, actionStatuses],
  );

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
    applyShift(activeAction);
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
                  <span className="label">Trim immediately</span>
                  <ul>
                    {(activeAction.remove ?? []).map((sku) => (
                      <li key={sku.id}>
                        <strong>{sku.name}</strong>
                        <span>
                          #{sku.ranking} • {sku.reason}
                        </span>
                      </li>
                    ))}
                    {activeAction.remove.length === 0 && <li className="muted">No trim candidates.</li>}
                  </ul>
                </div>
                <div>
                  <span className="label">Backfill candidates</span>
                  <ul>
                    {(activeAction.add ?? []).map((sku) => (
                      <li key={sku.id}>
                        <strong>{sku.name}</strong>
                        <span>
                          {sku.fitScore}% fit • {sku.rationale}
                        </span>
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
