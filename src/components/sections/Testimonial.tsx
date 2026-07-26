"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { testimonial } from "@/lib/data";

export default function Testimonial() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const el = section.querySelector("[data-reveal]");
    if (!el) return;
    gsap.set(el, { autoAlpha: 0, y: 24 });
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        toggleActions: "play none none none",
      },
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative border-t border-paper-500/10">
      <div className="padding-x padding-y">
        <p className="font-mono text-sm text-amber-400">
          Don&rsquo;t take my word for it /
        </p>
        <div
          data-reveal
          className="mt-8 flex flex-col items-start gap-6 sm:flex-row"
        >
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-void-800">
            <Image
              src={testimonial.photo}
              alt={`Portrait of ${testimonial.author}`}
              fill
              sizes="4rem"
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-title heading-4 max-w-2xl text-paper-500">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <p className="mt-4 text-sm text-paper-200">
              {testimonial.author}{" "}
              <span className="text-paper-100">— {testimonial.role}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
