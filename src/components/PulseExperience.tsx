"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Scene from "@/components/Scene";
import Hud from "@/components/Hud";
import InventoryTiles from "@/components/InventoryTiles";
import LiveSummaryPanel from "@/components/LiveSummaryPanel";
import ChatPanel from "@/components/ChatPanel";
import ReviewDrawer from "@/components/ReviewDrawer";
import WhatIfPanel from "@/components/WhatIfPanel";
import type { StoreSummary } from "@/lib/types";
import { useStore } from "@/lib/useStore";

function computeInventoryHealth(capacityPct: number) {
  const delta = Math.abs(capacityPct - 1);
  const score = Math.round(100 - delta * 500);
  return Math.max(0, Math.min(100, score));
}

export default function PulseExperience({ initialSummary }: { initialSummary: StoreSummary }) {
  const [summary] = useState<StoreSummary>(initialSummary);
  const setBaseline = useStore((state) => state.setBaseline);
  const overrides = useStore((state) => state.overrides);
  const setHasHeardIntro = useStore((state) => state.setHasHeardIntro);

  useEffect(() => {
    setBaseline(summary);
    setHasHeardIntro(false);
  }, [setBaseline, setHasHeardIntro, summary]);

  const adjustedSummary = useMemo(() => {
    const adjustments = overrides.categoryAdjustments ?? {};
    const adjustedCategories = summary.categories.map((category) => ({
      ...category,
      pct: Math.max(0, category.pct + (adjustments[category.name] ?? 0)),
    }));
    const total = adjustedCategories.reduce((acc, cat) => acc + cat.pct, 0);
    const normalizedCategories =
      total > 0
        ? adjustedCategories.map((cat) => ({
            ...cat,
            pct: cat.pct / total,
          }))
        : adjustedCategories;

    const adjustedCapacity = Math.max(0.6, summary.totals.capacityPct + (overrides.capacityOffset ?? 0));
    const adjustedOnHand = Math.max(0, summary.totals.onHand + (overrides.onHandOffset ?? 0));

    return {
      ...summary,
      categories: normalizedCategories,
      totals: {
        ...summary.totals,
        capacityPct: adjustedCapacity,
        onHand: Math.round(adjustedOnHand),
      },
    };
  }, [summary, overrides]);

  const inventoryHealth = useMemo(
    () => computeInventoryHealth(adjustedSummary.totals.capacityPct),
    [adjustedSummary.totals.capacityPct],
  );

  const isOverCapacity = adjustedSummary.totals.capacityPct >= 1;

  return (
    <motion.div
      className="h-[calc(100vh-2rem)] grid grid-cols-[minmax(340px,420px)_minmax(0,1fr)] gap-4 p-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
        <div className="flex min-h-0 flex-col gap-4">
          <LiveSummaryPanel
            storeId={summary.storeId}
            baselineTotals={summary.totals}
            baselineCapacityPct={summary.totals.capacityPct}
            baselineHealth={computeInventoryHealth(summary.totals.capacityPct)}
          />
          <motion.div
            className="bg-[#05080f] rounded-2xl ring-1 ring-[#163162] overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
          >
            <ChatPanel storeId={summary.storeId} />
          </motion.div>
        </div>

      <motion.main
        className="relative h-full p-4 bg-[#05080f] rounded-2xl ring-1 ring-[#163162] flex flex-col gap-4 overflow-hidden"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
      >
        <Hud summary={adjustedSummary} inventoryHealth={inventoryHealth} />

        <div className="flex flex-col gap-4 min-h-0">
          <motion.div
            className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)] gap-4 min-h-0"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.4, ease: "easeOut" }}
          >
            <Scene summary={adjustedSummary} inventoryHealth={inventoryHealth} />

            <motion.section
              className="flex flex-col gap-4 rounded-2xl bg-[#070c16]/75 ring-1 ring-[#1a2d55] p-4 backdrop-blur-md overflow-y-auto min-h-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.4, ease: "easeOut" }}
            >
              <header className="flex flex-col gap-1 text-sm text-white/70">
                <span className="uppercase tracking-[0.3em] text-[11px] text-sky-200/60">Store focus</span>
                <span className="text-white/90 text-base font-semibold">
                  {adjustedSummary.storeId} • as of {adjustedSummary.asOf}
                </span>
                <span className="text-xs text-white/50">
                  {isOverCapacity
                    ? "Inventory levels exceed bay capacity. Overfill is highlighted in red across metrics."
                    : "Inventory levels are within bay capacity. Maintain replenishment cadence."}
                </span>
              </header>

              <InventoryTiles
                categories={adjustedSummary.categories}
                capacityPct={adjustedSummary.totals.capacityPct}
                inventoryHealth={inventoryHealth}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={isOverCapacity ? "over" : "balanced"}
                  className="rounded-xl border border-[#203864]/80 bg-[#091124]/80 text-xs text-white/70 px-4 py-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {isOverCapacity ? (
                    <>
                      <strong className="text-[#fca5a5]">Action:</strong> re-slot 5% of stock to the nearby buffer
                      warehouse. Brake pads and batteries are the densest bays—confirm swap availability.
                    </>
                  ) : (
                    <>
                      <strong className="text-[#8bffd8]">Stable:</strong> bay fill is below alert thresholds. Keep
                      leveraging the mixed pick plan to avoid sudden spikes.
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.section>
          </motion.div>
        </div>
      </motion.main>
      <ReviewDrawer />
      <WhatIfPanel />
    </motion.div>
  );
}
