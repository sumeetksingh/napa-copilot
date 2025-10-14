"use client";
import { MeshReflectorMaterial } from "@react-three/drei";

export default function ReflectiveFloor({ w=22, d=12 }:{ w?:number; d?:number }) {
  return (
    <group position={[0,0.01,0]}>
      <mesh rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[w, d]} />
        <MeshReflectorMaterial
          blur={[250, 80]}
          resolution={1024}
          mixBlur={1}
          mixStrength={2}
          roughness={0.4}
          metalness={0.1}
          depthScale={0.5}
          minDepthThreshold={0.7}
          maxDepthThreshold={1}
          color="#1b2133"
          mirror={0.35}
        />
      </mesh>
    </group>
  );
}
