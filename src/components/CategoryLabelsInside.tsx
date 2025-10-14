"use client";
import { useMemo } from "react";
import { Text } from "@react-three/drei";
import { catColor } from "@/lib/colors";

/**
 * Finds the centroid of each category from the tile positions and
 * places a floating label slightly above the tiles inside the box.
 */
export default function CategoryLabelsInside({ tiles }:{ tiles: Array<{x:number;y:number;category:string}> }) {
  const centroids = useMemo(() => {
    const acc: Record<string,{sx:number; sy:number; n:number}> = {};
    for (const t of tiles) {
      const k = t.category;
      if (!acc[k]) acc[k] = { sx:0, sy:0, n:0 };
      acc[k].sx += t.x;
      acc[k].sy += t.y;
      acc[k].n  += 1;
    }
    return Object.entries(acc)
      .filter(([,v]) => v.n > 12) // ignore tiny stray groups
      .map(([name, v]) => ({
        name,
        x: v.sx / v.n,
        y: v.sy / v.n
      }));
  }, [tiles]);

  return (
    <group>
      {centroids.map(c => {
        const color = catColor(c.name);
        // Lift labels a bit above the floor. We position in the same coordinate space as tiles.
        return (
          <group key={c.name} position={[c.x*(1+0.08), 1.2, c.y*(1+0.08)]}>
            <Text
              fontSize={0.9}
              color={color}
              outlineColor="#001b2e"
              outlineWidth={0.02}
              anchorX="center"
              anchorY="middle"
            >
              {c.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
