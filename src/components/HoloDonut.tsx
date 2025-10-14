"use client";
import { useMemo } from "react";
import { Text } from "@react-three/drei";
import { catColor } from "@/lib/colors";

export default function HoloDonut({ categories }:{ categories: {name:string;pct:number}[] }) {
  const arcs = useMemo(() => {
    let start = -Math.PI * 0.95; // start near left for a nice arc
    return categories
      .filter(c => c.pct > 0.02) // hide tiny slivers
      .map((c) => {
        const sweep = c.pct * Math.PI * 2 * 0.75; // 270° ring
        const end = start + sweep;
        const seg = { name: c.name, start, end, color: catColor(c.name), pct: c.pct };
        start = end;
        return seg;
      });
  }, [categories]);

  const R = 5, T = 0.28;

  return (
    <group position={[0, 2.8, 0]}>
      {arcs.map((a, i) => {
        const mid = (a.start + a.end) / 2;
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI/2, 0, 0]}>
              <torusGeometry args={[R, T, 16, 128, a.end - a.start]} />
              <meshStandardMaterial color={a.color} emissive={a.color} emissiveIntensity={1.6} transparent opacity={0.9} />
            </mesh>
            <group position={[ (R+0.9)*Math.cos(mid), 0.1, (R+0.9)*Math.sin(mid) ]}>
              <Text fontSize={0.42} color="#E7FBFF" outlineColor="#001b2e" outlineWidth={0.012} anchorX="center" anchorY="middle">
                {`${a.name} ${(a.pct*100).toFixed(0)}%`}
              </Text>
            </group>
          </group>
        );
      })}
    </group>
  );
}
