---
title: "A Validator That Crashed Instead of Saying No"
date: "Aug 23, 2026"
excerpt: "pymilvus's binary-vector check raised a raw TypeError on None values instead of returning False. Swapping two lines fixed it."
tags: ["Python", "Milvus", "pymilvus", "Validation", "Open Source"]
---

The whole fix is two swapped `if` statements. It's [milvus-io/pymilvus#3769](https://github.com/milvus-io/pymilvus/pull/3769), and it's still open.

## The bug

`check_invalid_binary_vector` has one job: return `False` when binary vector data is bad, so the caller can raise a clean error. It raised a `TypeError` instead when a value had no length:

```python
>>> check_invalid_binary_vector([{"type": DataType.BINARY_VECTOR, "values": [b"\x00\x01", None]}])
TypeError: object of type 'NoneType' has no len()
```

The loop checked the length before checking the type:

```python
for values in entity["values"]:
    if len(values) * 8 != dim:        # len() runs first
        return False
    if not isinstance(values, bytes): # too late for None or an int
        return False
```

## Why it matters

The caller in `grpc_handler.py` (and the async handler) does this:

```python
if not check_invalid_binary_vector(entities):
    raise ParamError(message="Invalid binary vector data exists")
```

So instead of a clear `ParamError`, a user who passes something like `Collection.insert(data=[[b"\x00\x01", None]])` gets a raw `TypeError` from inside a helper they've never heard of.

This was a second bug in the same function that survived an earlier fix (#3694, which changed `and` to `or` for the empty-list case). The existing `test_non_bytes_values` only used nested lists as bad input, and lists have `__len__`, so it never hit a value without one.

## The fix

Check the type first:

```python
for values in entity["values"]:
    if not isinstance(values, bytes):
        return False
    if len(values) * 8 != dim:
        return False
```

## Testing

I added `test_non_sized_value` next to the existing cases in `tests/unit/test_utils.py`. All 71 tests in that file pass. The full unit suite: 4719 passed, 3 skipped and 1 failed. The failure is `test_get_commit`, which also fails on `master` without my change, and #3694's description mentions the same failure. I also ran the repro by hand: `TypeError` before the fix, `False` after.

I filed the issue as #3768 and said in the PR that the change was AI-assisted. I used Claude while auditing for unclaimed bugs. I reproduced the error myself, traced the callers to confirm what the function is supposed to do, and ran the suite and the baseline comparison myself. I think maintainers should know how a PR was produced.

## What I learned

In validation code, the order of checks is part of the logic. Check the cheap, safe thing (is it the right type?) before the thing that assumes the answer (how long is it?). Otherwise the validator itself becomes the crash.
