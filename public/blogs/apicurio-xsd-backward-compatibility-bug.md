---
title: "A silent backward-compatibility bug in Apicurio Registry's XSD checker"
date: "Sept 15, 2026"
excerpt: "A code comment said this case was already handled. It wasn't."
tags: ["Java", "Apicurio Registry", "Open Source", "Schema Compatibility", "Debugging"]
---

# A silent backward-compatibility bug in Apicurio Registry's XSD checker

*How a two-line comment convinced everyone — including code review — that a check existed when it never did.*

I spend a fair amount of time reading other people's code for no particular reason beyond curiosity. A few weeks ago that habit took me into `schema-util/xsd` in [Apicurio Registry](https://github.com/Apicurio/apicurio-registry), the open-source API and schema registry maintained by Red Hat. I came out of it having filed [issue #9379](https://github.com/Apicurio/apicurio-registry/issues/9379) and shipped the fix in [PR #9380](https://github.com/Apicurio/apicurio-registry/pull/9380).

This is the story of that bug: what it was, how I found it, how I proved it before touching any code, and what it taught me about trusting comments in a codebase.

## Table of contents

- [What the compatibility checker actually guarantees](#what-the-compatibility-checker-actually-guarantees)
- [The trick that makes FORWARD compatibility work](#the-trick-that-makes-forward-compatibility-work)
- [Where it broke](#where-it-broke)
- [Why optional → required is a BACKWARD problem, not a FORWARD one](#why-optional--required-is-a-backward-problem-not-a-forward-one)
- [The sibling method that gave it away](#the-sibling-method-that-gave-it-away)
- [Filing it, then proving it, before fixing it](#filing-it-then-proving-it-before-fixing-it)
- [The fix](#the-fix)
- [Being honest about scope](#being-honest-about-scope)
- [What I'd want other people to take from this](#what-id-want-other-people-to-take-from-this)

## What the compatibility checker actually guarantees

Apicurio Registry lets you register schemas — Avro, JSON Schema, Protobuf, XSD, and others — and attach a compatibility rule to each artifact. Set that rule to `BACKWARD` and the registry promises something specific: **old data will still validate against whatever schema you publish next.** This is the same compatibility model Confluent Schema Registry popularized for Avro, generalized here across formats: `BACKWARD`, `FORWARD`, `FULL`, and their `_TRANSITIVE` variants.

The `XsdCompatibilityChecker` class documents the contract for each level directly in its Javadoc:

```
BACKWARD: Old data must be readable by new schema (L(old) ⊆ L(new))
FORWARD:  New data must be readable by old schema (L(new) ⊆ L(old))
FULL:     Both backward and forward compatible
```

That set-inclusion notation matters. It's the thing I kept coming back to while tracing this bug: for any given change, ask which language — the set of documents the old schema accepts, or the set the new schema accepts — has to be a subset of the other.

## The trick that makes FORWARD compatibility work

Before getting to the bug, it's worth understanding how `FORWARD` is computed at all, because the bug lives entirely inside this mechanism. In `AbstractCompatibilityChecker`, the base class every format-specific checker extends:

```java
switch (compatibilityLevel) {
    case BACKWARD:
        incompatibleDiffs = isBackwardsCompatibleWith(
            lastExistingSchema, proposedArtifactContent, resolvedReferences);
        break;
    case FORWARD:
        incompatibleDiffs = isBackwardsCompatibleWith(
            proposedArtifactContent, lastExistingSchema, resolvedReferences);
        break;
    ...
}
```

There is no separate "forward" implementation per format. `FORWARD` is computed by calling the exact same `isBackwardsCompatibleWith` method with the two arguments swapped. It's an elegant trick — one implementation serves both directions — but it carries a hidden requirement: every check inside that method has to be written *symmetrically* with respect to its two parameters. If a check hardcodes an assumption about which argument is "the old one," swapping the arguments doesn't give you the opposite compatibility direction. It gives you a different, incorrect check that happens to compile and run without error.

That's exactly what happened here.

## Where it broke

`XsdCompatibilityChecker.checkAttributeChanges()` compares a single XSD attribute across two schema versions. Before my fix, the optional-to-required case looked like this:

```java
// Check if optional became required (making it more restrictive)
if (!existing.isRequired() && proposed.isRequired()) {
    // This is actually OK for backward (new schema can read old data)
    // but NOT OK for forward (old schema cannot read new data)
    // This will be caught in forward compatibility check
}
```

An empty body. The comment makes a specific, confident claim: this transition is handled, just not here — over in the forward compatibility check.

There is no separate forward compatibility check. Given the swap mechanism above, "the forward compatibility check" for this exact line of code *is* this same `if` block, invoked later with `existing` and `proposed` swapped. Swap the arguments and the condition `!existing.isRequired() && proposed.isRequired()` starts testing **required → optional** — the opposite transition. The case the comment promised would be caught elsewhere is never evaluated in either direction. It just doesn't exist.

## Why optional → required is a BACKWARD problem, not a FORWARD one

Walk the contract through a concrete example. Schema v1 declares:

```xml
<xs:attribute name="email" type="xs:string" use="optional"/>
```

Some document was validated against v1 without an `email` attribute at all — perfectly legal, since it's optional. Now schema v2 changes the declaration:

```xml
<xs:attribute name="email" type="xs:string" use="required"/>
```

Is that old, `email`-less document still valid under v2? No — it's now missing a required attribute. That's a document belonging to the old schema's language that the new schema rejects. By the stated contract, `L(old) ⊄ L(new)`. That is precisely the condition `BACKWARD` compatibility exists to catch, and the original comment had the direction backwards: it treated a backward-incompatible change as if it were only a forward concern.

## The sibling method that gave it away

What convinced me this wasn't a deliberate simplification was checking `checkElementChanges`, a few dozen lines above `checkAttributeChanges` in the same file — the equivalent logic for XSD elements instead of attributes:

```java
// Check if minOccurs increased (making it more restrictive)
if (proposed.getMinOccurs() > existing.getMinOccurs()) {
    incompatibilities.add(new SimpleCompatibilityDifference(
        "Element '" + existing.getName() + "' minOccurs increased from " +
        existing.getMinOccurs() + " to " + proposed.getMinOccurs(),
        elementPath
    ));
}
```

An element's `minOccurs` going from `0` to `1` is structurally the same transition as an attribute's `use` going from `optional` to `required`: both mean "this thing used to be omittable, and now it isn't." The element case was implemented correctly and flagged as backward-incompatible. The attribute case, a few dozen lines below it in the same file, was an empty `if` block with a comment explaining why it didn't need to exist.

That inconsistency between two near-identical methods was the actual signal. The stale comment was just where it happened to be visible.

## Filing it, then proving it, before fixing it

I opened the GitHub issue with a minimal, literal reproduction rather than a narrative description of the code:

1. Register an XSD artifact with `email` declared `use="optional"`.
2. Set a `BACKWARD` compatibility rule on the artifact.
3. Register a new version with `email` declared `use="required"`.
4. Expected: rejected, with a diff explaining why. Actual: accepted, with an empty diff set.

For the fix itself, I wanted to avoid writing a test that simply codified whatever the corrected code happened to produce — that kind of test passes trivially and proves nothing about regressions. So I wrote the test against the *unfixed* code first:

```java
@Test
void testBackwardIncompatible_AttributeOptionalToRequired() {
    TypedContent existing = toTypedContent(SCHEMA_WITH_OPTIONAL_ATTRIBUTE);
    TypedContent proposed = toTypedContent(SCHEMA_WITH_ATTRIBUTE_MADE_REQUIRED);

    CompatibilityExecutionResult result = checker.testCompatibility(
        CompatibilityLevel.BACKWARD,
        Collections.singletonList(existing),
        proposed,
        Collections.emptyMap()
    );

    Assertions.assertFalse(result.isCompatible(),
        "Changing an attribute from optional to required should be backward incompatible");
    Assertions.assertFalse(result.getIncompatibleDifferences().isEmpty());
}
```

I ran it against `main`, confirmed it failed, and only then wrote the fix.

## The fix

Four lines, mirroring the pattern that already worked for elements:

```java
if (!existing.isRequired() && proposed.isRequired()) {
    incompatibilities.add(new SimpleCompatibilityDifference(
        ATTRIBUTE_LABEL + existing.getName() + "' changed from optional to required",
        attrPath
    ));
}
```

I also added `testForwardCompatible_AttributeOptionalToRequired`, asserting the *other* direction is correctly left alone: an old schema can still read a document that omits an attribute the new schema doesn't require, so `FORWARD` should stay compatible for this same transition. Getting only one direction right would have just relocated the bug rather than fixed it.

One incidental cleanup: the `"Attribute '"` string literal was now repeated a third time in the file, which checkstyle flags as a duplicate-literal warning. I pulled it into an `ATTRIBUTE_LABEL` constant rather than leave a new warning behind.

## Being honest about scope

This fix is narrow, and it's worth stating exactly how narrow. It only affects XSD artifacts evaluated under `BACKWARD` or `FULL` compatibility rules — Avro, JSON Schema, and Protobuf each have their own, independent compatibility checker implementations and were never affected by this.

While I was in this file, I also noticed that `isTypeCompatible()` only ever returns `true` on an exact string match between type names:

```java
private boolean isTypeCompatible(String existingType, String proposedType, boolean strict) {
    if (existingType.equals(proposedType)) {
        return true;
    }
    // Check if proposed type is a broader version of existing type
    // This is a simplified check - a full implementation would need type hierarchy analysis
    return false;
}
```

It doesn't reason about XSD type widening at all — e.g., narrowing `xs:string` to a restricted pattern would presumably need to be flagged, but isn't distinguished from any other type change today. That's a real limitation, but it's a separate and considerably larger piece of work, and it was out of scope for this PR. I'm noting it here mainly for anyone reading the source who's looking for the next issue to pick up.

## What I'd want other people to take from this

A comment that says "this is handled elsewhere" is a claim about the codebase at the moment someone wrote it — not a fact that stays true as the code around it evolves. The swap-based `FORWARD` implementation in `AbstractCompatibilityChecker` is a reasonable, even elegant, piece of design. But it's also exactly the kind of abstraction that quietly changes what "elsewhere" means, with nothing in the type system or the test suite around to notice.

The more durable signal, in my experience, wasn't the comment at all — it was structural. When two code paths handle conceptually identical situations (here: "this thing used to be omittable, and now it's mandatory"), a difference in how thoroughly they're handled is worth chasing down, even when nothing is visibly broken. In this case, nothing was: the bug produced no exception, no log line, no failed test. Just a quiet `true` where the answer should have been `false`.

Thanks to the Apicurio Registry maintainers for a fast, substantive review on this one.

---

**Links**
- Issue: [apicurio-registry#9379](https://github.com/Apicurio/apicurio-registry/issues/9379)
- Pull request: [apicurio-registry#9380](https://github.com/Apicurio/apicurio-registry/pull/9380)
