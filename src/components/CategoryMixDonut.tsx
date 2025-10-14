"use client";
import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useStore } from "@/lib/useStore";
import { palette } from "@/lib/colors";

type Cat = { name: string; pct: number };

export default function CategoryMixDonut({ categories }: { categories: Cat[] }) {
  const { highlight, setHighlight, setFilters } = useStore();
  const data = categories.map(c => ({ name: c.name, value: Math.round(c.pct * 1000) / 10 })); // pct in %

  // --- draggable state (persist to localStorage)
  const [pos, setPos] = useState<{x:number; y:number}>({ x: 24, y: 16 });
  const startRef = useRef<{sx:number; sy:number; ox:number; oy:number} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mixPanelPos");
    if (saved) setPos(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("mixPanelPos", JSON.stringify(pos));
  }, [pos]);

  const beginDrag = (clientX:number, clientY:number) => {
    startRef.current = { sx: clientX, sy: clientY, ox: pos.x, oy: pos.y };
  };
  const onMove = (clientX:number, clientY:number) => {
    if (!startRef.current) return;
    const { sx, sy, ox, oy } = startRef.current;
    setPos({ x: ox + (clientX - sx), y: oy + (clientY - sy) });
  };
  const endDrag = () => { startRef.current = null; };

  // mouse + touch handlers
  const onMouseDown = (e: React.MouseEvent) => { beginDrag(e.clientX, e.clientY); };
  const onMouseMove = (e: React.MouseEvent) => onMove(e.clientX, e.clientY);
  const onMouseUp   = endDrag;
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]; beginDrag(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0]; onMove(t.clientX, t.clientY);
  };
  const onTouchEnd = endDrag;

  const onSlice = (name?: string) => {
    if (!name) { setHighlight(undefined); setFilters({ categories: [] }); return; }
    setHighlight(name);
    setFilters({ categories: [name] });
  };

  return (
    <div
      className="absolute z-20 select-none"
      style={{ left: pos.x, top: pos.y }}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <div className="bg-[#0b0f1a]/85 backdrop-blur-md rounded-xl px-4 py-3 ring-1 ring-[#163162] text-white w-72 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        {/* Drag handle / header */}
        <div
          className="flex items-center justify-between mb-2 cursor-move"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <div className="text-sm/none opacity-90">Inventory mix</div>
          <button
            onClick={() => onSlice(undefined)}
            className="text-xs bg-[#163162] hover:bg-[#1d3b82] rounded px-2 py-0.5"
          >
            Reset
          </button>
        </div>

        <div className="h-44">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="85%"
                paddingAngle={1}
                onClick={(d:any) => onSlice(d?.name)}
                onMouseEnter={(d:any)=> setHighlight(d?.name)}
                onMouseLeave={()=> setHighlight(undefined)}
                isAnimationActive={true}
              >
                {data.map((entry, idx) => {
                  const color = (palette as any)[entry.name] ?? "#7DD3FC";
                  const active = highlight ? highlight === entry.name : false;
                  return <Cell key={idx} fill={color} stroke={active ? "#ffffff" : "#0a1122"} strokeWidth={active ? 2 : 1} />;
                })}
              </Pie>
              <Tooltip
                formatter={(v:any, n:any)=> [`${v.toFixed(1)}%`, n]}
                contentStyle={{ background:"#0b0f1a", border:"1px solid #163162", borderRadius:8, color:"#ffffff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs text-white">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: (palette as any)[d.name] ?? "#7DD3FC" }} />
              <span className="truncate">{d.name}</span>
              <span className="ml-auto opacity-80">{d.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
