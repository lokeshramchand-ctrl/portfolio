---
title: "When Success Doesn't Mean It Worked"
date: "Sept 3, 2026"
excerpt: "A repair command in Birdwatcher, Milvus's diagnostic tool, could report success while writing corrupted protobuf bytes to etcd. Here's how I found and fixed it."
tags: ["Go", "Milvus", "etcd", "Protobuf", "Debugging", "Open Source"]
---

[Birdwatcher](https://github.com/milvus-io/birdwatcher) is the tool you reach for when [Milvus](https://milvus.io/) metadata in etcd goes bad. It reads a broken entry, fixes it in memory, marshals it back to protobuf and saves it. I found a case where that last step could fail and the command would still say "done." The fix is [PR #516](https://github.com/milvus-io/birdwatcher/pull/516), closing [#515](https://github.com/milvus-io/birdwatcher/issues/515), and it's merged.

## The code

This is what `writeRepairedIndex` looked like:

```go
bs, err := proto.Marshal(index)
if err != nil {
    fmt.Println("failed to marshal segment info", err.Error())
}
err = cli.Save(context.Background(), p, string(bs))
return err
```

It prints the error and then saves anyway. If `Save` succeeds, the function returns `nil` and `repair index_metric_type` reports a successful repair.

## It's not an empty value

The issue described the bad write as an empty value. I wanted to see for myself what `bs` holds after a marshal failure, so I triggered one with invalid UTF-8 in a string field:

```
marshal err: string field contains invalid UTF-8 bytes: [10 17 8 42 26 11 255 254 0 128 105 110 118 97 108 105 100]
unmarshal err: proto: cannot parse invalid wire-format data
```

It's a non-empty buffer that won't round-trip. That's worse than empty. A health check can spot a zero-byte key cheaply, but this one only shows up when something actually tries to decode it, and by then nobody connects it to the repair run that wrote it.

The error message also says "segment info" inside a function that marshals an index. That's a copy-paste leftover from `writeRepairedSegment`, which had the same bug. Its caller is commented out right now, but I fixed it too so the pattern doesn't come back if someone finishes that command.

## The fix

Return early:

```go
bs, err := proto.Marshal(index)
if err != nil {
    return fmt.Errorf("failed to marshal repaired index %d: %w", index.GetIndexInfo().GetIndexID(), err)
}
return cli.Save(context.Background(), p, string(bs))
```

The error now carries the index ID, and `Save` only ever sees bytes that marshaled cleanly.

## Testing it without mocking protobuf

The neat part was making `proto.Marshal` fail for real. Go strings can hold any bytes, but protobuf `string` fields must be valid UTF-8, and Go's protobuf checks that at marshal time. So I put `"\xff\xfe\x00\x80invalid"` in `IndexName`.

I wrote a small fake `kv.MetaKV` that records every `Save` call. The failure test asserts an error comes back and that `Save` was never called. An error plus a write would still be the original bug. A second test checks that a valid index saves and unmarshals back to the same values. I did the same for segments and ran the full repair package, `go vet` and `gofmt`.

## Why I care about this kind of bug

A crash is honest. This wasn't: the tool said it worked when it didn't, so you can't trust its output in the middle of an incident, and that's exactly when you need to. Logging an error isn't handling it. You're only handling it if the code stops.

Thanks to [Congqi Xia](https://github.com/congqixia) for the quick review and merge.
