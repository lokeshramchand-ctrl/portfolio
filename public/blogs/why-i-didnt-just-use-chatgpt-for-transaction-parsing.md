---
title: "Why I Didn't Just Use ChatGPT for Transaction Parsing"
date: "Aug 8, 2026"
excerpt: "I put three cheap, deterministic layers in front of the LLM in Velar, and gave the pipeline permission to say 'I don't know.'"
tags: ["Machine Learning", "FastAPI", "MongoDB", "System Architecture", "LLM"]
---

Pointing a chat model at `"UPI/DR/SWIGGY BANGALORE/4471829301"` and getting back `{"merchant": "Swiggy", "category": "Food Delivery"}` looks great in a demo. Then you give it a regional kirana store or a terminal ID with no vendor name, and it guesses in the same confident tone it uses when it's right.

When I started Velar I set myself a rule: the LLM is the most expensive and least predictable thing I have, so it goes last. Anything I can resolve deterministically, I resolve deterministically.

## Layer one: rules

A compiled regex table over a merchant alias file. No database, no network. A hit returns at a fixed 0.95:

```python
for pattern, data in self.compiled_rules.items():
    if pattern.search(text):
        return {"merchant": data["merchant"], "category": data["category"], "confidence": 0.95}
return {"merchant": text.strip() or "Unknown", "category": "Uncategorized", "confidence": 0.0}
```

A lot of real volume is repeat merchants: the same food delivery apps, ride-hailing brands and utility billers. Paying for inference on those means solving the same problem over and over.

## Layer two: clean, then match

UPI narrations are mostly noise: `UPI/CR/` prefixes, 12-digit reference numbers, handles like `@okaxis`. The resolver strips that out, tries an exact alias match in MongoDB (0.99), then a word-prefix match (0.75), skipping words under four characters so "LTD" and "PVT" don't match everything. The score depends on how the match happened, because an exact hit and a prefix guess aren't the same claim.

## Layer three: the confidence wall

```python
if predicted_category not in self.valid_categories:
    return ConfidenceEvaluation(final_category=UNKNOWN, confidence=0.0, is_hallucination_risk=True)
if calibrated_conf < self.threshold:  # 0.5
    return ConfidenceEvaluation(final_category=UNKNOWN, confidence=calibrated_conf, is_hallucination_risk=True)
```

The category check runs before the threshold. If the model returns a category the system has never heard of, that's a stronger sign something upstream is broken than a low score is.

Unknown is a valid answer here. Product pressure usually pushes toward always returning something, but every layer in Velar is allowed to fail into Unknown. The cost is that some spend stays uncategorized that a more confident (and more wrong) system would have labeled.

## Where the LLM does show up

`/v1/explain` turns a resolved transaction and its retrieved context into an explanation. Even there, if the Milvus search comes back empty, the context builder writes `NO_CONTEXT_AVAILABLE` and the generator returns before calling the model.

## What's not done yet

- There's no task queue. The `/v1/pipelines/*` batch jobs only run when a person or script triggers them.
- Active learning stops at the queue. Corrections get marked "processing" and nothing picks them up.
- `calibrate_probability()` just clamps the value to 0 through 1 and returns it.
- The three layers are separate endpoints, not one composed call yet.

## What I'd change

Reliability turned out to be mostly a sequencing problem. Most "the LLM hallucinated" stories I've read come down to inference doing a lookup's job. If I started over, I'd build the confidence wall first, since every other layer has to answer to it, and I'd stop letting the calibration function be a pass-through. A confidence score that was never calibrated is just a number that looks like a probability.
