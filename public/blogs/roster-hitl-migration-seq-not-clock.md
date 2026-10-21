---
title: "A Flaky Test That Was Really a Same-Millisecond Bug"
date: "Aug 9, 2026"
excerpt: "roster's v1 to v2 HITL migration refused valid history whenever two events landed in the same millisecond. The ledger already had a sequence number that fixed it."
tags: ["TypeScript", "Node.js", "Testing", "Open Source", "Debugging"]
---

I started out looking at a test that sometimes failed. I ended up fixing a real bug in a data migration. The PR is [firatcand/roster#396](https://github.com/firatcand/roster/pull/396), closing [#395](https://github.com/firatcand/roster/issues/395), and it's still open.

## The flake

I ran one test 20 times in a loop:

```bash
for i in $(seq 1 20); do
  node --test --experimental-strip-types \
    --test-name-pattern="v1 history is partitioned into generations at terminal boundaries" \
    test/hitl-local-migrate.test.ts 2>&1 | grep -E "^ℹ (pass|fail)"
done
```

It passed 11 times and failed 9, always with the same error:

```
request r1 was terminally decided at 1786258664269 but the next same-key
request r2 already existed at 1786258664269 — the generation boundary is ambiguous
```

Both timestamps are the same millisecond. That isn't an overlap. It's a tie.

## The bug

`preflight()` in `hitl-local-migrate.ts` converts local human-in-the-loop history from v1 to v2. It has to decide where one "generation" ends and the next begins for each request key. It did that by comparing `createdAt` timestamps, which only have millisecond resolution.

When a terminal decision and the next request on the same key were appended back to back, which is routine for synchronous writes, they often got the same timestamp. The migration then refused, calling the history ambiguous.

The odd part was that the same function already used the ledger's `seq` as a tiebreak when sorting, two lines earlier. It just didn't use it for the boundary check.

## The fix

`firstTerminalAt` now keeps the terminal decision's `seq` along with its `createdAt`, and the boundary check compares `seq`. Every `hitl` append (requests and decisions share one stream) gets a strictly increasing `seq`, so any two events are fully ordered, even in the same millisecond. `createdAt` stays in the error message, just so a person can read it.

## Why this is safe

`seq` is better evidence than the clock. It's a gapless, single-writer counter that gets validated on every ledger scan. `createdAt` is a wall-clock read that can tie and, rarely, go backwards when the clock is adjusted. A genuine overlap, where the next request's `seq` is lower than the terminal decision's, still gets refused. The only thing that changed is the false positive on a tie.

## Tests that don't depend on luck

The original test only failed when the timing lined up. I added two tests that freeze the clock using `LocalLedger`'s injectable `now` option. One forces a tie and must succeed. The other forces a real overlap at the same frozen time and must still refuse.

The file passes 18/18. I ran it 30 times in a row and the previously flaky test 50 times alone with no failures. Typecheck, build, the full suite (2505 pass, 0 fail), scaffold scripts and smoke tests all passed.

## What I learned

Before I retry a flaky test, I now ask what it's flaky about. This one was flaky about the clock, and the clock was the bug.
