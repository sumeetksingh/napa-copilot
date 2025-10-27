"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TooltipProps } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { useStore } from "@/lib/useStore";
import { palette } from "@/lib/colors";

type Cat = { name: string; pct: number };
type PieDatum = { name: string; value: number };

const defaultColor = "#7DD3FC";

const getCategoryColor = (name: string) => (palette as Record<string, string | undefined>)[name] ?? defaultColor;

const extractSliceName = (entry: PieSectorDataItem): string | undefined => {
  if (typeof entry.name === "string") {
    return entry.name;
  }
  const payload = entry.payload as Partial<PieDatum> | undefined;
  if (payload?.name) {
    return payload.name;
  }
  return undefined;
};

export default function CategoryMixDonut({ categories }: { categories: Cat[] }) {
  const { highlight, setHighlight, setFilters } = useStore();
  const data = useMemo<PieDatum[]>(
    () => categories.map((category) => ({ name: category.name, value: Math.round(category.pct * 1000) / 10 })),
    [categories],
  );

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 16 });
  const startRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mixPanelPos");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { x?: number; y?: number } | null;
      if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
        setPosition({ x: parsed.x, y: parsed.y });
      }
    } catch {
      // ignore malformed saved state
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mixPanelPos", JSON.stringify(position));
  }, [position]);

  const beginDrag = (clientX: number, clientY: number) => {
    startRef.current = { sx: clientX, sy: clientY, ox: position.x, oy: position.y };
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!startRef.current) return;
    const { sx, sy, ox, oy } = startRef.current;
    setPosition({ x: ox + (clientX - sx), y: oy + (clientY - sy) });
  };

  const endDrag = () => {
    startRef.current = null;
  };

  const onSlice = (name?: string) => {
    if (!name) {
      setHighlight(undefined);
      setFilters({ categories: [] });
      return;
    }
    setHighlight(name);
    setFilters({ categories: [name] });
  };

  const handleTooltipValue: TooltipProps<number, string>["formatter"] = (value, name) => {
    if (typeof value !== "number") return ["", name];
    return [`${value.toFixed(1)}%`, name];
  };

  const handlePieInteraction = (entry: PieSectorDataItem | undefined, action: (name?: string) => void) => {
    if (!entry) {
      action(undefined);
      return;
    }
    const sliceName = extractSliceName(entry);
    action(sliceName);
  };

  return (
    <div
      className="absolute z-20 select-none"
      style={{ left: position.x, top: position.y }}
      onMouseMove={(event) => onMove(event.clientX, event.clientY)}
      onMouseUp={endDrag}
      onTouchMove={(event) => {
        const touch = event.touches.item(0);
        if (!touch) return;
        onMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={endDrag}
    >
      <div className="bg-[#0b0f1a]/85 backdrop-blur-md rounded-xl px-4 py-3 ring-1 ring-[#163162] text-white w-72 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        <div
          className="flex items-center justify-between mb-2 cursor-move"
          onMouseDown={(event) => beginDrag(event.clientX, event.clientY)}
          onTouchStart={(event) => {
            const touch = event.touches.item(0);
            if (!touch) return;
            beginDrag(touch.clientX, touch.clientY);
          }}
        >
          <div className="text-sm/none opacity-90">Inventory mix</div>
          <button
            type="button"
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
                onClick={(entry) => handlePieInteraction(entry, onSlice)}
                onMouseEnter={(entry) => handlePieInteraction(entry, (name) => setHighlight(name ?? undefined))}
                onMouseLeave={() => setHighlight(undefined)}
                isAnimationActive
              >
                {data.map((entry) => {
                  const color = getCategoryColor(entry.name);
                  const isActive = highlight === entry.name;
                  return (
                    <Cell
                      key={entry.name}
                      fill={color}
                      stroke={isActive ? "#ffffff" : "#0a1122"}
                      strokeWidth={isActive ? 2 : 1}
                    />
                  );
                })}
              </Pie>
              <Tooltip formatter={handleTooltipValue} contentStyle={{ background: "#0b0f1a", border: "1px solid #163162", borderRadius: 8, color: "#ffffff" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs text-white">
          {data.map((datum) => (
            <div key={datum.name} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: getCategoryColor(datum.name) }} />
              <span className="truncate">{datum.name}</span>
              <span className="ml-auto opacity-80">{datum.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
