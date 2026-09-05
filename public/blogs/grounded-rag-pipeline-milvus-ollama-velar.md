---
title: "Building a Grounded RAG Pipeline for Financial Data with Milvus and Ollama"
date: "Aug 7, 2026"
excerpt: "An architectural deep dive into how Velar builds a privacy-first, grounded RAG pipeline using Milvus, Ollama, and FastAPI without relying on external LLM APIs."
tags: ["Machine Learning", "FastAPI", "MongoDB", "Milvus", "Ollama", "RAG", "System Architecture", "Privacy"]
---


A bank statement isn't a support ticket. You can't paste six months of someone's transaction history into a public API just to get a nicer explanation of why a charge got categorized the way it did. So the embedding model and the generation model in Velar both run on infrastructure I control, and the retrieval step is built to hand the LLM real records instead of asking it to remember something it was never shown.

*   **System:** Velar — grounded explanation layer
*   **Stack:** FastAPI · Milvus · Ollama · MongoDB
*   **Reading time:** 7 min

```text
query 
  ↓ 
Milvus (cosine, top_k=3) 
  ↓ 
MongoDB (profile+behavior) 
  ↓ 
Context Builder (XML fence or empty) 
  ↓ 
Ollama (local, format: "json") 
```
*(If NO_CONTEXT_AVAILABLE, the model is never called.)*

Everything in this diagram runs inside the same container network. Nothing here has a public API key, because nothing here needs one.

Most RAG write-ups assume the fun part is retrieval and the boring part is generation, and they usually skip past one detail: where does the embedding call actually go? For a lot of stacks the answer is "an OpenAI endpoint," which is fine for product docs and painfully wrong for a merchant name tied to someone's spending pattern. Velar's answer was to not have that conversation at all. The embedding model and the generation model are both served by Ollama, running on a host inside the same infrastructure boundary as the FastAPI process, MongoDB, and Milvus. Nothing about a transaction ever gets serialized into a request to a third party.

That's the privacy half of the pitch, and it's the easier half to build. The harder half is making sure the model, once it's local and cheap to call, doesn't just start making things up because nobody's watching anymore. Local doesn't mean honest. Grounding is what does that job, and it happens in two places: what retrieval is allowed to hand the model, and what the model is allowed to do when retrieval comes back empty.

### Phase 7: Turning a behavior pattern into something worth embedding

Before anything gets indexed, it has to become a sentence. Embedding models are trained on language, not raw floats, so a periodicity score of 0.91 sitting alone in a JSON blob doesn't carry much semantic weight. Wrapped in a sentence that says what the number means, it does:

`embeddings/vectorizer.py`
```python
def stringify_behavior(pattern: BehaviorPattern) -> str:
    return (
        f"Behavior footprint for {pattern.merchant_name}: "
        f"Average transaction amount is {pattern.avg_amount:.2f} "
        f"with a standard deviation of {pattern.std_dev:.2f}. "
        f"Preferred time of day is {pattern.preferred_hour}:00. "
        f"Periodicity score is {pattern.periodicity_score:.2f} "
        f"(1.0 means highly predictable)."
    )
```

That string gets POSTed to `{ollama_host}/api/embeddings` and comes back as a 768-dimension vector. The host itself is resolved once, lazily, on first real use rather than at import time — the same pattern `database/milvus.py` uses for the vector database connection. If `OLLAMA_URI` is set it wins outright; otherwise the app walks `OLLAMA_HOSTS`, a comma-separated failover list, and health-checks each one with a two-second timeout until it finds a host that answers. Whichever one responds first gets cached in a module-level variable for the rest of the process's life.

The vector lands in a Milvus collection built for exactly one thing: a 768-dim field named `embedding`, indexed HNSW with cosine distance, next to a `merchant_name` string field carried along as payload. There's no chunking logic, no document store, no metadata filters beyond that one field. It's less a document RAG system and more a nearest-neighbor lookup table keyed by merchant behavior, which is honestly the right amount of machinery for what this dataset actually is. Populating it is a manual batch job, `POST /v1/pipelines/embeddings/sync`, that walks every row in `behavior_patterns` and upserts a vector for each one. Nothing calls it automatically after the behavior pipeline finishes.

### Phase 12: Retrieval that hands the model receipts, not vibes

#### Two lookups, not one
When `/v1/explain` gets a question, it doesn't search Milvus for an answer. It searches Milvus for addresses: the top three merchant names whose behavior vectors are closest to the query. Those names are then used to pull the real records back out of MongoDB — the merchant's trust-state profile, its behavior pattern document, and its three most recent human corrections. Milvus never gets to describe a merchant on its own; it only gets to point at one Mongo already has a full record for.

#### An XML fence around the prompt
Those records get formatted into the actual prompt as tag-delimited blocks, and if there's nothing to format, the function returns a fixed sentinel string instead of an empty prompt:

`rag/context_builder.py`
```python
if not context_data:
    return "NO_CONTEXT_AVAILABLE"

block = f"""<MERCHANT_DATA ID="{idx}">
    <NAME>{name}</NAME>
    <MEMORY_STATE>{profile.get('memory_state')}</MEMORY_STATE>
    <BEHAVIOR_SIGNATURE>
        Periodicity Score: {behavior.get('periodicity_score')}
    </BEHAVIOR_SIGNATURE>
</MERCHANT_DATA>"""
```

The tags aren't decoration. A model asked to reason over free-floating prose has a lot of room to drift into a sentence that sounds like it belongs. A model told the only valid subject matter lives inside `<MERCHANT_DATA>` blocks has a narrower path to wander off of, and the system prompt spells that out directly: don't act like a chatbot, don't hallucinate, and if the context doesn't contain the answer, say so in the required JSON shape instead of improvising one.

#### The short circuit
The sentinel string does real work downstream, not just semantic work. The generator checks for it before building a request:

`rag/generator.py`
```python
if context_string == "NO_CONTEXT_AVAILABLE":
    return {"error": "No historical behavior found to explain this transaction."}

# only reached when there's something real to ground on
payload = {
    "model": LLM_MODEL, 
    "system": self.system_prompt,
    "prompt": full_prompt, 
    "format": "json"
}
response = await client.post(f"{get_ollama_host()}/api/generate", json=payload)
```

Zero hits in Milvus means the function returns before `httpx` ever opens a connection. Not a prompt instructing the model to decline, an actual early return in Python. Ollama doesn't get a chance to fill the gap with something plausible, because it never gets asked the question in the first place.

**Trust boundary, as actually enforced:** `query text` → `Milvus (local)` → `MongoDB (local)` → `Ollama (local)`. Zero calls, at any point in this path, to a service outside infrastructure this team operates.

### What running local actually costs

None of this is free, and it would be dishonest to write a privacy post without saying what got traded away for it. Ollama-served open models are not going to match a frontier hosted model on nuanced reasoning, and JSON-schema adherence is noticeably less reliable, which is why the generator forces `format: "json"` at the API level and still wraps the response parse in a broad `except Exception`. That catch-all is doing a lot of quiet work: a timeout, a genuinely unreachable host, and a model that returned syntactically broken JSON all collapse into the same generic message, "Failed to generate explanation due to internal model error." A caller can't currently tell those three failure modes apart, which is a real gap if you're trying to debug why explanations are failing in production at 2am.

### Known limitations
*What I'd want a reviewer to notice before I told them*

*   **The Ollama host resolves once and is cached for the process's lifetime.** If the healthy host from `OLLAMA_HOSTS` goes down ten minutes after the app starts, nothing re-resolves. Every request against it just fails until the process restarts. Fine for a single container in dev; not something I'd want load-bearing in a multi-host production failover story without changes.
*   **`embeddings/sync` is manual, and its absence fails silently.** If it never runs after a fresh `behavior/run-all`, `/v1/explain` doesn't error. It just returns `NO_CONTEXT_AVAILABLE` forever for merchants that have perfectly good behavior data sitting in MongoDB, because Milvus never got a vector for them.
*   **Failure modes are collapsed into one error string.** A model timeout, a malformed JSON response, and a dead Ollama host are indistinguishable to the API caller today.
*   **There's no reranking or metadata filtering.** Retrieval is pure vector similarity, top three, no second pass. That's adequate for a collection this narrowly scoped, but it's not a pattern that scales to a more general document set without more retrieval machinery than exists here right now.

### So what

The thing I underestimated going in was how much of "grounding" is actually just software engineering, not prompt engineering. The system prompt in `generator.py` does tell the model not to hallucinate, and I'm sure that instruction helps some. But the guarantee this system actually has doesn't come from asking nicely. It comes from the fact that when there's nothing to ground on, the code takes a branch that never reaches the network call at all. The prompt is a request. The early return is a fact.

Given more time, the first thing I'd fix is the cached-host problem — a background health-recheck instead of a resolve-once-and-trust-forever cache, since a silently dead Ollama host is a worse failure than a slow one. Second, I'd wire `embeddings/sync` into the tail end of the behavior pipeline instead of leaving it as a step a human has to remember. A pipeline that errors when you forget a step is annoying. A pipeline that just quietly returns nothing is the kind of bug that survives in production for months before anyone notices the explanations have gone empty.

***
