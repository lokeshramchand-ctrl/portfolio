"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    gsap.set([dot, ring], { opacity: 1 });

    const ringX = gsap.quickTo(ring, "x", {
      duration: 0.5,
      ease: "power3.out",
    });
    const ringY = gsap.quickTo(ring, "y", {
      duration: 0.5,
      ease: "power3.out",
    });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const onEnterInteractive = () =>
      gsap.to(ring, { scale: 2.2, duration: 0.3 });
    const onLeaveInteractive = () => gsap.to(ring, { scale: 1, duration: 0.3 });

    window.addEventListener("pointermove", onMove);
    const interactive = document.querySelectorAll(
      'a, button, [data-cursor="hover"]',
    );
    interactive.forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive);
      el.addEventListener("mouseleave", onLeaveInteractive);
    });

    document.documentElement.classList.add("cursor-none-custom");

    return () => {
      window.removeEventListener("pointermove", onMove);
      interactive.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
      });
      document.documentElement.classList.remove("cursor-none-custom");
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80]"
      aria-hidden="true"
    >
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -mt-3.5 -ml-3.5 h-7 w-7 rounded-full border border-paper-500/60 opacity-0"
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -mt-0.5 -ml-0.5 h-1 w-1 rounded-full bg-amber-400 opacity-0"
      />
    </div>
  );
}
