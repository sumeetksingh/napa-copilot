"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/useStore";
import type { StoreSummary } from "@/lib/types";
import { catColor } from "@/lib/colors";

const chipVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

export default function Hud({ summary, inventoryHealth }: { summary: StoreSummary; inventoryHealth: number }) {
  const setHighlight = useStore((state) => state.setHighlight);
  const setFilters = useStore((state) => state.setFilters);
  const filters = useStore((state) => state.filters);

  const metrics = useMemo(
    () => [
      {
        label: "On hand",
        value: summary.totals.onHand.toLocaleString(),
        tone: "base",
        detail: "units",
      },
      {
        label: "SKUs",
        value: summary.totals.skuCount.toLocaleString(),
        tone: "base",
        detail: "active",
      },
      {
        label: "Capacity",
        value: `${Math.round(summary.totals.capacityPct * 100).toLocaleString()}%`,
        tone: summary.totals.capacityPct >= 1 ? "alert" : "ok",
        detail: summary.totals.capacityPct >= 1 ? "over capacity" : "within plan",
      },
      {
        label: "Health",
        value: inventoryHealth.toLocaleString(),
        tone: inventoryHealth < 60 ? "alert" : inventoryHealth < 80 ? "caution" : "ok",
        detail: "score",
      },
    ],
    [summary.totals.capacityPct, summary.totals.onHand, summary.totals.skuCount, inventoryHealth],
  );

  return (
    <motion.section
      className="rounded-2xl bg-[#070c16]/80 ring-1 ring-[#1a2d55] backdrop-blur-md px-5 py-4 flex flex-col gap-4 text-white/90 shadow-[0_22px_50px_rgba(4,12,28,0.55)]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-200/60">Pulse telemetry</p>
          <p className="text-sm text-white/60">
            Updated {new Date(summary.asOf).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              className={`rounded-xl px-4 py-3 text-sm border border-[#1f325e] bg-[#0b152b]/80 min-w-[130px] ${
                metric.tone === "alert"
                  ? "shadow-[0_0_18px_rgba(248,113,113,0.45)] border-[#f87171]/60 text-[#fca5a5]"
                  : metric.tone === "caution"
                    ? "shadow-[0_0_18px_rgba(250,204,21,0.32)] border-[#facc15]/50 text-[#fde68a]"
                    : metric.tone === "ok"
                      ? "shadow-[0_0_18px_rgba(134,239,172,0.35)] border-[#34d399]/40 text-[#a7f3d0]"
                      : ""
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index + 0.15, duration: 0.35, ease: "easeOut" }}
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/45">{metric.label}</div>
              <div className="mt-1 text-xl font-semibold leading-tight">{metric.value}</div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-white/30">{metric.detail}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.categories.map((category, index) => {
          const active = filters.categories.includes(category.name);
          const color = catColor(category.name);
          return (
            <motion.button
              key={category.name}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition border ${
                active ? "bg-[#14244a] text-sky-200 border-sky-400/60" : "bg-[#0a172f] text-white/70 border-[#163162]"
              }`}
              style={active ? { boxShadow: `0 0 14px ${color}55` } : undefined}
              onMouseEnter={() => setHighlight(category.name)}
              onMouseLeave={() => setHighlight(undefined)}
              onClick={() => setFilters({ categories: active ? [] : [category.name] })}
              variants={chipVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.05 * index + 0.2, duration: 0.25, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.name} {(category.pct * 100).toFixed(0)}%
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] bg-[#133463] text-white/70 border border-[#1b3a6e]"
          onClick={() => setFilters({ categories: [] })}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          Reset
        </motion.button>
      </div>
    </motion.section>
  );
}
