# RemoteLens Phase 0–1 Tasks

`TASKS.md` is the source of truth for this run. A task is checked only after its
implementation, technical validation, acceptance cases, and worklog evidence
are complete.

## Phase 0 — Repository, design, and public shell

- [x] **P0-001 — Establish repository and quality tooling**
  - Package manager, strict TypeScript, TanStack Start, Cloudflare SSR, Tailwind,
    lint, format, Vitest, Playwright, and CI.
  - Acceptance: `ACC-OPS-001`, `ACC-SHELL-001`
- [x] **P0-002 — Validate environment and Cloudflare binding configuration**
  - Startup validation, safe defaults, binding types, security headers, and
    documented commands.
  - Acceptance: `ACC-OPS-001`, `ACC-SEC-001`
- [x] **P0-003 — Create the Stitch project and RemoteLens design system**
  - Record the Stitch project and design-system IDs in `docs/design.md`.
  - Acceptance: `ACC-DESIGN-001`
- [x] **P0-004 — Generate and review the five required responsive screen concepts**
  - Home, browse/filter, detail/provenance, sources/methodology, and API/Skill.
  - Record selected screens and implementation notes in `docs/design.md`.
  - Acceptance: `ACC-DESIGN-001`
- [x] **P0-005 — Implement customized shared UI primitives and public shell**
  - Semantic layout, skip link, navigation, footer, buttons, badges, fields,
    job rows, provenance rows, status/empty/error states.
  - Acceptance: `ACC-SHELL-001`, `ACC-A11Y-001`, `ACC-RESP-001`
- [x] **P0-006 — Implement fixture-backed public foundation routes**
  - `/`, `/jobs`, `/jobs/:slug`, `/sources`, `/methodology`, `/api`,
    `/skills/install`.
  - Acceptance: `ACC-HOME-001`, `ACC-JOBS-001`, `ACC-JOB-001`,
    `ACC-SOURCES-001`, `ACC-DOCS-001`
- [x] **P0-007 — Implement no-JavaScript URL-driven structured filters**
  - Exact filters only; no generic search input or `q` parameter.
  - Acceptance: `ACC-JOBS-001`, `ACC-JOBS-002`, `ACC-JOBS-003`
- [x] **P0-008 — Add Phase 0 browser and accessibility coverage**
  - Critical desktop/mobile routes, keyboard navigation, focus visibility,
    semantic labels/headings, reduced motion, and empty results.
  - Acceptance: `ACC-A11Y-001`, `ACC-RESP-001`, all Phase 0 critical cases
- [x] **P0-009 — Pass the Phase 0 validation gate**
  - Format, lint, typecheck, unit, Playwright, Cloudflare SSR smoke, and
    production build.
  - Acceptance: `ACC-OPS-001`

## Phase 1 — Domain model and V1 ingestion

- [x] **P1-001 — Add the D1 Drizzle schema, migrations, and constraints**
  - Includes source records/labels, ingestion cycles/runs, health, locks,
    catalog state, jobs/provenance scaffolding, dedupe candidates/decisions.
  - Acceptance: `ACC-DB-001`
- [x] **P1-002 — Implement shared source-adapter and normalization contracts**
  - Validation, sanitization, hashes, identity, normalized fields, provenance.
  - Acceptance: `ACC-INGEST-001`
- [x] **P1-003 — Implement and test the Remote OK adapter**
  - Deterministic developer admission from title markers plus provider tags;
    description text is never used for admission.
  - Acceptance: `ACC-REMOTEOK-001`, `ACC-REMOTEOK-002`
- [x] **P1-004 — Implement and test the WWR four-feed adapter**
  - Exact allow-list, RSS only, `guid`/listing identity, cross-feed category
    aggregation, safe `Company: Role` parsing.
  - Acceptance: `ACC-WWR-001`, `ACC-WWR-002`
- [x] **P1-005 — Implement scheduled Workflow configuration and run claiming**
  - Direct `0 */12 * * *` Workflow schedule, no public ingestion route or Cron
    handler, idempotent D1 claim/locks.
  - Acceptance: `ACC-WORKFLOW-001`, `ACC-WORKFLOW-002`
- [x] **P1-006 — Implement incremental source upserts and source health**
  - Unchanged observation refresh, bounded summaries, independent flags,
    non-destructive suspension, audit state.
  - Acceptance: `ACC-INGEST-001`, `ACC-INGEST-002`, `ACC-FLAGS-001`
- [x] **P1-007 — Implement complete/partial/failure stale-state safeguards**
  - Two complete missing checks, 72-hour closure, 30-day retention; partial or
    failed provider runs never advance absence.
  - Acceptance: `ACC-PARTIAL-001`, `ACC-STALE-001`
- [x] **P1-008 — Implement cache-epoch and dedupe-candidate foundations**
  - Rotate on successful/partial cycles, retain on failed cycles; deterministic
    unresolved cross-source candidates and auditable Phase 2 decision contract.
  - Acceptance: `ACC-CACHE-001`, `ACC-DEDUPE-001`
- [x] **P1-009 — Add fixture-driven ingestion integration coverage**
  - Full, repeated, cross-feed duplicate, partial, failed, stale, lock, flag,
    and cache-epoch cases.
  - Acceptance: all Phase 1 automated cases
- [x] **P1-010 — Run bounded live development fetches**
  - Remote OK and all four WWR feeds; no raw payload persistence.
  - Acceptance: `ACC-LIVE-001`
- [x] **P1-011 — Pass the full Phase 0–1 validation and acceptance gate**
  - Format, lint, typecheck, unit/integration tests, migration check, production
    build, Cloudflare smoke, Playwright, and tracker synchronization.
  - Acceptance: all critical and relevant cases

## Out of scope for this run

- Phase 2 canonical merge application and DeepSeek calls
- Phase 3 public API/feeds backed by D1
- Phase 4 complete live-catalog website
- Phase 5 executable Agent Skill
- Phase 6 production D1, deployment, schedule activation, or bootstrap run
