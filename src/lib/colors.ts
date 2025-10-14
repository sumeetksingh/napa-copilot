export const palette: Record<string,string> = {
  "Brake Pads":"#00F0FF",
  "Filters":"#8BFF6B",
  "Batteries":"#FFA640",
  "Rotors":"#C77CFF",
  "Other":"#5EEAD4",
};
export const catColor = (name: string) => palette[name] ?? "#7DD3FC";

/** 0..1 -> heat color (cool cyan → lime → yellow → orange → red) */
export function pctToHeatColor(p: number) {
  const t = Math.max(0, Math.min(1, p));
  // five-point gradient
  const stops = ["#20D5FF","#6DFF80","#FFE866","#FFAC47","#FF5A5A"];
  const idx = Math.min(3, Math.floor(t*4));
  const a = hexToRgb(stops[idx]), b = hexToRgb(stops[idx+1]);
  const k = t*4 - idx;
  const r = Math.round(a.r + (b.r-a.r)*k);
  const g = Math.round(a.g + (b.g-a.g)*k);
  const bch= Math.round(a.b + (b.b-a.b)*k);
  return `rgb(${r},${g},${bch})`;
}
function hexToRgb(hex:string){ const h=hex.replace('#','');
  const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
