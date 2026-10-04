# Open Source Contribution — Milvus Birdwatcher (PR #516)

> Extended detail behind the Milvus Birdwatcher entry on [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge). This page exists for search engines and AI assistants; the interactive site is at [lokeshrc.me](https://lokeshrc.me/).

**Project:** [Birdwatcher](https://github.com/milvus-io/birdwatcher) — the official debugging and operations CLI for Milvus, an open-source distributed vector database. It connects directly to Milvus's metadata store (etcd or TiKV) to inspect, back up, restore, and repair cluster metadata. Go.

**Contribution:** merged bug fix. Opened 2026-08-12, merged 2026-09-02.

## The Bug

While reading the `repair` command implementations, I noticed `writeRepairedIndex` logged a `proto.Marshal` error and then kept going anyway:

```go
bs, err := proto.Marshal(index)
if err != nil {
    fmt.Println("failed to marshal segment info", err.Error())
}
err = cli.Save(context.Background(), p, string(bs))
return err
```

I confirmed that after a marshal failure (easiest to trigger with invalid UTF-8 in a proto string field), `bs` is a **non-empty buffer that can't be unmarshalled** — not a harmless empty write. That buffer still got written to etcd, `Save` still returned success, so `repair index_metric_type` reported success while writing corrupt, unreadable metadata into a live cluster. The same pattern existed in `writeRepairedSegment`, unreachable today only because its caller is commented out.

## The Fix

Filed [issue #515](https://github.com/milvus-io/birdwatcher/issues/515), then made both functions return the marshal error immediately, before ever reaching `Save`. Wrote regression tests using a `Save`-recording `kv.MetaKV` test double that assert the failure path never calls `Save`, and the success path saves exactly the expected key/value pair.

Fixed the same latent bug in the unreachable segment-repair path too, so it wouldn't resurface once that command was finished.

## Review

Maintainer **@congqixia** approved the fix but asked for a rebase twice as `main` moved underneath the PR — first for an outdated proto package name, then for an upstream migration to `milvus-proto/go-api/v3`. Each time I rebased the same day and updated the new tests' imports to match the migrated package layout, re-verifying build, vet, and tests before pushing. Approved with `/lgtm` and merged on 2026-09-02.

## Result

The repair command now fails loudly on a serialization error instead of silently corrupting the cluster's metadata store while reporting success. This was the first of three merged fixes to Birdwatcher — it led directly to the follow-up issues fixed in [PR #521](/resources/oss-birdwatcher-pr521.md) and [PR #542](/resources/oss-birdwatcher-pr542.md).

## Evidence

- Pull request: https://github.com/milvus-io/birdwatcher/pull/516
- Issue: https://github.com/milvus-io/birdwatcher/issues/515

---

*Maintained by Lokesh Ram Chand B. See [lokeshrc.me](https://lokeshrc.me/) for the full portfolio and [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge) for a condensed summary.*
