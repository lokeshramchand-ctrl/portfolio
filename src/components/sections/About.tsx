"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { aboutCopy, services, siteConfig } from "@/lib/data";

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const items = section.querySelectorAll("[data-reveal]");
    gsap.set(items, { autoAlpha: 0, y: 30 });
    gsap.to(items, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        toggleActions: "play none none none",
      },
    });
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative border-t border-paper-500/10"
    >
      <div className="padding-x padding-y grid gap-16 lg:grid-cols-[1fr_1.3fr]">
        <div data-reveal>
          <p className="font-mono text-sm text-amber-400">
            Who&rsquo;s building /
          </p>
          <h2 className="font-title heading-2 mt-3 text-paper-500">
            Software Engineer
          </h2>
          <div className="relative mt-8 aspect-[4/5] max-w-sm overflow-hidden rounded-lg bg-void-800">
            <Image
              src="/images/profile.webp"
              alt="Headshot of Lokesh Ram Chand B facing the camera"
              fill
              sizes="(min-width: 1024px) 24rem, 80vw"
              className="object-cover"
            />
          </div>
        </div>

        <div>
          <p data-reveal className="heading-body max-w-xl text-paper-300">
            {aboutCopy.intro}
          </p>
          <div data-reveal className="mt-8 max-w-xl space-y-5 text-paper-200">
            {aboutCopy.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>

          <p data-reveal className="font-mono text-sm text-amber-400 mt-16">
            What I do /
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.number}
                data-reveal
                className="rounded-lg border border-paper-500/10 p-6"
              >
                <p className="font-mono text-xs text-paper-100">
                  {service.number}
                </p>
                <h3 className="font-title heading-5 mt-2 text-paper-500">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm text-paper-300">{service.body}</p>
                <ul className="mt-4 space-y-1">
                  {service.headings.map((h) => (
                    <li key={h} className="text-xs text-paper-100">
                      · {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p data-reveal className="mt-12 font-mono text-xs text-paper-100">
            {siteConfig.locationCountry} — {siteConfig.locationPlace}
          </p>
        </div>
      </div>
    </section>
  );
}
