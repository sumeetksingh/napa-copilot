"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import NapaStoreFront from "@/components/NapaStoreFront";
import StackedBars3D from "@/components/StackedBars3D";

export default function Scene({ summary }:{ summary:any }) {
  return (
    <div className="h-[72vh] w-full rounded-2xl overflow-hidden bg-[#0a0f18] ring-1 ring-[#163162]">
      <Canvas shadows camera={{ position: [22, 12, 30], fov: 42 }}>
        {/* clean background, no fog, no HDRI */}
        <color attach="background" args={["#0a0f18"]} />

        {/* crisp lighting */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[18, 22, 12]} intensity={1.0} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <directionalLight position={[-12, 10, -8]} intensity={0.25} />

        {/* matte ground so the store pops */}
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#0e1624" roughness={1} metalness={0} />
        </mesh>

        {/* subtle grid for depth */}
        <Grid args={[140,140]} cellSize={1.6} sectionColor="#18345f" cellColor="#0c1a33" infiniteGrid />

        {/* store */}
        <NapaStoreFront />

        {/* stacked bar pillar OUTSIDE (store extends to x≈±14) */}
        <StackedBars3D categories={summary.categories} position={[18, 0.6, -2]} height={9} width={2.2} />

        <Text position={[0, 11.2, -6]} fontSize={0.9} color="#FFFFFF" anchorX="center" anchorY="middle">
          NAPA • Inventory (store + stacked mix)
        </Text>

        <OrbitControls minDistance={18} maxDistance={80} target={[0,4,0]} />
      </Canvas>
    </div>
  );
}
