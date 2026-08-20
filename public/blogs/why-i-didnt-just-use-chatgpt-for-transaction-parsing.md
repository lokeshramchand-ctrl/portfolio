---
title: "Why I Didn't Just Use ChatGPT for Transaction Parsing"
date: "August 20, 2026"
excerpt: "Every fintech demo this year routes bank SMS text through a chat completion and calls it categorization. Here's the pipeline I built instead: three cheap, boring, deterministic layers before an LLM ever gets a vote."
tags: ["Machine Learning", "FastAPI", "MongoDB", "System Architecture", "LLM"]
---

Every fintech demo this year routes bank SMS text through a chat completion and calls it categorization. It works, right up until the model confidently invents a merchant that doesn't exist. Here's the pipeline I built instead: three cheap, boring, deterministic layers before an LLM ever gets a vote — and a wall that's allowed to say "I don't know."

**System:** Velar — transaction intelligence service  
**Stack:** FastAPI · MongoDB · Milvus  
**Reading time:** 7 min  

---

The three layers cost, in order: a regex scan, a Mongo lookup, and a threshold check. No inference until step four, and even then it's a gate, not a generator.

The pitch for using an LLM to categorize bank transactions is a good one on paper. Point a chat model at `"UPI/DR/SWIGGY BANGALORE/4471829301"`, get back `{"merchant": "Swiggy", "category": "Food Delivery"}`, done. No regex to maintain, no merchant database to seed, no schema to version. Then you feed it a narration it hasn't seen — a regional kirana store, a truncated NEFT reference, a POS terminal ID with no vendor name attached at all — and it doesn't fail loudly. It guesses. And the guess comes back with exactly the same tone of confidence as the correct answer, which is the part that should worry you.

Velar, the service I've been building, turns noisy UPI references, bank SMS, and POS narrations into merchant identity and spend category. Early on I set a rule for myself: the LLM is the most expensive, least predictable component I have, so it goes last. Not first. Anything that can be resolved deterministically gets resolved deterministically, full stop. What's left over goes to inference, and what's left over after that is allowed to just say "I don't know."

## Layer one: rules, because most transactions don't need a model

The first pass is a compiled regex table over a merchant alias file — no database round-trip, no network call, sub-millisecond per transaction. If the narration contains a known alias, Velar returns it at a fixed 0.95 confidence and moves on:

**`engines/rule_engine.py`**
```python
def categorize(self, text: str) -> dict:
    for pattern, data in self.compiled_rules.items():
        if pattern.search(text):
            return {
                "merchant": data["merchant"],
                "category": data["category"],
                "confidence": 0.95  # deterministic match
            }
    # no rule fired — surface what we actually know
    return {
        "merchant": text.strip() or "Unknown",
        "category": "Uncategorized", 
        "confidence": 0.0
    }
```

This is the layer most architecture posts skip because it's unglamorous, but it's also the one doing most of the work in production: a huge fraction of real transaction volume is repeat merchants — the same five food delivery apps, the same two ride-hailing brands, the same utility billers, over and over. Paying an inference cost for those is paying rent on a problem you already solved once.

## Layer two: cleaning the noise before matching it

What doesn't hit a rule goes to the merchant resolver, which exists because Indian UPI narrations are mostly noise: `UPI/CR/` prefixes, 12-digit reference numbers, bank handles like `@okaxis`. The resolver strips that first, then tries an exact alias match against MongoDB, then a prefix match on individual words — skipping anything under four characters so it doesn't false-positive on "LTD" or "PVT":

**`services/merchant_resolver.py`**
```python
exact_match = await db.merchants.find_one({"aliases": cleaned_text})
if exact_match:
    return ResolutionResult(..., confidence=0.99, resolution_method="exact_alias")

for word in cleaned_text.split():
    if len(word) < 4:
        continue  # skip short words like LTD, PVT, INC
    match = await db.merchants.find_one({"aliases": {"$regex": f"^{word}"}})
    if match:
        return ResolutionResult(..., confidence=0.75, resolution_method="substring")
```

Notice the confidence isn't just one number tuned by hand. It moves with how the match happened. An exact alias hit and a prefix guess are not the same claim about the world, and if you collapse them into one score you've thrown away exactly the information a downstream system needs to not be overconfident.

## The confidence wall

Everything upstream produces a category and a number. The wall's only job is deciding whether that number is trustworthy enough to leave the building. The threshold is unglamorous — a flat 0.5 — but the part worth stealing is the guard clause: a prediction in a category the system doesn't recognize gets rejected before the threshold check even runs, because an out-of-vocabulary label is a stronger signal of a broken upstream model than a low score is.

**`engines/confidence_engine.py`**
```python
if predicted_category not in self.valid_categories:
    return ConfidenceEvaluation(
        final_category=UNKNOWN, 
        confidence=0.0,
        is_hallucination_risk=True
    )

if calibrated_conf < self.threshold:  # default 0.5
    return ConfidenceEvaluation(
        final_category=UNKNOWN, 
        confidence=calibrated_conf,
        is_hallucination_risk=True
    )
```

> **Unknown is a valid, honest answer.**

That line is the actual thesis of the whole pipeline, and I'd argue it cuts against how most ML-adjacent products get built. Product pressure almost always pushes toward "always return something," because an empty state reads as a bug to a PM even when it's the only truthful output on offer. Every layer here is allowed to fail into Unknown instead of dressing up a guess as a category. That's a real cost, not a free lunch: some spend genuinely stays uncategorized that a more confident (and more wrong) system would have happily labeled.

| Stage | Match type | Confidence |
| :--- | :--- | :--- |
| Rule engine | compiled regex on alias table | 0.95 |
| Resolver | exact alias in MongoDB | 0.99 |
| Resolver | word-prefix match | 0.75 |
| Resolver | no match | 0.00 |
| Confidence wall | below 0.5, or invalid category | → Unknown |

## Where the LLM actually shows up

There is still an LLM in this system, for the record. It just does the one job that actually needs judgment instead of lookup: `/v1/explain`, which turns a resolved transaction and its retrieved context into a natural-language explanation. And even there, the "don't guess" rule holds. If the Milvus vector search comes back empty, the context builder doesn't shrug and pass a thin prompt to the model anyway. It writes the literal string `NO_CONTEXT_AVAILABLE` into the context, and the generator reads that and stops — no call to Ollama happens. The model never gets the chance to fill a gap with something that merely sounds right, because it never gets asked.

## What this pipeline is honest about not doing

This isn't finished. I don't think the best argument for this architecture is that it's complete — it's that where it's incomplete, it fails in ways I can predict. Better to list the rough edges myself than have a reader (or worse, an incident) find them for me.

### Known limitations

*   **No task queue exists anywhere in this service.** Batch jobs under `/v1/pipelines/*` are triggered manually, by a person or a script, not a scheduler. There's no Celery, no cron, no worker fleet — comments in the code (`routers/observability.py`) still describe a future Celery task that was never built.
*   **Active learning stops at the queue.** `feedback/retraining_queue.py` flips a correction's status to "processing" and then does nothing further — there's no executor on the other end. Wiring one up isn't a config change; it needs an actual async worker, because the trainer it would call is a long-running synchronous job that would otherwise block the event loop.
*   **Confidence calibration is currently an identity function.** `calibrate_probability()` just clamps the input to `[0, 1]` and returns it. The Platt scaling or isotonic regression the docstring promises for a later phase doesn't exist yet — today, "confidence" is whatever the upstream layer says it is, unadjusted.
*   **The three layers aren't chained server-side yet.** Rules, resolution, and the confidence wall are each their own endpoint (`/v1/categorize`, `/v1/resolve`, `/v1/confidence/evaluate`) rather than one composed call. The conceptual pipeline in this post is real; the single HTTP round-trip that runs all of it isn't, yet.

## So what?

The lesson I keep relearning building this thing: reliability here was mostly a sequencing problem, not a modeling problem. Nearly every "the LLM hallucinated" postmortem I've read, on this project or someone else's, turns out on closer inspection to be inference doing a lookup's job. Put the cheap, boring, auditable stuff first and the model only ever sees what's genuinely left over. That's a better use of it, and it gives it a lot less room to embarrass you.

Given a do-over, I'd build the confidence wall before the rule engine, not after. It's the cheapest piece in the whole system and the one every other layer ultimately has to answer to, and building it last meant bolting a threshold contract onto code that was never written to expose one cleanly. I'd also stop letting `calibrate_probability()` get away with being a pass-through for this long — right now it just clamps a number to `[0, 1]` and calls it a day. An uncalibrated confidence score is a plain number wearing a probability's clothes, and a wall is only as honest as the thing it's checking against.

---
*Velar · transaction intelligence*  
*Part 1 of a series on the architecture*
