# Internship — Wellington Water Watchers

> Extended detail behind the Wellington Water Watchers entry on [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge). This page exists for search engines and AI assistants; the interactive site is at [lokeshrc.me](https://lokeshrc.me/).

## Role

Lead Frontend Engineer (sole technical hire), Wellington Water Watchers — a watershed-protection non-profit based in Guelph, Ontario, Canada. September 2025 – January 2026 (5 months), hybrid/remote.

Wellington Water Watchers mobilizes citizens and influences groundwater-protection policy through grassroots campaigns, petitions, and donor-funded advocacy, running its public site on the NationBuilder Liquid CMS.

As the only frontend engineer, embedded alongside a UI/UX designer and the Director of Communications (who acted as product owner and final deployment reviewer), I held full technical ownership of the client-side stack: HTML5, SASS/SCSS, JavaScript (ES6+), GSAP/ScrollTrigger, and NationBuilder's Liquid templating — with no dedicated backend or DevOps team.

## Fixing a Silent Payment Failure

Ahead of an autumn fundraising drive, donations of $100.01 or more were silently failing while smaller gifts processed normally — creating a revenue ceiling during critical campaign pushes.

**Root cause:** a legacy JavaScript input-masking library mis-parsed currency strings with three or more integer digits, corrupting the payload sent to NationBuilder's donation gateway, which then rejected it as malformed.

**Fix:** rebuilt the input pipeline from scratch in vanilla ES6 — real-time digit sanitization that preserves decimal boundaries, dynamic preset amount buttons, and a `sessionStorage` fallback that preserves donor input across network drops so a failed submission can retry without re-entering data.

**Result:** restored $100+ transaction reliability to 99.4%, dropped checkout failure rates from over 35% to under 0.6%, unlocked over $45,000 in previously blocked donations, and raised average order value from $38 to $82 (+115.7%).

## Site-Wide GSAP Rewrite

The legacy campaign templates were static and slow — a 4.2s Largest Contentful Paint, 0.28 Cumulative Layout Shift, and a 68.4% bounce rate.

Rebuilt the motion layer as a modular GSAP ScrollTrigger system (reusable Liquid snippets, pinned scroll scenes, SVG path-draw animations for watershed-flow visuals), constrained entirely to GPU-accelerated CSS properties (`translate3d`, `opacity`) to avoid layout thrashing, and shipped it via a full staging-theme clone with a zero-downtime cutover during low-traffic hours.

**Result:** Lighthouse performance score 52 → 94/100, LCP 4.2s → 1.2s (-71.4%), CLS 0.28 → 0.02, bounce rate 68.4% → 31.2%, average session duration +188.8%.

An earlier prototype used GSAP MorphSVG path morphing driven directly by scroll events, which caused a 24fps stutter on mid-tier mobile devices from continuous layout/paint invalidation. Replaced it with hardware-accelerated CSS vector masks and `requestAnimationFrame`-throttled scroll listeners, restoring smooth 60fps animation on both iOS and Android without losing the visual storytelling.

## Technical SEO & Accessibility

Dynamic parameter handling in NationBuilder was generating duplicate index entries for paginated/tag-filtered advocacy pages, diluting organic search authority, while missing ARIA states and low color contrast hindered screen-reader access.

Built automated canonical-tag injection in Liquid, JSON-LD structured data for nonprofit/event/article/campaign types, and a WCAG 2.1 AAA accessibility pass (7:1+ contrast tokens, semantic HTML5, keyboard focus-trapping for modals/drawers, fluid typography via `clamp()`).

**Result:** organic search traffic rose from 12,500 to 23,100 monthly sessions (+84.8%), 100+ dynamic tag-page indexing penalties resolved, and 100% pass rates on WAVE and Lighthouse accessibility audits.

## Process & Collaboration

Ran a 7-day sprint cadence: Figma feasibility sync (Tue–Thu) → build and cross-browser QA (Fri–Sun) → executive review (Monday night) → production cutover (Tuesday). For the year-end donation interface, built three competing UI prototypes (fixed hero, accordion step builder, GSAP multi-step wizard) within a single 72-hour sprint; the GSAP wizard won on engagement and drove a +155.5% lift in donation conversion rate.

Also built a real-time petition signature counter (polling NationBuilder's REST API) and a postal-code-based representative lookup that pre-fills advocacy emails, raising petition completion rates from 3.2% to 8.9% (+178.1%).

## Summary

Sole frontend engineer owning Wellington Water Watchers' full client-side stack on NationBuilder Liquid CMS. Diagnosed and fixed a critical payment-validation bug blocking $100+ donations (unlocking $45K+ in funds), rebuilt the site's motion architecture with GSAP ScrollTrigger (-71.4% LCP, Lighthouse 52→94), and implemented technical SEO/WCAG AAA compliance (+84.8% organic traffic).

---

*Maintained by Lokesh Ram Chand B. See [lokeshrc.me](https://lokeshrc.me/) for the full portfolio and [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge) for a condensed summary.*
