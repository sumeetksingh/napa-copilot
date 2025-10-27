"use client";
import { useMemo, useState, type ReactNode } from "react";
import { Billboard, Text } from "@react-three/drei";
import { Color } from "three";
import { catColor } from "@/lib/colors";
import { useStore } from "@/lib/useStore";

type Cat = { name:string; pct:number };

type Stack = {
  cat: string;
  base: [number, number, number]; // x,y,z
  cols: number;                   // columns in stack footprint
  rows: number;
  height: number;                 // boxes tall
};

export default function CategoryStacks({ categories }:{ categories: Cat[] }) {
  const { highlight, setHighlight, setFilters } = useStore();
  const [hover, setHover] = useState<string|undefined>();

  // layout plan:
  //  - mezzanine row (x across), z ~ back half
  //  - back wall row (x across), z ~ -D/2+…
  // Box size ~ 0.6m cube visually
  const W = 22, D = 16;
  const box = 0.6;

  const stacks: Stack[] = useMemo(() => {
    // normalize pcts and map to stack heights (2..10 boxes)
    const tot = categories.reduce((s,c)=>s+c.pct, 0) || 1;
    const cats = categories.map(c => ({...c, pct: c.pct / tot}));

    // split into two rows
    const half = Math.ceil(cats.length/2);
    const frontRow = cats.slice(0, half); // mezzanine line
    const backRow  = cats.slice(half);

    const makeRow = (arr: typeof cats, z: number) => {
      const usable = W-6;
      return arr.map((c, i) => {
        const x = -usable/2 + (i * (usable/(Math.max(1,arr.length-1)))) ;
        const cols = 2, rows = 2;
        const height = Math.max(2, Math.round(2 + c.pct * 10));
        return { cat: c.name, base:[x, 0.0, z] as [number,number,number], cols, rows, height };
      });
    };

    const mezzZ = - (D/2 - (D-3)/2 + 0.2);   // just in front of mezz front rail
    const backZ = -D/2 + 0.9;                // right against back wall

    return [
      ...makeRow(frontRow, mezzZ),
      ...makeRow(backRow, backZ)
    ];
  }, [categories]);

  return (
    <group>
      {stacks.map((s, idx) => {
        const color = new Color(catColor(s.cat));
        const active = (highlight && s.cat === highlight) || (hover === s.cat);
        const emissive = color.clone();
        if (active) emissive.offsetHSL(0, 0.25, 0.15);

        // draw the stack as multiple boxes in a cols x rows x height grid
        const items: ReactNode[] = [];
        for (let i=0;i<s.cols;i++){
          for (let j=0;j<s.rows;j++){
            for (let k=0;k<s.height;k++){
              const x = s.base[0] + (i - (s.cols-1)/2) * (box+0.05);
              const y = 0.15 + k * (box+0.02);
              const z = s.base[2] + (j - (s.rows-1)/2) * (box+0.05);
              items.push(
                <mesh
                  key={`${idx}-${i}-${j}-${k}`}
                  position={[x, y, z]}
                  onPointerOver={(e)=>{ e.stopPropagation(); setHover(s.cat); }}
                  onPointerOut={(e)=>{ e.stopPropagation(); setHover(undefined); }}
                  onClick={(e)=>{ e.stopPropagation(); setHighlight(s.cat); setFilters({ categories: [s.cat] }); }}
                >
                  <boxGeometry args={[box, box, box]} />
                  <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={active ? 0.8 : 0.25} metalness={0.2} roughness={0.6}/>
                </mesh>
              );
            }
          }
        }

        // floating label (always faces camera)
        return (
          <group key={idx}>
            {items}
            <Billboard position={[s.base[0], 0.15 + s.height*(box+0.02) + 0.6, s.base[2]]}>
              <Text
                fontSize={0.55}
                color="#FFFFFF"
                outlineColor="#001b2e"
                outlineWidth={0.02}
                anchorX="center" anchorY="middle"
                onPointerOver={(e)=>{ e.stopPropagation(); setHover(s.cat); }}
                onPointerOut={(e)=>{ e.stopPropagation(); setHover(undefined); }}
                onClick={(e)=>{ e.stopPropagation(); setHighlight(s.cat); setFilters({ categories: [s.cat] }); }}
              >
                {s.cat}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}
