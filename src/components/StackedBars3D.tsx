"use client";
import { useMemo, useState } from "react";
import { Text } from "@react-three/drei";
import { catColor } from "@/lib/colors";
import { useStore } from "@/lib/useStore";

/**
 * One vertical 100%-stacked bar split into category segments.
 * Hover highlights a segment; click pushes a global filter.
 */
export default function StackedBars3D({
  categories,
  position = [12, 0, -1],  // to the RIGHT of the store
  height = 9,
  width = 2.2,
  gap = 0.02,
}: {
  categories: { name: string; pct: number }[];
  position?: [number, number, number];
  height?: number;
  width?: number;
  gap?: number;
}) {
  const { setHighlight, setFilters } = useStore();
  const [hover, setHover] = useState<string | null>(null);

  const data = useMemo(
    () => [...categories].sort((a, b) => b.pct - a.pct),
    [categories]
  );

  let yCursor = 0;
  return (
    <group position={position}>
      {/* Bar title */}
      <Text position={[0, height / 2 + 0.9, 0]} fontSize={0.6} color="#FFFFFF" anchorX="center">
        Inventory mix
      </Text>

      {/* Base frame */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[width + 0.18, 0.2, width + 0.18]} />
        <meshStandardMaterial color="#0e1a2f" />
      </mesh>

      {/* Stacks */}
      {data.map((c) => {
        const h = Math.max(0.15, c.pct * height);
        const y = -height / 2 + yCursor + h / 2;
        yCursor += h + gap;
        const active = hover === c.name;

        return (
          <group key={c.name}>
            <mesh
              position={[0, y, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(c.name);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHover(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setHighlight(c.name);
                setFilters({ categories: [c.name] });
              }}
            >
              <boxGeometry args={[width, h, width]} />
              <meshStandardMaterial
                color={catColor(c.name)}
                emissive={catColor(c.name)}
                emissiveIntensity={active ? 0.9 : 0.45}
                roughness={0.4}
                metalness={0.25}
              />
            </mesh>
            {/* Label on segment */}
            <Text
              position={[0, y, width / 2 + 0.02]}
              rotation={[0, 0, 0]}
              fontSize={0.36}
              color="#e6f5ff"
              anchorX="center"
              anchorY="middle"
            >
              {c.name} {(c.pct * 100).toFixed(0)}%
            </Text>
          </group>
        );
      })}
    </group>
  );
}
