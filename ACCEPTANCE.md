# RemoteLens Phase 0–1 Acceptance

Statuses: `Pending`, `Passed`, `Failed`, `Blocked`, `Not Run`, `Not Applicable`.
All test data is sanitized and repository-owned. No production user data or
credentials are required.

## Design and public shell

### ACC-DESIGN-001 — Stitch defines the implementation-ready visual direction

**Priority:** Critical  
**Automation:** Stitch artifact inspection plus documentation review  
**Status:** Passed

**Prerequisites**

- Stitch MCP is connected.
- The RemoteLens product audience, use cases, and visual constraints are known.

**Steps**

1. Open the dedicated RemoteLens Stitch project.
2. Inspect its design system.
3. Inspect responsive concepts for home, browse, job detail, sources/methodology,
   and API/Agent Skill installation.
4. Compare the IDs, tokens, and implementation notes with `docs/design.md`.

**Expected result**

- All five content families have an implementation-ready responsive direction.
- The system is calm, text-first, accessible, editorial, and provenance-led.
- It avoids gradients, glassmorphism, noisy cards, fake urgency, account prompts,
  promoted styling, and opaque match scores.

**Evidence**

- Stitch project/design-system/screen IDs in `docs/design.md`.

**Last result**

- Passed 2026-07-30. Reviewed five desktop and five mobile rendered concepts.
  The selected direction and rejected out-of-scope generated elements are
  recorded in `docs/design.md`.

### ACC-SHELL-001 — Public shell renders through Cloudflare-compatible SSR

**Priority:** Critical  
**Automation:** Playwright and HTTP smoke  
**Status:** Passed

**Prerequisites**

- Dependencies are installed.
- The local production-compatible server is running on its test port.

**Steps**

1. Request `/` directly.
2. Inspect the returned HTML before client hydration.
3. Follow the primary navigation links.
4. Refresh a nested route directly.

**Expected result**

- The shell, navigation, page heading, and primary content are server-rendered.
- Direct nested-route requests and refreshes succeed.
- No account, login, ad, promoted-job, or CV-upload prompt appears.

**Evidence**

- Playwright test and local server smoke output.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-HOME-001 — Home explains the public, local-CV product boundary

**Priority:** Critical  
**Automation:** Playwright  
**Status:** Passed

**Prerequisites**

- The fixture-backed application is running.

**Steps**

1. Open `/`.
2. Read the hero, trust strip, source/freshness explanation, and primary actions.
3. Follow “Browse remote jobs”, “Install the Agent Skill”, and API documentation.

**Expected result**

- The exact product promise is clear: remote jobs, no ads/promotions/login, and
  CV comparison stays local.
- All three actions reach the intended routes.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-JOBS-001 — Structured filters submit as shareable GET URLs

**Priority:** Critical  
**Automation:** Playwright with JavaScript disabled  
**Status:** Passed

**Prerequisites**

- Sanitized fixture jobs exist.

**Steps**

1. Open `/jobs` with JavaScript disabled.
2. Choose exact source, country, employment type, and tag controls.
3. Submit the filter form.
4. Copy and reload the resulting URL.

**Expected result**

- Filters are encoded in the URL and persist after reload.
- SSR results and active-filter summaries match the selected values.
- There is no text, title, description, semantic, or vector search control.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-JOBS-002 — Valid unmatched exact filters return an instructive empty state

**Priority:** High  
**Automation:** Playwright  
**Status:** Passed

**Prerequisites**

- The fixture-backed application is running.

**Steps**

1. Open `/jobs?company=Unknown%20Company`.
2. Inspect the result summary and next action.

**Expected result**

- The page succeeds with zero results.
- The empty state explains which exact filters are active and offers a clear
  filter-reset action.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-JOBS-003 — Malformed fixed filters fail clearly

**Priority:** High  
**Automation:** Vitest and Playwright  
**Status:** Passed

**Prerequisites**

- The fixture-backed application is running.

**Steps**

1. Open `/jobs?country=JAPAN` and `/jobs?source=unknown`.
2. Inspect the validation message and retained filter form.

**Expected result**

- The page presents a specific, accessible `invalid_filter` state.
- Valid-but-unmatched company/tag values remain ordinary empty results.

**Evidence**

- Filter validation unit tests and browser test.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-JOB-001 — Job detail makes provenance and uncertainty visible

**Priority:** Critical  
**Automation:** Playwright  
**Status:** Passed

**Prerequisites**

- A multi-source fixture job exists.

**Steps**

1. Open its permanent `/jobs/:slug` URL.
2. Inspect title, company, eligibility, status, full sanitized description,
   source labels, provenance origins, timestamps, and source destinations.
3. Navigate to a filterable tag and a source listing.

**Expected result**

- Source-stated, parsed, normalized, and unknown information are distinguishable.
- Every source is attributed and conflicting destinations remain visible.
- Non-filterable source labels are not rendered as filter links.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-SOURCES-001 — Sources and methodology disclose policy and freshness

**Priority:** High  
**Automation:** Playwright  
**Status:** Passed

**Prerequisites**

- The fixture-backed application is running.

**Steps**

1. Open `/sources` and `/methodology`.
2. Inspect provider attribution, four-feed WWR allow-list, refresh cadence,
   non-destructive suspension, normalization, dedupe boundary, stale policy,
   and limitations.

**Expected result**

- Source-specific freshness is shown without an invented global freshness claim.
- Remote OK and WWR rules are explicit and no unapproved source appears active.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-DOCS-001 — API and Agent Skill foundation explains read-only/local behavior

**Priority:** High  
**Automation:** Playwright  
**Status:** Passed

**Prerequisites**

- The fixture-backed application is running.

**Steps**

1. Open `/api` and `/skills/install`.
2. Inspect endpoint/filter examples and installation guidance.

**Expected result**

- Documentation describes a public read-only API with structured filters only.
- Agent Skill copy states that CV files stay on the user’s machine and that the
  skill does not scrape source pages or mutate tracking state.
- Unimplemented later-phase commands are clearly labeled as previews.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-A11Y-001 — Primary flows are keyboard and screen-reader oriented

**Priority:** Critical  
**Automation:** Playwright plus axe  
**Status:** Passed

**Prerequisites**

- The fixture-backed application is running.

**Steps**

1. Navigate the header, filters, result rows, and footer with the keyboard.
2. Use the skip link.
3. Inspect labels, heading order, landmarks, focus rings, and status messages.
4. Run automated WCAG checks on the critical routes.

**Expected result**

- All controls are reachable with visible focus and at least 44px touch targets.
- The skip link moves focus to main content.
- Controls have persistent labels and status/error text is programmatically
  associated.
- Automated checks report no serious or critical violations.

**Evidence**

- Playwright/axe report and screenshots.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-RESP-001 — Critical routes adapt at mobile and desktop widths

**Priority:** Critical  
**Automation:** Playwright screenshots and assertions  
**Status:** Passed

**Prerequisites**

- The fixture-backed application is running.

**Steps**

1. Open home, jobs, job detail, sources, and docs at 390×844 and 1440×1000.
2. Inspect navigation, filters, content order, overflow, clipping, and touch
   targets.

**Expected result**

- No horizontal page overflow, overlap, or clipped controls exists.
- Critical filtering and provenance content remains available on mobile.
- Layout adapts rather than merely shrinking.

**Evidence**

- Playwright screenshots under `test-results/`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

## Operations and security

### ACC-OPS-001 — Documented local checks and production build succeed

**Priority:** Critical  
**Automation:** CLI  
**Status:** Passed

**Steps**

1. Install with the documented pnpm command.
2. Run format check, lint, typecheck, unit/integration tests, migration check,
   Playwright tests, and production build.
3. Start the Cloudflare-compatible local build on an isolated port and request
   critical routes.
4. Stop the exact process and verify its port is free.

**Expected result**

- Every required command exits successfully.
- The server starts without production credentials.
- No task-owned process remains running.

**Evidence**

- Commands and results in `WORKLOG.md`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-SEC-001 — Public surface is read-only and hardened

**Priority:** Critical  
**Automation:** Vitest and HTTP smoke  
**Status:** Passed

**Steps**

1. Inspect routes and Worker exports.
2. Request public pages with GET/HEAD and try unsupported mutation methods.
3. Inspect security headers and source HTML rendering.

**Expected result**

- No ingestion, account, CV upload, or mutation endpoint exists.
- Security headers are present.
- Source HTML is sanitized and source scripts cannot execute.

**Evidence**

- Security unit tests and HTTP smoke.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

## D1 and ingestion

### ACC-DB-001 — Initial D1 migration is complete and repeatable

**Priority:** Critical  
**Automation:** Wrangler/D1 migration check  
**Status:** Passed

**Steps**

1. Apply migrations to a disposable local D1 database.
2. Inspect tables, indexes, foreign keys, uniqueness constraints, and seed
   catalog-state row.
3. Re-run the migration command.

**Expected result**

- The schema supports Phase 1 records, runs, locks, health, audit decisions, and
  cache epoch.
- Stable source-local identities cannot duplicate.
- Re-running migration tooling is safe.

**Evidence**

- Migration validation command and schema assertions.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-REMOTEOK-001 — Remote OK admits only deterministic developer jobs

**Priority:** Critical  
**Automation:** Vitest fixture contract  
**Status:** Passed

**Steps**

1. Parse accepted, ambiguous, malformed, and non-developer fixtures.
2. Compare results with the versioned title-marker and provider-tag allow-lists.

**Expected result**

- Admission requires both a positive developer title marker and a qualifying
  provider tag.
- Generic `engineer`, description wording, and ambiguous roles do not admit a
  job; known non-developer markers reject it.

**Evidence**

- Remote OK adapter tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-REMOTEOK-002 — Remote OK output is sanitized and attributable

**Priority:** Critical  
**Automation:** Vitest fixture contract  
**Status:** Passed

**Steps**

1. Normalize an accepted fixture containing HTML and mixed labels.
2. Inspect the normalized record and retained labels.

**Expected result**

- Full permitted description content is retained in sanitized HTML and text.
- Scripts/event attributes are removed.
- Source identity, listing URL, attribution, raw values, filterable labels, and
  provenance-only labels are preserved.

**Evidence**

- Remote OK adapter tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-WWR-001 — Only the approved four WWR programming feeds are configured

**Priority:** Critical  
**Automation:** Vitest configuration contract  
**Status:** Passed

**Steps**

1. Inspect configured feed URLs.
2. Parse sanitized responses from every configured feed.

**Expected result**

- Exactly four approved programming RSS endpoints are configured.
- DevOps/Sysadmin and auto-discovered feeds are absent.
- The adapter reads RSS only and attributes WWR.

**Evidence**

- WWR adapter tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-WWR-002 — Repeated WWR listings collapse by local identity

**Priority:** Critical  
**Automation:** Vitest fixture contract  
**Status:** Passed

**Steps**

1. Parse one listing appearing in multiple approved feed fixtures.
2. Normalize the provider result.

**Expected result**

- Exactly one WWR source record is produced from the shared `guid`/listing URL.
- Every observed upstream category is retained as a source tag.
- `rawTitle` is preserved and `Company: Role` is split only when safe.

**Evidence**

- WWR adapter tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-WORKFLOW-001 — Workflow is scheduled directly every 12 hours

**Priority:** Critical  
**Automation:** Wrangler config validation and unit test  
**Status:** Passed

**Steps**

1. Validate `wrangler.jsonc` with the installed Wrangler schema.
2. Inspect the Worker exports and route tree.

**Expected result**

- `CATALOG_INGESTION` binds the Workflow class with schedule `0 */12 * * *`.
- There is no `scheduled()` Cron handler and no public ingestion route.

**Evidence**

- Configuration test and Wrangler validation output.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-WORKFLOW-002 — Cycle and provider claims prevent overlapping work

**Priority:** Critical  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Claim a deterministic cycle/provider lock.
2. Attempt the same and overlapping claims.
3. Expire the fixture lock and retry.

**Expected result**

- Duplicate active work is rejected idempotently.
- The original run remains auditable.
- Only an expired, validated lock can be reclaimed.

**Evidence**

- Ingestion integration tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-INGEST-001 — Re-running identical source payloads is idempotent

**Priority:** Critical  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Ingest sanitized Remote OK and WWR fixtures.
2. Ingest the same payloads again at a later observation time.
3. Query source records and run summaries.

**Expected result**

- No duplicate source record is created.
- Unchanged records refresh `lastSeenAt`/`lastCheckedAt` and reset missing state.
- The second run reports unchanged observations rather than inserts.

**Evidence**

- Ingestion integration tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-INGEST-002 — Source health stores bounded, non-sensitive evidence

**Priority:** High  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Run successful, partial, and failed fixture cycles.
2. Inspect source-health and run records.

**Expected result**

- Counts, timestamps, status codes, hashes, and bounded errors are retained.
- Raw live payloads, unsanitized HTML, CV data, and prompt transcripts are not
  stored.

**Evidence**

- Ingestion integration tests and schema inspection.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-PARTIAL-001 — Partial WWR runs never advance absence

**Priority:** Critical  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Seed a WWR record from a complete fixture run.
2. Run another cycle where one configured WWR feed fails and the record is not
   present in successful feeds.
3. Inspect its missing count and status.

**Expected result**

- The WWR run and overall cycle are partial.
- Successful feed updates remain.
- The record’s missing count/status does not advance.
- The live cache epoch rotates.

**Evidence**

- Ingestion integration tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-STALE-001 — Missing, closure, and retention transitions are conservative

**Priority:** Critical  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Seed a source record.
2. Execute two complete successful provider checks where it is absent.
3. Advance the fixture clock beyond 72 hours and run another complete check.
4. Advance beyond 30 closed days and run cleanup.
5. Repeat with failed and partial checks.

**Expected result**

- One complete omission does not mark missing.
- Two complete omissions mark missing.
- Closure occurs only after a complete check beyond 72 hours.
- Closed records retain for 30 days, then delete.
- Failed/partial checks never advance absence or retention transitions.

**Evidence**

- Ingestion integration tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-FLAGS-001 — Provider suspension is independent and non-destructive

**Priority:** Critical  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Seed records from both providers.
2. Disable WWR while leaving Remote OK enabled.
3. Run the fixture cycle and inspect records/health.
4. Re-enable WWR.

**Expected result**

- WWR is skipped/suspended without closing or deleting its records.
- Remote OK continues independently.
- Re-enablement can observe the existing WWR identities again.

**Evidence**

- Ingestion integration tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-CACHE-001 — Cache epoch follows cycle outcome

**Priority:** Critical  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Record the cache epoch.
2. Complete successful, partial, and fully failed fixture cycles in sequence.

**Expected result**

- Successful and partial cycles each rotate the epoch after completion.
- A fully failed cycle preserves the previous epoch.

**Evidence**

- Ingestion integration tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-DEDUPE-001 — Cross-source candidate records are deterministic and auditable

**Priority:** High  
**Automation:** Vitest integration test  
**Status:** Passed

**Steps**

1. Ingest two cross-source fixtures that share deterministic candidate evidence.
2. Re-ingest unchanged fixtures.
3. Inspect candidate and decision schema behavior.

**Expected result**

- One stable unresolved candidate is recorded without merging source records.
- Re-ingestion does not duplicate the candidate.
- The append-only decision contract supports `merge`, `separate`, `uncertain`,
  and failed semantic outcomes with model/input/audit metadata.
- Phase 1 performs no DeepSeek call or canonical merge application.

**Evidence**

- Ingestion integration tests and schema tests.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.

### ACC-LIVE-001 — Bounded live development fetches normalize both providers

**Priority:** Critical  
**Automation:** Explicit integration command with network access  
**Status:** Passed

**Prerequisites**

- Network access to the two public providers.
- No production D1 or production schedule is bound.

**Steps**

1. Fetch Remote OK once with a clear user agent and timeout.
2. Fetch each of the four approved WWR RSS feeds once with bounded concurrency.
3. Parse and normalize in memory.
4. Record counts, hashes, response metadata, and bounded errors only.

**Expected result**

- Both providers yield normalized developer-job records.
- WWR local identity aggregates cross-feed duplicates.
- No raw payload file, R2 object, secret, or production data is created.

**Evidence**

- Timestamped, bounded output recorded in `WORKLOG.md`.

**Last result**

- Passed 2026-07-30. See `WORKLOG.md` for command results and evidence paths.
