"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });

    if (prefersReducedMotion()) return;

    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
    });

    return () => trigger.kill();
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[75] h-[2px] bg-paper-500/5"
      aria-hidden="true"
    >
      <div ref={barRef} className="h-full w-full bg-amber-500" />
    </div>
  );
}
