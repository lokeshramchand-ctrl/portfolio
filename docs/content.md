# Content — source of truth

Every fact used on the site. If it's not here, it's not a fact — don't invent one.
Extracted from the previous Vue site (`ui-changes` branch) on 2026-07-26.

## Identity

- Full name: **Lokesh Ram Chand B**, referred to as "Lokesh Ram Chand" in running copy.
- Location: Hyderabad, India (`17°22'31.0"N 78°28'27.0"E`).
- Email: `lokeshramchand@gmail.com`
- WhatsApp CTA: `https://wa.me/919121661507`
- GitHub: `https://github.com/lokeshramchand-ctrl`
- X: `https://x.com/LokeshRamC`
- LinkedIn: `https://www.linkedin.com/in/lokeshramchand/`
- Resume: Google Drive link (see `src/lib/data.ts` → `resourceLinks`)

## Bio

Short intro: "I enjoy building software that solves meaningful problems. From
intelligent AI-powered systems to scalable web applications, I focus on creating
products that are reliable, intuitive, and designed to make complex workflows feel
simple."

Full bio is three paragraphs — see `aboutCopy` in `src/lib/data.ts` for the verbatim
text (full-stack + AI + backend systems, event-driven architectures, curiosity about
emerging tech).

## Projects (only two — do not invent more)

1. **Velar** — AI Finance System, 2024. Node.js, Python, RabbitMQ. Event-driven: a
   Node.js API layer and a Python analysis engine communicate over RabbitMQ.
   `github.com/lokeshramchand-ctrl/Velar`
2. **MapLayer** — GeoRAG Platform, 2025. React, TypeScript, AI. Retrieval-augmented
   platform grounding an LLM in spatial data. `github.com/lokeshramchand-ctrl/MapLayer`

## Services (three)

1. AI & Machine Learning — ML, generative AI, intelligent automation.
2. Full-Stack Engineering — React & Next.js, Flutter, component architecture.
3. Backend & Infrastructure — distributed systems, cloud infrastructure, data
   engineering.

Full body copy for each is in `services` in `src/lib/data.ts`.

## Testimonial (only one — do not invent more)

> "Lokesh was competent, open to direction, and gave expert advice throughout the
> redesign process. His positive attitude and humility make him a true joy to
> collaborate with."
> — **Danielle Lindamood**, Director at Wellington Water Watchers

(The old site imported a second testimonial photo, "esmail", with no matching data
entry or image file — it was dead code, not a real testimonial. Do not resurrect it.)

## Blog

Two real posts, both migrated verbatim into `public/blogs/`:

1. "Owning the Stack: Building My Personal Cloud" (`self-hosting-journey.md`,
   2026-07-24) — self-hosting essay: static IP in India, Proxmox, LXC containers, an
   RTX 5060 desktop rig, Nginx reverse proxy on subdomains.
2. "Building an Nginx Configuration I Could Actually Maintain" (`nginx-config.md`,
   2026-06-12) — moving from a monolithic `nginx.conf` to modular
   `sites-available`/`sites-enabled`.

A third file, `enterprise-ai.md`, existed in the old `public/blogs/` as an unfinished
stub ("# Heading / Color") and was never wired into the post list — intentionally left
behind, not migrated.

## Assets

- `public/images/velar.webp`, `public/images/maplayer.webp` — project stills (large;
  see performance note in `CLAUDE.md`).
- `public/videos/velar.webm`, `public/videos/maplayer.webm` — project preview clips.
- `public/images/danielle.webp` — testimonial photo.
- `public/images/profile.webp` / `public/images/og-image.webp` — same headshot, reused
  for the about section and Open Graph image.
- `public/videos/contact.mp4` — contact-section background clip from the old site.
- `src/assets/fonts/CabinetGrotesk-Variable.ttf`, `Switzer-Variable.ttf` — brand fonts.
