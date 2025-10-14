"use client";
import { useTexture } from "@react-three/drei";
import { RepeatWrapping, Texture } from "three";
import { useMemo } from "react";

export default function ParkingLot() {
  let tex: { map?: Texture; normalMap?: Texture; roughnessMap?: Texture; aoMap?: Texture } = {};
  try {
    tex = useTexture({
      map: "/textures/asphalt_albedo.jpg",
      normalMap: "/textures/asphalt_normal.jpg",
      roughnessMap: "/textures/asphalt_rough.jpg",
      aoMap: "/textures/asphalt_ao.jpg",
    });
    [tex.map, tex.normalMap, tex.roughnessMap, tex.aoMap].forEach(t => {
      if (!t) return;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(8, 8);
    });
  } catch { /* fall back to flat color below */ }

  return (
    <group>
      {/* Parking lot surface */}
      <mesh position={[0, -0.001, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 50]} />
        {tex.map ? (
          <meshStandardMaterial
            map={tex.map}
            normalMap={tex.normalMap}
            roughnessMap={tex.roughnessMap}
            aoMap={tex.aoMap}
            roughness={0.9}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial color="#2b2f39" roughness={0.95} />
        )}
      </mesh>

      {/* Painted parking lines */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-18 + i * 4.5, 0, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 5]} />
          <meshBasicMaterial color="#f8f3cf" />
        </mesh>
      ))}
    </group>
  );
}
