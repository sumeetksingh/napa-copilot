"use client";
import { useEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D, Color, MeshStandardMaterial } from "three";
import { Text } from "@react-three/drei";
import { catColor } from "@/lib/colors";
import { useStore } from "@/lib/useStore";

/**
 * Renders 3 gondola aisles, each with several shelf units.
 * Boxes are distributed across shelf slots in proportion to category pct.
 *
 * Store interior reference (from NapaStoreFront):
 *   W=28, D=16, H=10 → usable floor ~ W-6 by D-6 (leave margins) 
 */
export default function GondolaAisles({ categories }:{
  categories: {name:string; pct:number}[];
}) {
  const { highlight, filters } = useStore();

  // ---- Shelf layout (feel free to tweak)
  const usableW = 22;               // interior free width
  const usableD = 10;               // interior free depth
  const aisles = 3;
  const unitsPerAisle = 5;
  const unitW = usableW / (unitsPerAisle + 0.5);   // width per unit
  const unitD = 0.6;
  const unitH = 2.0;
  const shelfLevels = 4;            // rows vertically per unit
  const slotsPerLevel = 4;          // columns horizontally per unit

  // Aisle z positions (front → back): push toward back wall a bit
  const aisleZ: number[] = Array.from({length: aisles}, (_,i)=>{
    const start = -usableD/2 + 1.2;
    const step  = (usableD-1.8) / (aisles-1 || 1);
    return start + i*step;
  });

  // Unit x positions left→right, centered
  const unitX: number[] = Array.from({length: unitsPerAisle}, (_,i)=>{
    const span = usableW - unitW;      // small margins
    return -span/2 + i*(span/(unitsPerAisle-1 || 1));
  });

  // Compute all "slots" (world positions) for boxes
  const slots = useMemo(()=>{
    const arr: {x:number;y:number;z:number}[] = [];
    aisleZ.forEach(z=>{
      unitX.forEach(x=>{
        for(let lvl=0; lvl<shelfLevels; lvl++){
          for(let col=0; col<slotsPerLevel; col++){
            const px = x - unitW/2 + (col+0.5)*(unitW/slotsPerLevel);
            const py = 0.25 + (lvl+1)*(unitH/(shelfLevels+1));
            const pz = z;
            arr.push({x:px, y:py, z:pz});
          }
        }
      });
    });
    return arr;
  }, [aisleZ, unitX, shelfLevels, slotsPerLevel, unitH, unitW]);

  // Decide how many boxes per category (cap by available slots)
  const totalSlots = slots.length;
  const norm = categories.reduce((s,c)=>s+c.pct, 0) || 1;
  const counts = categories.map(c => ({
    name: c.name,
    n: Math.max(1, Math.round((c.pct / norm) * totalSlots))
  }));
  // Normalize to exactly totalSlots
  let diff = totalSlots - counts.reduce((s,c)=>s+c.n,0);
  // adjust by adding/removing from 'Other' or first
  while (diff !== 0) {
    const idx = diff > 0
      ? counts.findIndex(c=>c.name==="Other") >= 0 ? counts.findIndex(c=>c.name==="Other") : 0
      : counts.findIndex(c=>c.n>1);
    if (idx < 0) break;
    counts[idx].n += (diff>0? 1:-1);
    diff += (diff>0? -1:1);
  }

  // Build "assignments": which slot gets which category
  const assignments = useMemo(()=>{
    const order: {slot:number; cat:string}[] = [];
    // interleave categories to avoid big blocks (looks nicer)
    const pool: {cat:string; remaining:number}[] = counts.map(c=>({cat:c.name, remaining:c.n}));
    for (let i=0;i<totalSlots;i++){
      // pick the category with highest remaining, but rotate
      pool.sort((a,b)=>b.remaining - a.remaining);
      const pick = pool.find(p=>p.remaining>0);
      if (!pick) break;
      order.push({slot:i, cat:pick.cat});
      pick.remaining -= 1;
      // rotate pool a bit
      pool.push(pool.shift()!);
    }
    return order;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSlots, JSON.stringify(counts)]);

  // Centroids per category for floating labels
  const centroids = useMemo(()=>{
    const acc = new Map<string,{sx:number;sy:number;sz:number;n:number}>();
    assignments.forEach(a=>{
      const s = slots[a.slot];
      const key = a.cat;
      if (!acc.has(key)) acc.set(key, {sx:0,sy:0,sz:0,n:0});
      const v = acc.get(key)!;
      v.sx += s.x; v.sy += s.y; v.sz += s.z; v.n += 1;
    });
    return Array.from(acc.entries()).map(([name,v])=>({
      name, x:v.sx/v.n, y:v.sy/v.n + 0.45, z:v.sz/v.n
    }));
  }, [assignments, slots]);

  // ---- INSTANCED BOXES ----
  const boxRef = useRef<InstancedMesh | null>(null);
  const dummy = useMemo(()=>new Object3D(),[]);
  const colors = useMemo(()=>assignments.map(a=>new Color(catColor(a.cat))),[assignments]);

  // prepare matrices/colors once
  useEffect(()=>{
    const mesh = boxRef.current;
    if (!mesh) return;
    assignments.forEach((a,i)=>{
      const s = slots[a.slot];
      const visible = !filters.categories.length || filters.categories.includes(a.cat);
      const h = visible ? 0.28 : 0.18;
      dummy.position.set(s.x, s.y + h/2, s.z);
      dummy.scale.set(0.9, 1, 0.9);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const base = colors[i].clone();
      if (highlight && a.cat === highlight) base.offsetHSL(0,0.25,0.15);
      mesh.setColorAt(i, base);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [assignments, colors, dummy, filters, highlight, slots]);

  // Shelf geometry: side panels + shelves (simple boxes), repeated per unit
  const shelfMaterial = useMemo(()=>new MeshStandardMaterial({ color:"#d8dbe5", roughness:0.7, metalness:0.05 }),[]);
  const supportMaterial = useMemo(()=>new MeshStandardMaterial({ color:"#9aa3b3", roughness:0.5, metalness:0.2 }),[]);

  return (
    <group position={[0,0,0]}>
      {/* Render all shelf units */}
      {aisleZ.map((z, ai)=>(
        <group key={`aisle-${ai}`} position={[0,0,z]}>
          {unitX.map((x, ui)=>(
            <group key={`unit-${ui}`} position={[x,0,0]}>
              {/* side panels */}
              <mesh position={[-unitW/2+0.03, unitH/2+0.3, 0]} material={supportMaterial}>
                <boxGeometry args={[0.06, unitH+0.6, unitD]} />
              </mesh>
              <mesh position={[ unitW/2-0.03, unitH/2+0.3, 0]} material={supportMaterial}>
                <boxGeometry args={[0.06, unitH+0.6, unitD]} />
              </mesh>
              {/* shelves */}
              {Array.from({length: shelfLevels+1}).map((_,si)=>(
                <mesh key={si} position={[0, 0.3 + (si+1)*(unitH/(shelfLevels+1)), 0]} material={shelfMaterial}>
                  <boxGeometry args={[unitW-0.1, 0.06, unitD]} />
                </mesh>
              ))}
              {/* base plinth */}
              <mesh position={[0, 0.15, 0]} material={supportMaterial}>
                <boxGeometry args={[unitW-0.05, 0.3, unitD+0.05]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Virtual boxes */}
      <instancedMesh ref={boxRef} args={[undefined, undefined, assignments.length]}>
        <boxGeometry args={[unitW/slotsPerLevel * 0.8, 0.28, unitD*0.6]} />
        <meshStandardMaterial emissiveIntensity={0.55} metalness={0.2} roughness={0.45} toneMapped={false}/>
      </instancedMesh>

      {/* Floating labels at centroids */}
      <group>
        {centroids.map(c=>{
          const color = catColor(c.name);
          const category = categories.find((entry) => entry.name === c.name);
          const percentLabel = category ? Math.round(category.pct * 100) : 0;
          return (
            <group key={c.name} position={[c.x, c.y + 0.35, c.z]}>
              <Text fontSize={0.55} color={color} outlineColor="#001b2e" outlineWidth={0.02} anchorX="center" anchorY="middle">
                {c.name}
              </Text>
              <Text position={[0,-0.5,0]} fontSize={0.4} color="#ffffff" anchorX="center" anchorY="middle">
                {percentLabel}%
              </Text>
            </group>
          );
        })}
      </group>
    </group>
  );
}
