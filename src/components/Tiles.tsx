"use client";
import { useMemo } from "react";
import { InstancedMesh, Object3D, Color } from "three";
import { useFrame } from "@react-three/fiber";
import { useStore } from "@/lib/useStore";
import { catColor } from "@/lib/colors";

export default function Tiles({ tiles }:{ tiles: any[] }) {
  const { highlight, filters } = useStore();
  const dummy = useMemo(() => new Object3D(), []);
  const count = tiles.length;
  const baseColors = useMemo(() => tiles.map((t:any) => new Color(catColor(t.category))), [tiles]);

  const gap = 0.08;           // small gap between tiles
  const baseH = 0.18;         // base tile height
  const maxH = 0.7;          // max height scale

  useFrame(({ clock, scene }) => {
    const mesh = scene.getObjectByName("tiles") as InstancedMesh;
    if (!mesh) return;
    tiles.forEach((t:any, i:number) => {
      const pulse = 0.9 + 0.15*Math.sin(clock.elapsedTime*1.8 + (t.x+t.y)*0.12);
      const visible = !filters.categories.length || filters.categories.includes(t.category);
      const h = visible ? baseH + t.value * maxH : 0.05;

      dummy.position.set(t.x*(1+gap), h/2, t.y*(1+gap));
      const s = visible ? 0.95 : 0.6;
      dummy.scale.set(s, 1, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const c = baseColors[i].clone();
      if (highlight && t.category === highlight) c.offsetHSL(0, 0.3, 0.2);
      c.multiplyScalar(pulse);
      mesh.setColorAt(i, c);
    });
    mesh.instanceColor!.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh name="tiles" args={[undefined, undefined, count]}>
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
