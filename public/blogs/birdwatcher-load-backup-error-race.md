---
title: "Three Goroutines, One Error Variable, and a Restore That Lied"
date: "Sept 10, 2026"
excerpt: "Birdwatcher's load-backup could report success while dropping keys, because worker goroutines raced on a shared err. I replaced the pattern with errgroup."
tags: ["Go", "Milvus", "etcd", "Concurrency", "Open Source"]
---

After I fixed `FileAuditKV.MultiSave` in [Birdwatcher](https://github.com/milvus-io/birdwatcher), the restore path behind it finally ran against a real `MultiSave`. That surfaced a race. The fix is [PR #542](https://github.com/milvus-io/birdwatcher/pull/542), fixing [#540](https://github.com/milvus-io/birdwatcher/issues/540), and it's merged.

## The bug

`restoreEtcdFromBackV2` in `states/etcd_restore.go` does the work behind `load-backup` for v2 backups. It splits keys into batches and hands them to 3 worker goroutines. All three wrote to the same function-scoped `err` variable with no synchronization. `go test -race` flags it immediately.

The real damage is what the race hides. Say batch 2 fails in `MultiSave` and sets `err`. Then batch 5 succeeds and overwrites `err` with `nil`. The function prints `load backup cost ...` and reports success, but some restored keys never made it into etcd.

This isn't the same bug as #520/#521. That one was the stub returning "not implemented." This one lives in the restore function and reproduces with any `kv.MetaKV`, including the real `etcdKV.MultiSave`. It only became reachable once #521 made `MultiSave` actually delegate.

## The fix

I removed the wait group, the shared `err` and the buffered error channel, and used `errgroup.WithContext` instead:

- each worker returns its own error
- the first failure cancels the shared context, so the producer and the other workers stop
- `g.Wait()` returns the first real error every time

The diff is +182/-43, including a `go.mod` change.

## Testing a race without trusting luck

A test that passes because the right goroutine happened to win isn't proving anything. So I wrote a fake `kv.MetaKV` that fails only when a batch contains one specific key. That makes the failure deterministic no matter which worker picks up that batch.

The new tests in `states/etcd_restore_test.go`, all run with `-race`:

- `TestRestoreEtcdFromBackV2Success`: every entry restored, correct instance returned
- `TestRestoreEtcdFromBackV2PropagatesMultiSaveError`: the error comes back
- `...Repeated`: the same check 20 times, to rule out a lucky last-write-wins pass

I ran these against the pre-fix code first. They failed there (error swallowed, `nil` returned) and pass with the fix. `go build`, `go vet` and `gofmt` were clean.

## What I learned

When goroutines share an error variable, whichever one writes last decides the result. With a restore, the result you want is the first error, every time. `errgroup` is built for that.

It also showed me why fixing one bug can expose the next. Before #521, this race couldn't happen because every `MultiSave` failed. Making the stub work made the race reachable.
