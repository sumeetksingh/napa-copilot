import { NextResponse } from "next/server";

type Tile = { x:number; y:number; category:string; value:number };

const cats = ["Brake Pads","Filters","Batteries","Rotors","Other"];
const pct: Record<string, number> = {
  "Brake Pads": 0.15,
  "Filters": 0.10,
  "Batteries": 0.12,
  "Rotors": 0.08,
  "Other": 0.55,
};

function seededRand(seed:number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  // grid
  const min = -12, max = 12;
  const size = (max - min + 1) * (max - min + 1);

  // pick "seeds" per category proportional to their pct
  const rng = seededRand(42);
  const seeds: Array<{cat:string; x:number; y:number}> = [];
  cats.forEach(c => {
    const count = Math.max(1, Math.round(pct[c] * 12)); // 12 total seed points approx
    for (let i=0; i<count; i++) {
      seeds.push({ cat: c, x: Math.floor(min + (max-min+1)*rng()), y: Math.floor(min + (max-min+1)*rng()) });
    }
  });

  const tiles: Tile[] = [];
  for (let x=min; x<=max; x++) {
    for (let y=min; y<=max; y++) {
      // find nearest seed to create Voronoi-like clusters
      let best = Infinity, chosen = "Other";
      for (const s of seeds) {
        const d = (s.x - x)*(s.x - x) + (s.y - y)*(s.y - y);
        if (d < best) { best = d; chosen = s.cat; }
      }
      // local variation for height/intensity
      const value = 0.6 + 0.4 * seededRand((x+999)*31 + (y+777)*17)();
      tiles.push({ x, y, category: chosen, value });
    }
  }
  return NextResponse.json(tiles);
}
