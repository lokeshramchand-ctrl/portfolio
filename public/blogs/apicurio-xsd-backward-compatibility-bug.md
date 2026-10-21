---
title: "A silent backward-compatibility bug in Apicurio Registry's XSD checker"
date: "Sept 15, 2026"
excerpt: "A code comment said this case was already handled. It wasn't, and I only found out because a sibling method handled the same case properly."
tags: ["Java", "Apicurio Registry", "Open Source", "Schema Compatibility", "Debugging"]
---

I was reading through `schema-util/xsd` in [Apicurio Registry](https://github.com/Apicurio/apicurio-registry) out of plain curiosity when I hit an empty `if` block with a very confident comment on top of it. That comment turned into [issue #9379](https://github.com/Apicurio/apicurio-registry/issues/9379) and my fix in [PR #9380](https://github.com/Apicurio/apicurio-registry/pull/9380), which got merged.

## The contract

When you set a `BACKWARD` rule on a schema, Apicurio promises that old data still validates against the next version you publish. The checker's own Javadoc says it plainly: `L(old) ⊆ L(new)`. Every document the old schema accepts, the new one has to accept too.

`FORWARD` has no separate implementation. The base class just calls the same backward check with the two schemas swapped. It's a neat trick, but it only works if every check inside is symmetric.

## The empty block

Here's what I found in `checkAttributeChanges()`:

```java
if (!existing.isRequired() && proposed.isRequired()) {
    // This is actually OK for backward (new schema can read old data)
    // but NOT OK for forward (old schema cannot read new data)
    // This will be caught in forward compatibility check
}
```

There is no other forward check. The "forward check" is this exact block run with the arguments flipped, at which point it tests required to optional, the opposite case. So optional to required was never checked in either direction.

And the comment had the direction wrong anyway. If `email` goes from `use="optional"` to `use="required"`, an old document without `email` is now invalid. That's exactly what `BACKWARD` exists to catch.

## What tipped me off

A few dozen lines up, `checkElementChanges` handled the same idea for elements. If `minOccurs` goes up, it flags an incompatibility. An element becoming mandatory was caught; an attribute becoming mandatory wasn't. That mismatch between two near-identical methods is what convinced me it was a bug and not a deliberate shortcut.

## How I fixed it

I wrote the issue as a literal repro: register an XSD with an optional attribute, set `BACKWARD`, register a version where it's required, and watch it get accepted with an empty diff.

Then I wrote `testBackwardIncompatible_AttributeOptionalToRequired` and ran it against `main` first to make sure it actually failed. Only after that did I write the fix, which copies the element pattern:

```java
if (!existing.isRequired() && proposed.isRequired()) {
    incompatibilities.add(new SimpleCompatibilityDifference(
        ATTRIBUTE_LABEL + existing.getName() + "' changed from optional to required",
        attrPath
    ));
}
```

I also added `testForwardCompatible_AttributeOptionalToRequired` so the other direction stays compatible. Fixing only one side would just move the bug. The repeated `"Attribute '"` string tripped checkstyle, so I pulled it into a constant. All 22 tests in the module passed.

The scope is narrow: only XSD artifacts under `BACKWARD` or `FULL`. Avro, JSON Schema and Protobuf have their own checkers. While I was in there I noticed `isTypeCompatible()` only returns true on an exact type-name match, so it doesn't reason about type widening at all. That's a bigger job, so I left it alone.

## What I took from it

A comment saying "this is handled elsewhere" describes the code on the day someone wrote it. What actually led me to the bug was two methods handling the same situation differently. Nothing crashed and nothing logged. The checker just returned `true` where it should have returned `false`.

Thanks to the Apicurio maintainers for the quick review.

**Links:** [issue #9379](https://github.com/Apicurio/apicurio-registry/issues/9379) · [PR #9380](https://github.com/Apicurio/apicurio-registry/pull/9380)
