---
title: "The Stub That Made Birdwatcher's Restore Write Nothing"
date: "Aug 23, 2026"
excerpt: "FileAuditKV.MultiSave in Birdwatcher always returned 'not implemented'. That broke one repair command outright and made restore silently write zero keys."
tags: ["Go", "Milvus", "etcd", "Open Source", "Debugging"]
---

This was my second fix to [Birdwatcher](https://github.com/milvus-io/birdwatcher), Milvus's diagnostic and repair tool: [PR #521](https://github.com/milvus-io/birdwatcher/pull/521), fixing [#520](https://github.com/milvus-io/birdwatcher/issues/520). It's merged.

## The stub

`FileAuditKV` wraps the real etcd client. When an audit log file is open, which is the normal case, every write goes through it. Each method writes an audit record and then delegates to the real client. `Save` does that, and so does `Remove`.

`MultiSave` didn't:

```go
func (c *FileAuditKV) MultiSave(...) error {
    return errors.New("not implemented")
}
```

## What that broke

I traced two live callers.

**`repair segment-storage-layout`** failed 100% of the time. It backs up metadata with `MultiSave` before doing any repair work, so it died at step one.

**`restore`** was worse. Its `MultiSave` error only got printed inside a goroutine and never returned, so a restore could report success after writing zero keys to etcd. You'd think you had restored your metadata when nothing had happened.

The first one is loud and annoying. The second one is quiet, and it's the one that actually hurts.

## The fix

I followed the existing `Save` pattern: write audit records for the batch, delegate to `c.cli.MultiSave`, and return its result. I also added a guard that rejects mismatched `keys` and `values` lengths, since a batch write with misaligned slices would pair the wrong keys with the wrong values.

## Testing

I added `states/kv/kv_audit_test.go` with three cases:

- delegation works and the values actually land
- an error from the wrapped client comes back to the caller
- mismatched key/value lengths are rejected

`go build` and `go vet` on `states/kv/...` passed.

## Where it led

Making `MultiSave` actually work opened up a code path nobody could reach before. In `load-backup`, three goroutines shared one error variable, and with a real `MultiSave` behind them they could race and hide a failure. I fixed that later in [PR #542](https://github.com/milvus-io/birdwatcher/pull/542), and it has its own post.

That's the main thing I learned from this one. When a stub always fails, the code behind it has never run against real behavior. Fixing the stub is also the first real test of everything that calls it.
