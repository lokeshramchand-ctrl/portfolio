---
title: "Building a Grounded RAG Pipeline for Financial Data with Milvus and Ollama"
date: "Aug 7, 2026"
excerpt: "How I kept Velar's explanations local and grounded: Ollama for embeddings and generation, Milvus for lookup, and an early return when there's nothing to ground on."
tags: ["Machine Learning", "FastAPI", "MongoDB", "Milvus", "Ollama", "RAG", "System Architecture", "Privacy"]
---

You can't paste six months of someone's bank transactions into a public API just to get a nicer explanation of a category. So in Velar, both the embedding model and the generation model run on Ollama, inside the same infrastructure as FastAPI, MongoDB and Milvus. No step in this path needs a public API key.

```text
query → Milvus (cosine, top_k=3) → MongoDB (profile + behavior)
      → context builder (XML fence or NO_CONTEXT_AVAILABLE) → Ollama (format: "json")
```

Keeping things private was the easy half. The hard half was stopping a local model from making things up just because it's cheap to call.

## Turning numbers into sentences

Embedding models are trained on language, so a bare periodicity score of 0.91 doesn't mean much to them. I wrap each behavior pattern in a sentence first:

```python
f"Behavior footprint for {pattern.merchant_name}: "
f"Average transaction amount is {pattern.avg_amount:.2f} ... "
f"Periodicity score is {pattern.periodicity_score:.2f} (1.0 means highly predictable)."
```

That goes to `/api/embeddings` and comes back as a 768-dimension vector. The Ollama host is picked lazily: `OLLAMA_URI` if it's set, otherwise the first host in `OLLAMA_HOSTS` that passes a two-second health check, and that host is cached.

The Milvus collection holds just that vector plus a `merchant_name` field. It's really a nearest-neighbor lookup keyed by behavior, which is the right amount of machinery for this data. I fill it with a manual job, `POST /v1/pipelines/embeddings/sync`.

## Retrieval gives the model real records

Milvus only returns addresses: the three closest merchant names. I use those to pull real records from MongoDB (trust state, behavior pattern, the three latest corrections), so Milvus never gets to describe a merchant by itself.

Those records go into the prompt inside `<MERCHANT_DATA>` tags. If there's nothing to put there, the builder returns a sentinel:

```python
if context_string == "NO_CONTEXT_AVAILABLE":
    return {"error": "No historical behavior found to explain this transaction."}
```

That check runs before the HTTP client opens a connection. The system prompt does tell the model not to hallucinate, but the actual guarantee is a Python early return.

## What running locally costs

Open models on Ollama aren't as good at nuanced reasoning or strict JSON as a frontier hosted model. I force `format: "json"` and still wrap the parse in a broad `except Exception`. That means a timeout, a dead host and broken JSON all come back as the same generic error, which makes debugging harder than it should be.

## What I'd want a reviewer to see

- The Ollama host is resolved once. If it dies ten minutes after startup, every request fails until the process restarts.
- If nobody runs `embeddings/sync`, `/v1/explain` doesn't fail. It just returns `NO_CONTEXT_AVAILABLE` forever.
- There's no reranking or metadata filtering, just top three by similarity.

## What I learned

Most of the grounding work turned out to be ordinary software engineering, not prompt engineering. The prompt asks the model to stay grounded. The early return makes sure it can't do anything else. Next on my list: re-checking host health in the background instead of trusting the cache forever, and running `embeddings/sync` automatically at the end of the behavior pipeline.
