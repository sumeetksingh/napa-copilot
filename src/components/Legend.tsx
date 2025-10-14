"use client";
import { palette } from "@/lib/colors";

export default function Legend() {
  const items = Object.entries(palette);
  return (
    <div className="w-full bg-[#0b0f1a]/80 text-[#d1faff] rounded-xl p-3 flex flex-wrap gap-3 backdrop-blur-md ring-1 ring-[#163162]">
      {items.map(([name, color]) => (
        <div key={name} className="flex items-center gap-2 text-xs">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: color, boxShadow:`0 0 10px ${color}66`}} />
          <span className="opacity-80">{name}</span>
        </div>
      ))}
    </div>
  );
}
