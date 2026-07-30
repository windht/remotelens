# RemoteLens Phase 0–1 Implementation Plan

## Scope

This run delivers Phase 0 and Phase 1 from `REMOTELENS_PLAN.md`, plus the
explicitly requested polished public frontend foundation. It does not deploy
production, expose a public ingestion endpoint, or implement Phase 2 canonical
merge behavior, Phase 3 public APIs/feeds, Phase 5 Agent Skill behavior, or
Phase 6 production operations.

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
  Phase 2 semantic-deduplication path.

## Phase 0 — Repository, design, and public shell

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

## Phase 1 — Domain model and V1 ingestion foundation

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
