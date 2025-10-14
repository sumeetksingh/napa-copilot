"use client";
import { useStore } from "@/lib/useStore";

export default function Hud({ summary }:{ summary:any }) {
  const { setHighlight, setFilters, filters } = useStore();
  return (
    <div className="w-full bg-[#0b0f1a] text-[#d1faff] rounded-xl p-4 flex items-center gap-4 justify-between">
      <div className="text-sm opacity-80">
        On hand: {summary.totals.onHand.toLocaleString()} • SKUs: {summary.totals.skuCount.toLocaleString()}
      </div>
      <div className="flex gap-2 flex-wrap">
        {summary.categories.map((c:any)=>(
          <button
            key={c.name}
            onMouseEnter={()=>setHighlight(c.name)}
            onMouseLeave={()=>setHighlight(undefined)}
            onClick={()=>setFilters({ categories: [c.name] })}
            className={`px-3 py-1 rounded-full text-xs transition
                        ${filters.categories.includes(c.name)
                          ? "bg-[#1d3b82]"
                          : "bg-[#0f1f3a] hover:bg-[#15325f]"}`}
          >
            {c.name} {(c.pct*100).toFixed(0)}%
          </button>
        ))}
        <button onClick={()=>setFilters({ categories: [] })} className="px-3 py-1 rounded-full bg-[#1b2a6b] text-xs">Reset</button>
      </div>
    </div>
  );
}
