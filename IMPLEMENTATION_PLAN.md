# RemoteLens Full Delivery Implementation Plan

## Scope

This run delivers the complete Phase 0–6 plan from `REMOTELENS_PLAN.md`.
Phases 0–5 are implemented and validated, and Phase 6 production deployment
and hardening is complete in the selected Hutong531 account. The service
remains public, read-only, and local-CV-only throughout.

RemoteLens remains a public, read-only remote developer-job index. It has no
accounts, hosted CVs, saved jobs, employer posting, advertising, application
tracking, or auto-apply behavior.

## Settled decisions

- TypeScript strict mode, TanStack Start, React, Tailwind CSS, and customized
  shadcn/ui-compatible primitives.
- SSR on Cloudflare Workers with minimal client JavaScript.
- Cloudflare D1 with Drizzle migrations as the live catalog source of truth.
- Cloudflare Workflows scheduled directly with `0 */12 * * *`.
- Zod at external input and environment boundaries.
- Remote OK and exactly four approved We Work Remotely programming RSS feeds.
- One mutable live catalog with a cache epoch; no snapshots or revisions.
- Structured discovery only; no text, title, description, vector, or semantic
  search.
- Deterministic source-local identity and candidate generation before the
  bounded Phase 2 semantic-deduplication path.

## Phase 2 — Canonical jobs and deduplication

- Extend D1 with canonical fields, stable slugs, filter projections, tags, and
  field provenance.
- Derive canonical fields conservatively from source evidence and retain
  unknowns rather than guessing.
- Resolve exact duplicate candidates deterministically, record append-only
  decisions, and use DeepSeek only for unresolved cross-source candidates with
  a maximum of 50 decisions per ingestion run.
- Rebuild/upsert canonical jobs, preserve source conflicts, and apply active,
  stale, closed, retention, and provider-suspension semantics.

## Phase 3 — Public API and feeds

- Ship the documented unauthenticated `/api/v1` jobs, detail, taxonomy, and
  metadata endpoints with Zod contracts, opaque cursor pagination, structured
  filters, provenance, stable errors, CORS, caching, and a bounded rate guard.
- Ship active-job JSON/RSS feeds and an OpenAPI document without introducing
  generic or full-text search.

## Phase 4 — Live public SSR website

- Route public SSR pages through the D1 catalog service while keeping sanitized
  fixtures only as a local empty-catalog fallback.
- Complete provenance, freshness, SEO, empty/error, no-JavaScript, accessibility,
  and responsive behavior for all required routes.

## Phase 5 — Agent Skill

- Ship the repository-owned `skills/remotelens/` package with `SKILL.md`, API,
  matching, CV-safety, local workflow references, and an example config.
- Document Codex, Claude Code, and generic installation; keep CV reads local,
  never scrape source pages, never mutate trackers, and never submit jobs.
- Add prompt-injection and selected-file-only safety tests.

## Phase 6 — Production deployment and hardening

- Create/migrate the Hutong531 production D1, deploy the Worker and direct
  `0 */12 * * *` Workflow, and run the authenticated initial ingestion.
- Verify public site/API availability, source freshness, provider suspension,
  observability, security headers, and the export/restore operations runbook.

## Phase 0 — Repository, design, and public shell (complete)

### P0.1 Repository and quality foundation

1. Create the package manifest, strict TypeScript configuration, formatting,
   linting, Vitest, Playwright, and CI.
2. Configure TanStack Start for Cloudflare Workers and document local and
   production commands.
3. Add validated public/runtime environment configuration without secrets.
4. Add security headers and the initial Worker binding types.

### P0.2 Stitch-led visual system

1. Create a dedicated RemoteLens Stitch project.
2. Create and apply a design system for the calm, technical-editorial direction.
3. Generate and review responsive concepts for:
   - home,
   - structured job browse,
   - job detail with provenance,
   - sources and methodology,
   - API documentation and Agent Skill installation.
4. Record project, design-system, and screen identifiers; selected direction;
   design tokens; responsive rules; accessibility rules; and implementation
   notes in `docs/design.md`.

### P0.3 Frontend foundation

1. Add Tailwind and customized shadcn/ui-compatible primitives.
2. Build the semantic public shell, skip link, responsive navigation, footer,
   buttons, badges, form controls, provenance rows, job rows, and status states.
3. Add sanitized fixtures and fixture-backed route content for `/`, `/jobs`,
   `/jobs/:slug`, `/sources`, `/methodology`, `/api`, and `/skills/install`.
4. Make structured filters ordinary `GET` form controls so URLs and server
   rendering work without JavaScript.
5. Add responsive, keyboard, reduced-motion, contrast, and semantic-heading
   browser coverage.

### P0 validation gate

- Formatting, lint, typecheck, unit tests, targeted Playwright acceptance tests,
  and production build pass.
- Local Cloudflare-compatible SSR starts and serves the critical routes.
- Critical Phase 0 acceptance cases are recorded as passed.

## Phase 1 — Domain model and V1 ingestion foundation (complete)

### P1.1 D1 and domain schema

1. Add Drizzle D1 configuration and a hand-reviewable initial migration.
2. Model source records, source labels, jobs/provenance scaffolding, ingestion
   cycles and source runs, source health, locks, deduplication candidates and
   append-only decisions, and the live cache epoch.
3. Add indexes and constraints for stable source-local identity, run claims,
   status queries, retention, and deterministic candidate lookup.
4. Add migration validation against a disposable local D1 database.

### P1.2 Shared ingestion contracts and deterministic normalization

1. Implement the source-adapter fetch/parse/normalize contract.
2. Implement text, URL, HTML sanitization, description extraction, hashes,
   source-local identity, company/title normalization, tags, salaries, and
   conservative location/timezone normalization.
3. Keep every derived field explicit about source-stated, parsed, normalized,
   or unknown status.
4. Add unit tests for deterministic normalization and malformed input.

### P1.3 Remote OK adapter

1. Validate the public JSON feed envelope and ignore its metadata row.
2. Admit records only when an allowed developer title marker and an allowed
   source-provided developer tag are both present.
3. Reject known non-developer markers and ambiguous roles without inspecting
   descriptions.
4. Preserve full sanitized descriptions, provenance-only labels, filterable
   allow-listed labels, source identity, attribution, and URLs.
5. Cover accepted, rejected, ambiguous, malformed, and unchanged fixtures.

### P1.4 We Work Remotely adapter

1. Configure exactly the four approved programming RSS feeds.
2. Parse RSS only; never scrape detail pages.
3. Use `guid`/listing URL as WWR-local identity.
4. Merge one listing observed in multiple configured feeds into one source
   record while retaining every observed category tag.
5. Preserve `rawTitle` and split `Company: Role` only when both sides are
   non-empty.
6. Cover duplicate-feed, fallback-title, malformed, and partial-feed fixtures.

### P1.5 Scheduled Workflow and incremental persistence

1. Configure `CATALOG_INGESTION` as a direct Workflow schedule at
   `0 */12 * * *`; expose no ingestion route and no separate Cron handler.
2. Claim idempotent cycles and provider locks in D1.
3. Use durable source steps that return bounded summaries/hashes rather than
   raw payloads.
4. Upsert by stable source-local identity; unchanged payloads refresh
   observation state without duplicate creation or unnecessary normalization.
5. Treat a failed WWR feed as a partial WWR run and never advance missing or
   closed state for that provider during that cycle.
6. Advance missing state only after two complete successful provider checks;
   close after 72 hours absent; retain closed data for 30 days.
7. Rotate the live cache epoch after successful or partial cycles and retain it
   after fully failed cycles.
8. Keep source feature flags independent and non-destructive.
9. Create unresolved cross-source candidates deterministically. Preserve the
   Phase 2 semantic-decision contract (`merge`, `separate`, `uncertain`,
   failures; maximum 50 per run) without applying canonical merges in Phase 1.

### P1.6 Validation and live development fetch

1. Run fixture-driven full, repeated, partial, failure, missing, close, lock,
   feature-flag, and cache-epoch integration tests.
2. Run one bounded live development fetch from Remote OK and all four WWR feeds
   without persisting raw payloads.
3. Verify normalized developer records and record only counts, hashes, response
   metadata, and bounded errors.
4. Run formatting, lint, typecheck, unit/integration tests, migration checks,
   production build, and affected Playwright cases.

## Evidence and synchronization

`TASKS.md` is the task source of truth. `ACCEPTANCE.md` records observable
user/operator checks. `WORKLOG.md` records actual commands, results, artifacts,
assumptions, and blockers. They are updated after every meaningful milestone.
