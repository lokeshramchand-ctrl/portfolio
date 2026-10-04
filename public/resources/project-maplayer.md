# Project Deep-Dive — MapLayer

> Extended detail behind the MapLayer entry on [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge). This page exists for search engines and AI assistants; the interactive site is at [lokeshrc.me](https://lokeshrc.me/).

A browser-based geospatial visualization tool for San Diego parcel and zoning data (internally nicknamed "ZoningLens"), built with React + OpenLayers on live GeoJSON/Esri feature layers, backed by a FastAPI service that does address geocoding, spatial lookups against MongoDB, and an LLM-driven chat agent (Ollama + Milvus RAG) that answers property-hazard and California zoning-code questions. A personal side project, under intermittent development over roughly 16 months.

## Problem

Checking a property's zoning, hazard exposure (fire/airport/coastal), and applicable CA legislative codes normally requires cross-referencing several disconnected GIS portals and manual lookups — one layer at a time, no synthesis, no natural-language interface.

## What I Built

A React/OpenLayers frontend where a user searches a San Diego address (debounced Nominatim autocomplete, hard-restricted to San Diego) and gets 14 live SANDAG feature layers rendered around that point — parcels, zoning, sewer/water mains, fire/airport/coastal hazard zones, historic districts — plus a floating AI chat panel.

The FastAPI backend chains address → point geometry → parcel geometry → concurrent hazard-layer intersection checks into a single call (`analyze_property_hazards`, using MongoDB's `$geoIntersects`), and runs a Milvus-based RAG pipeline over two corpora: a zoning/ADU PDF handbook and California legislative codes. An Ollama-driven tool-calling chat agent decides, per user question, whether to call the hazard tool, the handbook search, or the CA-code search — with a fallback parser for when the local model emits a raw JSON tool call instead of using proper tool-calling. The same search tools are also exposed over an MCP (Model Context Protocol) server for external agent integrations.

I joined after an initial scaffold (first commit, first Dockerfile, first search bar) from a second contributor, and rebuilt essentially everything past that point: the current OpenLayers map and layer-config system, the San-Diego-restricted address search, and the entire backend.

## Engineering Decisions

**MongoDB over querying the live SANDAG API per request.** Hazard/parcel/zoning checks need geometry intersection, not simple filtering. Keeping a local MongoDB copy of the shapefiles lets the backend chain multiple spatial joins in one process, independent of the upstream API's rate limits — at the cost of keeping that copy in sync with the source.

**Restricting address search to San Diego with two layers of validation.** Nominatim is a global geocoder, but the map layers and hazard data only cover San Diego. A fixed `viewbox`/`bounded` parameter on the geocoding request narrows results, but doesn't guarantee they're actually inside city/county limits at the edges of the box — so a second, client-side check re-validates the returned address fields before showing a result.

**Adding, then removing, a MySQL ingestion path.** Tried `pymysql`-based ingestion for the CA-codes RAG collection, then removed the whole integration two commits later in favor of the existing Milvus pipeline — a reminder that it's worth settling on one ingestion approach before writing the code.

## Challenges

**LLM tool-calling reliability.** The local model (`llama3.1` via Ollama) sometimes returned a tool-call request as plain JSON text instead of populating the structured `tool_calls` field. Reproduced it in a standalone test script first, then added a fallback that detects tool-name substrings in the raw content, parses the JSON, and reconstructs a synthetic tool call before dispatching — so the agent no longer echoes malformed JSON back to the user.

**Keeping address search inside San Diego.** A generic geocoder search returns nationwide results, but every downstream layer assumes a San Diego coordinate. The constraint was tightened progressively across several commits, from state-level to city/county-level, ending in the combined server-side + client-side validation described above.

## Status

Active personal/learning project, not a production deployment. As a side project rather than a client-facing product, authentication, secrets management, and rate limiting weren't the focus of the build and are the clear next steps before any public-facing deployment — a useful contrast with [Velar](/resources/project-velar.md), where that hardening pass was the explicit focus.

## Stack

React 19, TypeScript, OpenLayers, FastAPI, Python, MongoDB (`$geoIntersects`), Milvus (vector search/RAG), Ollama (`llama3.1` for tool-calling, embeddings for retrieval), MCP, Nominatim/OpenStreetMap geocoding, Docker.

---

*Maintained by Lokesh Ram Chand B. See [lokeshrc.me](https://lokeshrc.me/) for the full portfolio and [lokeshrc.me/knowledge](https://lokeshrc.me/knowledge) for a condensed summary.*
