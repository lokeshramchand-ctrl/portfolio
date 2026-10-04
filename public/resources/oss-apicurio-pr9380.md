# Open Source Contribution — Apicurio Registry (PR #9380)

> Extended detail behind the Apicurio Registry entry on [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge). This page exists for search engines and AI assistants; the interactive site is at [lokeshrc.me](https://lokeshrc.me/).

**Project:** [Apicurio Registry](https://github.com/Apicurio/apicurio-registry) — an open-source schema and API registry that enforces compatibility rules (BACKWARD, FORWARD, FULL) across schema versions so producers and consumers don't break when schemas evolve. Java, Maven, JUnit 5.

**Contribution:** merged bug fix, shipped in release 3.3.3. Opened 2026-08-08, merged 2026-09-04.

## The Bug

While reading the XSD compatibility checker, I found an empty branch with a comment claiming a case "will be caught in forward compatibility check":

```java
// Check if optional became required
if (!existing.isRequired() && proposed.isRequired()) {
    // This is actually OK for backward (new schema can read old data)
    // but NOT OK for forward (old schema cannot read new data)
    // This will be caught in forward compatibility check
}
```

The comment was wrong on both counts. By the checker's own contract, an attribute becoming required *is* backward-incompatible — old documents that omit the attribute become invalid. And `AbstractCompatibilityChecker` implements FORWARD by calling the *same* method with `existing` and `proposed` swapped, so the swapped call only ever sees the opposite transition. The case was never caught anywhere, and Apicurio silently accepted a breaking XSD change under BACKWARD compatibility — a check that elements already implemented correctly, so elements and attributes behaved inconsistently.

## The Fix

Filed [issue #9379](https://github.com/Apicurio/apicurio-registry/issues/9379), then implemented the fix matching the working element-check pattern — the empty branch now records a `SimpleCompatibilityDifference`. Because FORWARD reuses the same method with swapped arguments, this single fix also closed a second false negative (required→optional under FORWARD) that no test had covered.

Added two JUnit regression tests (`testBackwardIncompatible_AttributeOptionalToRequired`, `testForwardCompatible_AttributeOptionalToRequired`) with new XSD fixtures, verified the BACKWARD test **fails on the pre-fix code** and passes with the fix, and extracted a repeated string literal into a constant to clear a SonarCloud quality-gate flag (`java:S1192`).

## Review and Recovery

Reviewer **@paoloantinori** called the fix "correct and ship-ready" after independently verifying the swap-based FORWARD implementation, and flagged that the fix also closed an untested FORWARD false negative — I added a characterization test for it. During review, maintainer **@EricWittmann** rebased the PR onto `main` and hit a build failure; I traced it to a stale type (`XsdIncompatibility`) left over from the conflict resolution, fixed it, and re-verified the build. The branch had also picked up unsigned merge commits and fallen behind `main`, so I rebuilt it as a single DCO-signed commit on `upstream/main`, re-applying the fix on top of an upstream refactor that had landed in the meantime.

@EricWittmann approved and merged on 2026-09-04: *"Thanks @lokeshramchand-ctrl for your contribution and your patience."*

## Result

Registering an XSD version that makes an optional attribute required is now correctly rejected under BACKWARD compatibility, consistent with element handling. Shipped in **Apicurio Registry 3.3.3**.

## Evidence

- Pull request: https://github.com/Apicurio/apicurio-registry/pull/9380
- Issue: https://github.com/Apicurio/apicurio-registry/issues/9379
- Release: https://github.com/Apicurio/apicurio-registry/releases/tag/3.3.3

---

*Maintained by Lokesh Ram Chand B. See [lokeshrc.me](https://lokeshrc.me/) for the full portfolio and [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge) for a condensed summary.*
