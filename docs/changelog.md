# Changelog

Newest first. One line per meaningful change; see `docs/decisions.md` for the reasoning
behind non-obvious ones.

## 2026-07-26

- feat(blog): migrate blog list + post routes to Next.js (async `params` per Next 16),
  reading `public/blogs/*.md` server-side and rendering with `marked`; add
  `sitemap.ts`/`robots.ts`.
- fix(a11y): correct heading hierarchy in the construction story (h3→h2), mark
  decorative intro overlay `aria-hidden`.
- perf(images): recompress `velar.webp`/`maplayer.webp` from 6000px source
  (1.9–2.4MB) down to 1920px/quality-78 webp (28–108KB); fix `manifest.json`
  placeholder trailing space and light theme colors (site is dark-first).
- feat(story): construction narrative (Scenes 2–5) — pinned SVG elevation
  (blueprint grid → foundation columns → steel frame → glass panels) scrubbed by one
  GSAP timeline, paired with real tech-stack labels and authored narrative copy.
- feat: project showcase (Velar, MapLayer as full-viewport "floors"), about/services,
  testimonial (Danielle Lindamood only), and contact (Scene 7) sections.
- docs: initial `docs/` suite and rewritten `CLAUDE.md` for the Next.js rebuild.
- feat(hero): cinematic typed-line intro + hero headline reveal (Scene 1), with
  reduced-motion fallback.
- feat(shell): root layout with self-hosted fonts (CabinetGrotesk, Switzer, Bricolage
  Grotesque), real SEO metadata, `SmoothScroll` (Lenis + GSAP ticker) provider, custom
  cursor, nav, footer with live dual clocks.
- feat(design-system): Tailwind 4 `@theme` tokens — "Site & Blueprint" palette, fluid
  type scale, spacing/breakpoint utilities.
- chore: scaffolded Next.js 16 (App Router, TS strict, Tailwind 4, Turbopack) in place
  of the previous Vue 3 site on the new `nextjs-rebuild` branch; real content assets
  (images, videos, fonts, blog markdown) migrated into `public/`/`src/assets/`.
