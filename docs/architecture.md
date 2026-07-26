# Architecture

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS 4, GSAP +
ScrollTrigger, Lenis, `motion` (Framer Motion's successor package), `marked` for blog
markdown.

## Directory layout

```
src/
  app/
    layout.tsx        Root shell: fonts, metadata, SmoothScroll/Cursor/Nav/Footer
    page.tsx           Home — composes the scene components in order
    globals.css         Design tokens (@theme) and global rules
    blog/
      page.tsx           Blog list
      [slug]/page.tsx     Blog post (async params — Next 16)
    sitemap.ts / robots.ts
  components/
    providers/          SmoothScroll (single Lenis instance + GSAP ticker)
    design/              Cursor, Footer, and other visual chrome
    common/               Nav and reusable primitives (magnetic buttons, headings)
    sections/             One component per home-page scene
  lib/
    data.ts                Single source of truth for site content
    gsap.ts                 GSAP/ScrollTrigger/TextPlugin registration + reduced-motion helper
    utils.ts                 cn() class helper
  assets/fonts/               Self-hosted variable fonts
public/
  images/, videos/, blogs/     Real content assets (migrated from the old site)
```

## Data flow

`src/lib/data.ts` exports typed content (nav links, projects, services, bio,
testimonial, contact info, blog post metadata). Section components import from it
directly — there is no CMS, no fetch-on-mount for site content (blog post *bodies* are
the one exception, fetched at runtime from `public/blogs/*.md` since that's how the
previous site did it and it keeps posts editable without a rebuild).

## Scroll & animation stack

One `Lenis` instance is created in `SmoothScroll.tsx` and driven by `gsap.ticker`, so
Lenis's virtual scroll position and GSAP's `ScrollTrigger` stay perfectly in sync — this
mirrors the previous Vue site's `main.ts` pattern (a single exported Lenis/raf pair)
adapted to a React provider. `registerGsap()` in `lib/gsap.ts` runs once at module
import time (not inside a `useEffect`) so plugins are guaranteed registered before any
component's own effects fire, regardless of mount order.

## Migration note

This is a from-scratch rebuild of the previous Vue 3 + Vite site. That site remains
intact on the `ui-changes` and `main` branches; this rebuild lives on `nextjs-rebuild`.
Real content (copy, projects, testimonial, images, videos, fonts, blog posts) was
extracted and carried forward — see `docs/content.md`. The old `src/` (Vue components,
`vite.config.ts`, etc.) does not exist on this branch and should not be searched for.
