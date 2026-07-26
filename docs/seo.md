# SEO

Target domain: `lokeshrc.me` (set as `siteConfig.url` in `src/lib/data.ts`, and as
`metadataBase` in `src/app/layout.tsx` — every relative URL in metadata resolves
against it).

## What's implemented

- **Titles/descriptions:** template-based title (`%s — Lokesh Ram Chand B`) in the root
  layout; every route sets its own `description`. Blog posts pull `title`/`description`
  from real post metadata (`src/lib/data.ts` → `blogPosts`).
- **Canonical URLs:** explicit `alternates.canonical` on `/`, `/blog`, and every
  `/blog/[slug]` — resolved against `metadataBase`.
- **Open Graph / Twitter Cards:** `openGraph`/`twitter` metadata in the root layout;
  the actual preview image comes from `app/opengraph-image.tsx` (Next's file-convention
  auto-detection — a dynamically generated on-brand 1200×630 card, not a static asset),
  which Next automatically wires into both `openGraph.images` and `twitter.images`
  without them needing to be declared manually.
- **Structured data (JSON-LD):**
  - `Person` + `WebSite` (`@graph`) in the root layout — real name, real URL, real
    email, `sameAs` populated from `socialLinks` (X, GitHub, LinkedIn).
  - `BlogPosting` on each post page, with real `headline`/`datePublished`/`author`.
- **`sitemap.xml` / `robots.ts`:** generated via Next's file conventions
  (`src/app/sitemap.ts`, `src/app/robots.ts`), enumerating the home page, `/blog`, and
  every real post slug — sourced from `blogPosts`, so it can't drift from what's
  actually published.
- **Manifest & icons:** `public/manifest.json` (real name, correct dark theme colors —
  see `docs/decisions.md`), `favicon.svg`/`favicon-96x96.png`/`apple-touch-icon.png`.
- **Semantic HTML / heading hierarchy:** single `h1` (Hero), sequential `h2`s
  (construction-story stages, Works, About, Contact) with no skipped levels — fixed
  during the critique pass, see `docs/critique-2026-07-26.md`.
- **Image alt text:** every `next/image` usage (`profile.webp`, `danielle.webp`) has a
  real, descriptive `alt`. Decorative SVG/video elements are `aria-hidden`.

## Known gaps

- No Lighthouse SEO audit has actually been run (see `docs/performance.md`) — the above
  is built to spec, not measured.
- The generated OG image currently falls back to a default sans-serif rather than brand
  fonts (see `docs/decisions.md`) — cosmetic, doesn't affect crawlability or rich
  previews functioning.
