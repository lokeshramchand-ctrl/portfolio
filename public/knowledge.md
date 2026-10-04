# Lokesh Ram Chand B

Software engineer building full-stack products and AI/ML systems — backend architecture, retrieval-augmented generation (RAG), and production hardening (security, performance, CI/CD). Based in Hyderabad, India. Portfolio: https://lokeshrc.me/ · GitHub: https://github.com/lokeshramchand-ctrl · LinkedIn: https://www.linkedin.com/in/lokeshramchand/

This page is a plain-text knowledge summary for search engines and AI assistants. For the full interactive portfolio, visit https://lokeshrc.me/. For long-form technical writing, see https://lokeshrc.me/blog.

## Education

Bachelor of Technology (B.Tech) in Computer Science & Engineering, Koneru Lakshmaiah Education Foundation (KL University), Aziz Nagar, Hyderabad, India. Currently in Semester 7 of an 8-semester program (expected graduation ~2027). CGPA 9.41/10 through Semester 6 (153 credits across 6 semesters).

Coursework concentrates on core computer science (data structures, algorithms, advanced OOP, operating systems, theory of computation, database management systems) plus a Data Engineering & Analytics specialization track (data engineering fundamentals, data exploration, big data technologies, AI-driven data engineering) and three embedded industry certifications completed as part of the curriculum: AWS Certified Cloud Practitioner, MongoDB Associate Database Administrator, and Automation Anywhere Certified Advanced RPA Professional.

## Experience

### Lead Frontend Engineer — Wellington Water Watchers (Sept 2025 – Jan 2026)

Sole frontend engineer at a Guelph/Ontario, Canada watershed-protection non-profit, owning the full client-side stack on their NationBuilder Liquid CMS (HTML5, SASS/SCSS, JavaScript ES6+, GSAP/ScrollTrigger).

- Diagnosed and fixed a payment-processing defect silently failing all donations of $100+ (a legacy input-masking library was truncating multi-digit currency strings). Rebuilt the input pipeline in vanilla ES6, restoring transaction reliability to 99.4% and unlocking over $45,000 in previously blocked donations; average order value rose from $38 to $82 (+115.7%).
- Rebuilt the site's animation and scrollytelling layer with GSAP ScrollTrigger, constrained to GPU-accelerated CSS transforms. Cut Largest Contentful Paint from 4.2s to 1.2s (-71.4%), reduced Cumulative Layout Shift to 0.02, and raised the Lighthouse performance score from 52 to 94/100.
- Implemented technical SEO (canonical tag automation, JSON-LD structured data for nonprofit/event/article types) and WCAG 2.1 AAA accessibility compliance, growing organic search traffic from 12,500 to 23,100 monthly sessions (+84.8%).
- Built a real-time petition signature counter and a postal-code-based representative lookup tool that pre-fills advocacy emails, raising petition completion rates from 3.2% to 8.9% (+178.1%).

## Open Source Contributions

### Apicurio Registry — [PR #9380](https://github.com/Apicurio/apicurio-registry/pull/9380) (merged, shipped in v3.3.3)

Found and fixed a schema-compatibility false negative in Apicurio Registry's XSD compatibility checker (Java): an attribute changing from optional to required was not flagged as a breaking BACKWARD-incompatible change. Traced the bug to a forward-compatibility check that reused the same method with swapped arguments and so never caught the case. Added regression tests verified to fail against the pre-fix code.

### Milvus Birdwatcher — [PR #516](https://github.com/milvus-io/birdwatcher/pull/516), [PR #521](https://github.com/milvus-io/birdwatcher/pull/521), [PR #542](https://github.com/milvus-io/birdwatcher/pull/542) (all merged)

Three merged fixes (Go) to Milvus's operator debugging/repair tool:

- **#516** — Fixed a data-integrity bug where a failed `proto.Marshal` call in the `repair` command still wrote non-decodable bytes to etcd, silently corrupting index metadata.
- **#521** — Implemented `FileAuditKV.MultiSave`, a decorator that writes a length-prefixed protobuf audit log over etcd/TiKV, and fixed component wiring so every mutating command (repair, remove, set, reset) actually routes through the audit wrapper.
- **#542** — Replaced a racy `WaitGroup` + shared-error worker pool in the etcd restore pipeline with `errgroup.WithContext`, fixing a data race that let failed batch writes be silently swallowed during restores.

## Projects

### Velar — AI-powered financial intelligence platform

A backend-first transaction-intelligence platform that turns a Google Pay PDF statement into categorized transactions, behavioral profiles, anomaly/subscription detection, and grounded (RAG) natural-language explanations — with a Flutter mobile app and a Next.js admin dashboard. Solo-built over ~3.5 months (FastAPI, MongoDB, Milvus vector search, self-hosted Ollama LLM).

- A 15-phase backend pipeline (ingestion, merchant resolution, a trust-based memory state machine, statistical behavior/anomaly detection, vector embeddings, grounded RAG explainability) with retrieval-augmented generation deliberately hard-coded to refuse answering without real retrieved context, to prevent hallucinated financial explanations.
- A hand-built PDF statement parser reverse-engineered against a real anonymized Google Pay statement, reconciling extracted totals exactly against the statement's own printed figures.
- Defense-in-depth security: Argon2id password hashing, rotating JWTs with reuse detection, HMAC request signing, DLP redaction of sensitive data from logs, and prompt-injection filtering on LLM input/output.
- A full CI/CD pipeline (GitHub Actions) running secret scanning, linting, dependency-vulnerability audits, and a 61-test suite against a live database on every push.
- Repository: https://github.com/lokeshramchand-ctrl/Velar

### MapLayer — Geospatial visualization and GeoRAG platform

A browser-based geospatial visualization tool for San Diego parcel and zoning data, built with React + OpenLayers on live GeoJSON/Esri feature layers, backed by a FastAPI service doing address geocoding, spatial lookups against MongoDB, and an LLM-driven chat agent (Ollama + Milvus RAG) that answers property hazard and California zoning-code questions.

- 14 independently configured live map layers (parcels, zoning, fire/airport/coastal hazard zones, historic districts) sourced from SANDAG's public ArcGIS FeatureServer.
- A tool-calling chat agent that chains address geocoding → parcel lookup → concurrent hazard-zone checks into a single call, with retrieval-augmented generation over a zoning/ADU handbook and California legislative codes.
- An MCP (Model Context Protocol) server exposing the same search tools over SSE for external agent integrations.
- Repository: https://github.com/lokeshramchand-ctrl/MapLayer

## Skills

**Languages:** Python, TypeScript/JavaScript, Dart, Java, Go, SQL, Bash
**Backend:** FastAPI, Node.js, REST APIs, async I/O, microservice/monolith architecture
**AI/ML:** Retrieval-augmented generation (RAG), vector search (Milvus), LLM tool-calling, Ollama self-hosted inference, UMAP/HDBSCAN clustering, scikit-learn, LightGBM, XGBoost, LoRA fine-tuning
**Frontend:** React, Vue 3, Next.js, GSAP, OpenLayers, Flutter/Dart (Riverpod, Clean Architecture)
**Data:** MongoDB, PostgreSQL/MySQL, Redis, Milvus
**Infrastructure:** Docker, GitHub Actions CI/CD, Nginx, Linux systems administration
**Security:** JWT/OAuth auth design, Argon2id password hashing, HMAC request signing, dependency/secret scanning (gitleaks, pip-audit, Trivy)

---

*This page is maintained by Lokesh Ram Chand B as a structured, crawlable summary for search engines and AI assistants. See https://lokeshrc.me/ for the full portfolio and https://lokeshrc.me/blog for technical writing.*
