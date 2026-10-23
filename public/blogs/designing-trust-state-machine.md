---
title: "Designing a Memory State Machine for ML Predictions"
date: "Aug 1, 2026"
excerpt: "How I made merchant trust an explicit state in Velar, the race condition I almost shipped, and the decay question I still haven't answered."
tags: ["Machine Learning", "FastAPI", "MongoDB", "System Architecture", "Engineering"]
---

The first time Velar sees "SWIGGY BANGALORE" and the fortieth time aren't the same event. The merchant resolver gives the same match confidence both times, because it's matching strings and knows nothing about history. I wanted track record to live somewhere of its own, so I gave every merchant an explicit trust state.

## Four states

- **EPHEMERAL**: seen fewer than 3 times
- **TEMPORARY**: seen 3 to 9 times
- **PERMANENT**: seen 10 or more times
- **ARCHIVED**: inactive for 180 days

The first three come from frequency. Archiving comes from time, on a separate code path:

```python
def evaluate_promotion(self, profile: MerchantProfile) -> MemoryState:
    current_state = profile.memory_state
    if current_state in [PERMANENT, ARCHIVED]:
        return current_state
    if profile.frequency >= self.PERMANENT_THRESHOLD:  # 10
        return PERMANENT
    if profile.frequency >= self.TEMPORARY_THRESHOLD:  # 3
        return TEMPORARY
    return EPHEMERAL
```

This function only ever moves a merchant up.

## The race I almost shipped

My first version did the obvious thing: fetch the profile, add one to frequency in Python, write it back. Under concurrent traffic that breaks in two ways. Two requests can both read 12 and both write 13, so one increment disappears. And two first sightings of a new merchant can both see "no profile" and both insert.

I collapsed it into one atomic call:

```python
doc = await db.merchant_profiles.find_one_and_update(
    {"canonical_name": canonical_name},
    {
        "$inc": {"frequency": 1},
        "$set": {"last_seen": now},
        "$addToSet": {"aliases": raw_text},
        "$setOnInsert": {"memory_state": EPHEMERAL, "first_seen": now},
    },
    upsert=True,
    return_document=ReturnDocument.AFTER,
)
```

`$inc` lets MongoDB do the increment, and `upsert=True` with a unique index on `canonical_name` turns the double insert into a retried update. Neither fix is clever. I caught it because I asked what happens when two of these land in the same millisecond.

## Trust expires

Frequency only goes up, so without a way down everything would end up PERMANENT forever. A sweep archives anything with `last_seen` older than 180 days. It doesn't treat PERMANENT any differently. The code even has a comment, `# Optional: you might decide PERMANENT memory never decays`, and I haven't answered it. I'm leaving that open here rather than quietly fixing it right before I publish.

When an archived merchant shows up again, I bring it back as TEMPORARY, not EPHEMERAL:

```python
if profile.memory_state == MemoryState.ARCHIVED:
    new_state = MemoryState.TEMPORARY
```

It earned trust once and then went quiet, and making it climb the whole ladder again throws that history away. This is the one place a business judgment overrides the arithmetic, and it lives in the caller, not the state machine.

## What's still thin

- Nothing schedules the decay sweep. `POST /v1/pipelines/decay/sweep` only runs when someone calls it.
- The PERMANENT decay question is decided by omission.
- I only store the current state. There's no record of when a profile changed state, except in logs.

## Would I do it again?

Yes. The first time I had to debug why a merchant was being treated cautiously, the answer was one field instead of a probability I had to reverse-engineer. Next time I'd keep an append-only log of transitions instead of overwriting the state, so I could answer "how did we get here" six months later.
