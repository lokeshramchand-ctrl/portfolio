"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { siteConfig } from "@/lib/data";
import { useMagnetic } from "@/lib/useMagnetic";

export default function Contact() {
  const magneticRef = useMagnetic<HTMLAnchorElement>();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const el = section.querySelector("[data-reveal]");
    if (!el) return;
    gsap.set(el, { autoAlpha: 0, y: 28 });
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden border-t border-paper-500/10"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-25"
        src="/videos/contact.mp4"
        poster="/images/contact-poster.webp"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-void-950 via-void-950/60 to-void-950" />

      <div data-reveal className="padding-x relative w-full py-32 text-center">
        <p className="font-mono text-sm text-amber-400">
          Complex challenges require intelligent, scalable architectures.
        </p>
        <h2 className="font-title heading-display mx-auto mt-6 max-w-4xl text-paper-500">
          Let&rsquo;s build the next one together.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <a
            ref={magneticRef}
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="hover"
            className="inline-block rounded-full bg-amber-500 px-8 py-4 text-sm font-medium text-void-950"
          >
            Get in touch
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            data-cursor="hover"
            className="text-sm text-paper-300 underline decoration-paper-500/30 underline-offset-4 hover:text-amber-400"
          >
            {siteConfig.email}
          </a>
        </div>
        <p className="mt-16 font-mono text-xs text-paper-100">
          {siteConfig.locationCountry} — Engineering globally
        </p>
      </div>
    </section>
  );
}
