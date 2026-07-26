"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { projects, type Project } from "@/lib/data";

function Floor({ project, index }: { project: Project; index: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const reduced = prefersReducedMotion();

    if (reduced) {
      gsap.set(content, { autoAlpha: 1, y: 0 });
    } else {
      gsap.set(content, { autoAlpha: 0, y: 40 });
      gsap.to(content, {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });
    }

    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-end overflow-hidden border-t border-paper-500/10"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        src={project.video}
        poster={project.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/70 to-void-950/20" />

      <div
        ref={contentRef}
        className="padding-x relative w-full pb-20 md:pb-28"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs tracking-widest text-amber-400 uppercase">
              {project.floor} — {project.category}
            </p>
            <h3 className="font-title heading-1 mt-3 text-paper-500">
              {project.name}
            </h3>
            <p className="mt-5 max-w-xl text-lg text-paper-200">
              {project.description}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-paper-500/15 px-3 py-1 font-mono text-xs text-paper-300"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-6 md:flex-col md:items-end md:text-right">
            <p className="font-mono text-sm text-paper-100">{project.year}</p>
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="hover"
              className="inline-flex items-center gap-2 rounded-full border border-paper-500/20 px-5 py-2.5 text-sm text-paper-300 transition-colors hover:border-amber-400 hover:text-amber-400"
            >
              View repository ↗
            </a>
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute top-10 right-6 font-mono text-8xl leading-none font-bold text-paper-500/5 md:right-12 md:text-9xl">
        {String(index + 1).padStart(2, "0")}
      </p>
    </section>
  );
}

export default function Works() {
  return (
    <section id="work" className="relative bg-void-950">
      <div className="padding-x padding-y">
        <p className="font-mono text-sm text-amber-400">Occupied floors /</p>
        <h2 className="font-title heading-2 mt-3 max-w-2xl text-paper-500">
          Two floors, both load-bearing.
        </h2>
      </div>
      {projects.map((project, i) => (
        <Floor key={project.slug} project={project} index={i} />
      ))}
    </section>
  );
}
