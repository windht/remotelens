---
status: accepted
---

# One live catalog, no historical revisions

RemoteLens will maintain one live D1 catalog and mutate it directly during ingestion. A lightweight cache epoch changes after each completed refresh to invalidate derived public responses, but no catalog snapshot, staging projection, rollback history, or revision-retention system will be built in V1.

## Consequences

- Public reads use the live catalog; V1 does not guarantee an atomic cross-endpoint snapshot while ingestion is active.
- A completed successful or partial cycle rotates the cache epoch; a fully failed cycle does not.
- The only persistent deployed catalog is production. Local work and preview builds use fixtures and do not create a staging catalog or scheduled source ingestion.
- D1 Time Travel and normal database backups remain operational safeguards, not a public catalog-version feature.
