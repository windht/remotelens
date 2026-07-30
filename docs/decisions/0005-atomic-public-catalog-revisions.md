---
status: superseded by ADR-0006
---

# Atomic public catalog revisions

RemoteLens will build a candidate public catalog projection during each ingestion cycle and atomically publish it only after every enabled provider completes successfully. Public pages, APIs, and feeds read only the published revision; partial or failed cycles keep the previous public revision and expose degraded freshness through metadata.

## Consequences

- Cache keys include the published revision, so a revision flip logically invalidates every successful public response at once.
- Mutable ingestion tables and an in-progress projection are never served directly to public clients.
- Integration tests must prove that a failed or partial cycle cannot expose a partial catalog.
