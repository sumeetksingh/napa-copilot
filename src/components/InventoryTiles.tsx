"use client";
import { useMemo } from "react";
import { useStore } from "@/lib/useStore";
import { catColor } from "@/lib/colors";

type Cat = { name:string; pct:number };
const brandPalette: Record<string,string> = {
  "NAPA": "#FFCC00","AC-Delco": "#0046AD","Bosch": "#ff8a00","Denso": "#6ee7b7","Other": "#a78bfa",
};
function fakeBrandBreakdown(cat: string, pct: number) {
  const base = [{name:"NAPA",val:0.45},{name:"AC-Delco",val:0.22},{name:"Bosch",val:0.18},{name:"Denso",val:0.10},{name:"Other",val:0.05}];
  const total = base.reduce((s,b)=>s+b.val,0);
  return base.map(b => ({ name: b.name, pct: (b.val/total) * pct }));
}

export default function InventoryTiles({ categories }:{ categories: Cat[] }) {
  const { highlight, setHighlight, setFilters } = useStore();
  const data = useMemo(() => [...categories].sort((a,b)=>b.pct-a.pct).slice(0,9), [categories]);

  return (
    <div className="grid grid-cols-3 gap-3 pr-1">
      {data.map((c) => {
        const brands = fakeBrandBreakdown(c.name, c.pct);
        const active = highlight === c.name;
        return (
          <button
            key={c.name}
            onClick={()=>{ setHighlight(c.name); setFilters({ categories:[c.name] }); }}
            className={`relative aspect-[4/3] rounded-xl ring-1 ring-[#163162] bg-[#0b0f1a]/80 backdrop-blur-md p-3 text-left
                        hover:-translate-y-0.5 transition ${active ? "outline outline-2 outline-sky-400" : ""}`}
          >
            <div className="text-[11px] text-white/70">Category</div>
            <div className="text-sm font-semibold" style={{ color: catColor(c.name) }}>{c.name}</div>
            <div className="mt-1 text-3xl font-bold text-white">{(c.pct*100).toFixed(0)}%</div>

            {/* progress */}
            <div className="mt-2 h-2 w-full rounded bg-[#0f1f3a] overflow-hidden">
              <div className="h-full" style={{ width: `${c.pct*100}%`, background: catColor(c.name) }} />
            </div>

            {/* mini brand stack */}
            <div className="mt-2 h-2 w-full rounded bg-[#0f1f3a] overflow-hidden flex">
              {brands.map((b,i)=>(
                <div key={i} style={{ width: `${(b.pct/(c.pct||1))*100}%`, background: brandPalette[b.name] || "#7dd3fc" }} />
              ))}
            </div>

            <div className="mt-1 flex gap-2 text-[11px] text-white/70">
              {brands.slice(0,2).map((b)=>(
                <span key={b.name} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded" style={{ background: brandPalette[b.name] || "#7dd3fc" }} />
                  {b.name} {(b.pct*100).toFixed(0)}%
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
