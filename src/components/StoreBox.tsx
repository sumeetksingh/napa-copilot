"use client";
import { useRef } from "react";
import { Group } from "three";
import { Edges, Text } from "@react-three/drei";

export default function StoreBox() {
  const ref = useRef<Group>(null!);

  const w = 18, h = 10, d = 14;  // box size

  return (
    <group ref={ref}>
      {/* glassy shell */}
      <mesh position={[0, h/2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial
          transmission={0.8}
          transparent
          opacity={0.35}
          roughness={0.15}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.15}
          color="#6AD8FF"
          emissive="#0aa1ff"
          emissiveIntensity={0.08}
        />
        <Edges scale={1.002} color="#7dd3fc" threshold={15} />
      </mesh>

      {/* store label */}
      <Text position={[0, h + 0.6, d/2 + 0.4]} fontSize={0.9} color="#FFFFFF" anchorX="center">
        NAPA STORE
      </Text>

      {/* simple inner floor */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[w*0.92, d*0.92, 12, 8]} />
        <meshStandardMaterial color="#0A1224" wireframe={true} wireframeLinewidth={0.6} />
      </mesh>
    </group>
  );
}
