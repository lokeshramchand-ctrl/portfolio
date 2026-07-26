"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { materials } from "@/lib/data";

type Stage = {
  eyebrow: string;
  heading: string;
  body: string;
  tags: string[];
};

const stages: Stage[] = [
  {
    eyebrow: "Stage 01 — Blueprint",
    heading: "Every build starts as a drawing.",
    body: "Before a line of code ships, there’s a plan: how the pieces fit, where the load goes, what happens when a wall needs to move. That habit — designing the system before building it — came first.",
    tags: materials.blueprint,
  },
  {
    eyebrow: "Stage 02 — Foundation",
    heading: "Then the foundation gets poured.",
    body: "Learning to program meant pouring the same concrete a hundred times until it set right — syntax, data structures, the languages a system actually stands on.",
    tags: materials.foundation,
  },
  {
    eyebrow: "Stage 03 — Frame",
    heading: "Steel goes up, systems connect.",
    body: "A frontend without a backend is scaffolding. The frame is where APIs, services, and infrastructure start carrying real weight together.",
    tags: materials.frame,
  },
  {
    eyebrow: "Stage 04 — Glass & Light",
    heading: "Then it gets finished.",
    body: "The last pass is where craft shows: performance, resilience, the details nobody notices unless they’re missing. This is where projects move from working to shipped.",
    tags: materials.glass,
  },
];

const COLUMN_X = [240, 480, 720];
const COLUMN_TOP = 160;
const COLUMN_BOTTOM = 560;
const BEAM_Y = [440, 320, 200];
const BEAM_LENGTH = 240;
const COLUMN_LENGTH = COLUMN_BOTTOM - COLUMN_TOP;

export default function ConstructionStory() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const root = rootRef.current;
    if (!wrapper || !root) return;

    const gridLines = gsap.utils.toArray<SVGLineElement>(
      root.querySelectorAll(".grid-line"),
    );
    const columns = gsap.utils.toArray<SVGLineElement>(
      root.querySelectorAll(".column-line"),
    );
    const beams = gsap.utils.toArray<SVGLineElement>(
      root.querySelectorAll(".beam-line"),
    );
    const panels = gsap.utils.toArray<SVGRectElement>(
      root.querySelectorAll(".glass-panel"),
    );
    const stageEls = stageRefs.current.filter(Boolean) as HTMLDivElement[];

    if (prefersReducedMotion()) {
      gsap.set(gridLines, { opacity: 0.25 });
      gsap.set(columns, { strokeDashoffset: 0 });
      gsap.set(beams, { strokeDashoffset: 0 });
      gsap.set(panels, { opacity: 0.85, scaleY: 1 });
      gsap.set(stageEls, {
        autoAlpha: (i) => (i === stages.length - 1 ? 1 : 0),
      });
      return;
    }

    gsap.set(gridLines, { opacity: 0 });
    gsap.set(columns, { strokeDashoffset: COLUMN_LENGTH });
    gsap.set(beams, { strokeDashoffset: BEAM_LENGTH });
    gsap.set(panels, { opacity: 0, scaleY: 0.85, transformOrigin: "bottom" });
    gsap.set(stageEls, { autoAlpha: (i) => (i === 0 ? 1 : 0) });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
      },
    });

    tl.to(root, { scale: 1.03, duration: 4, ease: "none" }, 0)
      .to(gridLines, { opacity: 0.5, stagger: 0.05, duration: 0.8 }, 0)
      .to(stageEls[0], { autoAlpha: 0, duration: 0.3 }, 0.75)
      .to(stageEls[1], { autoAlpha: 1, duration: 0.3 }, 0.85)

      .to(gridLines, { opacity: 0.12, duration: 0.5 }, 1)
      .to(
        columns,
        {
          strokeDashoffset: 0,
          stagger: 0.15,
          duration: 0.9,
          ease: "power2.out",
        },
        1,
      )
      .to(stageEls[1], { autoAlpha: 0, duration: 0.3 }, 1.75)
      .to(stageEls[2], { autoAlpha: 1, duration: 0.3 }, 1.85)

      .to(
        beams,
        {
          strokeDashoffset: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "power2.out",
        },
        2,
      )
      .to(stageEls[2], { autoAlpha: 0, duration: 0.3 }, 2.75)
      .to(stageEls[3], { autoAlpha: 1, duration: 0.3 }, 2.85)

      .to(
        panels,
        {
          opacity: 0.85,
          scaleY: 1,
          stagger: 0.08,
          duration: 1,
          ease: "power2.out",
        },
        3,
      );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      id="story"
      ref={wrapperRef}
      className="relative h-[400vh] bg-void-950"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div ref={rootRef} className="relative h-full w-full">
          <svg
            className="story-svg absolute inset-0 h-full w-full"
            viewBox="0 0 960 600"
            preserveAspectRatio="xMidYMax meet"
            aria-hidden="true"
          >
            {Array.from({ length: 17 }, (_, i) => i * 60).map((x) => (
              <line
                key={`gv-${x}`}
                className="grid-line"
                x1={x}
                y1={0}
                x2={x}
                y2={600}
                stroke="var(--color-blueprint-500)"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 11 }, (_, i) => i * 60).map((y) => (
              <line
                key={`gh-${y}`}
                className="grid-line"
                x1={0}
                y1={y}
                x2={960}
                y2={y}
                stroke="var(--color-blueprint-500)"
                strokeWidth={1}
              />
            ))}

            {COLUMN_X.map((x) => (
              <line
                key={`col-${x}`}
                className="column-line"
                x1={x}
                y1={COLUMN_BOTTOM}
                x2={x}
                y2={COLUMN_TOP}
                stroke="var(--color-paper-400)"
                strokeWidth={3}
                strokeDasharray={COLUMN_LENGTH}
              />
            ))}

            {BEAM_Y.map((y) =>
              [0, 1].map((seg) => (
                <line
                  key={`beam-${y}-${seg}`}
                  className="beam-line"
                  x1={COLUMN_X[seg]}
                  y1={y}
                  x2={COLUMN_X[seg + 1]}
                  y2={y}
                  stroke="var(--color-amber-500)"
                  strokeWidth={3}
                  strokeDasharray={BEAM_LENGTH}
                />
              )),
            )}

            {[COLUMN_BOTTOM, ...BEAM_Y].slice(0, -1).map((yBottom, floor) => {
              const yTop = [...BEAM_Y, COLUMN_TOP][floor];
              return [0, 1].map((bay) => (
                <rect
                  key={`glass-${floor}-${bay}`}
                  className="glass-panel"
                  x={COLUMN_X[bay] + 10}
                  y={yTop + 8}
                  width={COLUMN_X[bay + 1] - COLUMN_X[bay] - 20}
                  height={yBottom - yTop - 16}
                  fill="var(--color-amber-400)"
                  fillOpacity={0.12}
                  stroke="var(--color-amber-400)"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                />
              ));
            })}
          </svg>

          <div className="padding-x pointer-events-none absolute inset-x-0 bottom-16 md:bottom-24">
            <div className="relative min-h-40 max-w-lg">
              {stages.map((stage, i) => (
                <div
                  key={stage.heading}
                  ref={(el) => {
                    stageRefs.current[i] = el;
                  }}
                  className="absolute inset-0"
                >
                  <p className="font-mono text-xs tracking-widest text-blueprint-400 uppercase">
                    {stage.eyebrow}
                  </p>
                  <h3 className="font-title heading-3 mt-3 text-paper-500">
                    {stage.heading}
                  </h3>
                  <p className="mt-4 max-w-md text-paper-200">{stage.body}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {stage.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-paper-500/15 px-3 py-1 font-mono text-xs text-paper-300"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
