"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { heroCopy } from "@/lib/data";
import Link from "next/link";
import { siteConfig } from "@/lib/data";

export default function Hero() {
  const introRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const intro = introRef.current;
    const typed = typedRef.current;
    const cursor = cursorRef.current;
    const hero = heroRef.current;
    const words = wordRefs.current.filter(Boolean) as HTMLSpanElement[];

    if (!intro || !typed || !cursor || !hero) return;

    if (reduced) {
      gsap.set(intro, { display: "none" });
      gsap.set(hero, { autoAlpha: 1, y: 0 });
      gsap.set(words, { autoAlpha: 1, y: 0 });
      document.body.classList.remove("overflow-hidden");
      return;
    }

    const text = heroCopy.eyebrow;
    document.body.classList.add("overflow-hidden");

    gsap.set(hero, { autoAlpha: 0 });
    gsap.set(words, { autoAlpha: 0, y: 24 });
    gsap.to(cursor, {
      opacity: 0,
      duration: 0.55,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    const tl = gsap.timeline({
      delay: 0.4,
      onComplete: () => document.body.classList.remove("overflow-hidden"),
    });

    tl.to({}, { duration: 0.6 }) // beat in darkness
      .to(typed, {
        duration: text.length * 0.055,
        text: { value: text },
        ease: "none",
      })
      .to({}, { duration: 0.7 }) // let the line sit
      .to(intro, {
        autoAlpha: 0,
        scale: 1.06,
        duration: 0.9,
        ease: "power2.inOut",
      })
      .set(intro, { display: "none" })
      .fromTo(
        hero,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4, ease: "power1.out" },
        "<",
      )
      .to(
        words,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
        },
        "-=0.3",
      );

    return () => {
      tl.kill();
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      <div
        ref={introRef}
        className="fixed inset-0 z-60 flex items-center justify-center bg-void-950"
      >
        <p className="font-mono text-lg text-paper-400 md:text-2xl">
          <span ref={typedRef} />
          <span
            ref={cursorRef}
            className="ml-1 inline-block h-[1em] w-[0.5em] bg-amber-400 align-middle"
          />
        </p>
      </div>

      <div ref={heroRef} className="padding-x w-full pt-32 pb-20">
        <p className="font-mono text-sm text-amber-400">
          {siteConfig.locationCountry} — Available for work
        </p>
        <h1 className="font-title heading-display mt-6 text-paper-500">
          {heroCopy.headline.map((word, i) => (
            <span key={word} className="block overflow-hidden">
              <span
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                className="block"
              >
                {word}
              </span>
            </span>
          ))}
        </h1>
        <p
          ref={(el) => {
            wordRefs.current[2] = el;
          }}
          className="mt-8 max-w-xl text-lg text-paper-200"
        >
          {heroCopy.sub}
        </p>
        <div
          ref={(el) => {
            wordRefs.current[3] = el;
          }}
          className="mt-10 flex items-center gap-6"
        >
          <Link
            href="#contact"
            className="rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-void-950 transition-transform hover:scale-105"
            data-cursor="hover"
          >
            Let&rsquo;s build something
          </Link>
          <Link
            href="#work"
            className="text-sm text-paper-300 underline decoration-paper-500/30 underline-offset-4 hover:text-amber-400"
            data-cursor="hover"
          >
            See the work
          </Link>
        </div>
      </div>
    </section>
  );
}
