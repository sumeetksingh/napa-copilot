"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import NapaStoreFront from "@/components/NapaStoreFront";
import type { StoreSummary } from "@/lib/types";
import { catColor } from "@/lib/colors";
import { useStore } from "@/lib/useStore";

type SceneProps = {
  summary: StoreSummary;
  inventoryHealth: number;
};

const STORE_HALF_WIDTH = 14;
const STORE_DEPTH = 8;

function categoryColumns(categories: StoreSummary["categories"], overfill: number) {
  const laneStart = -STORE_HALF_WIDTH + 4;
  const laneSpacing = (STORE_HALF_WIDTH * 2 - 8) / Math.max(categories.length - 1, 1);

  return categories.map((category, index) => {
    const x = laneStart + laneSpacing * index;
    const baseHeight = 1.2 + category.pct * 8;
    const overfillHeight = overfill > 0 ? category.pct * overfill * 6 : 0;
    const totalHeight = baseHeight + overfillHeight;

    return {
      category,
      x,
      baseHeight,
      overfillHeight,
      totalHeight,
    };
  });
}

export default function Scene({ summary, inventoryHealth }: SceneProps) {
  const activeAction = useStore((state) => state.activeAction);
  const overfill = Math.max(0, summary.totals.capacityPct - 1);
  const fillHeight = 0.6 + Math.min(summary.totals.capacityPct, 1.6) * 4.6;
  const haloColor =
    inventoryHealth >= 85 ? "#34d399" : inventoryHealth >= 70 ? "#facc15" : inventoryHealth >= 50 ? "#f97316" : "#f87171";

  const columns = useMemo(() => categoryColumns(summary.categories, overfill), [summary.categories, overfill]);

  return (
    <div className="h-[72vh] w-full rounded-2xl overflow-hidden bg-[#0a0f18] ring-1 ring-[#163162]">
      <Canvas shadows camera={{ position: [20, 13, 28], fov: 42 }}>
        <color attach="background" args={["#050b14"]} />

        <ambientLight intensity={0.3} />
        <directionalLight
          position={[18, 24, 12]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-14, 10, -10]} intensity={0.25} color="#6ec9ff" />
        {overfill > 0 && <pointLight position={[0, 8, 2]} intensity={1.2} color="#ff6666" distance={24} />}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#0c1526" roughness={1} />
        </mesh>

        <Grid args={[160, 160]} cellSize={1.4} sectionThickness={1} sectionColor="#143261" cellColor="#0b1a33" infiniteGrid />

        <group position={[0, 0, 0]}>
          <NapaStoreFront />

          <mesh position={[0, fillHeight / 2, 0]} castShadow>
            <boxGeometry args={[STORE_HALF_WIDTH * 1.8, fillHeight, STORE_DEPTH * 1.8]} />
            <meshStandardMaterial
              color={overfill > 0 ? "#471320" : "#123356"}
              transparent
              opacity={overfill > 0 ? 0.42 : 0.32}
              emissive={overfill > 0 ? "#ff5c73" : "#0ea5e9"}
              emissiveIntensity={overfill > 0 ? 0.55 : 0.28}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>

          {columns.map(({ category, x, baseHeight, overfillHeight, totalHeight }) => {
            const isTarget = activeAction?.targetCategory === category.name;
            const isSource = activeAction?.sourceCategory === category.name;
            return (
              <group key={category.name} position={[x, 0, 2]}>
              <mesh position={[0, baseHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.2, baseHeight, 3.2]} />
                <meshStandardMaterial
                  color={catColor(category.name)}
                  emissive={catColor(category.name)}
                  emissiveIntensity={isTarget ? 0.9 : isSource ? 0.6 : 0.45}
                  roughness={0.35}
                  metalness={isTarget ? 0.35 : 0.2}
                />
              </mesh>

              {overfillHeight > 0 && (
                <mesh position={[0, baseHeight + overfillHeight / 2, 0]} castShadow>
                  <boxGeometry args={[3.2, overfillHeight, 3.2]} />
                  <meshStandardMaterial color="#f87171" emissive="#f87171" emissiveIntensity={0.7} transparent opacity={0.85} />
                </mesh>
              )}

              <mesh position={[0, 0.35, 0]} receiveShadow>
                <boxGeometry args={[3.4, 0.7, 3.4]} />
                <meshStandardMaterial color={isTarget ? "#1c335f" : isSource ? "#341830" : "#0c1628"} />
              </mesh>

              <Text
                position={[0, totalHeight + 0.9, 0]}
                fontSize={0.55}
                color={isTarget ? "#9cd3ff" : isSource ? "#f9b4c7" : "#e7f4ff"}
                anchorX="center"
                anchorY="middle"
              >
                {category.name} {(category.pct * 100).toFixed(0)}%
              </Text>
            </group>
            );
          })}
        </group>

        <group position={[0, 0, 0]}>
          <Text position={[0, 11.6, 0]} fontSize={1.05} color="#f8fbff" anchorX="center" anchorY="middle">
            Inventory Health {inventoryHealth}
          </Text>

          <mesh position={[0, 10.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.6, 5.6, 128]} />
            <meshStandardMaterial color={haloColor} transparent opacity={0.35} emissive={haloColor} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 10.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[5.7, 6.4, 128]} />
            <meshStandardMaterial color={haloColor} transparent opacity={0.25} emissive={haloColor} emissiveIntensity={0.35} />
          </mesh>
        </group>

        <Text position={[0, 0.3, 10]} fontSize={0.65} color="#84b3ff" anchorX="center" anchorY="middle">
          Orbit + scroll to navigate bays
        </Text>

        <OrbitControls
          minDistance={18}
          maxDistance={72}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={(2 * Math.PI) / 3}
          target={[0, 4, 0]}
        />
      </Canvas>
    </div>
  );
}
