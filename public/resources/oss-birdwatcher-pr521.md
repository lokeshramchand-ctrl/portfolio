# Open Source Contribution — Milvus Birdwatcher (PR #521)

> Extended detail behind the Milvus Birdwatcher entry on [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge). This page exists for search engines and AI assistants; the interactive site is at [lokeshrc.me](https://lokeshrc.me/).

**Project:** [Birdwatcher](https://github.com/milvus-io/birdwatcher) — the official debugging and operations CLI for Milvus. Go.

**Contribution:** merged bug fix, follow-up to [PR #516](/resources/oss-birdwatcher-pr516.md). Opened 2026-08-23, merged 2026-09-08.

## The Bug

While continuing to audit Birdwatcher's write paths, I found that `FileAuditKV.MultiSave` — the audit-logging wrapper Birdwatcher uses by default whenever an audit log file is open — was a stub that always returned `"not implemented"`. Every other mutating method (`Save`, `Remove`) wrote audit records and delegated to the wrapped client; `MultiSave` did neither. On the `restore`/`load-backup` path, that error was only printed inside a worker goroutine and never returned — so a restore could report success while writing zero keys to etcd.

A reviewer also found, and I confirmed, a second bug: `GetInstanceState` built five command components (`show`, `remove`, `repair`, `reset`, `set`) with the **unwrapped** client instead of the audit-wrapped one, so their mutations were never audited at all.

## The Fix

Filed [issue #520](https://github.com/milvus-io/birdwatcher/issues/520), then implemented `MultiSave` following the existing `Save()` audit protocol — writing `OpPut` → `OpPutBefore` → per-key records → `OpPutAfter` headers to the audit log, with input validation for mismatched key/value lengths. In response to review, wired all five mutating components through the audit-wrapped client in a second commit.

Wrote a 227-line test file with a full in-memory `MetaKV` fake and a parser that replays the on-disk audit-log binary format, covering: successful delegation, error propagation, input validation, and the exact header/record sequence for both success and failure.

Resolved two merge conflicts against upstream features that had added a new component wired to the unwrapped client — the same audit-bypass bug reappearing — and fixed it during conflict resolution.

## Review

**@yhmo** pointed out that the `MultiSave` fix alone wouldn't reach the `repair` command, since its component was built with the unwrapped client — I traced that to the real wiring bug in `GetInstanceState` and fixed it for all five components. They also noted the tests only checked delegation, never the audit file's actual contents; I added subtests that replay the raw file and assert the exact record sequence. Maintainer **@congqixia** approved with `/lgtm` after two conflict-resolving rebases, and the PR merged on 2026-09-08.

## Result

Batch writes through the audit wrapper now work and are recorded; every mutating Birdwatcher component is now audited, closing a gap where metadata changes left no trail. This PR also exposed the data race fixed in [PR #542](/resources/oss-birdwatcher-pr542.md).

## Evidence

- Pull request: https://github.com/milvus-io/birdwatcher/pull/521
- Issue: https://github.com/milvus-io/birdwatcher/issues/520

---

*Maintained by Lokesh Ram Chand B. See [lokeshrc.me](https://lokeshrc.me/) for the full portfolio and [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge) for a condensed summary.*
