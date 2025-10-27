"use client";
import { Edges } from "@react-three/drei";

export default function Mezzanine() {
  // Store interior coords: keep consistent with StoreBuilding (W=22, D=16, H=9)
  const W = 22;
  const D = 16;
  const deckY = 4.5;        // height of mezzanine deck
  const deckW = W - 4;      // leave side margins
  const deckD = (D - 3) / 2;// mezzanine depth at back half
  const postH = 3.8;

  return (
    <group>
      {/* Deck slab */}
      <mesh position={[0, deckY, - (D/2 - deckD/2 - 0.6)]}>
        <boxGeometry args={[deckW, 0.18, deckD]} />
        <meshStandardMaterial color="#1E2436" metalness={0.2} roughness={0.6}/>
        <Edges color="#6c7aa5" />
      </mesh>

      {/* Front rail */}
      <mesh position={[0, deckY + 0.7, - (D/2 - deckD - 0.6)]}>
        <boxGeometry args={[deckW, 0.05, 0.05]} />
        <meshStandardMaterial color="#9fb5ff" emissive="#3752b7" emissiveIntensity={0.2}/>
      </mesh>

      {/* Vertical posts */}
      {Array.from({length: 8}).map((_,i)=> {
        const x = -deckW/2 + (i*(deckW/7));
        return (
          <mesh key={i} position={[x, deckY + postH/2 - 0.5, - (D/2 - deckD - 0.6)]}>
            <boxGeometry args={[0.05, postH, 0.05]} />
            <meshStandardMaterial color="#9fb5ff" emissive="#2e4da8" emissiveIntensity={0.15}/>
          </mesh>
        );
      })}
      {/* Simple columns beneath deck */}
      {[-deckW/2+1.2, 0, deckW/2-1.2].map((x,i)=>(
        <mesh key={i} position={[x, (deckY-0.1)/2, - (D/2 - deckD/2 - 0.6)]}>
          <boxGeometry args={[0.25, deckY-0.1, 0.25]} />
          <meshStandardMaterial color="#8b8f9a" metalness={0.1} roughness={0.5}/>
        </mesh>
      ))}
    </group>
  );
}
