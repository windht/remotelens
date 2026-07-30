---
status: accepted
---

# Scheduled incremental ingestion workflow

RemoteLens starts a Catalog Ingestion Workflow directly every 12 hours through a Cloudflare Workflow `schedules` binding, rather than exposing an ingestion endpoint or adding a separate Cron Trigger handler. Each workflow performs durable, idempotent incremental source steps while D1 remains the catalog source of truth.

## Consequences

- A complete source run is required before an absent source record can advance toward `missing` or `closed`; a partial or failed run is not an absence signal.
- A partial cycle may publish successfully refreshed source data and rotate the live cache epoch. A fully failed cycle leaves the last good catalog and cache epoch intact.
- Bootstrap the production catalog through one authenticated Wrangler-triggered Workflow run after deployment, then rely on the direct 12-hour schedule. Preview builds never schedule real-source ingestion.
