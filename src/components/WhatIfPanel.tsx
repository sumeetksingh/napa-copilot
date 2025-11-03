"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/useStore";
import { useEffect, useState } from "react";

type PresetType = "mezzanine" | "budget" | "replenishment" | null;

export default function WhatIfPanel() {
  const whatIfActive = useStore((state) => state.whatIfActive);
  const whatIfScenario = useStore((state) => state.whatIfScenario);
  const scenarioKPIs = useStore((state) => state.scenarioKPIs);
  const baseline = useStore((state) => state.baseline);
  const setWhatIfActive = useStore((state) => state.setWhatIfActive);
  const setWhatIfScenario = useStore((state) => state.setWhatIfScenario);
  const computeScenario = useStore((state) => state.computeScenario);
  const resetScenario = useStore((state) => state.resetScenario);

  const [activeTab, setActiveTab] = useState<"quick" | "custom">("quick");

  // Auto-compute when scenario changes
  useEffect(() => {
    if (whatIfActive) {
      computeScenario();
    }
  }, [whatIfScenario, whatIfActive, computeScenario]);

  const applyPreset = (preset: PresetType) => {
    switch (preset) {
      case "mezzanine":
        setWhatIfScenario({
          mezzanineSqft: 1000,
          addBudget: 50000,
          constraints: { staffingOK: true, receivingXpw: 2, bays: 8 },
          upliftPreset: "base",
        });
        break;
      case "budget":
        setWhatIfScenario({
          mezzanineSqft: 0,
          addBudget: 250000,
          constraints: { staffingOK: true, receivingXpw: 3, bays: 5 },
          upliftPreset: "aggressive",
        });
        break;
      case "replenishment":
        setWhatIfScenario({
          mezzanineSqft: 0,
          addBudget: 0,
          constraints: { staffingOK: true, receivingXpw: 3, bays: 0 },
          upliftPreset: "conservative",
        });
        break;
    }
  };

  const baseRevenue = baseline ? baseline.onHand * 45 : 0;
  const baseTurns = 4.2;

  return (
    <AnimatePresence>
      {whatIfActive && (
        <motion.div
          className="fixed right-4 top-4 bottom-4 w-[420px] bg-[#05080f]/95 rounded-2xl ring-1 ring-[#163162] backdrop-blur-xl shadow-[0_24px_64px_rgba(4,12,28,0.65)] flex flex-col z-50"
          initial={{ x: 460, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 460, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#163162]/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white/90 tracking-tight">What-If Analysis</h2>
                <p className="text-xs text-white/50 mt-0.5">Model store changes & forecast impact</p>
              </div>
              <button
                onClick={() => setWhatIfActive(false)}
                className="text-white/60 hover:text-white/90 transition"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab("quick")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "quick"
                    ? "bg-[#14244a] text-sky-200 ring-1 ring-sky-400/40"
                    : "bg-[#0a172f] text-white/60 hover:text-white/80"
                }`}
              >
                Quick Presets
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "custom"
                    ? "bg-[#14244a] text-sky-200 ring-1 ring-sky-400/40"
                    : "bg-[#0a172f] text-white/60 hover:text-white/80"
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {activeTab === "quick" ? (
              <>
                <PresetCard
                  title="Add Mezzanine"
                  description="+ 1,000 sqft storage space"
                  impact="+12% capacity, +$50k CapEx"
                  onClick={() => applyPreset("mezzanine")}
                />
                <PresetCard
                  title="Budget Increase"
                  description="+ $250k additional investment"
                  impact="+18% SKU depth, aggressive growth"
                  onClick={() => applyPreset("budget")}
                />
                <PresetCard
                  title="Replenishment Boost"
                  description="Increase receiving 2→3x/week"
                  impact="+8% turns, reduced stockouts"
                  onClick={() => applyPreset("replenishment")}
                />
              </>
            ) : (
              <>
                {/* Mezzanine Input */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/60">Mezzanine (sqft)</label>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="100"
                    value={whatIfScenario.mezzanineSqft}
                    onChange={(e) => setWhatIfScenario({ mezzanineSqft: parseInt(e.target.value) })}
                    className="w-full h-2 bg-[#0a172f] rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <div className="text-right text-sm text-white/80 font-mono">
                    {whatIfScenario.mezzanineSqft.toLocaleString()} sqft
                  </div>
                </div>

                {/* Budget Input */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/60">Additional Budget ($)</label>
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="10000"
                    value={whatIfScenario.addBudget}
                    onChange={(e) => setWhatIfScenario({ addBudget: parseInt(e.target.value) })}
                    className="w-full h-2 bg-[#0a172f] rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <div className="text-right text-sm text-white/80 font-mono">
                    ${(whatIfScenario.addBudget / 1000).toFixed(0)}k
                  </div>
                </div>

                {/* Uplift Preset */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/60">Growth Strategy</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["conservative", "base", "aggressive"] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setWhatIfScenario({ upliftPreset: preset })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition ${
                          whatIfScenario.upliftPreset === preset
                            ? "bg-[#14244a] text-sky-200 ring-1 ring-sky-400/40"
                            : "bg-[#0a172f] text-white/60 hover:text-white/80"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-white/60">Constraints</label>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Staffing Available</span>
                    <button
                      onClick={() =>
                        setWhatIfScenario({
                          constraints: { ...whatIfScenario.constraints, staffingOK: !whatIfScenario.constraints.staffingOK },
                        })
                      }
                      className={`w-11 h-6 rounded-full transition ${
                        whatIfScenario.constraints.staffingOK ? "bg-sky-500" : "bg-[#1a2d55]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          whatIfScenario.constraints.staffingOK ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Receiving Frequency</span>
                      <span className="text-sm text-white/90 font-mono">{whatIfScenario.constraints.receivingXpw}x/week</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={whatIfScenario.constraints.receivingXpw}
                      onChange={(e) =>
                        setWhatIfScenario({
                          constraints: { ...whatIfScenario.constraints, receivingXpw: parseInt(e.target.value) },
                        })
                      }
                      className="w-full h-2 bg-[#0a172f] rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* KPI Preview */}
            {scenarioKPIs && (
              <motion.div
                className="mt-6 p-4 rounded-xl bg-[#0a172f]/80 ring-1 ring-[#1a2d55] space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xs uppercase tracking-[0.25em] text-sky-200/70">Scenario Impact</h3>
                <KPIDelta label="Revenue" baseline={baseRevenue} scenario={scenarioKPIs.revenue} format="currency" />
                <KPIDelta label="Inventory Turns" baseline={baseTurns} scenario={scenarioKPIs.turns} format="number" />
                <KPIDelta label="Avg Inventory" baseline={baseline?.onHand || 0} scenario={scenarioKPIs.onHand} format="units" />
                <KPIDelta label="Capacity" baseline={baseline?.capacityPct || 0} scenario={scenarioKPIs.capacityPct} format="percent" />
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#163162]/60 flex gap-3">
            <button
              onClick={resetScenario}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#0a172f] text-white/70 hover:text-white/90 text-sm font-medium transition ring-1 ring-[#163162]"
            >
              Reset
            </button>
            <button
              onClick={() => setWhatIfActive(false)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition shadow-[0_0_20px_rgba(56,189,248,0.3)]"
            >
              Apply Scenario
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PresetCard({
  title,
  description,
  impact,
  onClick,
}: {
  title: string;
  description: string;
  impact: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-[#0a172f] hover:bg-[#0d1e3a] ring-1 ring-[#163162] hover:ring-sky-400/40 transition text-left group"
    >
      <h3 className="text-sm font-semibold text-white/90 group-hover:text-sky-200 transition">{title}</h3>
      <p className="text-xs text-white/60 mt-1">{description}</p>
      <p className="text-xs text-sky-300/80 mt-2 font-medium">{impact}</p>
    </button>
  );
}

function KPIDelta({
  label,
  baseline,
  scenario,
  format,
}: {
  label: string;
  baseline: number;
  scenario: number;
  format: "currency" | "number" | "units" | "percent";
}) {
  const delta = scenario - baseline;
  const deltaPercent = baseline !== 0 ? ((delta / baseline) * 100).toFixed(1) : "0.0";
  const isPositive = delta > 0;

  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `$${(val / 1000).toFixed(0)}k`;
      case "number":
        return val.toFixed(1);
      case "units":
        return val.toLocaleString();
      case "percent":
        return `${Math.round(val * 100)}%`;
    }
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white/50 line-through">{formatValue(baseline)}</span>
        <span className="text-white/90 font-semibold">{formatValue(scenario)}</span>
        <span className={`text-xs font-mono ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}
          {deltaPercent}%
        </span>
      </div>
    </div>
  );
}
