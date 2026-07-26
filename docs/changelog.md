# Changelog

Newest first. One line per meaningful change; see `docs/decisions.md` for the reasoning
behind non-obvious ones.

## 2026-07-26

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
