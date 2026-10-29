# When `5.0` isn't an integer: a small fix in Apicurio Registry's prompt templates

I recently fixed a bug in Apicurio Registry where a perfectly reasonable template default was rejected by the registry's own validation. The fix is small (PR #10017, closing issue #10016), but the cause is a good reminder of how YAML and JSON parsing can surprise you.

## The problem

Apicurio Registry can render prompt templates. A template declares variables, and each variable can have a type and a default. Suppose you declare a variable like this:

```yaml
type: integer
default: 5.0
```

That looks fine. `5.0` is a whole number, and the variable is an integer. But rendering failed with this error:

```
Type mismatch: expected integer but got number
```

The caller hadn't even touched that variable. The template author had written a sensible default, and the registry refused it.

## Why it happened

Jackson, the library that parses the YAML and JSON, always reads a decimal literal as a `Double`. So `5.0` arrives as the double `5.0`, not as a `5`. Meanwhile `validateType()` only accepted `Integer` or `Long` for `type: integer`.

This only started to bite after #9309 added `validateAppliedDefaults()`. That method runs the type check against every default the registry fills in. Before it existed, a mismatched default slipped through unnoticed. Once the check ran, the mismatch showed up as an error.

I confirmed this with a standalone repro against the project's Jackson and YAML versions:

```
default: 5              -> Integer = 5
default: 5.0            -> Double  = 5.0   (previously failed the integer check)
default: 1000000000000  -> Long    = 1000000000000
```

## The fix

I changed `applyDefaults()` so that when a variable's declared type is `integer`, a whole-number `Double` or `Float` default gets coerced to a `Long`. After that, the type check passes.

I kept the change narrow on purpose:

- A fractional default like `5.5` is left alone, so it's still rejected for an integer variable. That's the right behavior, since the author made a real mistake.
- Defaults for `number` variables are unaffected.

I also pulled the repeated `"integer"` and `"string"` type-name literals in `PromptRenderingService` into named constants. SonarCloud had flagged them on the diff, and it was easy to clean up while I was in there.

## Testing

I added three regression tests. `PromptRenderingServiceTest` now runs 60 tests, all passing, and checkstyle reports zero violations.

Getting the tests to run locally took some effort. The `app` module depends on `java-sdk`, which needs the Kiota code generator, and Kiota needs a working .NET runtime with libicu. Once I installed `libicu-dev`, the build worked.

## What I took away

Two things. First, a type check is only as honest as the parser feeding it. `5.0` and `5` mean the same thing to a person but not to Jackson, so when you validate parsed data, decide what you want to accept before you reject it.

Second, adding validation can expose old assumptions. #9309 was a reasonable change, and it turned up a gap that had been there all along. I'd rather find that through a bug report than not find it at all.
