---
title: "The Bug That Wasn't a Bug Yet: Hunting a Dormant API Contract Violation in Meshery"
date: "Aug 24, 2026"
excerpt: "I read Meshery's naming-convention doc closely and found 20 handlers that would break pagination the day the frontend moved to generated clients."
tags: ["Meshery", "Go", "API Contracts", "Bug Fixing", "Open Source", "Software Engineering"]
---

This bug had never fired. Every test passed. I found it by reading a style guide and taking it literally. It's [meshery/meshery#21582](https://github.com/meshery/meshery/issues/21582), and my fix is [PR #21583](https://github.com/meshery/meshery/pull/21583), which is still open.

## The rule

[Meshery](https://meshery.io)'s `AGENTS.md` says wire format is camelCase, and that includes URL query params. There was already a correct example in `server/handlers/utils.go`. `getPaginationParams` reads `pageSize` first and falls back to the legacy `pagesize`.

But that's one function. I wanted to know how many handlers skipped it:

```
grep -rn '\.Get("pagesize")' server/handlers/
```

The answer was 20 call sites across 14 files. They read only `pagesize`, with no fallback.

## Why "dormant"

Today the UI's hand-written clients all send `pagesize`, so everything works. But [#18526](https://github.com/meshery/meshery/issues/18526) tracks moving those clients onto hooks generated from `@meshery/schemas`, and those emit `pageSize`. The day one of them migrates, the handler gets an empty string, falls back to its default, and pagination quietly breaks. The migration PR would look correct in review, because it is. The bug sits in code nobody is touching.

I checked open issues and PRs first so I wouldn't duplicate anyone's work. The project had already hit the same class of bug with `orgId`/`orgID`, which told me the fix shape was the right one.

## The fix

I kept it boring on purpose. I added one helper:

```go
func getPageSizeParam(urlValues url.Values) string {
    if v := urlValues.Get("pageSize"); v != "" {
        return v
    }
    return urlValues.Get("pagesize")
}
```

`getPaginationParams` now uses it, and so do all 20 call sites. One spot in `connections_handlers.go` parsed the value inline, so I simplified it to use the helper too. Anyone still sending `pagesize` sees no change.

## Testing it

I wrote a table test, `TestGetPageSizeParam`, with four cases: canonical only, legacy only, both present, and neither present. The "both present" case matters most. During a rolling migration, old and new clients can hit the same handler, so `pageSize` has to win clearly.

Then I ran `go build`, `go test` and `gofmt -l` on every file I touched, plus one last grep to confirm no unguarded `.Get("pagesize")` reads were left. "I fixed the ones I found" and "I fixed all of them" are different claims, and only the grep backs up the second one.

## The review

CodeRabbit asked me to document the contract in the API docs. The OpenAPI spec already documents `pageSize`, and the helper has a doc comment explaining the fallback. I replied with that reasoning and the thread was resolved with no diff. Sometimes the thing a reviewer asks for is already true.

## What I learned

If a repo has a written "this is how we do it" rule and lots of call sites, some of them have drifted from it. Grepping for the drift is cheap, and fixing it before the contract changes costs a code review. Fixing it after costs someone an afternoon of debugging.
