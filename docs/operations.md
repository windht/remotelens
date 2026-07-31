# RemoteLens production operations

This runbook applies to the single production D1 catalog and the
`remotelens` Worker in the Hutong531 account. It is intentionally read-only by
default. Run mutations only against the named RemoteLens resources, after
reviewing the expected effect.

## Resource identity

- Cloudflare account: Hutong531 (`d06a8c795d2fd2c7718ed48c534dc2ba`)
- Worker: `remotelens`
- D1: `remotelens-catalog`
- Workflow: `remotelens-catalog-ingestion`
- Schedule: `0 */12 * * *`
- Primary public URL: `https://remotelens.co`
- Workers.dev fallback: `https://remotelens.hutong531.workers.dev`

Never copy secret values into this file, a command argument, a log, a ticket,
or a backup. The database stores normalized source records and provenance, not
raw feed payloads, CV files, or provider credentials.

## Preflight and process cleanup

Run commands from the repository root with the repository's pinned toolchain:

```bash
pnpm install
pnpm cf:dry-run
pnpm build
pnpm cf:prod-dry-run
pnpm exec wrangler whoami
```

Use foreground commands. If a local Worker or preview is required, record its
PID, process group, port, and temporary data directory before starting it. Stop
only those task-owned processes when finished and verify that ports 4173 and
8787 are no longer listening. Do not use broad process-name or port kills.

## Backup and export

Create a temporary, access-controlled directory and export the normalized
catalog before a planned migration or recovery exercise:

```bash
backup_dir="$(mktemp -d /tmp/remotelens-backup.XXXXXX)"
chmod 700 "$backup_dir"
pnpm exec wrangler d1 export remotelens-catalog --remote \
  --output "$backup_dir/remotelens-catalog.sql" --skip-confirmation
```

Inspect the file location and permissions, then move it to the approved
encrypted backup store. Do not print the SQL contents. Delete only the exact
temporary directory after confirming the approved copy exists; use a targeted
recoverable cleanup process rather than a broad recursive deletion.

The export is a recovery artifact, not a public catalog snapshot. It must not
be uploaded to a source provider, included in a release artifact, or retained
with CV or application materials.

## Time Travel and restore

Inspect available recovery information first:

```bash
pnpm exec wrangler d1 time-travel info remotelens-catalog \
  --timestamp "2026-07-31T00:00:00Z" --json
```

A restore is a production mutation and can replace the current database state.
Confirm the exact RFC3339 timestamp or bookmark, export the current database,
and obtain operator approval before running:

```bash
pnpm exec wrangler d1 time-travel restore remotelens-catalog \
  --timestamp "<approved-rfc3339-timestamp>"
```

After a restore, re-run migration/readback checks and verify catalog epoch,
provider health, canonical-job counts, and public responses before resuming
ingestion. Do not use restore as a routine deployment rollback.

## Ingestion diagnosis

List and inspect only the named Workflow and its bounded instance output:

```bash
pnpm exec wrangler workflows list
pnpm exec wrangler workflows instances list remotelens-catalog-ingestion
pnpm exec wrangler workflows instances describe \
  remotelens-catalog-ingestion <instance-id>
```

Use safe aggregate D1 readback for diagnosis; never select descriptions,
provider response bodies, credentials, or other unbounded payloads into logs:

```bash
pnpm exec wrangler d1 execute remotelens-catalog --remote --command \
  "SELECT status, COUNT(*) AS count FROM ingestion_cycles GROUP BY status"
pnpm exec wrangler d1 execute remotelens-catalog --remote --command \
  "SELECT provider, status, fetched_count, rejected_count, error_code
   FROM ingestion_source_runs ORDER BY finished_at DESC LIMIT 10"
pnpm exec wrangler d1 execute remotelens-catalog --remote --command \
  "SELECT provider, status, active_count, consecutive_failures
   FROM source_health ORDER BY provider"
```

A fully failed cycle keeps the previous cache epoch. Partial and successful
cycles rotate it. A bounded error code/message may be inspected for diagnosis;
do not paste secrets or raw source text into incident notes.

## Provider suspension and recovery

WWR is suspended by changing only the named `ENABLE_SOURCE_WWR` variable to
`false` in the reviewed Wrangler configuration and deploying that reviewed
version. This withholds WWR-only jobs while retaining its source records. It
does not delete records or mass-close them. Re-enable it by reverting only that
flag and deploying again, then run or wait for the next scheduled cycle.

Before and after a suspension test, record aggregate counts only:

```bash
pnpm exec wrangler d1 execute remotelens-catalog --remote --command \
  "SELECT provider, status, COUNT(*) AS count
   FROM source_records GROUP BY provider, status ORDER BY provider, status"
```

Do not edit provider rows directly in D1. Do not delete source records to
simulate suspension. If a provider feed is legally or operationally unsafe,
disable the provider and preserve the audit state until the recovery decision
is complete.

## Secret hygiene

List names and binding types only:

```bash
pnpm exec wrangler secret list
```

Rotate an exposed secret by obtaining its replacement from the provider or a
cryptographically secure local generator, then piping it to Wrangler without
printing it:

```bash
openssl rand -base64 32 | pnpm exec wrangler secret put API_CURSOR_SECRET
```

Provider API keys must be revoked and reissued in the provider account before
updating the Worker secret. Never reuse a value that appeared in terminal,
tool, CI, or chat output. Never commit `.dev.vars`, `.env`, or secret values.

## Production acceptance smoke

After deployment and bootstrap, verify the public home, `/api`, `/api/v1/meta`,
`/api/v1/jobs`, JSON feed, RSS feed, and one returned detail route. Confirm
security headers, provider-specific freshness, source URLs, canonical metadata,
and the absence of secret/raw-payload leakage. Keep request output bounded and
store only sanitized status/header/body excerpts as evidence.
