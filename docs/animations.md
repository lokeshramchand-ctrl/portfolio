# Animation spec — scene by scene

Every scene's motion is described here as (a) what it communicates and (b) how it's
built. Update this file whenever a scene's motion changes materially.

## Scene 1 — Intro (`Hero.tsx`)

**Communicates:** the moment before anything exists; a single line typed as if by hand
establishes "someone is here, building."

**Build:** full-screen `void-950` overlay, GSAP `TextPlugin` types `"I build software."`
character by character over a fixed-width mono cursor, holds, then fades/scales out
(camera push) to reveal the real hero headline underneath. `document.body` gets
`overflow-hidden` for the duration only. `prefers-reduced-motion`: overlay is skipped
entirely (`display: none`), hero content is shown at rest.

## Scenes 2–5 — Construction story (pending)

Planned mapping (see `docs/roadmap.md` for build status):

- **Scene 2 (blueprint):** wireframe/grid lines draw themselves in `blueprint-500`,
  representing the learning phase — pinned section, ScrollTrigger-scrubbed SVG
  `stroke-dashoffset` reveal.
- **Scene 3 (foundation):** columns rise from the baseline as scroll progresses; each
  column is labeled with a core language (TypeScript, Python, Node.js) — represents
  learning to program.
- **Scene 4 (frame):** steel beams connect columns into a full structure; labels shift
  to systems (Backend, Frontend, Cloud, APIs) — represents architecture forming.
- **Scene 5 (glass):** panels of light fade in over the frame — represents polish and
  production experience, transitioning into the projects section.

Each is a pinned `ScrollTrigger` (`scrub: true`) so the story plays out in lockstep with
scroll position, not on a timer — the visitor drives the pace.

## Scene 6 — Projects (pending)

Each project (Velar, MapLayer) is presented as a "floor" of the building rather than a
card grid: full-viewport section, background video, GSAP-driven text/tag reveal on
scroll into view.

## Scene 7 — Contact (pending)

Final beat: the completed structure, city backdrop, single CTA. No further motion
tricks — after six scenes of construction, stillness is the punctuation.

## Cross-cutting rules

- All entrance timelines set an explicit hidden state with `gsap.set` before any
  `ScrollTrigger` is created, to avoid a flash of unstyled/final-state content.
- `prefersReducedMotion()` (from `lib/gsap.ts`) must be checked at the top of every
  scene's effect; the reduced branch sets the final visual state immediately rather than
  hiding the section.
- No animation should re-trigger on every scroll direction change unless it's
  explicitly meant to (most reveals use `toggleActions: 'play none none none'`, i.e.
  play once).
