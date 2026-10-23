---
title: "Auditing My Own Portfolio Like Someone Else's Codebase"
date: "Sept 5, 2026"
excerpt: "I ran a security and production audit on this site. It found an XSS hole in the blog, two vulnerable dependencies, a dead permalink and missing security headers."
tags: ["Security", "Vue", "Web Performance", "Open Source"]
---

I spend a lot of time finding bugs in other people's repos, so I figured I should do the same to my own. The result is [PR #23](https://github.com/lokeshramchand-ctrl/portfolio/pull/23) on this site's repo, which closed four issues (#19 to #22). It's merged.

## Scoping it honestly

This site is a static Vue SPA. There's no backend, no database and no auth, so SQL injection and auth bypass don't apply. I limited the audit to what's actually exposed: the blog renderer, dependencies, published content and HTTP headers.

## #19: the blog could run scripts

Posts are Markdown, rendered with `marked` and inserted with `v-html`. `marked` passes raw HTML through by design, so a `<script>` tag in a post would have run.

I added DOMPurify at the single place Markdown gets parsed, `src/blog/toc.ts`. Then I tested it with a combined payload (`<script>`, an `onerror` handler and a `javascript:` link) in a scratch environment. All three were stripped, and the heading `id`s the table of contents relies on survived.

## #20: two vulnerable dependencies

`npm audit` found two high-severity transitive issues: a DoS in `brace-expansion` and an infinite loop in `nanoid`. `npm audit fix` resolved both without breaking changes, leaving 0 vulnerabilities.

## #21: a dead permalink

I'd renamed a post from `blog-marshal-fix-draft` to `birdwatcher-merge`, but the generated `blogIndex.ts` and `rss.xml` still pointed at the old slug, so production had a dead permalink. I regenerated them and checked the diff to make sure only that slug changed.

## #22: missing security headers

Production only sent HSTS. I added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`.

I deliberately left out a Content Security Policy. The Cal.com booking embed needs testing against a live CSP first, and I'd rather ship no CSP than one that silently breaks booking. I wrote the reasoning into the issue.

## Checking my own work

After every commit I ran `vue-tsc --noEmit` and `npm run build`. I put the full method in `tests_documentation.md`: which tests I picked, why, how each bug turned up, and before/after numbers.

One box is still unchecked: a manual smoke test of a live post and its TOC. I verified with curl and builds, not a real browser, and I said so in the PR.

## What I learned

Auditing my own code was harder than auditing someone else's, because I already "knew" how it worked. The XSS was the clearest example. I'd written the renderer, and I'd never thought of my own Markdown files as untrusted input. They are, as soon as anything else can write to that folder.
