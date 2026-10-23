---
title: "Why 5.0 Wasn't an Integer in Apicurio's Prompt Templates"
date: "Sept 6, 2026"
excerpt: "An integer prompt-template variable with a default of 5.0 failed its own type check in Apicurio Registry, because Jackson reads every decimal literal as a Double."
tags: ["Java", "Apicurio Registry", "Jackson", "Open Source", "Debugging"]
---

This is my second PR to [Apicurio Registry](https://github.com/Apicurio/apicurio-registry), after the XSD compatibility fix. It's [PR #10017](https://github.com/Apicurio/apicurio-registry/pull/10017), closing [#10016](https://github.com/Apicurio/apicurio-registry/issues/10016), and it's still open.

## The bug

Apicurio has prompt templates where each variable declares a type and can have a `default`. Imagine a template author writes:

```yaml
type: integer
default: 5.0
```

That's a reasonable thing to write. But it failed with:

```
Type mismatch: expected integer but got number
```

The caller never even touched that variable. The template's own default was rejecting itself.

## Why

Two things combined:

1. Jackson always deserializes a YAML or JSON decimal literal as a `Double`. `5.0` becomes a `Double`, even though it's a whole number.
2. `validateType()` only accepted `Integer` or `Long` for `type: integer`.

On top of that, `validateAppliedDefaults()` (added in #9309) runs the type check against every default that gets filled in. So the strictness that was meant to catch bad defaults also caught a good one.

I wanted to see exactly what Jackson produced, so I wrote a small standalone repro against the project's own Jackson/YAML versions:

```
default: 5              -> Integer = 5
default: 5.0            -> Double  = 5.0   (previously failed integer type check)
default: 1000000000000  -> Long    = 1000000000000
```

## The fix

In `applyDefaults()`, when a variable's declared type is `integer` and its default is a whole-number `Double` or `Float`, I convert it to `Long`. A genuinely fractional default like `5.5` is left as-is and still gets rejected, which is correct. `number`-typed defaults aren't touched.

SonarCloud flagged the repeated `"integer"` and `"string"` literals in `PromptRenderingService`, so I moved them into named constants in the same PR.

## Getting the tests to run locally

The `app` module depends on the reactor's `java-sdk` module, which needs the Kiota code generator, which needs a working .NET runtime with libicu. My environment didn't have it, so at first I couldn't run the tests locally. I installed `libicu-dev`, and then:

```
./mvnw test -pl app -Dtest=PromptRenderingServiceTest -Dlocal
```

All 60 passed, including the 3 new regression tests. `checkstyle:check` had zero violations, and every commit has a DCO sign-off. Before opening the PR, I also checked the project's "Tried & Rejected" discussion list and made sure no other open PR covered this issue.

## What I took from it

"Integer" means different things at different layers. To a person writing YAML, `5.0` is five. To Jackson, it's a `Double`. To the validator, it's the wrong class. The fix belongs at the point where values cross from parsing into validation, and it should only change the cases that are clearly whole numbers.
