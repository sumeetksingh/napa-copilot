"use client";
import { useMemo, useRef } from "react";
import { Group, InstancedMesh, Object3D, Color } from "three";
import { Text, Edges, ContactShadows } from "@react-three/drei";
import { catColor } from "@/lib/colors";

type Cat = { name:string; pct:number };
type Props = { categories: Cat[], highlight?: string };

export default function StoreBuilding({ categories, highlight }: Props) {
  /**
   * Building shell dimensions (meters-ish)
   */
  const W = 22, H = 9, D = 16;         // outer footprint
  const wall = 0.25;                   // wall thickness
  const floorInset = 0.5;              // slight curb / sidewalk
  const doorW = 3.0, doorH = 2.6;
  const windowW = 4.0, windowH = 2.0;

  /**
   * Derive aisle assignments from category mix:
   * - 6 aisles, front to back; assign length proportional to pct
   */
  const aisles = useMemo(() => {
    const count = 6;
    const depth = D - 2.0;            // inside depth
    const spacing = depth / (count + 1);
    // Repeat categories to fill aisles by weight
    const ordered: string[] = [];
    const total = categories.reduce((s,c)=>s+c.pct, 0) || 1;
    categories.forEach(c => {
      const n = Math.max(1, Math.round((c.pct/total) * count));
      for (let i=0;i<n;i++) ordered.push(c.name);
    });
    while (ordered.length < count) ordered.push("Other");
    return Array.from({length: count}).map((_,i) => ({
      z: -(depth/2) + spacing*(i+1),
      cat: ordered[i] ?? "Other"
    }));
  }, [categories, D]);

  /**
   * Instanced shelves: each aisle = several bays (boxes)
   */
  const instRef = useRef<InstancedMesh>(null!);
  const dummy = useMemo(()=>new Object3D(),[]);
  const shelvesCount = 6 * 8; // 6 aisles * 8 bays

  useMemo(() => {
    if (!instRef.current) return;
    let i = 0;
    const bayW = 2.0, bayH = 1.6, bayD = 0.5;
    const runW = W - 4.0; // margin from side walls
    const baysPerRun = 8;
    const startX = -runW/2 + bayW/2;
    const step = runW / (baysPerRun-1);
    aisles.forEach((a) => {
      for (let b=0;b<baysPerRun;b++){
        const x = startX + b*step;
        dummy.position.set(x, bayH/2, a.z);
        dummy.scale.set(1,1,1);
        dummy.updateMatrix();
        instRef.current.setMatrixAt(i, dummy.matrix);
        // color per category; bright if highlighted
        const base = new Color(catColor(a.cat));
        if (highlight && a.cat === highlight) base.offsetHSL(0, 0.25, 0.15);
        instRef.current.setColorAt(i, base);
        i++;
      }
    });
    instRef.current.instanceMatrix.needsUpdate = true;
    (instRef.current.instanceColor as any).needsUpdate = true;
  }, [aisles, dummy, highlight]);

  return (
    <group>
      {/* Ground / sidewalk */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[W+8, D+8]} />
        <meshStandardMaterial color="#0B0F18" />
      </mesh>

      {/* Floor slab inside */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[W - floorInset, D - floorInset]} />
        <meshStandardMaterial color="#1A2032" />
      </mesh>

      {/* Four perimeter walls (simple boxes with cutouts would need CSG; here we fake door/window with glass planes) */}
      {/* Left wall */}
      <mesh position={[-W/2+wall/2, H/2, 0]}>
        <boxGeometry args={[wall, H, D]} />
        <meshStandardMaterial color="#D9DCE3" />
      </mesh>
      {/* Right wall */}
      <mesh position={[W/2-wall/2, H/2, 0]}>
        <boxGeometry args={[wall, H, D]} />
        <meshStandardMaterial color="#D9DCE3" />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, H/2, -D/2+wall/2]}>
        <boxGeometry args={[W, H, wall]} />
        <meshStandardMaterial color="#D9DCE3" />
      </mesh>
      {/* Front fascia (top beam) */}
      <mesh position={[0, H - 1.2, D/2 - wall/2]}>
        <boxGeometry args={[W, 1.0, wall]} />
        <meshStandardMaterial color="#D9DCE3" />
      </mesh>

      {/* Front columns (sides of door area) */}
      <mesh position={[-(doorW/2 + 1.2), H/2 - 0.6, D/2 - wall/2]}>
        <boxGeometry args={[1.0, H-1.2, wall]} />
        <meshStandardMaterial color="#D9DCE3" />
      </mesh>
      <mesh position={[(doorW/2 + 1.2), H/2 - 0.6, D/2 - wall/2]}>
        <boxGeometry args={[1.0, H-1.2, wall]} />
        <meshStandardMaterial color="#D9DCE3" />
      </mesh>

      {/* Glass door */}
      <mesh position={[0, doorH/2, D/2 - wall/2 + 0.005]}>
        <boxGeometry args={[doorW, doorH, 0.02]} />
        <meshPhysicalMaterial color="#89CFF0" transmission={0.85} roughness={0.1} metalness={0.0} thickness={0.05} />
        <Edges scale={1.001} color="#a3cfff" />
      </mesh>

      {/* Front windows */}
      <mesh position={[-(doorW/2 + 2.2), windowH/2 + 0.3, D/2 - wall/2 + 0.005]}>
        <boxGeometry args={[windowW, windowH, 0.02]} />
        <meshPhysicalMaterial color="#89CFF0" transmission={0.85} roughness={0.12} thickness={0.05} />
      </mesh>
      <mesh position={[(doorW/2 + 2.2), windowH/2 + 0.3, D/2 - wall/2 + 0.005]}>
        <boxGeometry args={[windowW, windowH, 0.02]} />
        <meshPhysicalMaterial color="#89CFF0" transmission={0.85} roughness={0.12} thickness={0.05} />
      </mesh>

      {/* Roof overhang */}
      <mesh position={[0, H+0.15, D/2 + 0.2]} rotation={[-Math.PI/18, 0, 0]}>
        <boxGeometry args={[W+0.5, 0.12, 2.0]} />
        <meshStandardMaterial color="#C9CCD2" />
      </mesh>

      {/* Lit sign */}
      <Text position={[0, H+0.8, D/2 + 0.6]} fontSize={1.1} color="#FFFFFF" anchorX="center" anchorY="middle">
        NAPA STORE
      </Text>

      {/* Interior shelves (instances) */}
      <instancedMesh ref={instRef as any} args={[undefined, undefined, shelvesCount]}>
        <boxGeometry args={[2.0, 1.6, 0.5]} />
        <meshStandardMaterial emissiveIntensity={0.35} metalness={0.2} roughness={0.45} />
      </instancedMesh>

      {/* Soft shadows */}
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={40} blur={2} far={12} />
    </group>
  );
}
