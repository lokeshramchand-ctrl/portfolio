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

          <p data-reveal className="mt-16 font-mono text-sm text-amber-400">
            Systems schedule /
          </p>
          <div className="mt-6 border-t border-paper-500/10">
            {services.map((service) => (
              <div
                key={service.number}
                data-reveal
                className="group grid gap-3 border-b border-paper-500/10 py-8 md:grid-cols-[4rem_1fr_1fr] md:gap-8"
              >
                <p className="font-mono text-3xl text-paper-500/15 transition-colors group-hover:text-amber-400">
                  {service.number}
                </p>
                <div>
                  <h3 className="font-title heading-5 text-paper-500">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm text-paper-300">{service.body}</p>
                </div>
                <ul className="flex flex-wrap content-start gap-x-2 gap-y-2 md:justify-end">
                  {service.headings.map((h) => (
                    <li
                      key={h}
                      className="h-fit rounded-full border border-paper-500/15 px-3 py-1 font-mono text-xs whitespace-nowrap text-paper-100"
                    >
                      {h}
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
