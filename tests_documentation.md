# Security & Production Audit — tests_documentation.md

Branch: `security-perf-audit` → PR into `master`.
Scope: static Vue 3 SPA, no backend/database/auth, deployed to a homelab Nginx server with Vercel as a backup origin (`vercel.json`). "Security testing" here targets the surface that actually exists for a site like this: client-side XSS, supply-chain/dependency risk, response headers, build integrity, and stale generated artifacts — not SQLi/auth bypass/server exploitation, which don't apply (there is no server-side app logic).

Each section: what was tested, why, how it was found, how it was fixed, and the before/after.

---

## 1. Stored XSS via unsanitized markdown → `v-html`

**Issue:** [#19](https://github.com/lokeshramchand-ctrl/portfolio/issues/19)
**Commit:** `ec1e31c` (+ dompurify install in `aa515e2`)

### Why this test
`grep -rn "v-html" src/` surfaces every place the app trusts a string enough to skip Vue's normal escaping. `BlogPostView.vue` pipes markdown through `marked` straight into `v-html`. Any markdown renderer that emits raw HTML unchanged turns `v-html` into an XSS sink the moment untrusted content reaches it.

### How it was found
Ran the actual parser against a payload:
```js
marked.parse('<script>alert(1)</script>\n\n**bold**')
// -> "<script>alert(1)</script><p><strong>bold</strong></p>"
```
Confirmed `marked` (v18) passes raw `<script>` through unchanged — it does not sanitize by design (the old `sanitize` option was removed years ago; upstream now explicitly recommends a dedicated sanitizer). Traced the call site to the single choke point: `parseMarkdownWithToc()` in `src/blog/toc.ts`, which `BlogPostView.vue` is the only current caller of.

### Real-world exploitability today
Low — blog posts are self-authored markdown files checked into the repo, not user-submitted. This is a defense-in-depth gap, not an active exploit: any future external contribution, compromised dependency, or mistake in a `.md` file would otherwise become stored XSS with zero safety net.

### Fix
Added `dompurify` (browser-standard, actively maintained HTML sanitizer). Sanitized the final HTML string inside `parseMarkdownWithToc()` — the one place all current and future callers route through — rather than in the Vue component, so the fix can't be bypassed by a new caller.

```ts
const rawHtml = marked.parse(stripFrontmatter(markdown), { renderer }) as string;
const html = DOMPurify.sanitize(rawHtml);
```

Considered `marked`'s own `sanitize` option first (ponytail rung: reuse before adding a dependency) — confirmed via `npm view` / source inspection that it no longer exists in current `marked`; upstream deprecated and removed it. DOMPurify was the only sound option, and this is an explicit "security measure" case where reaching for a dependency instead of hand-rolling sanitization logic is the correct trade-off.

### Verification
Installed `dompurify` + `jsdom` in a throwaway scratch directory (kept out of the repo) and ran the actual sanitizer against a combined payload:
```
Input:  <h2 id="foo">Bar</h2><script>alert(1)</script><img src=x onerror=alert(2)><p>hi</p><a href="javascript:alert(3)">click</a>
Output: <h2 id="foo">Bar</h2><img src="x"><p>hi</p><a>click</a>
```
`<script>`, the `onerror` handler, and the `javascript:` href were all stripped. The `id="foo"` heading attribute survived — this matters because the table-of-contents feature depends on heading ids for anchor navigation; a naive sanitizer config would have silently broken TOC links.

### Metrics
| | Before | After |
|---|---|---|
| `<script>` in markdown | executes | stripped |
| `onerror`/`onload` attrs | executes | stripped |
| `javascript:` hrefs | executes | stripped |
| TOC heading anchors | working | working (unchanged) |
| `BlogPostView` chunk (gzip) | 16.15 kB | 27.23 kB (+11 kB, DOMPurify cost) |
| `vue-tsc --noEmit` | n/a | clean |
| `vite build` | n/a | clean |

---

## 2. High-severity transitive dependency vulnerabilities

**Issue:** [#20](https://github.com/lokeshramchand-ctrl/portfolio/issues/20)
**Commit:** `aa515e2`

### Why this test
Supply-chain risk is one of the few security categories that applies fully to a static site's *build* even though the deployed artifact has no server. A vulnerable dev-tooling dependency can still compromise the build machine/CI runner.

### How it was found
`npm audit --json`. Two high-severity findings:
- `brace-expansion` <2.1.4 — DoS via unbounded expansion length / intermediate arrays (CWE-400, CWE-770)
- `nanoid` <3.3.18 — infinite loop when a custom generator's `size` is 0 (CWE-835)

Both transitive (not direct dependencies), not shipped to the browser bundle.

### Fix
`npm audit fix` (no `--force`, so no breaking major-version bumps were pulled in). Re-ran `npm audit` after: `0 vulnerabilities`.

### Verification
- `npm audit --json` → `{ info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }`
- `vue-tsc --noEmit` clean
- `vite build` succeeds, output unchanged in structure

### Metrics
| | Before | After |
|---|---|---|
| npm audit high-severity | 2 | 0 |
| npm audit total | 2 | 0 |
| Breaking changes | — | none (no `--force` used) |

---

## 3. Stale generated blog index / RSS after a post rename

**Issue:** [#21](https://github.com/lokeshramchand-ctrl/portfolio/issues/21)
**Commit:** `308cb12`

### Why this test
CLAUDE.md documents that `src/generated/blogIndex.ts` and `public/rss.xml` are generated, checked-in files whose source of truth is the frontmatter in `public/blogs/*.md`. Generated-but-committed files are a known drift risk if someone renames a source file without re-running the generator — worth an explicit check any time blog content changes.

### How it was found
Running `npm run build` (which triggers `prebuild` → `generate:blog`) produced a diff on files that should have been stable:
```diff
- "slug": "blog-marshal-fix-draft",
+ "slug": "birdwatcher-merge",
```
The markdown file had been renamed from `blog-marshal-fix-draft.md` to `birdwatcher-merge.md` in an earlier commit, but the generator was never re-run afterward, leaving stale links in production (`/blog/blog-marshal-fix-draft` — a 404) inside the committed `blogIndex.ts` and `rss.xml`.

### Fix
Ran `npm run generate:blog` and committed the regenerated, now-correct output.

### Verification
`git diff` after regeneration touched only the slug field and the two derived URLs, nothing else — confirms the generator is deterministic given unchanged source markdown, and the only drift was the one rename.

### Metrics
| | Before | After |
|---|---|---|
| Stale slug references | 2 (blogIndex.ts, rss.xml) | 0 |
| Broken permalink risk | `/blog/blog-marshal-fix-draft` (404) | `/blog/birdwatcher-merge` (200) |

---

## 4. Missing security response headers on production

**Issue:** [#22](https://github.com/lokeshramchand-ctrl/portfolio/issues/22)
**Commit:** `fdec5ae`

### Why this test
Response headers are one of the few "production hardening" levers available for a static SPA with no server-side code — worth checking directly against the live edge, not just the repo config.

### How it was found
```
curl -sI https://lokeshrc.me/
```
Production is currently resolving through Vercel (confirms this repo's `vercel.json` is live-relevant, not dormant backup config). Response had `strict-transport-security` but nothing else: no `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy`.

### Fix
Added a catch-all header rule in `vercel.json`:
```json
{
  "source": "/(.*)",
  "headers": [
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
  ]
}
```

### Explicitly not done: Content-Security-Policy
`index.html` loads the Cal.com booking embed, which injects a script and iframe from `app.cal.com`/`cal.com`. Writing a CSP without live-testing it against that embed risks silently breaking the booking widget (the failure mode — a blocked script — doesn't throw a build or type error, it just quietly stops working in the browser). Flagged as a follow-up in issue #22 rather than shipped as a guess.

### Verification
`vue-tsc --noEmit` and `vite build` both clean (headers are Vercel platform config, not app code, so this doesn't affect the build — verified the JSON is well-formed and matches Vercel's documented header-rule schema).

### Metrics
| | Before | After |
|---|---|---|
| Security headers present | 1 (HSTS only) | 5 (HSTS + 4 new) |
| CSP | none | none (deliberately deferred, see above) |

---

## Things checked with no finding (worth recording so they aren't re-litigated)

- **`target="_blank"` reverse-tabnabbing:** only one external link in the codebase uses it (`Works.vue`), and it already has `rel="noopener noreferrer"`.
- **Hardcoded secrets/API keys/tokens:** none found (`grep -rniE "api[_-]?key|secret|token|password"` across `src/`, filtered for false positives like the `marked` AST `token` variable).
- **Debug `console.log`/`console.debug` leaks:** none found in `src/`.
- **Dead/orphaned dependency (`vue3-lottie`):** confirmed still in active use (`Contact.vue` imports `earth.json`), not dead code — large bundle (314 kB / 81 kB gzip) but legitimate, not a bug.
- **Broken external profile links:** X/Twitter and GitHub links return 200. LinkedIn returned HTTP 999 to `curl`, which is LinkedIn's standard bot-blocking response for non-browser requests, not evidence of a broken link.
- **Dual lockfile drift (`bun.lock` / `package-lock.json`):** re-synced by running `bun install` after `npm install`/`npm audit fix`; no independent bug found beyond needing both updated together (already implicitly known from CLAUDE.md documenting both are supported).

## Overall before/after

| Metric | Before | After |
|---|---|---|
| npm audit vulnerabilities (high) | 2 | 0 |
| XSS defense-in-depth on blog content | none | DOMPurify sanitization at the parse choke point |
| Security response headers | 1 | 5 |
| Broken/stale generated blog links | 1 | 0 |
| `vue-tsc --noEmit` | — | clean throughout |
| `vite build` | — | succeeds throughout, all commits |
| GitHub issues filed | — | 4 (#19–#22), all closed by this PR |
