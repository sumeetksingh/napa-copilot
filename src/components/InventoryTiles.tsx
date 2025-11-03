"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/useStore";
import { catColor } from "@/lib/colors";

type Cat = { name: string; pct: number };

type BrandData = {
  name: string;
  pct: number;
  idealPct: number;
};

type CategoryInfo = {
  idealPct: number;
  brands: BrandData[];
};

// Sample brand data for each category
const CATEGORY_DATA: Record<string, CategoryInfo> = {
  "Brake Pads": {
    idealPct: 0.18,
    brands: [
      { name: "Wagner", pct: 0.35, idealPct: 0.30 },
      { name: "ACDelco", pct: 0.28, idealPct: 0.28 },
      { name: "Bosch", pct: 0.22, idealPct: 0.25 },
      { name: "Raybestos", pct: 0.15, idealPct: 0.17 },
    ],
  },
  "Batteries": {
    idealPct: 0.15,
    brands: [
      { name: "Interstate", pct: 0.42, idealPct: 0.35 },
      { name: "DieHard", pct: 0.31, idealPct: 0.30 },
      { name: "Optima", pct: 0.18, idealPct: 0.20 },
      { name: "EverStart", pct: 0.09, idealPct: 0.15 },
    ],
  },
  "Oil": {
    idealPct: 0.22,
    brands: [
      { name: "Mobil 1", pct: 0.38, idealPct: 0.35 },
      { name: "Castrol", pct: 0.27, idealPct: 0.25 },
      { name: "Valvoline", pct: 0.20, idealPct: 0.22 },
      { name: "Pennzoil", pct: 0.15, idealPct: 0.18 },
    ],
  },
  "Filters": {
    idealPct: 0.12,
    brands: [
      { name: "Fram", pct: 0.40, idealPct: 0.38 },
      { name: "Purolator", pct: 0.28, idealPct: 0.30 },
      { name: "WIX", pct: 0.20, idealPct: 0.20 },
      { name: "K&N", pct: 0.12, idealPct: 0.12 },
    ],
  },
  "Wipers": {
    idealPct: 0.08,
    brands: [
      { name: "Rain-X", pct: 0.45, idealPct: 0.40 },
      { name: "Bosch", pct: 0.30, idealPct: 0.33 },
      { name: "Michelin", pct: 0.25, idealPct: 0.27 },
    ],
  },
  "Coolant": {
    idealPct: 0.10,
    brands: [
      { name: "Prestone", pct: 0.52, idealPct: 0.45 },
      { name: "Zerex", pct: 0.28, idealPct: 0.30 },
      { name: "Peak", pct: 0.20, idealPct: 0.25 },
    ],
  },
  "Spark Plugs": {
    idealPct: 0.09,
    brands: [
      { name: "NGK", pct: 0.48, idealPct: 0.45 },
      { name: "Denso", pct: 0.32, idealPct: 0.35 },
      { name: "Champion", pct: 0.20, idealPct: 0.20 },
    ],
  },
  "Belts": {
    idealPct: 0.06,
    brands: [
      { name: "Gates", pct: 0.55, idealPct: 0.50 },
      { name: "Dayco", pct: 0.30, idealPct: 0.30 },
      { name: "Continental", pct: 0.15, idealPct: 0.20 },
    ],
  },
};

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
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

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
          const isFlipped = flippedCard === category.name;
          const categoryInfo = CATEGORY_DATA[category.name];
          const idealPct = categoryInfo?.idealPct ?? 0.15;
          const deltaFromIdeal = category.pct - idealPct;
          const isOverIdeal = deltaFromIdeal > 0.02;
          const isUnderIdeal = deltaFromIdeal < -0.02;

          return (
            <motion.div
              key={category.name}
              className="relative h-[180px]"
              style={{ perspective: "1200px" }}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 * index, duration: 0.35, ease: "easeOut" }}
              onMouseEnter={() => setHighlight(category.name)}
              onMouseLeave={() => setHighlight(undefined)}
            >
              <motion.div
                className="relative w-full h-full"
                style={{ 
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center"
                }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.23, 1, 0.32, 1],
                  type: "tween"
                }}
              >
                {/* Front Face */}
                <button
                  type="button"
                  className={`absolute inset-0 rounded-xl border border-[#1a2d55] bg-[#0b1426]/80 p-3 text-left shadow-[0_10px_30px_rgba(6,14,32,0.55)] transition-all duration-200 focus-visible:outline-none ${
                    active || isTarget ? "ring-2 ring-sky-400/60" : isSource ? "ring-2 ring-rose-400/45" : "hover:border-sky-500/60"
                  }`}
                  style={{ 
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden"
                  }}
                  onClick={() => {
                    setHighlight(category.name);
                    setFilters({ categories: [category.name] });
                  }}
                  onDoubleClick={() => setFlippedCard(isFlipped ? null : category.name)}
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
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{(category.pct * 100).toFixed(0)}%</div>
                      <div className="text-[10px] uppercase tracking-wider mt-0.5">
                        <span className="text-white/40">Ideal: </span>
                        <span className={isOverIdeal ? "text-amber-400" : isUnderIdeal ? "text-sky-400" : "text-emerald-400"}>
                          {(idealPct * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

              <div 
                className="mt-3 grid gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${CELLS_PER_ROW}, 1fr)`,
                  gridTemplateRows: `repeat(${Math.ceil(CELL_COUNT / CELLS_PER_ROW)}, 1fr)`,
                  height: "60px",
                  width: "100%",
                }}
              >
                {cells.map((state, cellIndex) => {
                  const isFilled = state === "filled";
                  const isOverflow = state === "overflow";
                  const color = isOverflow ? "#f87171" : catColor(category.name);
                  return (
                    <div
                      key={cellIndex}
                      className="rounded-[2px] border border-[#16294d]/60 bg-[#0a1220]"
                      style={{
                        background: isFilled || isOverflow ? color : "rgba(10,18,32,0.6)",
                        boxShadow:
                          isOverflow || isFilled
                            ? `0 0 8px ${isOverflow ? "#f87171bb" : `${color}66`}`
                            : "none",
                        opacity: isOverflow ? 1 : isFilled ? 0.95 : 0.5,
                      }}
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
                  <div className="mt-2 text-center text-[9px] uppercase tracking-[0.2em] text-sky-400/60">
                    Double-click to see brands →
                  </div>
                </button>

                {/* Back Face */}
                <div
                  className="absolute inset-0 rounded-xl border border-[#1a2d55] bg-[#0b1426]/95 p-3 shadow-[0_10px_30px_rgba(6,14,32,0.55)] backdrop-blur-sm overflow-hidden"
                  style={{ 
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.25em] text-white/50">Brand Mix</div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: catColor(category.name) }}
                      >
                        {category.name}
                      </div>
                    </div>
                    <button
                      onClick={() => setFlippedCard(null)}
                      className="text-white/60 hover:text-white/90 transition"
                      aria-label="Flip back"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[110px] overflow-y-auto pr-1" style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(56, 189, 248, 0.3) transparent"
                  }}>
                    {categoryInfo?.brands.map((brand, idx) => {
                      const brandDelta = brand.pct - brand.idealPct;
                      const isBrandOver = brandDelta > 0.02;
                      const isBrandUnder = brandDelta < -0.02;
                      
                      return (
                        <div
                          key={brand.name}
                          className="flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: catColor(category.name) }}
                              />
                              <span className="text-white/80 truncate">{brand.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-transparent transition-all"
                                style={{
                                  width: `${brand.pct * 50}px`,
                                  backgroundImage: `linear-gradient(to right, transparent, ${catColor(category.name)})`
                                }}
                              />
                              <span className="text-white/70 font-mono text-[11px] w-9 text-right">
                                {(brand.pct * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] pl-4">
                            <span className="text-white/40">Ideal:</span>
                            <span className={`font-mono ${
                              isBrandOver ? "text-amber-400/80" : 
                              isBrandUnder ? "text-sky-400/80" : 
                              "text-emerald-400/80"
                            }`}>
                              {(brand.idealPct * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-white/50 uppercase tracking-wider">Optimization</span>
                    <span className={isOverIdeal ? "text-amber-400" : isUnderIdeal ? "text-sky-400" : "text-emerald-400"}>
                      {isOverIdeal ? "Reduce stock" : isUnderIdeal ? "Increase stock" : "Optimal"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
