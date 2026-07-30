---
status: accepted
---

# Deterministic public job fields

RemoteLens V1 exposes only source-stated, deterministically parsed, or normalized job fields, and treats ambiguity as `unknown` or `unspecified`. This favors reliable, explainable filters over broader but speculative enrichment; DeepSeek remains limited to cross-source semantic deduplication.

## Consequences

- `published_after` uses only a provenance-backed source publication time; `first_seen_after` is the separate RemoteLens discovery-time filter.
- Salary minimum filtering requires explicit matching currency and period, with no currency conversion or annualization.
- A timezone requirement is filterable only when employer-stated wording can be deterministically normalized to an IANA timezone; otherwise it remains visible source text.
- A concrete structured value excludes `unknown` or `unspecified`; they are returned only when explicitly requested.
