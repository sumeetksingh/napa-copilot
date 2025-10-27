import { NextRequest, NextResponse } from "next/server";

type Tile = { x: number; y: number; category: string; value: number };

const categories = ["Brake Pads", "Filters", "Batteries", "Rotors", "Other"] as const;
const pct: Record<(typeof categories)[number], number> = {
  "Brake Pads": 0.15,
  Filters: 0.1,
  Batteries: 0.12,
  Rotors: 0.08,
  Other: 0.55,
};

function seededRand(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const deriveSeedFromId = (id: string) =>
  id.split("").reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0) || 42;

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const min = -12;
  const max = 12;

  const { id } = await context.params;
  const baseSeed = deriveSeedFromId(id);

  const rng = seededRand(baseSeed);
  const seeds: Array<{ cat: (typeof categories)[number]; x: number; y: number }> = [];
  categories.forEach((cat) => {
    const count = Math.max(1, Math.round(pct[cat] * 12));
    for (let i = 0; i < count; i += 1) {
      seeds.push({
        cat,
        x: Math.floor(min + (max - min + 1) * rng()),
        y: Math.floor(min + (max - min + 1) * rng()),
      });
    }
  });

  const tiles: Tile[] = [];
  for (let x = min; x <= max; x += 1) {
    for (let y = min; y <= max; y += 1) {
      let best = Infinity;
      let chosen: (typeof categories)[number] = "Other";
      for (const seed of seeds) {
        const dx = seed.x - x;
        const dy = seed.y - y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < best) {
          best = distanceSquared;
          chosen = seed.cat;
        }
      }
      const localRng = seededRand((x + 999) * 31 + (y + 777) * 17);
      const value = 0.6 + 0.4 * localRng();
      tiles.push({ x, y, category: chosen, value });
    }
  }
  return NextResponse.json(tiles);
}
