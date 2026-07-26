# Roadmap

Milestones for the Next.js rebuild. Check off as completed; keep this in sync with
`docs/changelog.md`.

- [x] **M1 — Architecture & design system.** Next.js scaffold merged into the repo,
      TypeScript strict, Tailwind 4 theme tokens, self-hosted fonts, global shell (nav,
      footer, cursor, smooth scroll), docs suite created.
- [x] **M2 — Scene 1: cinematic intro + hero.** Typed-line intro, headline reveal,
      reduced-motion fallback.
- [ ] **M3 — Scenes 2–5: construction story.** Blueprint → foundation → frame → glass,
      pinned ScrollTrigger sections, real tech-stack labels.
- [ ] **M4 — Scene 6: project showcase.** Velar and MapLayer as immersive "floors."
- [ ] **M5 — Scene 7 + supporting sections.** About, services, testimonial, contact,
      footer wiring.
- [ ] **M6 — Blog migration + polish.** Blog list/post routes, SEO metadata, sitemap/
      robots, accessibility pass, performance pass (image sizes, Lighthouse), final
      build.

## Deliberately out of scope (unless asked)

- Three.js / WebGL — the master brief allows it "only if it genuinely enhances the
  experience"; the construction narrative is being built with 2D SVG/CSS + GSAP
  ScrollTrigger first because it's more reliably performant, and revisited only if that
  turns out not to deliver the intended depth.
- A CMS for the blog — intentionally file-based, matching the previous site.
