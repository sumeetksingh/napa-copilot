"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import IntroOverlay from "@/components/IntroOverlay";

const DEFAULT_STORE = "atl_012";

export default function PulseLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showIntro, setShowIntro] = useState(true);
  const [initialPersona, setInitialPersona] = useState<"joe" | "planner">("joe");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const forceIntro = searchParams?.get("persona") === "choose";
    if (forceIntro) {
      sessionStorage.removeItem("pulse.lastPersona");
    }

    const lastPersona = sessionStorage.getItem("pulse.lastPersona") as "joe" | "planner" | null;
    if (lastPersona) {
      setInitialPersona(lastPersona);
    }
    setShowIntro(true);
  }, [searchParams]);

  const handleDismiss = (persona: "joe" | "planner") => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pulse.lastPersona", persona);
    }
    setShowIntro(false);
    if (persona === "joe") {
      router.replace("/pulse/dashboard");
    } else {
      router.replace(`/pulse/store/${DEFAULT_STORE}`);
    }
  };

  return showIntro ? <IntroOverlay initialPersona={initialPersona} onDismiss={handleDismiss} /> : null;
}
