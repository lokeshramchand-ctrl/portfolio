# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a personal portfolio site built with Vue 3, TypeScript, Vite, and Tailwind CSS 4. It's a heavily animated single-page-ish site (Home) plus a small file-based blog. GSAP + Lenis drive scroll and entrance animations throughout.

## Commands

Package manager: this repo has both `bun.lock` and `package-lock.json`; either bun or npm works. Node version is pinned via `.node-version` (20).

- `npm run dev` — start Vite dev server (bound to all hosts via `--host`, port 5173)
- `npm run build` — type-check via `vue-tsc` then `vite build`
- `npm run preview` — preview the production build

There is no test suite and no lint script configured in this repo. Formatting is via Prettier (`.prettierrc`: single quotes, 2-space, `prettier-plugin-tailwindcss` for class sorting) — run `npx prettier --write .` if needed.

## Architecture

### Routing & pages
`src/router/index.ts` defines three routes: `/` (`HomeView`), `/blog` (`BlogView`), `/blog/:slug` (`BlogPostView`). The router has custom `scrollBehavior`: hash links (`/#works`) smooth-scroll after a 100ms delay (to let content mount), back/forward restores scroll position, otherwise it snaps to top.

### Global scroll/animation setup
`src/main.ts` creates a single `Lenis` smooth-scroll instance and a `raf` loop, both exported (`export { raf, lenis }`) so any component can import and control global scrolling (e.g. `lenis.stop()`/`lenis.start()` to lock scroll during menus/loading, `lenis.scrollTo(...)` for nav links).

`App.vue` is the root shell used for every route — and the *only* place `LoadingScreen`, `SamsungError`, the fixed full-screen SVG noise overlay (two `feTurbulence` filters), and `Cursor` are rendered. It toggles `body.stop-scrolling` on mount and kicks off the `raf` loop after a 2s delay (this delay is tied to the loading-screen animation timing in `src/animations/index.ts`). Because `App.vue` never unmounts across route changes, the loading curtain plays exactly once per real page load, never on SPA navigation. `HomeView.vue` (and every other routed view) should render page content only — do not reintroduce the noise/cursor/loading shell there.

### Boot state & cross-route section navigation (`src/state.ts`)
`appBooted` (ref) flips `true` once the one-time boot loading-curtain sequence finishes (set inside `animateLoadingPath`'s callback in `src/animations/index.ts`). `Hero.vue` checks it in its own `onMounted`: on the true first mount it waits for the boot sequence's `animateHeroEntrance()` call to reveal it (unchanged first-load timing); on any later remount (e.g. returning to Home from `/blog`) it's already `true`, so Hero reveals itself immediately instead of waiting on a curtain that isn't playing again. Scroll-linked GSAP effects that target Hero-owned elements (`animateHeroScrollPin`, `navbarScale`) are re-registered on every Hero mount and give their `ScrollTrigger` a stable `id` so the previous instance (bound to an already-unmounted node) gets killed first — this pattern should be followed for any future scroll-trigger tied to an element inside a routed view.

`pendingSection` (ref) holds a section hash requested from another route (e.g. clicking "Projects" while on `/blog`). Section-nav links go through `useSectionNav()` in `src/functions/index.ts` (used by both the desktop navbar's `Link.vue` and the mobile menu in `Nav.vue` — do not reimplement this per-component): if already on `/`, it scrolls via Lenis immediately; otherwise it sets `pendingSection` and routes to `/`, and `HomeView.vue`'s `onMounted` consumes/clears it and performs the Lenis scroll once its own content has actually mounted (`nextTick`), rather than guessing a timeout.

### Animation layer (`src/animations/index.ts`)
A single flat module of GSAP helpers, all operating on CSS selector strings (not refs), registered with `ScrollTrigger` and `MotionPathPlugin`. Conventions to follow when adding new animations:
- Functions are named `animate*` for composed sequences (e.g. `animateHeroNav`, `animateBlogListEnter`, `animateBlogPostEnter`) and lowercase verbs for primitives (`fadeIn`, `yToZero`, `xToZero`, `resetOpacity`).
- Entrance animations for a page/section pair a `yReset`/`resetOpacity` (set initial state) with a `scrollTrigger`-driven or timeline-driven reveal.
- Blog animations (`animateBlogListEnter`, `animateBlogPostEnter`) are triggered manually from the view's `onMounted` after `nextTick()` + `ScrollTrigger.refresh()`, since blog content is fetched/rendered after route entry — this pattern (wait for DOM, refresh ScrollTrigger, then animate) should be reused for any new route that renders async content.
- `src/functions/index.ts` holds non-GSAP helpers used alongside animations: `textSplitterIntoChar` (wraps text in per-letter spans for stagger animations, expects matching CSS in `style.css`/Tailwind for `.letters`), `getAvailableForWorkDate`, and `gotoSection` (nav scroll dispatch, has a special case for `#testimonials-section` which actually scrolls to `#slider`).

### Component organization (`src/components/`)
- `common/` — reusable UI (`Button.vue`, `Nav.vue`), barreled via `common/index.ts`.
- `design/` — visual/decorative pieces (`Cursor`, `Footer`, `LoadingScreen`, `Marquee`, `Slider`, `SamsungError`, `Circles`, icons), barreled via `design/index.ts`.
- `sections/` — one component per home-page section (`Hero`, `Services`, `Works`, `aboutMe`, `People`, `Contact`), barreled via `sections/index.ts`.
- Top-level `components/index.ts` barrels smaller shared pieces (`Link`, `MagneticEffect`, `MyEnName`, `BurgerMenuBtn`, `ServicesCard`).

New components should be added to the relevant subfolder's `index.ts` barrel and imported via `@/components/...` (the `@` alias maps to `src/`, configured in both `vite.config.ts` and `tsconfig.json`).

`MagneticEffect.vue` pairs with `activateMagneto`/`resetMagneto` in `src/animations/index.ts` for the magnetic-hover button/link effect used around the site (e.g. contact button, social links).

### Blog system
The blog is file-based, not a CMS, but frontmatter — not `src/data.ts` — is the source of truth for post metadata:
- Each post is a Markdown file at `public/blogs/<slug>.md` with a YAML frontmatter block (`title`, `date`, `excerpt`, `tags`, optional `image`). The filename (minus `.md`) is the slug.
- `scripts/generate-blog-index.ts` (run via `npm run generate:blog`, and automatically via the `predev`/`prebuild` npm hooks) reads every file in `public/blogs/`, validates its frontmatter against a Zod schema, and emits `src/generated/blogIndex.ts` — a generated, checked-in `blogPosts` array. Invalid frontmatter fails the script (and therefore `predev`/`prebuild`) loudly.
- `BlogView.vue`, `BlogPostView.vue`, `vite.config.ts` (sitemap routes), and `src/seo/schema.ts` all import `blogPosts` from `@/generated/blogIndex` — never hand-edit that file.
- Post body content is still fetched at runtime (`fetch(`${import.meta.env.BASE_URL}blogs/${slug}.md`)`) and parsed client-side with `marked` in `BlogPostView.vue`; only the frontmatter is extracted at generation time.
- **To add a new post**: create `public/blogs/<slug>.md` with a frontmatter block, then run `npm run generate:blog` (or just start `dev`/`build`, which do it automatically). Commit the regenerated `src/generated/blogIndex.ts` alongside it.
- `src/data.ts` no longer holds blog post metadata. It still holds other site-wide content/config: nav links (`navLinks`/`navbarLinks`), `socialLinks`, `resourceLinks`, hero copy, location strings, and Cal.com booking config (`dataCalNamespace`/`dataCalLink`/`dataCalConfig`).

### Styling
Tailwind CSS 4 is configured via the `@tailwindcss/vite` plugin (no `tailwind.config.js` — theme lives in `src/style.css` under `@theme`). Key custom tokens defined there:
- Color scale `flax-smoke-50..950` — despite the naming, this is currently a dark-mode-first palette (50 = pure black background, 900/950 = white text, 500/600 = amber accent). Use these tokens (`text-flax-smoke-900`, `bg-flax-smoke-50`, etc.) rather than raw Tailwind grays/ambers for anything visual.
- Fluid heading sizes as custom properties (`--heading-1` through `--heading-display`, plus `--heading-body`), exposed as utility classes like `heading-3`, `heading-display`.
- Two custom font families: `font-title` (CabinetGrotesk, loaded via `@font-face`) and `font-fancy` (Bricolage Grotesque, loaded via Google Fonts `@import`).

### Deployment
`.github/workflows/vue.yml` builds and deploys to GitHub Pages on every push using `xRealNeon/VuePagesAction`. `vite-plugin-sitemap` and `vite-plugin-robots` generate `sitemap.xml`/`robots.txt` at build time (hostname `https://lokeshrc.me/`); robots behavior differs between `.robots.development.txt` and `.robots.production.txt`.
