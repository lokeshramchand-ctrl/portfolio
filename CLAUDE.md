# CLAUDE.md

Guidance for Claude Code (or any future engineer) working in this repository.

## Framework note

This project runs **Next.js 16**, which has real breaking changes versus older training
data — most relevantly: `params`/`searchParams` in pages are `Promise`s and must be
`await`ed, `next lint` doesn't exist (this repo uses the ESLint CLI directly via
`npm run lint`), and Turbopack is the default bundler for both `dev` and `build`. Before
assuming an App Router API works the way you remember, check
`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.

## Project vision

This is Lokesh Ram Chand B's developer portfolio, rebuilt as a single scroll-driven
narrative: the visitor watches a building go up, and the building _is_ the story of
becoming a software engineer. Darkness and a blinking cursor give way to blueprints,
foundations, structural steel, glass and lighting, occupied floors (the projects), and
finally a finished building overlooking the city (contact). Every section maps to a real
stage of construction **and** a real stage of engineering practice — the metaphor is not
decorative, it is the information architecture.

The bar is a portfolio that reads as handcrafted, not templated: no generic SaaS-landing
patterns, no glassmorphism-for-its-own-sake, no motion that doesn't communicate something.

## Design philosophy

- **One accent, used sparingly.** The palette is void-black, blueprint-paper white/grey,
  one warm accent (amber, `--color-amber-*`) and one cold accent (blueprint blue,
  `--color-blueprint-*`) reserved for the early construction-document scenes. See
  `docs/design-system.md`.
- **Typography carries the hierarchy.** `font-title` (CabinetGrotesk, self-hosted) for
  display/headings, `font-body` (Switzer, self-hosted) for reading copy, `font-fancy`
  (Bricolage Grotesque, via `next/font/google`) reserved for small accent/annotation text
  only — it should never be the primary voice of a section.
- **No placeholder copy, ever.** Every sentence on the site is either factual (real
  projects, real testimonial, real bio) or a deliberate authored line for the construction
  narrative. See `docs/content.md` for the source of truth on facts.

## Architecture rules

- Next.js App Router, TypeScript strict mode, Tailwind CSS 4 (`@theme` in
  `src/app/globals.css`, no `tailwind.config.js`).
- `src/lib/data.ts` is the single source of truth for content (nav, projects, services,
  bio, testimonial, contact). Components read from it; they do not hardcode copy.
- `src/lib/gsap.ts` centralizes GSAP plugin registration (`registerGsap()` runs once, at
  module load, on the client) — components import `gsap`/`ScrollTrigger` from here, never
  straight from the `gsap` package, so registration is never a race condition.
- `src/components/providers/SmoothScroll.tsx` owns the single Lenis instance and drives
  it from the GSAP ticker (`gsap.ticker.add`), so Lenis and ScrollTrigger stay in sync.
  Don't create a second Lenis instance anywhere else.
- Scene/section components live in `src/components/sections/`; shared chrome (nav,
  footer, cursor) lives in `src/components/design/` and `src/components/common/`.
- Route-level content (blog posts) is fetched from `public/blogs/*.md` at runtime and
  rendered with `marked`, mirroring the previous site's approach — no CMS. Remember
  `params` is async in the `[slug]` route (Next 16).

## Animation philosophy

- Every animation maps to a beat in the construction story — if you can't say what a
  motion communicates in one sentence, cut it.
- Entrance timelines: hidden state set with `gsap.set`, revealed either on a scroll
  trigger (`ScrollTrigger`) or as part of a scene's own timeline.
- Always provide a `prefers-reduced-motion` branch (`prefersReducedMotion()` from
  `src/lib/gsap.ts`) that sets the final state immediately with no motion, instead of
  skipping the section.
- Never block scroll longer than a single intro beat. `document.body` gets
  `overflow-hidden` only during the opening cinematic and is released as soon as it ends
  or on unmount.
- See `docs/animations.md` for the scene-by-scene motion spec.

## Coding standards

- TypeScript strict; no `any`. Components are typed function components, data flows
  through props from `src/lib/data.ts`.
- Client components are marked `'use client'` only where they need browser APIs
  (animation, scroll, time) — sections that are pure markup stay server components.
- Tailwind utility classes only; no ad-hoc inline styles except where a value must come
  from JS (e.g. GSAP-driven transforms).
- Run `npx prettier --write .` before committing if formatting drifts.

## Accessibility rules

- Respect `prefers-reduced-motion` everywhere motion is added (see above).
- Custom cursor (`Cursor.tsx`) only replaces the system cursor on fine-pointer,
  non-reduced-motion devices; it never removes default focus or hover affordances.
- Maintain visible `:focus-visible` styling (defined globally in `globals.css`).
- Color contrast: body text stays on `paper-400`/`paper-500` against `void-*`
  backgrounds; never drop to `paper-100`/`paper-200` for body copy, only for secondary
  labels.
- All interactive elements are real `<a>`/`<button>` elements — no click handlers on
  `<div>`s.

## Performance requirements

- Target Lighthouse 90+ across the board.
- Project preview videos (`public/videos/*.webm`) are muted, lazy, and paused off-screen.
- Images go through `next/image` wherever practical; the two project stills
  (`velar.webp`, `maplayer.webp`) are large source assets — resize/compress before
  shipping if Lighthouse flags them.
- Fonts are self-hosted (`next/font/local`) except Bricolage Grotesque, which Next
  self-hosts automatically via `next/font/google` (no runtime Google Fonts request).

## Component guidelines

- New sections go in `src/components/sections/`, imported directly (no barrel) since
  each is used exactly once on the home page — don't add an index barrel until there's a
  second consumer.
- Reusable primitives (magnetic buttons, section headings) go in `src/components/common/`.
- Every new component that renders copy must source that copy from `src/lib/data.ts`, not
  inline strings, unless the copy is structural narration for the construction scenes (in
  which case it lives inline in the scene component, since it's a one-off).

## Git workflow

- Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`,
  `refactor(scope): ...`).
- Commit at the end of each milestone (see `docs/roadmap.md`), after `lint` and
  `typecheck`/`build` pass.
- This rebuild lives on the `nextjs-rebuild` branch; `main`/`ui-changes` hold the previous
  Vue site untouched until the user decides to merge.
- Never force-push, rebase-with-history-rewrite, or delete branches without explicit
  instruction.

## Documentation workflow

Whenever a real design or engineering decision is made, update in the same commit:

- `docs/decisions.md` — the decision and why.
- `docs/changelog.md` — a one-line entry.
- This file, if the decision changes a rule above.

`docs/roadmap.md`, `docs/architecture.md`, `docs/animations.md`, `docs/content.md`, and
`docs/components.md` are updated as those areas of the project change, not on every
commit.

## Rules for future Claude sessions

- Read `docs/content.md` before writing any copy — it is the authoritative list of real
  facts (projects, bio, testimonial, contact info). Do not invent projects, metrics, or
  quotes.
- Read `docs/decisions.md` before re-litigating a design choice that's already been made.
- This is a from-scratch rebuild of a previous Vue 3 site (still intact on the
  `ui-changes` branch) — do not go looking for the old `src/` structure; it no longer
  exists on this branch.
