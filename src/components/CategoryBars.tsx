"use client";
import { useMemo, useState } from "react";
import { Html, Text } from "@react-three/drei";
import { catColor } from "@/lib/colors";

export default function CategoryBars({ categories }:{ categories: {name:string;pct:number}[] }) {
  const sorted = useMemo(() => [...categories].sort((a,b)=>b.pct - a.pct), [categories]);
  const [hover, setHover] = useState<string|undefined>(undefined);

  const barW = 1.8, gap = 0.7, baseZ = 0;        // move to center of store interior
  const maxH = 8;                                // taller bars

  return (
    <group position={[0,0,baseZ]}>
      {sorted.map((c, i) => {
        const h = Math.max(0.5, c.pct * maxH * 2.2);
        const x = -((sorted.length-1)*(barW+gap))/2 + i*(barW+gap);
        const color = catColor(c.name);
        const isHover = hover === c.name;
        return (
          <group key={c.name} position={[x, h/2, -3.2 /* push slightly toward back wall */]}>
            <mesh
              onPointerOver={(e)=>{ e.stopPropagation(); setHover(c.name); }}
              onPointerOut={(e)=>{ e.stopPropagation(); setHover(undefined); }}
            >
              <boxGeometry args={[barW, h, barW]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHover ? 0.9 : 0.5}/>
            </mesh>
            <Text position={[0, h/2 + 0.6, 0]} fontSize={0.5} color="#ffffff" anchorX="center" anchorY="middle">
              {`${c.name}\n${(c.pct*100).toFixed(1)}%`}
            </Text>
            {isHover && (
              <Html position={[0, h/2 + 1.3, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
                <div style="background:#0b0f1a; border:1px solid #163162; color:#fff; padding:6px 8px; border-radius:8px; font-size:12px;">
                  {(c.pct*100).toFixed(1)}%
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
