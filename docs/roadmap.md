# Roadmap

Milestones for the Next.js rebuild. Check off as completed; keep this in sync with
`docs/changelog.md`.

- [x] **M1 — Architecture & design system.** Next.js scaffold merged into the repo,
      TypeScript strict, Tailwind 4 theme tokens, self-hosted fonts, global shell (nav,
      footer, cursor, smooth scroll), docs suite created.
- [x] **M2 — Scene 1: cinematic intro + hero.** Typed-line intro, headline reveal,
      reduced-motion fallback.
- [x] **M3 — Scenes 2–5: construction story.** Blueprint → foundation → frame → glass,
      pinned ScrollTrigger sections, real tech-stack labels.
- [x] **M4 — Scene 6: project showcase.** Velar and MapLayer as immersive "floors."
- [x] **M5 — Scene 7 + supporting sections.** About, services, testimonial, contact,
      footer wiring.
- [x] **M6 — Blog migration + polish.** Blog list/post routes (async `params`, real
      posts migrated, orphaned stub left behind), SEO metadata, `sitemap.ts`/`robots.ts`,
      heading-hierarchy + `aria-hidden` pass on decorative elements, oversized project
      stills recompressed (6000px/1.9–2.4MB → 1920px/28–108KB), clean `tsc`/`eslint`/
      `next build`.

## Next up (not started)

- Visual QA in an actual browser (this build was verified via `tsc`/`eslint`/
  `next build`/SSR HTML + curl, not a rendered browser — no browser tool was available
  in this session).
- Lighthouse run once there's a way to serve the production build and audit it.
- Consider whether the construction-story SVG reads as intended at a range of viewport
  sizes — it's only been reasoned about from the code, not seen.

## Deliberately out of scope (unless asked)

- Three.js / WebGL — the master brief allows it "only if it genuinely enhances the
  experience"; the construction narrative is being built with 2D SVG/CSS + GSAP
  ScrollTrigger first because it's more reliably performant, and revisited only if that
  turns out not to deliver the intended depth.
- A CMS for the blog — intentionally file-based, matching the previous site.
