---
status: accepted
---

# Structured discovery, not full-text search

RemoteLens will not expose generic keyword, job-title, or description full-text search. Public discovery uses structured category, normalized-company, and geographic eligibility criteria; job text remains available only for permitted display, provenance, and internal deduplication.

## Consequences

- Do not build or expose `jobs_fts`, `searchText`, or a public `q` parameter.
- Company matching is normalized exact matching only, never a free-text, substring, or prefix query over job content.
- The V1 role-family vocabulary contains only `engineering`; repeated `source` keys are exact validated OR filters.
- Every provider-supplied tag or category is retained as a source label, but only a small, versioned, source-scoped allow-list of documented developer category or technology labels is filterable as an exact job tag. Tag normalization is lexical only (case, whitespace, and hyphen variants); V1 does not infer tags from job text or make synonym or semantic mappings.
- V1 exposes neither result-derived facets nor a tag directory, tag autocomplete, or tag vocabulary in `/api/v1/taxonomy`. A syntactically valid unknown exact company or tag returns `200` with an empty result set, while malformed fixed values or an unknown provider return `invalid_filter` `400`; any additional structured facet must be explicitly documented and must not reintroduce a generic text-search path.
