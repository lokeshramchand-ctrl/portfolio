# Design system

Source of truth: `src/app/globals.css` (`@theme` block). This file explains the _why_
behind the tokens; the tokens themselves should stay in CSS.

## Palette — "Site & Blueprint"

| Token                  | Value          | Use                                                                                                                      |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `void-950`             | `#000000`      | Page background                                                                                                          |
| `void-900`–`void-500`  | greys          | Elevated surfaces, borders, dividers                                                                                     |
| `paper-500`            | `#f5f5f0`      | Primary heading text                                                                                                     |
| `paper-400`/`300`      | off-white/grey | Body copy                                                                                                                |
| `paper-200`/`100`/`50` | greys          | Secondary labels, disabled text — never body copy                                                                        |
| `amber-400`–`600`      | warm amber     | The one accent: CTAs, links, active states, the intro cursor                                                             |
| `blueprint-400`–`600`  | cold blue      | Reserved for the blueprint/construction-document scenes only — never appears in the projects, about, or contact sections |

Rationale: a building site has two kinds of color — the warm hazard/rivet amber of
finished structure and safety equipment, and the cold technical blue of the drawings that
preceded it. Keeping blueprint blue confined to the early scenes means its appearance is
itself a signal ("we're in the planning/learning phase of the story").

## Typography

- `font-title` → CabinetGrotesk (self-hosted variable font). Display and heading type.
- `font-body` → Switzer (self-hosted variable font). All reading copy.
- `font-fancy` → Bricolage Grotesque (`next/font/google`, self-hosted by Next at build
  time). Small accent/annotation text only (e.g. blueprint callouts, floor numbers) —
  never a paragraph.

Fluid scale (`--heading-6` … `--heading-display`) uses `clamp()` so type scales with
viewport width without separate breakpoint overrides. Exposed as utility classes
(`heading-display`, `heading-1`, … `heading-body`).

## Spacing & layout

- `padding-x` / `padding-y` / `common-padding` utilities give consistent section gutters
  (`px-6 md:px-12 xl:px-20`, `py-16 md:py-28 xl:py-36`).
- Breakpoints add `2xs` (420px), `xs` (512px), `2xl` (1440px), `3xl` (1920px) on top of
  Tailwind defaults, for the same reasons as the original site: fine control at both the
  small-phone and ultra-wide ends.

## Motion tokens

- `--ease-blueprint: cubic-bezier(0.16, 1, 0.3, 1)` — the standard "settle" ease used for
  scene reveals, chosen for a confident deceleration without overshoot (construction
  elements should land solidly, not bounce).

## Accessibility

- All color pairings above are chosen to keep body text ≥ 4.5:1 contrast against
  `void-950`/`void-900`. `paper-100`/`paper-200`/`paper-50` fall below that at small
  sizes and are restricted to large/secondary text (§ Accessibility rules in
  `CLAUDE.md`).
- `prefers-reduced-motion` is handled globally in `globals.css` (collapses all
  animation/transition durations) in addition to per-component branches for GSAP
  timelines that would otherwise skip content entirely rather than just speeding up.
