"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/useStore";
import { catColor } from "@/lib/colors";

type Cat = { name: string; pct: number };

const CELL_COUNT = 20;
const CELLS_PER_ROW = 5;

function buildCells(loadPct: number, overfillPct: number) {
  const filledCells = Math.round(loadPct * CELL_COUNT);
  const overflowCells = Math.min(filledCells, Math.round(overfillPct * CELL_COUNT));

  return Array.from({ length: CELL_COUNT }, (_, index) => {
    if (index >= filledCells) {
      return "empty";
    }
    if (index >= filledCells - overflowCells) {
      return "overflow";
    }
    return "filled";
  });
}

export default function InventoryTiles({
  categories,
  capacityPct,
  inventoryHealth,
}: {
  categories: Cat[];
  capacityPct: number;
  inventoryHealth: number;
}) {
  const highlight = useStore((state) => state.highlight);
  const setHighlight = useStore((state) => state.setHighlight);
  const setFilters = useStore((state) => state.setFilters);
  const activeAction = useStore((state) => state.activeAction);

  const sorted = useMemo(() => [...categories].sort((a, b) => b.pct - a.pct), [categories]);
  const overfillFraction = Math.max(0, capacityPct - 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-200/60">
        <span>Inventory mix heat map</span>
        <span>Health score {inventoryHealth}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {sorted.map((category, index) => {
          const cells = buildCells(category.pct, overfillFraction);
          const active = highlight === category.name;
          const isTarget = activeAction?.targetCategory === category.name;
          const isSource = activeAction?.sourceCategory === category.name;

          return (
            <motion.button
              key={category.name}
              type="button"
              className={`relative rounded-xl border border-[#1a2d55] bg-[#0b1426]/80 p-3 text-left shadow-[0_10px_30px_rgba(6,14,32,0.55)] transition focus-visible:outline-none ${
                active || isTarget ? "ring-2 ring-sky-400/60" : isSource ? "ring-2 ring-rose-400/45" : "hover:border-sky-500/60"
              }`}
              onClick={() => {
                setHighlight(category.name);
                setFilters({ categories: [category.name] });
              }}
              onMouseEnter={() => setHighlight(category.name)}
              onMouseLeave={() => setHighlight(undefined)}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 * index, duration: 0.35, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-white/50">Category</div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: isTarget ? "#93c5fd" : isSource ? "#f9b4c7" : catColor(category.name) }}
                  >
                    {category.name}
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{(category.pct * 100).toFixed(0)}%</div>
              </div>

              <div
                className="mt-3 grid gap-[6px]"
                style={{
                  gridTemplateColumns: `repeat(${CELLS_PER_ROW}, minmax(0, 1fr))`,
                }}
              >
                {cells.map((state, cellIndex) => {
                  const isFilled = state === "filled";
                  const isOverflow = state === "overflow";
                  const color = isOverflow ? "#f87171" : catColor(category.name);
                  return (
                    <motion.span
                      key={cellIndex}
                      className="aspect-square w-full rounded-[6px] border border-[#16294d] bg-[#081020]"
                      style={{
                        background: isFilled || isOverflow ? color : "rgba(10,18,32,0.8)",
                        boxShadow:
                          isOverflow || isFilled
                            ? `0 0 12px ${isOverflow ? "#f87171aa" : `${color}55`}`
                            : "none",
                        opacity: isOverflow ? 1 : isFilled ? 0.92 : 0.65,
                      }}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: isOverflow || isFilled ? 1 : 0.6, scale: 1 }}
                      transition={{ delay: 0.02 * cellIndex, duration: 0.25, ease: "easeOut" }}
                    />
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/40">
                <span>Load factor</span>
                <span
                  className={
                    overfillFraction > 0.01
                      ? "text-[#fca5a5]"
                      : inventoryHealth > 80
                        ? "text-[#6efacc]"
                        : "text-[#facc15]"
                  }
                >
                  {(capacityPct * 100).toFixed(0)}%
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
