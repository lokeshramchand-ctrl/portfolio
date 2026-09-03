# When "Success" Doesn't Mean It Worked: A Silent Data Corruption Bug in Birdwatcher

Picture a hospital records clerk. Every time a doctor updates a patient's chart, the clerk files a clean copy in the archive, then stamps it "DONE."

Now imagine the copier jams mid-page. The clerk notices, scribbles a warning in their own desk log, and files the torn page anyway. Then stamps it "DONE."

Nobody finds out until someone actually needs that record, and it's unreadable.

That's the shape of a bug I recently fixed in [Birdwatcher](https://github.com/milvus-io/birdwatcher), the diagnostic and repair tool engineers use to inspect the internal state of [Milvus](https://milvus.io/), an open-source vector database used for AI search and retrieval. This post walks through what the bug was, why it's more interesting than it looks at first glance, and how I fixed it. The first half is for anyone curious about how software can lie to you without ever crashing. The second half is for engineers who want the actual mechanics: the wire format, the test strategy, and a detail in the original bug report that turned out to be wrong.

## The story, for anyone

Milvus stores its operational metadata (things like which segments exist, which indexes are built, which channel a piece of data belongs to) in [etcd](https://etcd.io/), a small, fast key-value store designed for exactly this kind of bookkeeping. Think of etcd as the library's card catalog. The actual books (vectors, embeddings, search indexes) live elsewhere, but the catalog is what tells every part of the system where to look.

Sometimes that catalog gets damaged. A crash mid-write, a version migration, a rare edge case nobody tested for, and now some entry points to a segment that doesn't exist, or a field is missing where a required one should be. Birdwatcher exists to let an operator go in, find those broken entries, and repair them directly.

Here's where it gets interesting. Repairing an entry in etcd isn't as simple as editing a JSON file. Milvus stores its metadata using [Protocol Buffers](https://protobuf.dev/) (protobuf), a compact binary format that's fast to read and write but not human-editable. So the repair process has three steps: read the broken entry, fix it in memory as a Go struct, then convert that struct back into protobuf bytes before writing it to etcd.

That middle-to-last step, converting the fixed struct into bytes, is where the bug lived. If that conversion failed, the old code printed a warning to the terminal and then wrote the result anyway. The result of a failed conversion isn't nothing. It's a chunk of bytes that looks like data but isn't valid data. The repair command reported success either way. An operator running the repair would see a clean "done," walk away believing the entry was fixed, and the entry now sitting in etcd would be quietly unreadable.

Nobody would find out until something downstream tried to read that entry and choked on it, possibly hours or days later, in an unrelated part of the system, far from any log line connecting it back to the repair. That's the failure mode that makes this class of bug expensive: the tool didn't just fail, it failed while telling you it succeeded.

## The fix

The fix is small on paper: if the conversion to protobuf fails, stop. Return the error. Don't write anything. "Success" should only ever mean success.

```go
// Before
bs, err := proto.Marshal(index)
if err != nil {
    fmt.Println("failed to marshal segment info", err.Error())
}
err = cli.Save(context.Background(), p, string(bs))
return err

// After
bs, err := proto.Marshal(index)
if err != nil {
    return fmt.Errorf("failed to marshal repaired index %d: %w", index.GetIndexInfo().GetIndexID(), err)
}
return cli.Save(context.Background(), p, string(bs))
```

Same shape of bug existed in a sibling function that repairs segment metadata, so I applied the identical fix there. I also added tests for both functions that specifically simulate a marshal failure and assert that the save never happens, so this can't quietly come back in a future refactor.

## Why this matters more than the diff suggests

Two files. About ten lines changed. But the category of bug is worth sitting with for a second, because it's one of the more dangerous shapes a bug can take.

A crash is annoying but honest. The system tells you something went wrong, right when it went wrong, and you go fix it. A silent failure is worse precisely because it isn't loud. It erodes the thing operators depend on most during an incident: whether they can trust what their tools are telling them. A repair tool that occasionally lies about whether the repair worked is worse than having no repair tool at all, because the operator now has to independently verify every result, which defeats the point of having the tool.

This is also the kind of bug that's easy to write and easy to miss in review, because the code isn't wrong in an obvious way. It compiles. It handles the error, technically; it just handles it by printing instead of stopping. The fix isn't a clever algorithm or a new abstraction. It's the discipline of treating "I logged the error" and "I handled the error" as two different things.

---

## For the engineers: the mechanics

If you've read this far because you actually want the technical detail, here's the part that made this bug worth writing about instead of just fixing and moving on.

### The bug report said "empty value." It's not.

The original issue that flagged this ([#515](https://github.com/milvus-io/birdwatcher/issues/515)) described the failure mode as writing an *empty* value to etcd on marshal failure. That's a reasonable assumption, and it's wrong in a way that actually makes the bug worse than advertised.

`proto.Marshal` doesn't return an empty byte slice on failure. Depending on where in the encoding process it fails, it can return a partially written buffer: some fields successfully serialized before the error was hit, followed by nothing. That buffer is non-empty, syntactically plausible-looking binary data that fails to unmarshal because it's missing required structure or gets cut off mid-field. In other words, the corrupted value isn't detectably empty. It looks like it might be real data until something tries to actually decode it.

This distinction matters operationally. An empty value at a known key is trivially detectable: a health check or a startup scan can flag "this key exists but has zero bytes" in milliseconds. A non-empty value that merely fails to unmarshal requires you to actually attempt deserialization against every entry to find the corruption, which is a much more expensive and much less obvious check to run proactively. The bug doesn't just corrupt data, it corrupts it in a way that hides from cheap detection.

### Why the original code even got this far

Looking at the function before the fix:

```go
func writeRepairedIndex(cli kv.MetaKV, basePath string, index *indexpb.FieldIndex) error {
	p := path.Join(basePath, fmt.Sprintf("field-index/%d/%d", index.IndexInfo.CollectionID, index.IndexInfo.IndexID))

	bs, err := proto.Marshal(index)
	if err != nil {
		fmt.Println("failed to marshal segment info", err.Error())
	}
	err = cli.Save(context.Background(), p, string(bs))
	return err
}
```

There's a second, smaller smell here worth calling out: the error message says "failed to marshal segment info" inside a function that marshals an *index*, not a segment. That's a copy-paste artifact, almost certainly from `writeRepairedSegment`, which has the identical pattern a few files over. It's a small thing on its own, but it's a useful signal: when the exact same bug shows up in two places with a leftover copy-paste error message between them, that's usually a sign the pattern was written once and reused without re-deriving the logic each time, which is exactly the kind of place review needs to slow down.

`writeRepairedSegment` had the same issue, and I fixed it the same way, even though its current caller is commented out in the codebase and it isn't reachable from the CLI today. I fixed it anyway because dead-but-present code has a way of getting a caller again, and there's no reason to leave a known-bad pattern sitting there waiting to be reactivated.

### The fix itself

```go
bs, err := proto.Marshal(index)
if err != nil {
    return fmt.Errorf("failed to marshal repaired index %d: %w", index.GetIndexInfo().GetIndexID(), err)
}
return cli.Save(context.Background(), p, string(bs))
```

Two changes worth noting beyond the obvious early return. First, the wrapped error now includes the specific index ID that failed to marshal, using `%w` so the underlying error is still inspectable by callers. Under the old code, a marshal failure produced a print statement disconnected from the return value, so a caller checking `err` after the function returned would see `nil` (from the subsequent `cli.Save` call, assuming that happened to succeed on garbage bytes) or, at best, an error with no indication of which entry was the problem. Now the error return is the single source of truth about whether the operation succeeded, and it's specific enough to be actionable in a log.

Second, `cli.Save` is only ever called with bytes that are known-good, since the function returns before reaching it on any marshal failure.

### Testing a marshal failure without mocking the codec

The interesting part of the test isn't the assertion, it's how you make `proto.Marshal` fail deterministically without mocking protobuf internals. The answer is invalid UTF-8 in a string field:

```go
index := &indexpb.FieldIndex{
    IndexInfo: &indexpb.IndexInfo{
        CollectionID: 100,
        IndexID:      200,
        // invalid UTF-8 makes proto.Marshal fail.
        IndexName: "\xff\xfe\x00\x80invalid",
    },
}

err := writeRepairedIndex(cli, "by-dev/meta", index)

require.Error(t, err)
assert.Empty(t, cli.saveKeys, "Save must not be called when marshaling fails")
```

Protobuf's `string` type is defined to hold valid UTF-8, and the Go implementation enforces that at marshal time rather than at struct-construction time, since Go's own `string` type doesn't enforce it. That gap between what the type system allows you to construct and what the wire format actually permits is exactly the failure mode this bug lived in, and it's a reliable, dependency-free way to trigger a real marshal error in a test rather than reaching for a mock.

The test doubles as a regression guard against the corrupted-write behavior specifically. `saveRecordingKV` is a small fake that implements the `kv.MetaKV` interface and records every key and value passed to `Save`, so the assertion isn't just "an error came back," it's "the write never happened at all." That's the property that actually matters: an error return with no write is a safe failure. An error return with a write anyway is the original bug wearing a different error path.

A second test case in the same file exercises the happy path: a valid index gets marshaled, saved under the expected key, and read back with `proto.Unmarshal` to confirm the round trip actually preserves the data, not just that some bytes landed in etcd.

## Closing thought

The fix here doesn't rewrite an algorithm or add a feature. It closes a gap between what an error handling block looks like and what it does. `if err != nil { log it }` reads like error handling. It isn't, unless something after that block also stops. That's an easy thing to write once, under deadline, in a function that otherwise works fine on the happy path, and it's an easy thing to keep shipping unnoticed for a long time, because the bug only shows up when the unhappy path actually gets hit, which by definition is rare.

Small fix, two files. But it's the kind of change that matters most at 2am, when someone is trying to recover a production system and needs to actually believe what their tools are telling them.

Thanks to Congqi Xia for the quick review and merge.
