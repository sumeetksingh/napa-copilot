"use client";

import { useEffect, useRef, useState } from "react";

type Persona = "joe" | "planner";

type IntroOverlayProps = {
  onDismiss: (persona: Persona) => void;
  initialPersona?: Persona;
};

const personaConfig: Record<Persona, { name: string; role: string; description: string }> = {
  joe: {
    name: "Joe",
    role: "Super user",
    description: "See the network pulse before drilling into individual stores.",
  },
  planner: {
    name: "A. Planner",
    role: "Inventory planner",
    description: "Jump straight into local store optimization.",
  },
};

export default function IntroOverlay({ onDismiss, initialPersona = "joe" }: IntroOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [closing, setClosing] = useState(false);
  const [persona, setPersona] = useState<Persona>(initialPersona);

  useEffect(() => {
    setPersona(initialPersona);
  }, [initialPersona]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    const fallback = window.setTimeout(() => setVisible(true), 250);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!visible || !videoRef.current) return;
    const video = videoRef.current;

    const handleLoaded = () => {
      setReady(true);
      void video.play().catch(() => {});
    };

    const handleError = () => {
      console.warn("Intro video failed to load; continuing without background video");
      setReady(true);
    };

    if (video.readyState >= 2) {
      handleLoaded();
    } else {
      video.addEventListener("loadeddata", handleLoaded, { once: true });
      video.addEventListener("error", handleError, { once: true });
    }

    return () => {
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("error", handleError);
    };
  }, [visible]);

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => onDismiss(persona), 600);
  };

  return (
    <div
      ref={containerRef}
      className={`intro-overlay ${closing ? "intro-overlay--fade" : ""}`}
      aria-label="Pulse welcome screen"
    >
      <video
        ref={videoRef}
        className={`intro-overlay__video ${ready ? "intro-overlay__video--visible" : ""}`}
        playsInline
        muted
        loop
        preload="auto"
      >
        <source src="/video/pulse.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="intro-overlay__mask" aria-hidden="true" />

      <div className="intro-overlay__content">
        <span className="intro-badge">Pulse Co‑Pilot</span>
        <div className="intro-personas">
          {(["joe", "planner"] as Persona[]).map((key) => {
            const cfg = personaConfig[key];
            const isActive = persona === key;
            return (
              <button
                key={key}
                type="button"
                className={`intro-persona ${isActive ? "intro-persona--active" : ""}`}
                onClick={() => setPersona(key)}
              >
                <span className="intro-persona__name">{cfg.name}</span>
                <span className="intro-persona__role">{cfg.role}</span>
              </button>
            );
          })}
        </div>
        <h1 className="intro-headline">
          Hi <span className="intro-name">{personaConfig[persona].name}</span>, ready to tune this store?
        </h1>
        <p className="intro-subhead">{personaConfig[persona].description}</p>
        <button onClick={handleDismiss} className="intro-cta">
          {persona === "joe" ? "Enter command center" : "Open stores"}
        </button>
        <button onClick={handleDismiss} className="intro-skip">
          Skip intro
        </button>
      </div>
    </div>
  );
}
