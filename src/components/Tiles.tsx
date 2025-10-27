"use client";
import { useMemo, useRef } from "react";
import { InstancedMesh, Object3D, Color } from "three";
import { useFrame } from "@react-three/fiber";
import { useStore } from "@/lib/useStore";
import { catColor } from "@/lib/colors";

type Tile = { x: number; y: number; category: string; value: number };

export default function Tiles({ tiles }: { tiles: Tile[] }) {
  const { highlight, filters } = useStore();
  const dummy = useMemo(() => new Object3D(), []);
  const meshRef = useRef<InstancedMesh | null>(null);
  const count = tiles.length;
  const baseColors = useMemo(() => tiles.map((tile) => new Color(catColor(tile.category))), [tiles]);

  const gap = 0.08;           // small gap between tiles
  const baseH = 0.18;         // base tile height
  const maxH = 0.7;          // max height scale

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    tiles.forEach((tile, index) => {
      const pulse = 0.9 + 0.15*Math.sin(clock.elapsedTime*1.8 + (tile.x+tile.y)*0.12);
      const visible = !filters.categories.length || filters.categories.includes(tile.category);
      const h = visible ? baseH + tile.value * maxH : 0.05;

      dummy.position.set(tile.x*(1+gap), h/2, tile.y*(1+gap));
      const s = visible ? 0.95 : 0.6;
      dummy.scale.set(s, 1, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);

      const color = baseColors[index].clone();
      if (highlight && tile.category === highlight) color.offsetHSL(0, 0.3, 0.2);
      color.multiplyScalar(pulse);
      mesh.setColorAt(index, color);
    });
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh name="tiles" ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.95, 1, 0.95]} />
      <meshStandardMaterial
        emissiveIntensity={1.5}
        metalness={0.4}
        roughness={0.15}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
