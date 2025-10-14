"use client";
import { useMemo } from "react";
import { InstancedMesh, Object3D, Color } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "@/lib/useStore";
import { catColor } from "@/lib/colors";

/** Renders your 25x25 grid as instanced cubes and fits it on the store floor. */
export default function TilesInside({ tiles }:{ tiles: Array<{x:number;y:number;category:string;value:number}> }) {
  const { filters, highlight } = useStore();
  const dummy = useMemo(()=>new Object3D(),[]);
  const colors = useMemo(()=>tiles.map(t=>new Color(catColor(t.category))),[tiles]);

  // size to fit: store ~28x16 outer; interior ~22x10 usable
  const gridSide = 25;
  const usableW = 22, usableD = 10;
  const scale = Math.min(usableW, usableD) / gridSide;
  const gap = 0.06;
  const baseH = 0.06, maxH = 0.55;

  useFrame(({ clock, scene }) => {
    const mesh = scene.getObjectByName("inside-tiles") as InstancedMesh;
    if (!mesh) return;
    tiles.forEach((t,i) => {
      const visible = !filters.categories.length || filters.categories.includes(t.category);
      const h = visible ? baseH + t.value * maxH : baseH*0.5;
      const px = (t.x*(1+gap)) * scale;
      const pz = (t.y*(1+gap)) * scale - 3.2; // push toward back of store
      dummy.position.set(px, h/2 + 0.02, pz);
      dummy.scale.set(0.95, 1, 0.95);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const c = colors[i].clone();
      if (highlight && t.category === highlight) c.offsetHSL(0,0.25,0.15);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    // @ts-ignore
    mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh name="inside-tiles" args={[undefined, undefined, tiles.length]}>
      <boxGeometry args={[scale*0.95, 1, scale*0.95]} />
      <meshStandardMaterial emissiveIntensity={0.6} metalness={0.2} roughness={0.45} toneMapped={false} />
    </instancedMesh>
  );
}
