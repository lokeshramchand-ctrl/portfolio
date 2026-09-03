# Homelab-primary / Vercel-backup deployment & failover plan

Status: repo-side changes applied and validated locally. No Cloudflare or
Vercel account changes have been made. Everything below marked "you run" is
a manual step or requires credentials you hold.

## 1. Current architecture (as discovered)

- Vue 3 + Vite 6 SPA, `vue-router` in `createWebHistory` mode (needs a
  server-side SPA fallback rewrite — any host serving this app, including
  Nginx, needs `try_files ... /index.html` or equivalent).
- No backend, no env vars, no external API calls except a same-origin
  `fetch()` of its own bundled markdown (`BlogPostView.vue`). Fully static.
- `package-lock.json` present and in sync with `package.json` — `npm ci`
  verified clean.
- `.github/workflows/deploy.yml`: push to `perf/audit-fixes` → self-hosted
  runner → `npm install` → `npm run build` → `rm -rf` + `cp -r` into
  `/var/www/portfolio/dist/` → ntfy notification.
- Cloudflare currently resolves `lokeshrc.me` via a DNS record pointing at
  your homelab's public IP (direct IP / port-forward, proxied through
  Cloudflare).
- No Vercel project, no `vercel.json` existed before this change.

## 2. Proposed architecture

```
Visitor → lokeshrc.me / www.lokeshrc.me (Cloudflare DNS, orange-cloud)
              │
              ▼
      Cloudflare Worker (Route bound to lokeshrc.me/* and www.lokeshrc.me/*)
        - probes homelab /health.txt (2.5s timeout, 15s cache)
        - healthy  → proxy to homelab origin (Host: lokeshrc.me)
        - unhealthy → proxy to Vercel deployment (Host: lokeshrc.me)
              │                              │
              ▼                              ▼
     Homelab Nginx (primary)          Vercel (backup)
     /var/www/portfolio/dist/         same repo, auto-deployed by Vercel's
     deployed by GitHub Actions       own GitHub integration
     (self-hosted runner)             /health.txt → 200
     /health.txt → 200
```

GitHub Actions deploys to homelab only (unchanged responsibility). Vercel
deploys itself via its GitHub App on every push — no Action needed for that
side. **Runtime failover lives entirely in the Worker**, not in Actions.

### Why a Worker instead of Cloudflare Load Balancer
Cloudflare's native Load Balancer (origin pools, health checks, automatic
failover) requires the paid Load Balancing add-on — it is not available on
the Free plan. Since this deployment is free-tier only, a Cloudflare Worker
Route is used instead: same effect (health-checked failover) at $0 on
Workers' free tier (100k requests/day). This is a standard, supported
pattern, not a hack — just a manual implementation of what the paid
product does automatically.

Trade-off vs. the paid Load Balancer: the Worker's health check runs
inline per-request (cached 15s) rather than on a separate background
schedule, and failback to homelab happens on the next request after the
cache expires rather than instantly. For a personal portfolio site this is
an acceptable trade-off.

## 3. Files changed in this repo

| File | Change |
|---|---|
| `.github/workflows/deploy.yml` | `npm install` → `npm ci`; added `cache: 'npm'` to `setup-node`; replaced `rm -rf` + `cp -r` with an atomic rename-swap deploy (`dist.new` → swap → remove `dist.old`) so Nginx never serves a half-written directory |
| `public/health.txt` | New. Contains `OK`. Copied verbatim into `dist/health.txt` by Vite's static `public/` handling — verified present after `npm run build` |
| `vercel.json` | New. Sets build command/output dir explicitly and adds an SPA rewrite (`/(.*)` minus real static paths → `/index.html`) so direct loads of `/blog/:slug` etc. don't 404 on Vercel |
| `cloudflare-worker/failover.js` | New. The failover Worker script (not part of the Vite build — deployed separately to Cloudflare). **Has two placeholders you must fill in before deploying**: `HOMELAB_ORIGIN` (your public IP) and `VERCEL_ORIGIN` (the `*.vercel.app` URL Vercel gives you) |

Diff for the workflow:

```diff
       - name: Setup Node.js
         uses: actions/setup-node@v4
         with:
           node-version: '20'
+          cache: 'npm'

       - name: Install Dependencies
-        run: npm install
+        run: npm ci

       - name: Copy to Nginx Directory
         run: |
-          rm -rf /var/www/portfolio/dist/*
-          cp -r dist/* /var/www/portfolio/dist/
+          rm -rf /var/www/portfolio/dist.new
+          cp -r dist /var/www/portfolio/dist.new
+          rm -rf /var/www/portfolio/dist.old
+          mv /var/www/portfolio/dist /var/www/portfolio/dist.old
+          mv /var/www/portfolio/dist.new /var/www/portfolio/dist
+          rm -rf /var/www/portfolio/dist.old
```

Local validation performed: `npm run build` succeeded end-to-end; confirmed
`dist/health.txt` exists post-build; confirmed `npm ci --dry-run` is clean
against the committed lockfile.

Nothing has been committed yet — these are working-tree changes only,
pending your review.

## 4. Vercel setup (you run — needs your Vercel account)

1. https://vercel.com → New Project → Import this GitHub repo
   (`perf/audit-fixes` branch, or whichever branch you want Vercel tracking
   — can differ from the homelab trigger branch).
2. Vercel should auto-detect the `vercel.json` build command/output dir.
   Framework preset: "Vite" or "Other" both work since `vercel.json`
   already specifies `buildCommand`/`outputDirectory` explicitly.
3. No environment variables needed (confirmed no env-var usage in the app).
4. Deploy. Copy the resulting `https://<project>.vercel.app` URL.
5. Project Settings → Domains → Add `lokeshrc.me` and `www.lokeshrc.me`.
   Vercel will show DNS instructions (a TXT record for verification, and
   normally an A/CNAME record) — **do not add the A/CNAME record it
   suggests**. Only add the verification TXT record it asks for, in
   Cloudflare DNS, DNS-only (grey cloud, not proxied) so Vercel can verify
   domain ownership. Traffic will reach Vercel only via the Worker's
   fallback fetch, not via public DNS pointing at Vercel.
6. Once verified, Vercel will mark the domain as "assigned" even though
   public DNS doesn't point at it — that's fine; the Worker origin-fetches
   Vercel directly by its `*.vercel.app` hostname with the `Host` header
   overridden to `lokeshrc.me`, which is exactly what step 5's
   verification enables.
7. Send me the `*.vercel.app` URL and I'll fill in `VERCEL_ORIGIN` in
   `cloudflare-worker/failover.js`.

## 5. Cloudflare Worker setup (you run — needs your Cloudflare credentials)

1. Fill in `cloudflare-worker/failover.js`:
   - `HOMELAB_ORIGIN` = `https://<your public IP>` (the IP your current DNS
     A record points at).
   - `VERCEL_ORIGIN` = the URL from step 4 above.
2. Cloudflare dashboard → Workers & Pages → Create Worker → paste in
   `failover.js` contents (or deploy via `wrangler deploy` from this repo
   if you prefer CLI — I can add a `wrangler.toml` if you want that route).
3. Worker → Triggers → Routes → add:
   - `lokeshrc.me/*`
   - `www.lokeshrc.me/*`
4. Confirm the `lokeshrc.me` DNS record stays proxied (orange cloud) in
   Cloudflare — the Worker Route only intercepts requests that already
   pass through Cloudflare's proxy; if the record is set to "DNS only"
   (grey cloud), the Worker never runs and traffic goes straight to
   whatever the DNS record points at.
5. **Certificate note**: the homelab probe in the Worker connects to
   `HOMELAB_ORIGIN` by IP over HTTPS. If Nginx's TLS cert is issued only
   for `lokeshrc.me` (not the bare IP), that direct-by-IP `fetch()` may
   fail TLS hostname verification depending on Workers' `fetch` behavior.
   If you hit this, the fix is to keep the `Host: lokeshrc.me` header (already
   done in the script) — Workers' `fetch()` does SNI/cert validation
   against the URL's hostname (the IP), which will not match. In that case,
   switch `HOMELAB_ORIGIN` to route through a `resolveOverride`-style
   approach, or run the probe over plain HTTP on a dedicated health-check
   port/vhost if your homelab firewall allows it, or use a Cloudflare
   Tunnel hostname instead of a raw IP so the cert matches. Tell me which
   your Nginx TLS setup looks like and I'll adjust the script.

## 6. Exactly which DNS records change

- **No record needs to change value.** The existing `lokeshrc.me` /
  `www.lokeshrc.me` A (or CNAME) record pointing at your homelab IP stays
  exactly as-is, still proxied through Cloudflare.
- **One record is added**: the Vercel domain-verification TXT record
  (DNS-only, not proxied) — required only so Vercel accepts `lokeshrc.me`
  as a valid custom domain on that project. It carries no traffic.
- No record is deleted. This is a net-additive, reversible change.

## 7. Required Cloudflare permissions/credentials

To do the Worker deployment yourself via dashboard: your normal Cloudflare
login, Workers & Pages write access on the zone (default for an account
owner). If you want me to help via `wrangler` CLI later, that needs a
Cloudflare API token scoped to `Workers Scripts:Edit` + `Zone:Read` for
this zone only — not the Global API Key. I have not asked for or received
any credentials yet; hand me only a scoped token if/when we get there.

## 8. Rollback procedure

- **Worker misbehaving**: Cloudflare dashboard → Workers & Pages → Routes →
  remove the two routes (`lokeshrc.me/*`, `www.lokeshrc.me/*`). Traffic
  immediately reverts to going straight to the DNS record's target
  (homelab) with zero Worker involvement. Takes effect immediately,
  no propagation delay.
- **Bad homelab deploy**: the workflow's atomic swap means the previous
  `dist.old` briefly exists mid-deploy; for a true rollback, re-run the
  workflow against the last-good commit, or `git revert` and re-push.
- **Vercel bad deploy**: Vercel keeps every deployment; promote a previous
  deployment to production from the Vercel dashboard in one click. Doesn't
  affect homelab at all since they deploy independently.

## 9. Testing failover safely (site is currently offline, per your note, so this is low-risk right now)

1. After the Worker is deployed with routes bound, temporarily stop Nginx
   or block port 443 on the homelab firewall.
2. Request `https://lokeshrc.me/` — should now serve the Vercel-built
   version (visually identical, same content) instead of erroring.
3. Check `https://lokeshrc.me/health.txt` directly — should still return
   `200 OK` (served by whichever origin is currently active).
4. Restart Nginx / re-open the port. Within `HEALTH_CACHE_SECONDS` (15s),
   the next request should route back to homelab.
5. Because the domain never actually points at `*.vercel.app` in public
   DNS, visitors never see a `vercel.app` URL in their address bar during
   any of this — the Worker does the proxying, so the browser only ever
   sees `lokeshrc.me`.
