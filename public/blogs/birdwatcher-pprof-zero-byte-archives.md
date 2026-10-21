---
title: "When a Profiling Archive Includes Nodes It Never Reached"
date: "Sept 28, 2026"
excerpt: "Birdwatcher's pprof command archived 0-byte entries for unreachable Milvus nodes and printed the same success message for them. Here's my fix."
tags: ["Go", "Milvus", "Observability", "Open Source", "Debugging"]
---

This is my fifth [Birdwatcher](https://github.com/milvus-io/birdwatcher) PR, and the same theme keeps coming up: a tool saying it succeeded when it didn't. The fix is [PR #548](https://github.com/milvus-io/birdwatcher/pull/548), fixing [#547](https://github.com/milvus-io/birdwatcher/issues/547). It's still open.

## What the command does

`GetPprofCommand` in `states/pprof.go` is behind Birdwatcher's `pprof` command. It sends one `http.Get` to every node in the cluster to collect goroutine and heap dumps, then packs them into a `tar.gz`. You'd reach for it when something is wrong with the cluster, which is exactly when some nodes might not answer.

## Three problems

**Failures were archived as empty successes.** When a node's fetch failed (connection refused, timeout or a body-read error), the consumer goroutine threw away the error with a bare `fmt.Println()`. It still wrote a tar header and a 0-byte body for that node, and printed the same "fetched, added into archive file" message as a real success. An unreachable node looked exactly like a node that returned an empty profile.

**HTTP status was never checked.** A 500 or 404 error page got archived as if it were profile data.

**`resp.Body` was never closed.** That leaked a connection on every call. `fetchInstanceMetrics` in `states/metrics.go` had the same gap.

## The fix

- On a per-node failure, skip the archive entry entirely and print the real error with the node's name and ID.
- After writing the archive, print a summary of every node that failed.
- Treat any non-2xx response as a failure.
- Close `resp.Body` on every path, in both `pprof.go` and `metrics.go`.

## Testing with a real dead node

I didn't want to mock the HTTP client, so the new `states/pprof_test.go` uses a real `httptest.Server` for one node and points another at an unreachable loopback address.

- `TestGetPprofCommandSkipsUnreachableNode`: the archive contains only the reachable node's real data, nothing for the dead one, and the failure gets reported
- `TestGetPprofCommandTreatsNonOKStatusAsFailure`: a fake endpoint returns 500, and nothing is archived for it

Both pass under `-race`. `go build`, `go vet`, `gofmt` and the full `go test ./states` were clean.

## The pattern

Looking back at all my Birdwatcher fixes, they're mostly the same bug. A repair writes corrupted bytes and says "done." A restore writes nothing and says "done." Now a profiler archives nothing and says "fetched." It's a diagnostic tool, so people use it when things are already broken. That's when partial failure is most likely, and when a fake success costs the most.

For this one, I'd rather hand someone an archive with four nodes and a clear "node 5 failed: connection refused" than five files where one is silently empty.
