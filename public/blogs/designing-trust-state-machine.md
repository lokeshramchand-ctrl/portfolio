---
title: "Designing a Memory State Machine for ML Predictions"
date: "Augus, 2026"
excerpt: "An architectural deep dive into how Velar tracks merchant trust explicitly using a frequency-based state machine, built with FastAPI and MongoDB."
tags: ["Machine Learning", "FastAPI", "MongoDB", "System Architecture", "Engineering"]
---


The first time Velar sees "SWIGGY BANGALORE" and the fortieth time are not the same event, but most systems treat them identically once the merchant is resolved. This one doesn't. Every merchant carries an explicit trust state, and it has to be earned one encounter at a time.

**System**: Velar — trust state machine  
**Stack**: FastAPI · MongoDB  
**Reading time**: 7 min  

* **EPHEMERAL**: freq < 3
* **TEMPORARY**: 3 ≤ freq < 10 (re-entry point)
* **PERMANENT**: freq ≥ 10
* **ARCHIVED**: 180d inactive (180d, no special case, re-encountered)

The dashed line is the one I'm least sure about: nothing in the code exempts PERMANENT from decaying the same way EPHEMERAL does.

A merchant resolver can tell you what something is. It can't tell you how much history you have with it, and those turn out to be different questions with different answers. "SWIGGY BANGALORE" resolved on the first transaction Velar has ever seen from that alias carries exactly as much confidence in the merchant match as the same alias on its fortieth transaction, because resolution confidence is about string matching, not track record. Track record needed its own place to live, so it got one: a small explicit state machine, one state per merchant, updated on every encounter.

## Four states, one number driving three of them

A profile starts EPHEMERAL the moment it's first seen. At three encounters it becomes TEMPORARY. At ten, PERMANENT. A fourth state, ARCHIVED, doesn't come from frequency at all — it comes from time, which the promotion function below has nothing to do with:

`memory/state_machine.py`
```python
def evaluate_promotion(self, profile: MerchantProfile) -> MemoryState:
    current_state = profile.memory_state

    # once permanent or archived, frequency alone doesn't move it
    if current_state in [PERMANENT, ARCHIVED]:
        return current_state

    if profile.frequency >= self.PERMANENT_THRESHOLD:  # 10
        return PERMANENT

    if profile.frequency >= self.TEMPORARY_THRESHOLD:  # 3
        return TEMPORARY

    return EPHEMERAL
```

The guard clause at the top matters more than the threshold numbers do. Without it, a merchant sitting at PERMANENT with a hundred transactions behind it and a merchant that just crossed ten would be indistinguishable to any caller reading `memory_state`, which defeats the point of having a ceiling. This function is a one-way ratchet along the frequency axis. It's also the only place that's true, which is the part worth remembering going into the next section.

## The race that almost shipped

An earlier version of the code that records an encounter looked exactly like you'd expect: fetch the profile, bump frequency in Python, write it back. Under concurrent traffic against the same merchant, that has two real bugs in it, not hypothetical ones. Two requests can both read frequency = 12, both compute 13, and both write 13 — one increment just vanishes. And on a brand-new merchant, two concurrent first sightings can both check "no profile exists yet," both decide to insert, and both succeed, leaving two documents for one merchant.

The fix collapses the whole read-modify-write into one atomic Mongo operation:

`repositories/profile_repository.py`
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

`$inc` can't lose a concurrent write the way a Python-side frequency + 1 can, and `upsert=True` against a unique index on `canonical_name` turns the duplicate-insert race into a retried update instead of two documents. Neither fix is exotic. What made it worth writing up is that the bug was real and specific enough to describe in one sentence each, and catching that in review before it shipped came down to actually asking "what happens if two of these land at the same millisecond," not general caution.

## Trust expires too

Frequency only grows, so without a way back down every merchant would eventually reach PERMANENT and stay there forever, which isn't earned trust so much as trust that was never revisited. A separate sweep handles the other direction: anything whose `last_seen` is older than 180 days gets moved to ARCHIVED, on a cadence entirely disconnected from the per-encounter promotion logic above.

That sweep doesn't special-case PERMANENT. A merchant with three years of history and two hundred transactions decays exactly like a merchant that scraped past the ten-transaction line last month, provided both go quiet for six months. The code even leaves a comment where that decision should live: `# Optional: you might decide PERMANENT memory never decays`, and nobody has answered it. I'm including that here instead of quietly fixing it before publishing, because leaving an open question visible in a blog post is a more honest description of the codebase than resolving it five minutes before writing about it would be.

## The one override that skips the ladder

There's exactly one place the state machine's own output gets overridden, and it happens on the way back in, not the way up:

`memory/memory_manager.py`
```python
new_state = state_machine.evaluate_promotion(profile)

# archived but just seen again - wake it up as Temporary, not Ephemeral
if profile.memory_state == MemoryState.ARCHIVED:
    new_state = MemoryState.TEMPORARY
```

A merchant that earned PERMANENT once, went quiet, and got archived hasn't actually forgotten how to be trusted. It just stopped showing up. Restarting it at EPHEMERAL and making it re-climb three encounters before it's even TEMPORARY again would throw away real history for no reason connected to risk. So the ladder gets skipped on purpose, once, right here. It's the single spot in the whole system where a business judgment about what dormancy means overrides pure frequency arithmetic, and it lives outside `state_machine.py` entirely, in the caller, not the machine.

## Known limitations

### Where this is thinner than it looks

* Nothing schedules the decay sweep. `POST /v1/pipelines/decay/sweep` runs it, and only a person or a script triggers that endpoint. If nobody calls it, profiles simply never archive, no matter how old `last_seen` gets.
* The PERMANENT-decay question is still open in the code, not just in this post. The comment asking whether permanent memory should be exempt has been sitting there unanswered; today's behavior is "no exemption," by omission rather than by decision.
* State transitions aren't persisted as history, only as a current value. `MerchantProfile` stores `memory_state`, `frequency`, `first_seen`, and `last_seen` — nothing that records when a profile crossed from EPHEMERAL to TEMPORARY, or how many times it's been archived and revived. That trail exists only in application logs, which aren't queryable the way a real collection would be.

## So what

Making trust an explicit field instead of folding it into a confidence score turned out to pay for itself the first time I had to debug why a merchant was being treated cautiously. The answer was one field read, not a probability I had to reverse-engineer. That's the part of this design I'd defend without hesitation.

What I'd change: turn the decay comment into an actual decision instead of leaving it as a question for whoever reads the file next, and replace the current single-value `memory_state` with an append-only log of transitions. Overwriting state in place is what made the concurrency bug in the previous section possible to reason about in isolation, which was convenient while writing this post and probably a mistake for anyone who eventually needs to answer "how did we get here," six months from now, about a specific merchant.

***