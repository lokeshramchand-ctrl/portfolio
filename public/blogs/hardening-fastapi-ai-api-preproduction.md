---
title: "Hardening a 15-Phase AI API for Pre-Production"
date: "Aug 22, 2026"
category: "Engineering"
tags: ["Machine Learning", "FastAPI", "MongoDB", "Docker", "Security", "Production Readiness"]
excerpt: "What my pre-production audit of Velar found: zero indexes, a root container, a concurrency race, and two security bumps that broke things."
---

Getting Velar to return the right category was the fun part. Getting it ready for real traffic was a different job. Before this audit it had no indexes on any collection, logged raw transaction payloads by default, ran as root in a single-stage Docker image, and had a real race in its merchant profile updates.

I had one rule for the whole pass: make the change, run the full suite, then check the behavior by hand where no test covered it. For Docker that meant building the image and running it against a real database. That rule caught two breakages I wouldn't have seen otherwise.

## The race, briefly

`process_encounter` used to read a profile, bump its frequency in Python and write it back. That loses updates and can double-insert new merchants. I replaced it with one atomic `find_one_and_update` with `upsert=True`. I wrote that up in its own post.

## Zero indexes

I grepped for `create_index` and found nothing, so every profile lookup was a full collection scan. `ensure_indexes()` now runs at startup:

```python
await cls.merchant_profiles.create_index("canonical_name", unique=True, background=True)
await cls.transactions.create_index([("user_id", 1), ("timestamp", -1)], background=True)
await cls.refresh_tokens.create_index("expires_at", expireAfterSeconds=0, background=True)
```

The unique index on `canonical_name` backs up the race fix at the database level. The TTL index lets MongoDB delete expired refresh tokens itself, so there's no cleanup job to forget. If index creation fails, I log a warning instead of crashing. A slow service is easier to recover from than one that won't start.

## Not running as root

I split the Dockerfile into a builder stage and a runtime stage, added a `velar` system user with no home directory, and added a `HEALTHCHECK` against `/live`. I checked with `id` that the process really runs as `uid=999`. I picked `/live` because it doesn't touch Mongo, Milvus or Ollama, so a dependency outage won't make Docker restart-loop a container that a restart can't fix. I kept `python:3.12-slim` instead of Alpine because scikit-learn, numpy and umap-learn are painful on Alpine's C library.

## Two security bumps that broke things

`pip-audit` found fourteen known vulnerabilities in three packages. Bumping the pins was the easy part.

- `fastapi` 0.115.6 to 0.140.13 pulled in a newer Starlette and broke `prometheus-fastapi-instrumentator`'s route lookup. Thirteen of fifteen tests failed, which is the only reason it didn't ship.
- `setuptools` 83.0.0 removed `pkg_resources`, which pymilvus below 2.6 imports at load time. Tests didn't catch this one. It only showed up when I built and ran the image.

## The rest

The API key check now uses a constant-time comparison. Free-text fields have length limits, a body-size middleware handles requests with or without `Content-Length`, and rate limits match cost: 20 per minute for `/v1/explain`, 5 per minute for clustering.

## What I left open on purpose

- Every caller with `VELAR_API_KEY` has the same access. Scoping keys per caller is a feature, not a patch.
- The Trivy image scan in CI doesn't block builds yet. Someone has to triage its first findings.
- The CPU and memory limits are guesses until I have real load data.
- A MongoDB credential is in git history. Deleting it from the file doesn't help. It has to be rotated on the server.

## What I'd do differently

I expected the checklist to be the valuable part. It turned out to be the verification loop. Next time I'd set up CI before starting the fixes instead of near the end. Re-running everything by hand worked only because I remembered to do it every time.
