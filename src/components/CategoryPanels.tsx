"use client";
import { useMemo } from "react";
import { Text, QuadraticBezierLine } from "@react-three/drei";
import { catColor } from "@/lib/colors";

type Cat = { name:string; pct:number };

export default function CategoryPanels({ categories }:{ categories: Cat[] }) {
  // arrange panels in an arc in front-right of the box
  const panels = useMemo(() => {
    const filtered = categories.filter(c => c.pct > 0.03);
    const radius = 14;
    const start = -Math.PI/6, end = Math.PI/2.2;
    return filtered.map((c, i) => {
      const t = filtered.length === 1 ? 0.5 : i/(filtered.length-1);
      const angle = start + (end-start) * t;
      const x = radius * Math.cos(angle) + 6;
      const z = radius * Math.sin(angle) + 2;
      const y = 3.2 + (i%2)*0.8;
      return { ...c, pos:[x,y,z] as [number,number,number] };
    });
  }, [categories]);

  return (
    <group>
      {panels.map((p, idx) => {
        const color = catColor(p.name);
        const [x,y,z] = p.pos;
        const from:[number,number,number] = [4, 5.2, 6.8];         // a point on the box front/right
        const via:[number,number,number]  = [ (x+from[0])/2, y+2.2, (z+from[2])/2 ]; // lift the curve

        return (
          <group key={idx} position={p.pos}>
            {/* panel card */}
            <mesh>
              <planeGeometry args={[4.8, 2.4]} />
              <meshStandardMaterial color="#081226" emissive={color} emissiveIntensity={0.25} transparent opacity={0.85}/>
            </mesh>
            {/* labels */}
            <group position={[0,0,0.01]}>
              <Text fontSize={0.42} color="#E7FBFF" anchorX="center" anchorY="middle">
                {p.name}
              </Text>
              <Text position={[0,-0.7,0]} fontSize={0.34} color={color} anchorX="center" anchorY="middle">
                {(p.pct*100).toFixed(0)}%
              </Text>
            </group>
            {/* connector from store to this panel */}
            <QuadraticBezierLine
              start={from}
              end={[x,y,z]}
              mid={via}
              color={color}
              lineWidth={2.5}
              dashed={false}
              opacity={0.95}
            />
          </group>
        );
      })}
    </group>
  );
}
