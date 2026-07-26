# Components

## Providers

- `providers/SmoothScroll.tsx` — mounts once in the root layout. Owns the Lenis
  instance; renders `children` unchanged (no visual output of its own).

## Chrome (`design/`, `common/`)

- `design/Cursor.tsx` — custom dot + ring cursor, fine-pointer + non-reduced-motion
  only. Toggles `html.cursor-none-custom` to hide the system cursor via CSS rather than
  fighting `cursor: none` per-element.
- `design/Footer.tsx` — sitemap, socials, resume link, and two live clocks (Lokesh's
  local time in `Asia/Kolkata`, the visitor's local time via the browser's timezone).
  Clock values start empty and are set client-side only, to avoid SSR/client hydration
  mismatches on a value that's inherently client-dependent.
- `common/Nav.tsx` — fixed header, adds a blurred background once scrolled past 40px.

## Sections (`sections/`)

- `Hero.tsx` — Scene 1. See `docs/animations.md`.
- (Scenes 2–7 land here as they're built — see `docs/roadmap.md`.)

## Conventions

- A component is a Server Component unless it needs browser APIs (`'use client'`
  is added only then — animation, scroll position, `window`, timers).
- Copy comes from `src/lib/data.ts`, never hardcoded, except one-off narrative text for
  the construction scenes (see `CLAUDE.md` → Component guidelines).
- Every interactive element that should show the cursor's "hover" state gets
  `data-cursor="hover"` (see `Cursor.tsx`) in addition to being a real `<a>`/`<button>`.
