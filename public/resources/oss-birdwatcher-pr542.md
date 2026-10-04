# Open Source Contribution — Milvus Birdwatcher (PR #542)

> Extended detail behind the Milvus Birdwatcher entry on [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge). This page exists for search engines and AI assistants; the interactive site is at [lokeshrc.me](https://lokeshrc.me/).

**Project:** [Birdwatcher](https://github.com/milvus-io/birdwatcher) — the official debugging and operations CLI for Milvus. Go, `errgroup`, Go race detector.

**Contribution:** merged bug fix, follow-up to [PR #521](/resources/oss-birdwatcher-pr521.md). Opened 2026-09-10, merged 2026-09-18.

## The Bug

Once `FileAuditKV.MultiSave` actually delegated instead of always failing (PR #521), real `MultiSave` errors could finally reach the restore code — which is where I found a data race. `restoreEtcdFromBackV2` ran a producer/consumer pipeline: one goroutine read the backup stream and pushed batches onto a channel, and three worker goroutines wrote each batch via `cli.MultiSave`. All three workers assigned to the **same function-scoped `err` variable with no synchronization** — `go test -race` flagged it immediately. A failure on an early batch was routinely overwritten by a later batch's success, so `load-backup` could report success while some restored keys were silently missing from etcd. A failing worker also didn't stop the producer or the other workers.

## The Fix

Filed [issue #540](https://github.com/milvus-io/birdwatcher/issues/540), then rewrote the pipeline's coordination with `errgroup.WithContext`: each goroutine returns its own error, `g.Wait()` deterministically returns the first one, and the first failure cancels a shared context that the producer and in-flight worker writes both check cooperatively. Also fixed a divide-by-zero panic in the progress calculation on empty backups.

Wrote a deterministic test suite: a mutex-protected fake `MetaKV` that fails `MultiSave` only when a batch contains a specific sentinel key (so the failure surfaces regardless of which worker happens to pick it up), a valid backup-stream builder, and a test run 20× under `-race` to rule out a lucky pass. Confirmed the new tests **fail against the pre-fix code** — race detected, error swallowed — and pass with the fix.

## Review

Maintainer **@congqixia** reviewed and wrote *"the fix is correct and well-tested,"* independently verifying the tests failed on the pre-fix code and calling the context-cancellation design "a nice improvement." Non-blocking suggestions — a pre-existing divide-by-zero, a clarifying comment, wrapping errors for diagnostics, and a rebase blocked by a `go.mod` conflict — were all addressed the same day; the branch was squashed into a single signed-off commit to clear the conflict. Approved with `/lgtm` and merged on 2026-09-18.

## Result

`load-backup` now fails deterministically with a descriptive error when any batch fails, and stops reading/writing promptly instead of reporting a false success after a partial restore. Together, PR #521 and PR #542 fix the restore error path end-to-end, from the KV layer up to the CLI result.

## Evidence

- Pull request: https://github.com/milvus-io/birdwatcher/pull/542
- Issue: https://github.com/milvus-io/birdwatcher/issues/540

---

*Maintained by Lokesh Ram Chand B. See [lokeshrc.me](https://lokeshrc.me/) for the full portfolio and [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge) for a condensed summary.*
