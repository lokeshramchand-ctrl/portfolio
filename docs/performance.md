# Performance

Target: Lighthouse 90+ across Performance/Accessibility/Best Practices/SEO. **Not yet
measured** — no way to run Lighthouse against a served build was available in this
session (no browser tooling). Treat everything below as "designed for," not "verified."

## What's in place

- **Fonts:** self-hosted via `next/font/local` (CabinetGrotesk, Switzer) and
  `next/font/google` (Bricolage Grotesque, self-hosted by Next at build time — no
  runtime request to Google). All use `display: 'swap'`.
- **Images:** `next/image` for the profile and testimonial photos (automatic
  responsive `srcset`, lazy loading below the fold). The two project stills
  (`velar.webp`, `maplayer.webp`) were recompressed from a 6000px source (1.9–2.4MB)
  down to 1920px @ quality 78 (28–108KB) — see `docs/decisions.md`; they're used as
  `<video poster>`, not through `next/image`, since they back a `<video>` element.
- **Video:** project preview clips (`public/videos/*.webm`) and the contact background
  clip use `preload="none"` and are only played while their section intersects the
  viewport (`IntersectionObserver`, 0.4 threshold) — paused immediately off-screen.
- **Animation cost:** all GSAP `ScrollTrigger` work is `scrub`-driven (tied to actual
  scroll position, not `requestAnimationFrame` polling independent of scroll), and the
  `Lenis` instance is driven by `gsap.ticker` rather than its own RAF loop, so there's
  one animation clock for the whole page, not several competing ones.
- **Static generation:** every route (`/`, `/blog`, `/blog/[slug]`, `/sitemap.xml`,
  `/robots.txt`, `/opengraph-image`) is statically prerendered (`○`/`●` in `next build`
  output) — no server-rendering-per-request cost for a portfolio that's fundamentally
  static content.

## Known risks (unverified)

- The construction story (`ConstructionStory.tsx`) is a single 400vh pinned section
  scrubbing ~20 SVG elements simultaneously — cheap individually, but the cumulative
  cost under real scroll-jank conditions (low-end mobile) hasn't been profiled.
- No image dimensions were checked against actual rendered size for `next/image` calls
  beyond setting `sizes` — worth a real audit once the site can be served and inspected.

## How to check, once possible

```bash
npm run build && npm run start
# then run Lighthouse (Chrome DevTools or `npx lighthouse http://localhost:3000`)
```
