---
title: "Hardening a 15-Phase AI API for Pre-Production"
date: "Aug 22, 2026"
category: "Engineering"
tags: ["Machine Learning", "FastAPI", "MongoDB", "Docker", "Security", "Production Readiness"]
excerpt: "An architectural deep dive and pre-production audit of Velar, detailing how to secure a FastAPI service against concurrency races, missing indexes, root containers, and dependency CVEs."
---



Getting a FastAPI service to return the right category for a transaction is the interesting part. Getting it to survive a 2MB request body, a dead Mongo connection, a root-user container, and a dependency with a CVE from last quarter is the part that decides whether it ever sees real traffic. This is the audit that closed that gap, and it found more than one bug it also had to un-find.

**System:** Velar — pre-production audit  
**Stack:** FastAPI · MongoDB · Docker · GitHub Actions  
**Reading time:** 8 min  

A prototype has to work once, on your machine, while you're watching it. A production service has to survive requests it wasn't tested against, dependencies it doesn't control, and traffic that isn't trying to be nice to it. Velar had thirteen phases of ML pipeline behind it and none of that. No indexes on any collection. A logging config that wrote raw transaction payloads to disk at DEBUG by default. A single-stage Docker image running as root. A genuine concurrency race in the one piece of state every merchant profile depends on.

What follows is what the pre-production audit actually found and fixed, verified against a real MongoDB and a real container build rather than assumed correct because the diff looked reasonable. That distinction turned out to matter twice, in ways I didn't expect going in.

## The rule for the whole audit: verify, don't assume

Every finding below got the same treatment: make the change, then run the full test suite, then confirm the specific behavior by hand where a test didn't already cover it. For the Docker changes that meant actually building the image and running it against a real database, not trusting that a multi-stage Dockerfile that looks right behaves right. That discipline is the actual subject of this post more than any individual fix is, so it gets a section of its own near the end, where it earns it.

## The concurrency race, briefly

One finding gets its own full post: `memory_manager.process_encounter` used to read a profile, increment frequency in Python, and write it back, which loses updates under concurrent traffic against the same merchant and can double-insert a brand-new one. That's CWE-362, and it's High severity here specifically because it can silently corrupt the trust-state data the whole memory system is built on. 

The fix is a single atomic `find_one_and_update` with `upsert=True`, backed by a unique index. I walked through the mechanics of that fix already, so I won't repeat it here — what's worth adding is that the index half of that fix belongs to a much bigger gap this audit found.

## Zero indexes, confirmed by grep

Before this pass, no collection in the database had a single index on it. Not one. That's not a guess — it was confirmed by grepping the codebase for `create_index` calls and finding none, which meant every query, including the profile lookup that runs on every single `/memory/update` call, was a full collection scan. `ensure_indexes()` now runs once at startup and creates every index the app's actual query patterns need:

```python
# database/mongo.py
await cls.merchant_profiles.create_index("canonical_name", unique=True, background=True)
await cls.behavior_patterns.create_index("merchant_name", unique=True, background=True)
await cls.transactions.create_index([("user_id", 1), ("timestamp", -1)], background=True)
await cls.users.create_index("email", unique=True, background=True)
await cls.refresh_tokens.create_index("token_hash", unique=True, background=True)
await cls.refresh_tokens.create_index("expires_at", expireAfterSeconds=0, background=True)
```

Two of these are doing more than speeding up a query. The unique index on `canonical_name` is the actual backstop behind the concurrency fix above; the atomic upsert closes the race in the application, and the unique index closes it at the database, which is the layer that should have been enforcing it the whole time. And the TTL index on `refresh_tokens.expires_at`, with `expireAfterSeconds=0`, means MongoDB deletes expired tokens on its own schedule. No cleanup job, no cron entry, nothing to forget to run.

The whole block is wrapped in a `try/except` that logs a warning instead of crashing startup if index creation fails, on the theory that a service running slow because an index didn't get created is a recoverable Tuesday, and a service that won't start at all because it lacked permission to create an index is a much worse Tuesday.

## A Docker image that doesn't run as root

The original image was single-stage, ran as root, and had no health check beyond whatever the orchestrator assumed. All three got fixed at once, because they're related decisions, not separate ones:

```dockerfile
# Dockerfile
FROM python:3.12-slim AS builder
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim AS runtime
RUN groupadd --system velar && useradd --system --gid velar --no-create-home velar
COPY --from=builder /install /usr/local
COPY --chown=velar:velar . .
USER velar

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "...urllib.request.urlopen('http://localhost:8000/live'...)"
```

The builder stage is the only place that ever sees `build-essential` or pip's cache; the runtime stage copies the finished packages out of `/install` and never installs a compiler of its own. The `velar` user has no home directory and no login shell, and `docker run ... id` confirms the process actually runs as `uid=999`, not root. The health check hits `/live` specifically rather than the older `/health`, because `/live` never touches Mongo, Milvus, or Ollama — a dependency outage shouldn't also convince Docker the process itself is broken and restart-loop a container that restarting can't fix.

One deliberate non-change: the base image stayed `python:3.12-slim` instead of moving to Alpine. Alpine's `musl libc` has real compatibility friction with the scientific-Python wheels (`scikit-learn`, `numpy`, `umap-learn`) the clustering endpoint genuinely needs at runtime. That's a tradeoff made on purpose, not a missed optimization I forgot to revisit.

## The two regressions the version bumps caused

Running `pip-audit` found fourteen known vulnerabilities across three packages. Bumping version pins to fix them is the easy ninety percent of this kind of work. The other ten percent is what actually happened here: two of those bumps broke something, and neither failure was visible by reading the diff.

| Package | Before | After | What broke |
| :--- | :--- | :--- | :--- |
| `fastapi` | 0.115.6 | 0.140.13 | Pulled in a newer starlette that broke prometheus-fastapi-instrumentator's internal route lookup |
| `setuptools` | implicit | 83.0.0 | Removed pkg_resources, which pymilvus <2.6 imports at load time |

The `fastapi` bump was needed to pull in a patched starlette, closing seven CVEs that only existed transitively since starlette was never pinned directly. It also broke `prometheus-fastapi-instrumentator`, whose route-name lookup reached into an internal Starlette object (`route.path` on an `_IncludedRouter`) that no longer existed in the same shape. Thirteen of fifteen tests failed the moment that combination landed, which is the only reason it didn't ship. 

The `setuptools` bump, needed for its own CVE fix, quietly deleted `pkg_resources` from the package entirely — and `pymilvus`'s import chain still depended on it. That one didn't show up in the test suite at all. It only surfaced when the Docker image was actually built and run, because the isolated `pip install --prefix` used in the multi-stage build doesn't pull in `setuptools` the same way a normal install does.

Neither of those would have been caught by reading the changelog for the CVE fix. Both were caught because "bump the version" wasn't treated as the finish line.

## Securing the endpoints nobody blogs about

The API-key check now uses `secrets.compare_digest` instead of `!=`, closing a timing side-channel a prior review had flagged but never fixed. Every free-text field (`CategorizeRequest.text`, `ExplainRequest.transaction_text`, and the rest) got explicit length bounds, so a multi-megabyte payload now gets rejected before it's even parsed instead of being handed to a regex engine. A new body-size middleware backs that up at the transport level, catching both an oversized declared `Content-Length` and a streamed body with no `Content-Length` header to check in the first place. And the batch endpoints got rate limits scaled to what they actually cost: 20 requests a minute for `/v1/explain`, which triggers both an embedding call and an LLM generation call, down to 5 a minute for the clustering pipeline, the single most CPU-intensive thing this service does.

## What's still not fixed, on purpose

**Named in the audit, not hidden by it**

*   Every caller with `VELAR_API_KEY` has identical access to everything. There's no per-caller scoping. Fixing that is a real feature, multi-tenant key management, not a hardening patch, and it's on the roadmap rather than in this pass.
*   The Trivy image scan in CI is non-blocking on purpose. This is the first time this image has ever been scanned. Findings need a human to triage them before the build is allowed to hard-fail on a severity nobody's looked at yet.
*   Docker resource limits are starting defaults, not measured ones. `cpus: "2.0"` and `memory: 2g` are reasonable guesses in the absence of real production load to tune against.
*   A MongoDB credential exists in this repo's git history, committed before this audit and already removed from the current file. Removing it from the working tree doesn't undo the exposure. That credential has to be rotated on the actual database server; no amount of git history rewriting from inside this repo fixes it on its own.

## So what

Going in, I expected the value of this audit to be the list: indexes added, headers added, a root user removed. It turned out to be the verification loop around that list. A CVE fix that isn't re-tested against the actual system it's patching is a version number changed on faith, and twice during this pass that faith would have shipped a broken metrics endpoint or a container that couldn't import its own vector database client.

If I did this again, I'd stand up the CI pipeline before starting the fixes instead of after. It ended up added as one of the last items in this pass, which meant every verification step up to that point was a manual re-run of the test suite and a manual Docker build, done by hand, by me, after each change. That worked, but it worked because I happened to remember to do it every time. A pipeline doesn't need to remember anything. It just runs.

---
