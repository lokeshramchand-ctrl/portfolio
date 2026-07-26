# Decisions log

Chronological. Each entry: what was decided, why, and what it rules out.

## 2026-07-26 — Rebuild from scratch on a new branch, not in place

Migrating Vue → Next.js is a full framework rewrite; doing it directly on `ui-changes`
or `main` would leave no easy path back to the working site mid-migration. Decided to
branch `nextjs-rebuild` off `ui-changes` and do the rewrite there. **Rules out:**
touching `main`/`ui-changes` until the user chooses to merge.

## 2026-07-26 — Keep only real content, extracted before deleting the old site

Before removing the Vue `src/`, ran a full content-extraction pass (bio, both real
projects, the one real testimonial, services copy, contact info, blog posts) and wrote
it into `docs/content.md`. **Rules out:** any placeholder/lorem-ipsum copy anywhere on
the new site, and any invented third project or testimonial.

## 2026-07-26 — Fonts: keep CabinetGrotesk + add Switzer as the body font

The old site loaded CabinetGrotesk locally for headings and Bricolage Grotesque via a
runtime Google Fonts `@import` for accents, with no defined body font (fell back to
`Arial, Helvetica, sans-serif`). A `Switzer-Variable.ttf` file existed in
`src/assets/fonts/` but was never wired into any CSS. Decided to self-host all three:
CabinetGrotesk (title), Switzer (body — giving the previously-unused asset a real job),
Bricolage Grotesque via `next/font/google` (fancy/accent only, self-hosted by Next at
build time instead of a runtime `@import`, which is strictly faster). **Rules out:**
an undefined/system-fallback body font, and any runtime Google Fonts request.

## 2026-07-26 — No Three.js for the construction narrative, by default

The master brief says WebGL "only if it genuinely enhances the experience" and to avoid
it if it hurts performance. Building the blueprint/foundation/frame/glass scenes in 2D
SVG + CSS + GSAP `ScrollTrigger` first, since it's the more reliably performant choice
for a portfolio that also needs to hit Lighthouse 90+. Revisit only if the 2D approach
demonstrably can't deliver the intended sense of depth. **Rules out:** a Three.js
dependency in the initial build.

## 2026-07-26 — Blog stays file-based, one stub post left behind

`public/blogs/enterprise-ai.md` existed in the old site as an unfinished stub
("# Heading / Color") never referenced by `blogPosts`. Not migrated — carrying forward
only the two real, complete posts. **Rules out:** publishing a broken/empty blog post.
