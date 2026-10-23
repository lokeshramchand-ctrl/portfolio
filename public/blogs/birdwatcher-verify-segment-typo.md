---
title: "A Typo That Hid a Whole Command, and the Crash Behind It"
date: "Sept 21, 2026"
excerpt: "Birdwatcher's verify-segment command was fully written but never registered, because its method was named VerifySegmentCommnad. Fixing the typo exposed a startup panic."
tags: ["Go", "Milvus", "Reflection", "Open Source", "Debugging"]
---

Some bugs are funny until you see what's behind them. This one started as a misspelled method name in [Birdwatcher](https://github.com/milvus-io/birdwatcher). The fix is [PR #546](https://github.com/milvus-io/birdwatcher/pull/546), closing [#545](https://github.com/milvus-io/birdwatcher/issues/545), and it's merged.

## How commands get registered

Birdwatcher builds its CLI by reflection. `parseFunctionCommandsFrom` walks a receiver's methods and registers each one whose name ends in `Command`, using `strings.HasSuffix(name, "Command")`.

The method for `verify-segment` was named `VerifySegmentCommnad`. Two letters swapped. It doesn't end in `Command`, so registration skipped it without any error. The command was fully implemented and nobody could run it.

## Fixing the typo broke startup

I renamed it to `VerifySegmentCommand`. Now it got registered, and that exposed a second bug. `VerifySegmentParam`'s fields had no `name:` struct tags, so `setupFlags` tried to add three flags with empty names, and pflag panicked:

```
flag redefined: ""
```

Any state that mounts this command would have crashed on startup. The typo had been hiding a crash. I added the missing tags, following the repo's existing convention.

## Making the typo impossible to repeat

Fixing one typo felt incomplete, since the same mistake could happen to any command. So I added `framework.FindMissingCommandSuffix`. It scans a receiver for exported methods that look like CLI commands (`func(ctx context.Context, p *T) ...`, where `T` implements `CmdParam`) but don't end in `Command`.

That turns a one-off fix into a guard against the whole class of bug.

## Tests

- `TestVerifySegmentCommandRegistered`: `verify-segment` is reachable in `InstanceState`'s command tree
- `TestInstanceStateNoUnregisteredCommandLikeMethods`: audits `InstanceState` for any command-shaped method missing the suffix
- `TestFindMissingCommandSuffixDetectsTypo`, `...CleanReceiver`, `...NilReceiver`: unit tests for the detector

`go build ./...`, `go vet ./...` and `go test ./framework/... ./states/...` all passed.

## What I took from it

Convention-based registration is convenient, but when a name doesn't match, nothing tells you. The code compiles, and the command just isn't there. When I use reflection like this, I want a test that says "everything that looks like X really is registered as X." It's cheap to write and it catches this whole category of mistake.

The other lesson: a feature that never ran is also a feature that was never tested. As soon as `verify-segment` became reachable, it crashed. I'd much rather find that in a PR than in someone's terminal.
