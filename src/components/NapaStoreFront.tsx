"use client";
import { Text } from "@react-three/drei";

export default function NapaStoreFront() {
  const W = 28, H = 10, D = 16;
  const fasciaH = 3.2;
  const fasciaBlue = "#0046AD";
  const napaYellow = "#FFCC00";
  const napaPurple = "#2C2A7C";

  const wallMat = { color: "#E6EBF3", roughness: 0.95, metalness: 0.02 }; // slightly gray, matte

  return (
    <group>
      {/* LEFT / RIGHT / BACK walls – front is OPEN */}
      <mesh position={[-W/2 + 0.4, H/2 - fasciaH/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, H - fasciaH, D]} />
        <meshStandardMaterial {...wallMat}/>
      </mesh>
      <mesh position={[ W/2 - 0.4, H/2 - fasciaH/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, H - fasciaH, D]} />
        <meshStandardMaterial {...wallMat}/>
      </mesh>
      <mesh position={[0, H/2 - fasciaH/2, -D/2 + 0.4]} castShadow receiveShadow>
        <boxGeometry args={[W, H - fasciaH, 0.8]} />
        <meshStandardMaterial {...wallMat}/>
      </mesh>

      {/* BLUE fascia band (no emissive) */}
      <mesh position={[0, H - fasciaH/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, fasciaH, D]} />
        <meshStandardMaterial color={fasciaBlue} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* NAPA hex + text (vector) */}
      <mesh position={[-6.2, H - 1.3, D/2 + 0.02]}>
        <planeGeometry args={[2.9, 2.4]} />
        <meshStandardMaterial color={napaYellow} />
      </mesh>
      <Text position={[-6.2, H - 1.3, D/2 + 0.03]} fontSize={0.8} color={napaPurple} anchorX="center" anchorY="middle" fontWeight={800}>
        NAPA
      </Text>

      <Text position={[2.8, H - 1.3, D/2 + 0.02]} fontSize={1.15} color={napaYellow} fontWeight={900} anchorX="left" anchorY="middle">
        AUTO PARTS
      </Text>
    </group>
  );
}
