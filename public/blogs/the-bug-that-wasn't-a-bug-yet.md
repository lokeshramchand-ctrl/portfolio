---
title: "The Bug That Wasn't a Bug Yet: Hunting a Dormant API Contract Violation in Meshery"
date: "Aug 24, 2026"
excerpt: "How reading a naming-convention doc closely enough led to a 20-site fix for a pagination bug in a CNCF project that hadn't broken anything, yet."
tags: ["Meshery", "Go", "API Contracts", "Bug Fixing", "Open Source", "Software Engineering"]
---


*Finding, proving, and fixing a dormant `pageSize` / `pagesize` contract mismatch across 20 call sites in Meshery's Go server*

---

Most bugs announce themselves. A user hits an endpoint, gets a 500, files an issue, someone bisects a commit. This one didn't work that way. It had never fired, it would pass every existing test, and it was sitting quietly in 14 files waiting for an unrelated migration to wake it up. Finding it meant reading a style guide like it was a threat model.

This is the story of [meshery/meshery#21582](https://github.com/meshery/meshery/issues/21582) and its fix, [#21583](https://github.com/meshery/meshery/pull/21583).

## The setting

[Meshery](https://meshery.io) is a CNCF-hosted platform for managing Kubernetes infrastructure: a Go backend, a Next.js frontend, GraphQL and REST APIs, 300+ integrations. Like any project that size, its conventions have grown faster than its enforcement of them. One convention, spelled out explicitly in the repo's `AGENTS.md`:

> Wire is camelCase; DB is snake_case; Go fields follow Go idiom; the ORM layer is the sole translation boundary.

| Layer | Form |
|---|---|
| DB column | `snake_case` |
| Go struct field | `PascalCase` |
| JSON tag | `camelCase` |
| URL query/path param | `camelCase` |

That last row is what this story is about. It reads as pedantic until you notice Meshery already had a working, canonical example of the rule being followed, and thirteen other files quietly ignoring it.

## The reference implementation, and its blind spot

`server/handlers/utils.go` has a function called `getPaginationParams` that every well-behaved list endpoint is supposed to route through. Before this PR, its pagination-size logic looked like this:

```go
// pageSize is the canonical camelCase wire param (schemas registry
// construct); pagesize is the legacy spelling still sent by
// pre-/api/registry clients.
limitstr := urlValues.Get("pageSize")
if limitstr == "" {
    limitstr = urlValues.Get("pagesize")
}
```

This is correct. It reads the camelCase `pageSize` first and falls back to the legacy lowercase `pagesize` for backward compatibility. It's the pattern the whole codebase should have used everywhere pagination shows up.

"Should have" is doing a lot of work in that sentence, though. `getPaginationParams` is one function. Pagination logic in a codebase this size doesn't live in one function; it lives wherever a handler author needed a page size and reached for `req.URL.Query().Get("pagesize")` directly, skipping the shared helper. That turned out to be a lot of places.

## Finding it: read the convention, then go looking for violations

You don't find this class of bug by running the test suite (it was green), and you don't find it by waiting for a bug report (there wasn't going to be one yet). You find it by taking a stated invariant seriously and grepping for places that don't uphold it.

```
grep -rn '\.Get("pagesize")' server/handlers/
```

That single command surfaced the problem right away: 13 additional handler files, independent of `getPaginationParams`, reading the query string directly and asking only for `pagesize`, never `pageSize`. No fallback. These call sites simply never considered that a client might send the camelCase form.

A closely related, already-fixed sibling case existed in the codebase for `orgId` / `orgID`, which confirmed the pattern: this project had hit this exact class of bug before, in a different field, and the fix was the same shape each time: read canonical first, fall back to legacy, prefer the wire-contract spelling going forward.

Checking Meshery's open issues and PRs ruled out duplication. There was an already-fixed, unrelated `ORDER BY` sanitization bug in a similar area, and a resolved access-gating audit, but nothing tracking this specific `pageSize`/`pagesize` gap. It also sat directly upstream of a tracked initiative, [#18526](https://github.com/meshery/meshery/issues/18526), the effort to migrate hand-rolled UI RTK Query endpoints onto `@meshery/schemas`-generated clients.

That connection is what turned a minor inconsistency into something worth an issue.

## Why "dormant" is the right word, not "harmless"

Here's the part that makes this bug interesting: as of today, it does nothing. Every UI RTK Query client in the Meshery frontend that talks to these 20 call sites hand-rolls its query string, and every one of them sends `pagesize`, lowercase, no camelCase anywhere. The handlers read `pagesize`. It works. Tests pass. Users paginate fine.

But `@meshery/schemas` is the single source of truth for Meshery's wire contracts, and its generated OpenAPI-driven RTK Query hooks emit the canonical spelling, `pageSize`. The moment any one of these 20 call sites' frontend consumer gets migrated from a hand-rolled endpoint to a schemas-generated one (which is exactly what #18526 is tracking, and exactly the direction `AGENTS.md` itself mandates: "MUST NOT hand-roll an RTK query endpoint when `@meshery/schemas` provides one"), the query param silently changes shape under the handler's feet. `req.URL.Query().Get("pagesize")` returns empty. The handler falls back to its zero-value default. Pagination breaks quietly, no error, no stack trace, no failing test, just a page size that's suddenly wrong for every list view routed through that endpoint.

That's a hard bug to catch after the fact. It won't show up in code review of the migration PR, because that PR is correctly emitting the canonical parameter; the bug lives upstream, in code nobody's touching. It won't show up in CI, because CI has no way to know the frontend is about to change shape. It'll show up as a support ticket three weeks after #18526 ships, and whoever's on call will spend an afternoon bisecting a regression actually introduced by a PR merged a year earlier.

Fixing it now, before the trigger condition exists, is strictly cheaper than fixing it after.

## The fix: one helper, twenty call sites, zero behavior change today

The fix is deliberately boring, and boring is correct here; this is exactly the kind of change where cleverness would be a liability.

```go
// getPageSizeParam returns the canonical camelCase "pageSize" wire param,
// falling back to the legacy "pagesize" spelling still sent by
// pre-/api/registry clients. Handlers that pass a page-size string straight
// through to a provider call (rather than parsing it via getPaginationParams)
// should read it through this helper instead of calling
// urlValues.Get("pagesize") directly.
func getPageSizeParam(urlValues url.Values) string {
    if v := urlValues.Get("pageSize"); v != "" {
        return v
    }
    return urlValues.Get("pagesize")
}
```

`getPaginationParams` gets rewritten to call this helper instead of hand-rolling the same two-line fallback it always had, collapsing the one correct implementation and the twenty incorrect (or missing) ones into a single source of truth. Every other call site changes from this:

```go
resp, err := provider.GetMesheryPatterns(tokenString, q.Get("page"), q.Get("pagesize"), ...)
```

to this:

```go
resp, err := provider.GetMesheryPatterns(tokenString, q.Get("page"), getPageSizeParam(q), ...)
```

Twenty times, across fourteen files: `connections_handlers.go`, `contexts_handler.go`, `environments_handlers.go`, `fetch_results_handler.go`, `keys_handler.go`, `meshery_filter_handler.go`, `meshery_pattern_handler.go`, `organization_handler.go`, `performance_profiles_handler.go`, `schedule_handlers.go`, `user_handler.go`, `workspace_handlers.go`, `load_test_preferences_handler.go`, and `utils.go` itself. One file, `connections_handlers.go`, had a call site doing something slightly different (parsing into an int inline) and got simplified to reuse the helper rather than special-cased.

Net diff: 88 insertions, 32 deletions, across 15 files. Every existing caller that sends `pagesize` keeps working exactly as before. That's the whole point of a fallback rather than a replacement.

## Proving it doesn't regress today and does fix tomorrow

A fix for a bug that hasn't fired yet needs a test that pins the contract, not just today's behavior:

```go
func TestGetPageSizeParam(t *testing.T) {
    tests := []struct {
        name     string
        query    string
        expected string
    }{
        {"canonical pageSize used when present", "?pageSize=50", "50"},
        {"legacy pagesize used as fallback", "?pagesize=50", "50"},
        {"canonical pageSize wins over legacy pagesize", "?pageSize=10&pagesize=20", "10"},
        {"empty string when neither present", "", ""},
    }
    // ...
}
```

The third case, camelCase winning when both are present, is the one that actually matters for the migration scenario. It's not enough for the fallback to work; precedence has to be unambiguous, because a rolling migration can plausibly put old and new clients on the same handler at the same time.

Verification, in order:

- `go build ./server/handlers/...`: clean
- `go test ./server/handlers/...`: clean, `TestGetPageSizeParam` plus the pre-existing `TestGetPaginationParams` both passing
- `gofmt -l` on every touched file: clean (one pre-existing, unrelated import-ordering issue in `meshery_filter_handler.go` was noted and correctly left alone rather than folded into this PR's diff)
- A final grep pass confirming zero remaining unguarded `.Get("pagesize")` reads anywhere in `server/handlers/*.go`

That last check matters as much as the fix itself. "I fixed the ones I found" and "I fixed all of them" are different claims, and only the grep proves the second one.

## The review conversation

The PR picked up one CodeRabbit review comment: a request to document the `pageSize`/`pagesize` contract in the API docs. Worth describing how that got resolved, because declining a review comment and explaining why is a legitimate outcome, not something to avoid.

The OpenAPI spec already documents `pageSize` as the public, schemas-generated parameter. `getPageSizeParam` already carries a doc comment explaining the legacy fallback and who should call it. Between those two, the contract was already discoverable from both ends, API consumer and internal maintainer. Rather than bolt on a doc change that added no new information, the reply on the review thread laid out that reasoning, and the thread was resolved without a diff. A review comment is a request for something to be true, not necessarily a request for a specific diff. Sometimes it's already true.

## What made this worth an issue, not just a drive-by fix

A few things separate a bug like this from noise.

It's provable, not speculative. "This could be a problem" is weak. "This is a wire-contract violation per this repo's own stated rules, and here is the exact commit that will trigger it" is strong. Tying the bug to the concrete, already-tracked #18526 migration turned a style nitpick into a ticking clock.

It's bounded. Twenty call sites, one shared root cause, one shared fix shape. Not a rabbit hole, not an open-ended refactor.

It's silent by construction. No test was failing, no user was complaining. The only way to find it was to treat the project's documented conventions as ground truth and check the code against them, a search strategy that generalizes to plenty of other bug classes: any place a codebase has both a "this is how we do it" doc and enough call sites for one of them to have drifted.

The fix doesn't editorialize. It doesn't refactor unrelated code, doesn't rename anything, doesn't add speculative flexibility for cases that don't exist. One helper function, twenty mechanical call-site substitutions, one test file. In a codebase with an explicit house rule against designing for hypothetical future requirements, that restraint is the right engineering call, not a missed opportunity.

## The takeaway

The best time to fix a wire-contract bug is before the wire contract changes. Once #18526 migrates even one of these twenty call sites' consumers onto schemas-generated clients, this bug stops being dormant and starts costing someone a debugging session instead of a code review. Catching contract drift by reading the contract, rather than waiting for the alarm, is a cheap habit. It only has to pay off once, on exactly the day it would otherwise have paged someone.

---

*Issue: [meshery/meshery#21582](https://github.com/meshery/meshery/issues/21582) · PR: [meshery/meshery#21583](https://github.com/meshery/meshery/pull/21583)*