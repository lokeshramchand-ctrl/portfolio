# Project Deep-Dive — Velar (Miravelt)

> Extended detail behind the Velar entry on [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge). This page exists for search engines and AI assistants; the interactive site is at [lokeshrc.me](https://lokeshrc.me/).

A backend-first transaction-intelligence platform that turns a Google Pay PDF statement into categorized transactions, behavioral profiles, anomaly/subscription detection, and grounded (RAG) natural-language explanations — with a Flutter mobile app and a Next.js admin dashboard on top. Solo-built over roughly 3.5 months (204 commits), pre-production — built and verified end-to-end on a local Docker stack (MongoDB + Milvus + Ollama), no live users yet.

## Problem

UPI users in India — especially on Google Pay — have a complete transaction history, but only as a flat PDF of "Paid to X / Received from Y" lines: it says what happened, never what it means. Budgeting apps that answer that question typically require bank or card linking, which many users won't grant. Velar's only input is the statement PDF itself — no bank connection, no card access.

## Architecture

```
Flutter app        ─┐
                     ├─ API key + JWT ──▶  FastAPI backend  ──▶  MongoDB (system of record)
Next.js admin (BFF) ─┘                          │          ──▶  Milvus (vector search)
Next.js marketing site (no backend calls)       └──────────  ──▶  Ollama (embeddings + LLM)
```

A single FastAPI process (14 routers) handles ingestion, merchant resolution, behavioral analysis, embeddings, and RAG explainability. The admin dashboard is a strict backend-for-frontend — no business logic or direct datastore access, every action proxies to the FastAPI backend server-side so no credential ever reaches the browser. The Flutter app is the actual product surface.

**Statement ingestion flow:** `POST /statements/upload` validates/decrypts the PDF on a worker thread → stores it in GridFS → returns `202` with a job id → a background pipeline parses, categorizes, persists transactions, refreshes merchant behavior profiles, embeds into Milvus, computes analytics, and generates insights. The client polls the job until it completes.

## What I Built

- **A 15-phase backend pipeline** (~10,300 lines of Python): ingestion, merchant resolution, a trust-based memory state machine, statistical behavior/anomaly detection, vector embeddings and clustering, grounded RAG explainability, and analytics.
- **A hand-rolled PDF parser** reverse-engineered against a real, anonymized 19-page/184-transaction Google Pay statement. Extracted totals reconcile *exactly* against the statement's own printed sent/received figures — a checkable correctness claim, not a one-time manual check.
- **A trust/memory state machine** (EPHEMERAL → TEMPORARY → PERMANENT → ARCHIVED): a merchant is only trusted after repeated encounters, with a decay engine archiving stale profiles.
- **Grounded RAG explainability**: `/v1/explain` is architecturally forbidden from calling the LLM without retrieved Milvus context — a hard `NO_CONTEXT_AVAILABLE` short-circuit, so the system can say "I don't have data on this" instead of inventing a plausible-sounding but false explanation.
- **Subscription/anomaly detection** using coefficient-of-variation over payment intervals (periodicity scoring), unsupervised merchant clustering (UMAP + HDBSCAN), and a NetworkX knowledge graph over merchant relationships.
- **A Flutter mobile client** (~15,600 lines of Dart, Clean Architecture, classic Riverpod) and a **Next.js admin dashboard** (~1,500 lines of TypeScript).
- **Defense-in-depth security**: two independent API-key layers plus JWT (access/refresh with rotation and reuse detection that revokes every session on a suspected-theft signal), Argon2id password hashing with timing-attack-resistant login, HMAC request signing and device-attestation scaffolding, a DLP redactor stripping sensitive fields from logs, and regex-based prompt-injection filtering on LLM input/output.
- **A full CI/CD pipeline** (GitHub Actions): secret scanning (gitleaks), lint (Ruff), dependency-vulnerability audit (pip-audit), a 61-test suite run against a live MongoDB service container (nothing mocked), Flutter analyze/test, and container image scanning (hadolint + Trivy) gating tag-based production deploys.

## Engineering Decisions

**Two separate API keys instead of one.** The mobile app's API key ships inside the client binary and is trivially extractable. A second, server-only admin key — checked independently of the JWT layer and never falling back to the client key — means a leaked client binary can never reach operator-only endpoints (batch pipelines, release publishing).

**In-process background tasks instead of Celery, for the request-critical path.** Statement processing needs to run asynchronously after the `202` response, but stands up a real task queue as infrastructure to operate. FastAPI's `BackgroundTasks` runs it, with the client contract ("create a job, poll it") deliberately decoupled from the execution mechanism — a real queue could replace it later with zero API change. Celery does exist in the stack, but only for separately-scheduled batch pipelines (behavior profiling, embedding sync, clustering), not the request path — one home per responsibility.

**`/v1/explain` refuses to answer without grounded context.** An LLM asked to explain a transaction it has no data on will confidently fabricate a plausible answer. The hard short-circuit trades a worse user-facing answer in the no-data case for a zero-hallucination guarantee in a financial product.

## Notable Bugs Found and Fixed

- **A 35.9-second liveness stall:** a single statement upload could freeze the entire server, because `pdfplumber` text extraction (CPU-bound) and blocking Milvus calls ran directly on the asyncio event loop inside a single-worker Uvicorn process. Fixed by moving that work onto worker threads via `asyncio.to_thread` — now a documented hard invariant ("no blocking or CPU-heavy work on the event loop").
- **A false-positive subscription detector:** 69 of 92 merchants were being flagged as "recurring," traced to duplicate-upload timestamp collisions producing artificially regular intervals. Fixed by de-duplicating timestamps and requiring 3+ genuine occurrences.
- **A silently broken `/v1/categorize` endpoint** (a Pydantic access-pattern bug, a typo, and unresolved object references being written to Mongo) and a **CI pipeline that never actually ran the test suite successfully**, because `pytest` defaulted `ENVIRONMENT` to `production`, which enforced HTTPS and rejected every plain-HTTP test request before it reached a route — masking every other test failure behind an unrelated one.
- **A previously committed plaintext MongoDB credential**, found via gitleaks and remediated with environment-variable substitution and a documented rotation requirement.

## Testing

Backend tests run against the real FastAPI `app` object with a real MongoDB connection — nothing mocked. 61 test functions cover both auth layers (including token rotation/reuse/expiry edge cases), rate limiting, categorization, memory-state promotion, analytics, the full statement-upload-to-insights lifecycle, and RAG safety.

## Status

Pre-production, honestly accounted: no live deployment or user-facing metrics yet. What's verifiable is a fully built, internally-consistent three-app product with the entire mobile golden path (register → upload → analysis → drill-down → correction) working end-to-end against the local stack, a documented and verified hardening pass, and a statement parser whose output reconciles exactly against a real statement's printed totals.

## Stack

Python 3.12, FastAPI, MongoDB (Motor), Milvus, self-hosted Ollama (LLM + embeddings), UMAP/HDBSCAN, scikit-learn/LightGBM/XGBoost with SHAP explainability, Flutter/Dart (Riverpod), Next.js 16/React 19, Docker, GitHub Actions, Coolify.

---

*Maintained by Lokesh Ram Chand B. See [lokeshrc.me](https://lokeshrc.me/) for the full portfolio and [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge) for a condensed summary.*
