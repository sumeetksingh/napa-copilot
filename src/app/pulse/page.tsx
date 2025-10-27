import { Suspense } from "react";
import PulseLanding from "@/components/PulseLanding";

export default function PulsePage() {
  return (
    <div className="relative min-h-screen">
      <Suspense fallback={null}>
        <PulseLanding />
      </Suspense>
    </div>
  );
}
