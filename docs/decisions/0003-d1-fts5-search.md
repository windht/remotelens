---
status: superseded by ADR-0004
---

# D1 FTS5 for V1 search

RemoteLens will use Cloudflare D1's supported SQLite FTS5 module for canonical-job keyword search. A `jobs_fts` index will be updated in the same transaction as a canonical job while structured eligibility filters continue to use ordinary indexed D1 fields; this keeps search simple, testable, and free of an external search service.

## Consequences

- Search covers title, company, permitted description text, role family, tags, and location summary.
- FTS5 selects matching canonical job IDs; it never substitutes for structured eligibility filtering.
- FTS index synchronization is covered by ingestion and migration tests.
