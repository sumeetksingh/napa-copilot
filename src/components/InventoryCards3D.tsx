"use client";
import { useMemo, useState } from "react";
import { Text } from "@react-three/drei";
import { pctToHeatColor, catColor } from "@/lib/colors";
import { useStore } from "@/lib/useStore";

type Cat = { name: string; pct: number };

export default function InventoryCards3D({ categories }: { categories: Cat[] }) {
  const { highlight, setHighlight, setFilters } = useStore();
  const [hover, setHover] = useState<string | undefined>();

  const data = useMemo(
    () => [...categories].sort((a, b) => b.pct - a.pct).slice(0, 9),
    [categories]
  );

  // bigger cards & better spacing
  const cardW = 3.4;
  const cardH = 5.0;
  const gapX = 1.0;
  const gapZ = 1.2;
  const startX = -((cardW * 3 + gapX * 2) / 2) + cardW / 2;
  const startZ = -3.5;

  return (
    <group position={[0, 2.0, 0]}>
      {data.map((c, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = startX + col * (cardW + gapX);
        const z = startZ + row * (cardH * 0.2 + gapZ);

        const isHover = hover === c.name;
        const isActive = highlight === c.name;

        const heat = pctToHeatColor(c.pct);
        const frame = isActive ? "#8ec9ff" : "#163162";
        const tilt = isHover ? -0.25 : -0.15;

        return (
          <group
            key={c.name}
            position={[x, 0, z]}
            rotation={[tilt, 0, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHover(c.name);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHover(undefined);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setHighlight(c.name);
              setFilters({ categories: [c.name] });
            }}
          >
            {/* card base */}
            <mesh>
              <boxGeometry args={[cardW, 0.05, cardH]} />
              <meshStandardMaterial color="#0b1224" roughness={0.55} metalness={0.25} />
            </mesh>

            {/* main face */}
            <group position={[0, 0.03, 0]}>
              <mesh>
                <planeGeometry args={[cardW * 0.94, cardH * 0.92]} />
                <meshStandardMaterial
                  color="#101c3a"
                  emissive={heat}
                  emissiveIntensity={0.3}
                  roughness={0.4}
                />
              </mesh>

              {/* glow outline */}
              <mesh scale={[1.05, 1.05, 1]}>
                <planeGeometry args={[cardW * 0.94, cardH * 0.92]} />
                <meshBasicMaterial color={frame} transparent opacity={0.35} />
              </mesh>

              {/* category */}
              <Text
                position={[0, cardH * 0.35, 0.01]}
                fontSize={0.48}
                color={catColor(c.name)}
                anchorX="center"
                anchorY="middle"
                fontWeight={700}
              >
                {c.name}
              </Text>

              {/* percentage */}
              <Text
                position={[0, cardH * 0.05, 0.01]}
                fontSize={0.85}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight={900}
              >
                {(c.pct * 100).toFixed(0)}%
              </Text>

              {/* mini heat bar */}
              <group position={[0, -cardH * 0.28, 0.01]}>
                <mesh>
                  <planeGeometry args={[cardW * 0.8, 0.18]} />
                  <meshStandardMaterial color="#0f2448" />
                </mesh>
                <mesh
                  position={[-cardW * 0.4 + (cardW * 0.8 * c.pct) / 2, 0, 0.001]}
                >
                  <planeGeometry args={[cardW * 0.8 * c.pct, 0.18]} />
                  <meshStandardMaterial
                    color={heat}
                    emissive={heat}
                    emissiveIntensity={0.6}
                  />
                </mesh>
              </group>

              {isHover && (
                <Text
                  position={[0, -cardH * 0.42, 0.01]}
                  fontSize={0.2}
                  color="#9be8ff"
                  anchorX="center"
                >
                  click to focus
                </Text>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
