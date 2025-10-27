"use client";
import { useMemo, useEffect } from "react";
import { useTexture } from "@react-three/drei";
import { RepeatWrapping, Texture } from "three";

type AsphaltTextures = Partial<{ map: Texture; normalMap: Texture; roughnessMap: Texture; aoMap: Texture }>;

const texturePaths = {
  map: "/textures/asphalt_albedo.jpg",
  normalMap: "/textures/asphalt_normal.jpg",
  roughnessMap: "/textures/asphalt_rough.jpg",
  aoMap: "/textures/asphalt_ao.jpg",
} as const;

export default function ParkingLot() {
  const textures = useTexture(texturePaths) as AsphaltTextures;

  useEffect(() => {
    const maps = [textures.map, textures.normalMap, textures.roughnessMap, textures.aoMap] as Texture[];
    maps.forEach((texture) => {
      if (!texture) return;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(8, 8);
    });
  }, [textures.aoMap, textures.map, textures.normalMap, textures.roughnessMap]);

  const hasTexture = useMemo(() => Boolean(textures.map), [textures.map]);

  return (
    <group>
      {/* Parking lot surface */}
      <mesh position={[0, -0.001, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 50]} />
        {hasTexture && textures.map ? (
          <meshStandardMaterial
            map={textures.map}
            normalMap={textures.normalMap}
            roughnessMap={textures.roughnessMap}
            aoMap={textures.aoMap}
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
