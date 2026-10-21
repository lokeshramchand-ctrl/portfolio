/**
 * Cloudflare Worker: homelab-primary / Vercel-backup failover proxy.
 *
 * Bound to a Route on lokeshrc.me/* and www.lokeshrc.me/* (Free plan, no
 * Load Balancer add-on required). On each request:
 *   1. Probe the homelab origin's /health.txt with a short timeout.
 *   2. If it returns 200, proxy the real request to the homelab origin.
 *   3. Otherwise, proxy the real request to the Vercel deployment,
 *      rewriting the Host header so Vercel's SNI/host routing resolves
 *      to this project instead of 404ing.
 *
 * Health state is cached in-memory per-isolate for HEALTH_CACHE_SECONDS
 * so we don't double the request volume against the homelab origin.
 */

const HOMELAB_ORIGIN = 'https://YOUR_HOMELAB_PUBLIC_IP'; // e.g. https://203.0.113.10 — set this
const HOMELAB_HOST_HEADER = 'lokeshrc.me'; // Host Nginx expects (vhost match)
const VERCEL_ORIGIN = 'https://YOUR-PROJECT.vercel.app'; // set after creating the Vercel project
const HEALTH_PATH = '/health.txt';
const HEALTH_CACHE_SECONDS = 15;
const PROBE_TIMEOUT_MS = 2500;

// Per-IP rate limiting. State is in-memory per isolate (same tradeoff as
// the health-check cache above — no KV/Durable Object binding needed),
// so a given IP's budget can reset whenever Cloudflare spins up a fresh
// isolate. That's fine here: the goal is blunting bursts/scrapers hitting
// the homelab origin on every request, not perfectly precise accounting.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120; // ~2 req/s sustained per IP
const RATE_LIMIT_MAX_TRACKED_IPS = 5000; // cap memory if many unique IPs hit in one window

let cachedHealthy = null;
let cachedAt = 0;

const requestLog = new Map(); // ip -> { count, windowStart }

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    if (!entry && requestLog.size >= RATE_LIMIT_MAX_TRACKED_IPS) {
      // Defend against unbounded growth from a flood of distinct IPs —
      // drop the oldest-inserted entry (Map preserves insertion order).
      const oldestKey = requestLog.keys().next().value;
      requestLog.delete(oldestKey);
    }
    requestLog.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

async function probeHomelab() {
  const now = Date.now();
  if (cachedHealthy !== null && now - cachedAt < HEALTH_CACHE_SECONDS * 1000) {
    return cachedHealthy;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const res = await fetch(HOMELAB_ORIGIN + HEALTH_PATH, {
      method: 'GET',
      headers: { Host: HOMELAB_HOST_HEADER },
      signal: controller.signal,
      // Talking to the origin directly by IP; TLS cert is issued for the
      // domain name, not the IP, so this request targets the origin
      // as Cloudflare would after DNS resolution.
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    cachedHealthy = res.status === 200;
  } catch (_err) {
    cachedHealthy = false;
  } finally {
    clearTimeout(timeout);
    cachedAt = now;
  }

  return cachedHealthy;
}

async function proxyTo(origin, hostHeader, request) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, origin);

  const headers = new Headers(request.headers);
  headers.set('Host', hostHeader);

  const init = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  };

  return fetch(target.toString(), init);
}

export default {
  async fetch(request) {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000) },
      });
    }

    const healthy = await probeHomelab();

    if (healthy) {
      return proxyTo(HOMELAB_ORIGIN, HOMELAB_HOST_HEADER, request);
    }

    // Vercel routes by Host/SNI. Once lokeshrc.me is attached as a custom
    // domain on the Vercel project, Vercel matches requests by that Host
    // header — send the real domain, not the *.vercel.app hostname, or
    // Vercel won't resolve the right project/deployment.
    return proxyTo(VERCEL_ORIGIN, request.headers.get('Host') || HOMELAB_HOST_HEADER, request);
  },
};
