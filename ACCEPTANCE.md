# RemoteLens Acceptance

Statuses: `Pending`, `Passed`, `Failed`, `Blocked`, `Not Run`, `Not Applicable`.
All test data is sanitized and repository-owned. No production user data or
credentials are required.

## Design and public shell

### ACC-DESIGN-001 — Stitch defines the implementation-ready visual direction

**Priority:** Critical<br>
**Automation:** Stitch artifact inspection plus documentation review<br>
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

**Priority:** Critical<br>
**Automation:** Playwright and HTTP smoke<br>
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

**Priority:** Critical<br>
**Automation:** Playwright<br>
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

**Priority:** Critical<br>
**Automation:** Playwright with JavaScript disabled<br>
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

**Priority:** High<br>
**Automation:** Playwright<br>
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

**Priority:** High<br>
**Automation:** Vitest and Playwright<br>
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

**Priority:** Critical<br>
**Automation:** Playwright<br>
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

**Priority:** High<br>
**Automation:** Playwright<br>
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

**Priority:** High<br>
**Automation:** Playwright<br>
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

**Priority:** Critical<br>
**Automation:** Playwright plus axe<br>
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

**Priority:** Critical<br>
**Automation:** Playwright screenshots and assertions<br>
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

**Priority:** Critical<br>
**Automation:** CLI<br>
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

**Priority:** Critical<br>
**Automation:** Vitest and HTTP smoke<br>
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

**Priority:** Critical<br>
**Automation:** Wrangler/D1 migration check<br>
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

**Priority:** Critical<br>
**Automation:** Vitest fixture contract<br>
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

**Priority:** Critical<br>
**Automation:** Vitest fixture contract<br>
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

**Priority:** Critical<br>
**Automation:** Vitest configuration contract<br>
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

**Priority:** Critical<br>
**Automation:** Vitest fixture contract<br>
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

**Priority:** Critical<br>
**Automation:** Wrangler config validation and unit test<br>
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

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
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

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
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

**Priority:** High<br>
**Automation:** Vitest integration test<br>
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

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
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

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
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

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
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

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
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

**Priority:** High<br>
**Automation:** Vitest integration test<br>
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

**Priority:** Critical<br>
**Automation:** Explicit integration command with network access<br>
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

## Operator-directed Cloudflare setup

### ACC-CF-SECRETS-001 — Remote Worker contains the requested encrypted secrets

**Priority:** Critical<br>
**Automation:** Wrangler CLI readback<br>
**Status:** Passed

**Prerequisites**

- Wrangler is authenticated to the Hutong531 Cloudflare account.
- `.dev.vars` contains all requested non-empty values and remains gitignored.

**Steps**

1. Target account `d06a8c795d2fd2c7718ed48c534dc2ba`.
2. Upload `.dev.vars` with Wrangler's bulk-secret command.
3. List remote Worker secrets without reading their values.
4. Inspect the resulting remote Worker deployments.

**Expected result**

- Worker `remotelens` exists in the selected account.
- `DEEPSEEK_API_KEY`, `DEEPSEEK_API_BASE_URL`, `DEEPSEEK_API_MODEL`, and
  `API_CURSOR_SECRET` exist as `secret_text`.
- No secret value appears in repository configuration, trackers, or command
  output.

**Evidence**

- `wrangler secret list` remote name/type readback.
- `wrangler deployments list` version readback.

**Last result**

- Passed 2026-07-31. Four requested secrets were created and verified by name
  and type. Cloudflare automatically created the initial Worker deployment and
  a subsequent secret-change version.

## Phase 2 — Canonical jobs and deduplication

### ACC-DB-002 — Canonical schema supports public fields and provenance

**Priority:** Critical<br>
**Automation:** Migration assertion<br>
**Status:** Passed

**Prerequisites**

- The repository migrations are available.

**Steps**

1. Apply all migrations to a disposable local D1 database.
2. Inspect canonical job columns, job tags, field provenance, dedupe decisions,
   and the relevant indexes.
3. Reapply migrations.

**Expected result**

- Canonical jobs expose stable IDs/slugs, structured fields, lifecycle fields,
  and serialized eligibility/timezone data.
- Tags and field origins are queryable without raw feed payload storage.
- A second migration application is a no-op.

**Evidence**

- `tests/migrations/schema.test.ts` and migration command output.

**Last result**

- Passed 2026-07-31. `pnpm db:migrate:check` passed 4/4 migration assertions,
  including canonical columns, tags, field provenance, indexes, constraints,
  and raw-payload absence. The canonical migration applied cleanly in the
  integration database.

### ACC-INGEST-003 — Canonical field derivation is deterministic and honest

**Priority:** High<br>
**Automation:** Vitest integration test<br>
**Status:** Passed

**Prerequisites**

- Sanitized source records with structured and incomplete evidence are loaded.

**Steps**

1. Rebuild canonical jobs from the same source records twice.
2. Inspect normalized fields, serialized eligibility arrays, unknown values,
   canonical IDs, and slugs.

**Expected result**

- The same source evidence yields the same canonical ID and slug on every
  rebuild.
- Parsed and normalized values are distinct from source-stated values.
- Missing evidence remains unknown or null and is never guessed.

**Evidence**

- `tests/integration/canonical-jobs.test.ts`.

**Last result**

- Passed 2026-07-31 with the canonical rebuild and repeatability assertions.

### ACC-CANONICAL-001 — Cross-source duplicates become one canonical job

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
**Status:** Passed

**Prerequisites**

- Sanitized Remote OK and WWR duplicate fixtures exist.

**Steps**

1. Ingest the two source records with the same normalized company and title.
2. Resolve deterministic dedupe candidates.
3. Rebuild canonical jobs.
4. Read the canonical job and its provenance.

**Expected result**

- Exactly one canonical job represents both source records.
- The source listing URLs, provider labels, and source-specific timestamps remain
  visible.
- A `merge` decision records its reason, input hash, schema version, and time.

**Evidence**

- Canonicalization integration test and D1 rows.

**Last result**

- Passed 2026-07-31 in `tests/integration/canonical-jobs.test.ts`. Two exact
  cross-provider records produced one canonical job, two source associations,
  deterministic merge evidence, stable identity, and visible provenance.

### ACC-CANONICAL-002 — Non-duplicates and unknown fields remain honest

**Priority:** High<br>
**Automation:** Vitest integration test<br>
**Status:** Passed

**Prerequisites**

- Two same-company jobs with materially different titles and one record with
  incomplete eligibility data.

**Steps**

1. Ingest the records.
2. Run dedupe candidate evaluation and canonical rebuild.
3. Inspect jobs, field values, and provenance.

**Expected result**

- Distinct jobs remain separate with a recorded `separate` or no-match outcome.
- Missing salary, timezone, visa, or travel values remain `unknown`/null.
- Parsed and normalized fields identify their origin rather than appearing as
  source-stated facts.

**Evidence**

- Canonical field-selection and dedupe tests.

**Last result**

- Passed 2026-07-31 in `tests/integration/canonical-jobs.test.ts`. A materially
  different same-company role remained separate; missing structured values stay
  null or `unknown`; parsed and normalized fields retain explicit origins.

### ACC-CANONICAL-003 — Semantic dedupe is narrow, bounded, and auditable

**Priority:** High<br>
**Automation:** Vitest contract test with mocked DeepSeek response<br>
**Status:** Passed

**Prerequisites**

- An unresolved cross-source candidate and a mocked OpenAI-compatible response.

**Steps**

1. Submit a candidate to the semantic decision helper.
2. Return each supported outcome: `merge`, `separate`, `uncertain`, and failure.
3. Inspect the D1 decision rows and per-run limit.

**Expected result**

- Only unresolved cross-source candidates are sent.
- The helper sends at most 50 candidates per run and validates structured JSON.
- The CV, source HTML, and public search path are never sent to DeepSeek.
- Every outcome records model, input hash, schema version, error state, and time.

**Evidence**

- Semantic dedupe contract test.

**Last result**

- Passed 2026-07-31 in `tests/integration/canonical-jobs.test.ts`. Mocked
  OpenAI-compatible responses covered `merge`, `separate`, `uncertain`, and
  retry failure; decisions stored model, input hash, schema version, error, and
  timestamp; a 51-candidate run sent exactly 50 requests; only sanitized job
  text was included.

### ACC-DEDUPE-002 — Canonical decisions and rebuilds are repeatable

**Priority:** High<br>
**Automation:** Vitest integration test<br>
**Status:** Passed

**Prerequisites**

- Deterministic duplicate and non-duplicate source records exist.

**Steps**

1. Resolve the deterministic candidate set.
2. Rebuild the canonical catalog twice without changing source evidence.
3. Compare canonical IDs, slugs, source associations, and decision rows.

**Expected result**

- Canonical identity and source associations remain stable across rebuilds.
- The append-only decision evidence remains auditable and no unresolved exact
  duplicate is reintroduced.

**Evidence**

- `tests/integration/canonical-jobs.test.ts`.

**Last result**

- Passed 2026-07-31 with stable-ID, stable-slug, and decision assertions.

### ACC-CANONICAL-004 — Canonical lifecycle follows source evidence

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
**Status:** Passed

**Prerequisites**

- A canonical job with two source records and controlled timestamps.

**Steps**

1. Omit one provider record in a complete run.
2. Run a partial provider cycle.
3. Close one source after the documented thresholds.
4. Disable and re-enable one provider.

**Expected result**

- Partial/failed runs do not advance absence.
- A canonical job remains active while any enabled active source remains.
- Stale/closed state and 30-day source retention are reflected without deleting
  provenance prematurely.
- Provider suspension hides source-only jobs without mass-closing or deleting
  retained source records.

**Evidence**

- Lifecycle and suspension integration tests.

**Last result**

- Passed 2026-07-31 in the canonical lifecycle integration test and existing
  catalog lifecycle tests. A merged job stayed active while one source was
  active, became stale/closed as sources transitioned, and a suspended WWR-only
  job was hidden while its active source row remained retained.

### ACC-FLAGS-002 — Canonical visibility follows independent provider flags

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
**Status:** Passed

**Prerequisites**

- A canonical job backed only by WWR and an enabled source-health row exist.

**Steps**

1. Query active canonical jobs while WWR is enabled.
2. Set WWR to suspended without deleting source records.
3. Query active canonical jobs again and inspect the retained source row.

**Expected result**

- The WWR-only job is visible before suspension and withheld during suspension.
- The source record remains active and retained for recovery.

**Evidence**

- `tests/integration/canonical-jobs.test.ts` and
  `tests/integration/catalog-engine.test.ts`.

**Last result**

- Passed 2026-07-31.

### ACC-STALE-002 — Canonical stale and closed states preserve source history

**Priority:** Critical<br>
**Automation:** Vitest integration test<br>
**Status:** Passed

**Prerequisites**

- A canonical job with controlled source timestamps exists.

**Steps**

1. Transition a source to missing and rebuild the canonical catalog.
2. Transition it to closed and rebuild again.
3. Inspect the canonical status and retained provenance/source rows.

**Expected result**

- Canonical state reflects active, stale, and closed source evidence.
- Closure does not erase source history before the retention policy allows it.

**Evidence**

- `tests/integration/canonical-jobs.test.ts` and
  `tests/integration/catalog-engine.test.ts`.

**Last result**

- Passed 2026-07-31.

## Phase 3 — Public API and feeds

### ACC-API-001 — Job list filters and cursor pagination are exact

**Priority:** Critical<br>
**Automation:** Vitest plus direct HTTP contract test<br>
**Status:** Passed

**Prerequisites**

- A disposable catalog contains active, stale, closed, duplicate, and
  multi-source jobs.

**Steps**

1. Request `/api/v1/jobs` with no filters.
2. Request exact company, source, country, tag, role-family, salary, date, and
   status filters.
3. Follow `meta.next_cursor` with the same contract.
4. Reuse the cursor with a changed filter and with a changed sort.

**Expected result**

- The default is active jobs with a maximum of 25 results.
- Exact filters never fall back to substring, title, description, semantic, or
  vector search.
- Cursor pagination is deterministic and the changed-contract cursor is a
  stable `invalid_cursor` `400` response.
- `country=JP` honors explicit eligibility, worldwide inclusion, exclusions,
  and omission of unspecified jobs.

**Evidence**

- API contract tests and HTTP response captures.

**Last result**

- Passed 2026-07-31. `tests/api/public-api.test.ts` covers exact company/source/tag,
  Japan eligibility, same-currency salary, date/status defaults, deterministic
  cursors, changed-filter and changed-sort rejection, and empty exact matches.
  The local Wrangler Worker smoke returned `200` with a signed cursor for
  `/api/v1/jobs?limit=1`.

### ACC-API-002 — Job detail returns full evidence and conflicts

**Priority:** Critical<br>
**Automation:** Direct HTTP contract test<br>
**Status:** Passed

**Prerequisites**

- A multi-source canonical job exists.

**Steps**

1. Request `/api/v1/jobs/:id`.
2. Inspect canonical fields, sanitized description, source records, field
   provenance, conflicts, and tags.

**Expected result**

- The detail response validates against the documented schema.
- Every source destination and important field origin is retained.
- Unsafe source HTML and internal database-only fields are not exposed.

**Evidence**

- API schema test and response fixture.

**Last result**

- Passed 2026-07-31. The direct contract test validates the multi-source Kumo
  detail response against `ApiJobDetailSchema`, including sanitized HTML/text,
  source records, field provenance, conflicts, and tags.

### ACC-API-003 — Taxonomy, metadata, and feeds are public and consistent

**Priority:** High<br>
**Automation:** Direct HTTP contract test<br>
**Status:** Passed

**Prerequisites**

- The catalog has completed at least one refresh.

**Steps**

1. Request `/api/v1/taxonomy`, `/api/v1/meta`, `/feeds/jobs.json`, and
   `/feeds/jobs.xml`.
2. Compare statuses, provider health, active counts, cache epoch, and feed
   items with the catalog.

**Expected result**

- Taxonomy contains fixed filter vocabularies but no result-derived tag or
  company directory.
- Metadata reports provider-specific freshness and cycle state.
- Feeds contain active compact summaries only and preserve attribution.

**Evidence**

- API/feed contract tests.

**Last result**

- Passed 2026-07-31. Taxonomy and metadata schemas, active-only JSON, RSS, and
  OpenAPI responses pass the direct contract test; Wrangler HTTP smoke returned
  `200` for the feeds and `/api/openapi.json`.

### ACC-API-004 — Invalid filters, CORS, methods, and rate errors are stable

**Priority:** High<br>
**Automation:** Direct HTTP contract test<br>
**Status:** Passed

**Prerequisites**

- The API server is running.

**Steps**

1. Send malformed enum, country, timezone, salary, source, and cursor values.
2. Send public GET/HEAD and OPTIONS requests with an Origin header.
3. Send a mutation request to an API endpoint.
4. Exercise the configured per-IP limit with a test limit override.

**Expected result**

- Malformed input returns an accessible stable `invalid_filter` or
  `invalid_cursor` `400` envelope; valid unknown company/tag returns `200` with
  an empty data array.
- GET/HEAD responses expose public CORS and cache headers; mutations return
  `405` with an allow list.
- The rate guard returns a stable `429` envelope and `Retry-After` without
  caching the error.

**Evidence**

- API security/rate tests.

**Last result**

- Passed 2026-07-31. Invalid country/source/timezone/salary/cursor inputs return
  stable `400` envelopes; GET/HEAD/OPTIONS CORS and read-only `405` boundaries
  pass; the mocked edge limiter returns uncached `429` with `Retry-After: 60`.
  Wrangler smoke confirmed real `204` preflight and `405` mutation behavior.

### ACC-API-005 — OpenAPI documents the shipped read-only contract

**Priority:** High<br>
**Automation:** OpenAPI schema test<br>
**Status:** Passed

**Prerequisites**

- The OpenAPI document is generated or maintained in the repository.

**Steps**

1. Request the OpenAPI JSON document.
2. Validate its paths, parameters, error envelopes, and response schemas.

**Expected result**

- Every shipped API and feed route is documented.
- The contract contains no `q`, FTS, CV upload, account, or mutation endpoint.

**Evidence**

- OpenAPI validation test and `docs/openapi.json`.

**Last result**

- Passed 2026-07-31. `docs/openapi.json` and the served document contain all
  shipped API/feed paths, structured parameters, response/error references, and
  no generic `q`, CV upload, account, or mutation endpoint.

## Phase 4 — Live public SSR website

### ACC-WEB-001 — Public SSR reads the canonical catalog

**Priority:** Critical<br>
**Automation:** Playwright plus HTTP smoke<br>
**Status:** Passed

**Prerequisites**

- A local or production-compatible D1 catalog contains canonical jobs.

**Steps**

1. Request `/`, `/jobs`, and a canonical `/jobs/:slug` directly.
2. Inspect the response HTML before hydration.
3. Follow navigation and refresh the nested route.

**Expected result**

- Canonical job data and provenance are server-rendered from the catalog.
- Direct nested routes and refresh succeed without an account or CV prompt.
- An explicitly empty local catalog uses only the documented sanitized fixture
  fallback and production never silently fabricates tenant/user state.

**Evidence**

- Playwright route test and HTML smoke output.

**Last result**

- Passed 2026-07-31. A local Wrangler Worker seeded with the disposable live
  catalog rendered SSR home, browse, and canonical detail routes, including
  direct nested-route refresh. The external live-catalog Playwright run passed
  3 tests.

### ACC-WEB-002 — Live structured filters work without JavaScript

**Priority:** Critical<br>
**Automation:** Playwright with JavaScript disabled<br>
**Status:** Passed

**Prerequisites**

- Canonical jobs with different exact fields exist.

**Steps**

1. Open `/jobs` with JavaScript disabled.
2. Submit country, source, employment, role, and tag filters.
3. Copy and reload the resulting URL.

**Expected result**

- The URL is shareable and the server-rendered result count and active-filter
  summary remain stable after reload.
- Empty and malformed filter states remain distinct and accessible.

**Evidence**

- `tests/e2e` browser evidence.

**Last result**

- Passed 2026-07-31. JavaScript-disabled Playwright coverage submitted exact
  country, source, employment, role-family, and tag filters; shareable URLs,
  reloads, empty results, and malformed-filter states remained distinct.

### ACC-WEB-003 — Detail pages show provenance, conflicts, freshness, and SEO

**Priority:** High<br>
**Automation:** Playwright assertions<br>
**Status:** Passed

**Prerequisites**

- A multi-source job and source health records exist.

**Steps**

1. Open the job detail, sources, methodology, and API pages.
2. Inspect titles, descriptions, timestamps, source links, conflict notices,
   field-origin badges, and provider-specific freshness.

**Expected result**

- Source-stated, parsed, normalized, and unknown values are distinct.
- SEO metadata uses canonical job identity and closed jobs are not presented as
  active.
- No promoted styling, opaque rank, account prompt, or generic search appears.

**Evidence**

- Browser assertions and response head inspection.

**Last result**

- Passed 2026-07-31. Assertions verified source destinations, preserved
  conflicts, field origins, provider-specific freshness, canonical metadata,
  and noindex behavior for stale/closed jobs.

### ACC-WEB-004 — Website error and empty states are safe

**Priority:** High<br>
**Automation:** Playwright/HTTP test<br>
**Status:** Passed

**Prerequisites**

- The test can exercise an empty catalog and a controlled D1 read failure.

**Steps**

1. Open an unmatched exact filter.
2. Open a missing job slug.
3. Exercise the catalog-unavailable path.

**Expected result**

- Empty results explain the exact constraint and offer reset navigation.
- Missing jobs return a normal not-found response.
- Catalog failures expose a bounded retry-safe message and no SQL, secret, or
  source payload details.

**Evidence**

- Browser and HTTP failure-case output.

**Last result**

- Passed 2026-07-31. Empty, not-found, and controlled unavailable-catalog paths
  returned bounded retry-safe states without SQL, secret, or raw source payload
  leakage.

### ACC-WEB-005 — Documentation reflects shipped API and Skill behavior

**Priority:** High<br>
**Automation:** Playwright plus text contract test<br>
**Status:** Passed

**Prerequisites**

- Phase 3 and Phase 5 packages are present.

**Steps**

1. Open `/api` and `/skills/install`.
2. Compare installation commands, endpoint examples, privacy statements, and
   preview labels with the repository package.

**Expected result**

- Shipped endpoints and install paths are described as live behavior.
- The docs state that CV files remain local and that job descriptions are
  untrusted data.
- No stale Phase 3/5 preview claim remains.

**Evidence**

- Documentation browser test.

**Last result**

- Passed 2026-07-31. `/api` and `/skills/install` describe the shipped live API,
  installation package, structured limits, local-CV boundary, and untrusted
  job-content policy without stale preview claims.

### ACC-WEB-006 — Responsive and accessibility regressions remain absent

**Priority:** Critical<br>
**Automation:** Playwright plus axe<br>
**Status:** Passed

**Prerequisites**

- The production-compatible preview server is running.

**Steps**

1. Exercise critical routes at 390×844 and 1440×1000.
2. Use the skip link, keyboard filters, result links, and source controls.
3. Run axe and inspect overflow, clipping, focus, headings, and status text.

**Expected result**

- No serious or critical axe violations, horizontal overflow, hidden focus, or
  unreachable critical content exists.

**Evidence**

- Playwright reports and screenshots.

**Last result**

- Passed 2026-07-31. Desktop/mobile Playwright coverage, JavaScript-disabled
  flows, keyboard/focus checks, and axe checks passed with no serious or
  critical violations; the external live-catalog run passed 3 tests.

## Phase 5 — RemoteLens Agent Skill

### ACC-SKILL-001 — Skill package contains the required local-only contract

**Priority:** Critical<br>
**Automation:** File contract test<br>
**Status:** Passed

**Prerequisites**

- `skills/remotelens/` exists.

**Steps**

1. Inspect `SKILL.md`, all required references, and the example config.
2. Check the documented API base, local CV path, limits, and final-review rules.

**Expected result**

- The package is independently readable by Codex, Claude Code, and a generic
  `SKILL.md`-compatible agent.
- It reads only an explicitly selected local CV, queries only the public API,
  and never uploads CV text, scrapes source pages, mutates trackers, or submits
  applications.

**Evidence**

- Skill package contract test.

**Last result**

- Passed 2026-07-31. The repository-owned package contains `SKILL.md`, API,
  matching, CV-safety, client-local workflow references, and example
  configuration; the contract test passed.

### ACC-SKILL-002 — Installation and configuration instructions are copyable

**Priority:** High<br>
**Automation:** Markdown command/text test<br>
**Status:** Passed

**Prerequisites**

- The repository package and public install page are present.

**Steps**

1. Follow the Codex installation instructions using a temporary local target.
2. Inspect the Claude Code and generic-agent instructions.
3. Validate the YAML example against the documented configuration contract.

**Expected result**

- Instructions use repository-owned files or a clearly labeled source checkout;
  they do not claim a nonexistent registry package.
- Configuration includes an explicit API URL and selected CV path without
  requiring a private RemoteLens key.

**Evidence**

- Skill documentation test.

**Last result**

- Passed 2026-07-31. Copyable Codex, Claude Code, and generic-agent setup
  instructions were verified without inventing a package registry or requiring
  a private RemoteLens key.

### ACC-SKILL-003 — Matching output is evidence-based and explainable

**Priority:** Critical<br>
**Automation:** Deterministic helper/contract test<br>
**Status:** Passed

**Prerequisites**

- A temporary CV fixture and API job fixtures exist.

**Steps**

1. Read the explicitly selected CV fixture locally.
2. Evaluate returned jobs against structured requirements.
3. Produce a recommendation for a strong, possible, weak, ineligible, and
   insufficient-information case.

**Expected result**

- Output cites job IDs/source URLs and separates evidence, gaps, uncertainty,
  and next actions.
- It never invents employers, dates, skills, qualifications, or certainty.

**Evidence**

- Matching policy test and sample outputs.

**Last result**

- Passed 2026-07-31. Deterministic matching tests passed for strong, possible,
  weak, ineligible, and insufficient-information cases with source URL
  citations and no opaque scores.

### ACC-SKILL-004 — Prompt-injection content is treated as untrusted

**Priority:** Critical<br>
**Automation:** Safety test<br>
**Status:** Passed

**Prerequisites**

- CV and job-description fixtures contain instruction-like text.

**Steps**

1. Run the skill workflow on the fixtures.
2. Inspect file access, network requests, shell execution, and output.

**Expected result**

- Instructions inside a CV or job description are quoted as untrusted content,
  never followed as agent commands.
- No recursive home-directory scan, shell interpolation, external CV upload,
  tracker mutation, or application submission occurs.

**Evidence**

- Prompt-injection safety test logs.

**Last result**

- Passed 2026-07-31. Safety tests verified selected-file-only reads,
  prompt-injection refusal as untrusted data, no CV upload, no scraping, no
  tracker mutation, and no application submission.

## Phase 6 — Production deployment and hardening

### ACC-PROD-001 — Production D1 exists and all migrations are applied

**Priority:** Critical<br>
**Automation:** Wrangler CLI readback<br>
**Status:** Passed

**Prerequisites**

- Wrangler is authenticated to the Hutong531 account.

**Steps**

1. Create or identify the `remotelens-catalog` D1 database.
2. Update only the binding ID in `wrangler.jsonc`.
3. Apply all migrations remotely.
4. List migration state and inspect schema metadata without printing secrets.

**Expected result**

- The Worker binds to the intended non-placeholder D1 database.
- All repository migrations are applied exactly once.
- No raw payload/archive table or secret value exists in the database or config.

**Evidence**

- Wrangler D1 list/migration output and safe schema readback.

**Last result**

- Passed 2026-07-31. Created `remotelens-catalog` in APAC with database ID
  `64a296b6-d6d0-4e11-8b3a-4145018c03c4`, applied
  `0000_complex_changeling.sql` and `0001_canonical_jobs.sql` remotely, and
  verified both migration rows, the expected schema/indexes, no raw-payload
  table, and zero pre-bootstrap source/job/cycle rows.

### ACC-PROD-002 — Validated Worker deploys with Workflow schedule

**Priority:** Critical<br>
**Automation:** Wrangler deploy/dry-run readback<br>
**Status:** Passed

**Prerequisites**

- Phase 2–5 validation gates pass.

**Steps**

1. Verify Cloudflare authentication and account ID.
2. Run the production dry-run.
3. Deploy the Worker.
4. Inspect deployment metadata and Workflow configuration.

**Expected result**

- The deployed Worker serves the validated application and binds `DB` and
  `CATALOG_INGESTION`.
- The direct `0 */12 * * *` Workflow schedule is present.
- Security headers and observability remain enabled.

**Evidence**

- Dry-run, deploy, and deployment-list output.

**Last result**

- Passed 2026-07-31. `pnpm cf:prod-dry-run` resolved the production D1,
  `CatalogIngestionWorkflow`, direct `0 */12 * * *` schedule, both providers,
  observability, production URLs, and the `120 requests/60s` rate-limit binding.
  `wrangler deployments list` confirmed the final application deployment
  `e4df130f-027e-4309-beb0-17aaadc02255` at 100% traffic. The user authorized
  reuse of the existing DeepSeek key and confirmed rate-limit namespace `1001`;
  neither secret value nor key material is stored in this repository or output.

### ACC-PROD-003 — Production public endpoints are available before bootstrap

**Priority:** High<br>
**Automation:** HTTP smoke<br>
**Status:** Passed

**Prerequisites**

- The Worker is deployed.

**Steps**

1. Request the production home, API documentation, `/api/v1/meta`, and
   `/api/v1/jobs` endpoints.
2. Inspect status codes, security/CORS/cache headers, and bounded empty-catalog
   metadata.

**Expected result**

- Public reads remain available before the first catalog refresh.
- The site does not claim a global freshness value or fabricate jobs.

**Evidence**

- Curls/HTTP captures with response bodies reviewed for secret leakage.

**Last result**

- Passed 2026-07-31. Production home, API documentation, `/api/v1/meta`, and
  `/api/v1/jobs` returned `200`; the live response exposed no secret values.
  Security headers, CORS, cache epoch, and request IDs were present. After
  bootstrap, `/api/v1/meta` reports 169 active jobs and both providers healthy.

### ACC-PROD-004 — Authenticated first ingestion completes

**Priority:** Critical<br>
**Automation:** Authenticated Wrangler Workflow run plus D1 readback<br>
**Status:** Passed

**Prerequisites**

- The production Worker, D1, secrets, and provider flags are configured.

**Steps**

1. Trigger one Workflow instance using authenticated Wrangler tooling.
2. Wait for completion and inspect the bounded instance result.
3. Query cycle, provider-run, health, cache-epoch, canonical-job, and candidate
   counts from D1.

**Expected result**

- The first run completes successfully or records a diagnosable partial result.
- Remote OK and all four approved WWR feeds are enabled when healthy.
- No raw payload is persisted and no public ingestion endpoint exists.
- A successful/partial run rotates the cache epoch; a fully failed run does not.

**Evidence**

- Workflow instance output and safe D1 count/readback.

**Last result**

- Passed 2026-07-31. Authenticated instance
  `729efeff-d0fa-4ffd-be4b-af4a0180e5cb` completed successfully. The bounded
  run summary recorded Remote OK `100 fetched / 2 admitted / 98 rejected` and
  WWR `199 fetched / 167 admitted`; finalization rotated the catalog to
  `epoch:763407dc068ddc9ecb354f7a`. Remote D1 readback confirmed 169 active
  jobs, 2 active Remote OK records, 167 active WWR records, 3 successful
  cycles, and no raw-payload table/data path.

### ACC-PROD-005 — Production site and API expose refreshed provenance

**Priority:** Critical<br>
**Automation:** HTTP smoke plus Playwright against production<br>
**Status:** Passed

**Prerequisites**

- `ACC-PROD-004` completed with at least one admitted source record.

**Steps**

1. Request `/api/v1/meta`, `/api/v1/jobs`, a returned job detail, JSON feed,
   RSS feed, and website browse/detail routes.
2. Compare provider freshness, source URLs, canonical fields, and status.

**Expected result**

- Public responses contain sanitized, attributed data from the refreshed catalog.
- Caching is keyed by the live epoch and API responses remain unauthenticated.
- Website and API remain available during later refreshes.

**Evidence**

- Production HTTP and browser artifacts.

**Last result**

- Passed 2026-07-31. Production HTTP smoke returned `200` for `/api/v1/meta`,
  `/api/v1/jobs`, `/api/v1/taxonomy`, `/api/openapi.json`, `/feeds/jobs.json`,
  and `/feeds/jobs.xml`; JSON and RSS feeds contain active attributed jobs and
  share the live cache epoch. A dynamic production Chromium smoke exercised
  home, browse, detail, sources, methodology, API, and Skill routes with no
  serious/critical axe violations or horizontal overflow. The canonical feed
  paths are `/feeds/jobs.json` and `/feeds/jobs.xml`; `/api/v1/feeds/...` is
  intentionally not shipped and returned `404`.

### ACC-PROD-006 — Operations runbook covers backup, restore, and diagnosis

**Priority:** High<br>
**Automation:** Documentation review<br>
**Status:** Passed

**Prerequisites**

- `docs/operations.md` exists.

**Steps**

1. Follow the documented export command to a temporary path.
2. Inspect the restore/time-travel procedure, secret hygiene, failed-run
   diagnosis, source suspension, and cleanup instructions.

**Expected result**

- The runbook names safe, recoverable operations and never suggests deleting a
  broad directory or exposing secret values.
- Raw source payloads and CV data are explicitly excluded from backups/logs.

**Evidence**

- Runbook review and command examples.

**Last result**

- Passed 2026-07-31. Added and reviewed `docs/operations.md` with targeted
  D1 export, Time Travel inspection/restore safeguards, bounded Workflow/D1
  diagnosis, non-destructive WWR suspension/recovery, secret rotation, and
  task-owned process cleanup procedures. No broad deletion, secret output, CV
  data, or raw provider payload is prescribed.

### ACC-PROD-007 — WWR suspension and recovery are non-destructive

**Priority:** High<br>
**Automation:** Controlled production/operator test<br>
**Status:** Passed

**Prerequisites**

- A safe provider-flag change path and existing WWR source records exist.

**Steps**

1. Disable WWR through the documented configuration/operation.
2. Run or inspect a cycle and query public jobs and retained WWR source rows.
3. Re-enable WWR and run a recovery cycle.

**Expected result**

- WWR-only jobs are withheld while WWR is suspended.
- Existing WWR records are retained and not mass-closed or deleted.
- Re-enabling resumes stable source identities and public visibility.

**Evidence**

- Safe D1 readback, cycle summary, and public API responses.

**Last result**

- Passed 2026-07-31. Controlled production suspension hid WWR-backed public
  jobs while leaving all 167 WWR source records retained. During suspension,
  the public API exposed the 2 Remote OK jobs; re-enabling WWR and completing
  recovery restored all 169 active jobs. No WWR source records were deleted or
  mass-closed, and the source health row returned to enabled/healthy.

## Full-plan validation gates

## Browser-comment product refinement

### ACC-REFINE-001 — Public navigation is focused

**Priority:** Critical<br>
**Automation:** Playwright and HTTP redirect checks<br>
**Status:** Passed

**Prerequisites**

- The redesigned public shell is running.

**Steps**

1. Open the landing page and the Index.
2. Inspect desktop and mobile primary navigation.
3. Request `/sources` and `/methodology` directly.
4. Open `/api` and inspect its section navigation.

**Expected result**

- The primary navigation contains Index, Agent Skill, and API.
- Sources and Methodology are not separate navigation destinations and their
  old URLs redirect safely.
- No DevOps/Sysadmin exclusion warning is rendered.
- The API page has no provider-freshness section or freshness anchor.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-31. Desktop/mobile Playwright and production HTTP checks
  confirmed the `Index`, `Agent Skill`, and `API` navigation; 301 redirects for
  both retired routes; and the absence of the DevOps warning and API freshness
  section.

### ACC-REFINE-002 — Landing page presents the product and ten latest jobs

**Priority:** Critical<br>
**Automation:** Playwright plus image-based browser review<br>
**Status:** Passed

**Prerequisites**

- At least ten production jobs exist.

**Steps**

1. Open `/` at desktop and mobile widths.
2. Inspect the hero, actions, product promises, and latest-job ledger.
3. Count the server-rendered latest job rows.

**Expected result**

- The hero follows the reviewed asymmetric Stitch direction with restrained
  typography and clear actions.
- The promises remain visible and the landing ledger contains at most the ten
  latest jobs.
- The Index action opens the dedicated full catalog.

**Evidence**

- Playwright assertions and browser screenshots.

**Last result**

- Passed 2026-07-31. Production SSR returned exactly ten latest job rows.
  Desktop and 390×844 screenshots confirmed the asymmetric hero, actions,
  promise ledger, latest-job preview, and dedicated Index action.

### ACC-REFINE-003 — Index filters are bounded, responsive, and shareable

**Priority:** Critical<br>
**Automation:** Playwright desktop/mobile and JavaScript-disabled coverage<br>
**Status:** Passed

**Prerequisites**

- The application is running with fixture or live catalog data.

**Steps**

1. Open `/jobs`.
2. Inspect the bounded filter panel and then scroll the result cards.
3. Choose country, role, scope, employment, seniority, and sort values.
4. Apply filters and reload the resulting URL.

**Expected result**

- The Index has no oversized editorial hero or permanent sidebar.
- The filter panel uses a compact desktop grid and a single-column mobile
  layout without floating over results.
- Applied exact filters are encoded in the GET URL and survive reload.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-08-01 after the clean-index refinement. Desktop/mobile Playwright
  confirmed the bounded responsive panel, shareable GET parameters, reload
  persistence, and absence of the former oversized hero/sidebar composition.

### ACC-REFINE-004 — Index SSR is bounded and later pages load incrementally

**Priority:** Critical<br>
**Automation:** HTTP HTML assertion plus Playwright network/UI coverage<br>
**Status:** Passed

**Prerequisites**

- More than ten matching production jobs exist.

**Steps**

1. Request `/jobs` as HTML and count rendered job rows.
2. Open `/jobs` with JavaScript.
3. Scroll to the result sentinel.
4. Observe the cursor-backed API request and appended jobs.
5. Continue to completion or exercise a failed request and retry.

**Expected result**

- SSR carries at most ten job rows while showing the complete matching count.
- Each client request asks for at most ten more jobs with an opaque cursor.
- Existing rows remain stable, duplicates are not added, loading is announced,
  failures offer retry, and the terminal state is explicit.

**Evidence**

- Catalog integration tests and Playwright assertions.

**Last result**

- Passed 2026-07-31 against production. Raw landing and Index HTML each
  contained exactly ten rows while Index reported all 82 matching engineering
  jobs. Scrolling issued `limit=10` API requests with an opaque cursor,
  appended later rows, and retained unique job URLs.

### ACC-REFINE-005 — Enhanced selects use the shadcn/Radix interaction model

**Priority:** High<br>
**Automation:** Playwright keyboard and no-JavaScript tests<br>
**Status:** Passed

**Prerequisites**

- JavaScript-enabled and JavaScript-disabled browser projects are available.

**Steps**

1. Open each enhanced filter select with pointer and keyboard.
2. Choose a value and submit.
3. Repeat the exact filter flow with JavaScript disabled.

**Expected result**

- Enhanced selects expose labeled trigger, listbox, option, focus, and selected
  states based on Radix Select.
- A native select fallback preserves the GET workflow without JavaScript.

**Evidence**

- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-31. Pointer/keyboard Radix selection and native
  JavaScript-disabled GET submission passed in both desktop and mobile
  Playwright projects.

### ACC-REFINE-006 — Job sources and Skill installation are recognizable

**Priority:** High<br>
**Automation:** Playwright and documentation test<br>
**Status:** Passed

**Prerequisites**

- Job rows from JS Guru Jobs, Remote OK, and WWR are available.

**Steps**

1. Inspect provider marks in landing and Index job rows.
2. Open `/skills/install`.
3. Copy the primary installation command.

**Expected result**

- JS Guru Jobs, Remote OK, and WWR rows include local provider marks with
  accessible labels and no third-party image request.
- The installation page shows
  `npx skills add windht/remotelens`.

**Evidence**

- Browser assertions and `tests/unit/remotelens-skill.test.ts`.

**Last result**

- Passed 2026-07-31. Production job rows exposed local Remote OK/WWR marks with
  accessible provider names and no third-party image dependency. The
  installation page displayed
  `npx skills add windht/remotelens`.

### ACC-OPS-007 — Phase 7 validation gate

**Priority:** Critical<br>
**Automation:** CLI, Playwright, browser review, and production HTTP<br>
**Status:** Passed

**Expected result**

- All Phase 7 tasks have implementation, technical validation, acceptance
  evidence, synchronized trackers, production deployment, and process cleanup.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md`.

**Last result**

- Passed 2026-07-31. Full validation, production dry run/deploy, canonical-path
  HTTP checks, four production Playwright cases, desktop/mobile screenshot
  review, accessibility, cursor loading, redirects, and cleanup all passed.
  Final production version: `77472bf9-cd45-47e0-910a-46347a339308`.

## Public domain and Skill install correction

### ACC-SKILL-005 — Installation uses the publishable repository command

**Priority:** Critical<br>
**Automation:** Unit test, Playwright, and production HTTP<br>
**Status:** Passed

**Prerequisites**

- The public repository is expected at `windht/remotelens`.

**Steps**

1. Open `/skills/install`.
2. Inspect the primary installation command.
3. Inspect the repository-owned client-local workflow reference.

**Expected result**

- Both surfaces show `npx skills add windht/remotelens`.
- The obsolete checkout-copy block and unnecessary single-skill selector are
  absent.

**Evidence**

- `tests/unit/remotelens-skill.test.ts`.
- `tests/e2e/public-shell.spec.ts`.

**Last result**

- Passed 2026-07-31. Unit and desktop/mobile production browser checks show
  exactly `npx skills add windht/remotelens`; the obsolete checkout-copy block
  and `--skill remotelens` selector are absent. Mobile viewport review also
  confirms the installation content fits without horizontal overflow.

### ACC-DOMAIN-001 — remotelens.co serves the production Worker

**Priority:** Critical<br>
**Automation:** Wrangler plus DNS/TLS/HTTP and Playwright<br>
**Status:** Passed

**Prerequisites**

- The `remotelens.co` zone is active in the selected Hutong531 Cloudflare
  account.
- The Worker is deployed from `wrangler.production.jsonc`.

**Steps**

1. Resolve the apex domain through public DNS.
2. Open `https://remotelens.co`.
3. Request `/api/v1/meta`, `/jobs`, and `/skills/install`.
4. Inspect canonical metadata and absolute API/feed URLs.
5. Confirm the workers.dev URL remains available as a fallback.

**Expected result**

- Public DNS delegates `remotelens.co` to the selected Cloudflare zone.
- TLS is valid and the apex serves the current RemoteLens Worker.
- Production canonical URLs and generated absolute links use
  `https://remotelens.co`.
- The existing workers.dev address remains reachable.

**Evidence**

- `wrangler.production.jsonc`.
- Production DNS/HTTP/Playwright output in `WORKLOG.md`.

**Last result**

- Passed 2026-07-31. Cloudflare DNS-over-HTTPS resolves the apex through
  `jeremy.ns.cloudflare.com` and `margot.ns.cloudflare.com`; valid TLS serves
  the Worker at `https://remotelens.co`. Root, redirected Index, Skill, API
  metadata, and apex-generated RSS job links passed. The workers.dev fallback
  remains HTTP 200.

### ACC-OPS-008 — Phase 8 validation gate

**Priority:** Critical<br>
**Automation:** CLI, Playwright, and production HTTP<br>
**Status:** Passed

**Expected result**

- Phase 8 implementation, technical validation, production deployment,
  acceptance evidence, tracker synchronization, and process cleanup are
  complete.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md`.

**Last result**

- Passed 2026-07-31. Full validation, local Playwright, production dry run,
  deployment, DNS/TLS/HTTP checks, desktop/mobile production Playwright, visual
  review, diff validation, and task-owned process cleanup passed. Final
  production version: `64a85888-d1de-4daf-9697-a42785115030`.

## Open-source release hygiene

### ACC-OSS-001 — Published Git data contains no credentials

**Priority:** Critical<br>
**Automation:** Repository and reachable-blob scan<br>
**Status:** Passed

**Expected result**

- No credential, token, private key, populated secret environment file, or
  production secret value is present in tracked files or reachable Git blobs.
- Local secret files and generated copies remain ignored.
- Any non-secret infrastructure identifiers or internal records retained in
  the repository are explicitly classified.

**Evidence**

- Secret and Git-history audit recorded in `WORKLOG.md`.

**Last result**

- Passed 2026-07-31 for publishable Git data. The only reachable commit,
  current tracked/untracked publishable files, refs, and reflog contain no
  credential-format match, populated secret file, private key, token, or
  personal email/path. `.dev.vars`, `dist`, and browser artifacts are ignored.
  Cloudflare account/database IDs remain classified as non-secret deployment
  identifiers. One local-only unreachable blob contains the current DeepSeek
  key; no remote is configured and a normal push cannot transfer the blob.

### ACC-OSS-002 — README is useful to public users

**Priority:** High<br>
**Automation:** Documentation inspection and link checks<br>
**Status:** Passed

**Steps**

1. Open `README.md`.
2. Follow the live site, Agent Skill, API, and OpenAPI links.
3. Follow the local setup and validation instructions.

**Expected result**

- The README explains what RemoteLens is, who it is for, and its privacy
  boundary without internal phase or operator narration.
- Installation and API examples are immediately usable.
- Contributor setup is concise and points to public repository files only.

**Evidence**

- `README.md`.

**Last result**

- Passed 2026-07-31. The README contains the product boundary, live links,
  exact Agent Skill install command, public API example and resources, data
  sources, privacy boundary, local setup, validation, technology, and
  contribution guidance. All three repository-relative links exist, live
  RemoteLens links and the documented API request return HTTP 200, and no
  internal phase/operator/tracker narration remains.

### ACC-OSS-003 — Open-source release gate

**Priority:** Critical<br>
**Automation:** CLI validation<br>
**Status:** Passed

**Expected result**

- Sensitive-data audit, README rewrite, formatting, link validation, technical
  checks, tracker synchronization, and process cleanup are complete.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md`.

**Last result**

- Passed 2026-08-01. The owner selected MIT and explicitly requested normal
  publication to the public `windht/remotelens` repository. The standard license
  is recorded in `LICENSE`, `package.json`, and `README.md`; validation and the
  final reachable-history credential scan passed. The local-only unreachable
  secret blob was not pruned and cannot be transferred by the normal push used
  for publication.

### ACC-OPS-002 — Phase 2 validation gate

**Priority:** Critical<br>
**Automation:** CLI/Playwright/operator evidence per phase<br>
**Status:** Passed

**Expected result**

- All Phase 2 implementation tasks have implementation, technical validation,
  acceptance evidence, and synchronized tracker state.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md` entries plus command artifacts.

**Last result**

- Passed 2026-07-31. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, `pnpm db:migrate:check`, `pnpm build`, `pnpm cf:dry-run`, and
  `pnpm test:e2e` passed; Phase 2 acceptance cases are recorded above.

### ACC-OPS-003 — Phase 3 validation gate

**Priority:** Critical<br>
**Automation:** CLI and direct HTTP contract evidence<br>
**Status:** Passed

**Expected result**

- All Phase 3 implementation, contract tests, API smoke checks, and tracker
  updates pass.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md` entries plus command artifacts.

**Last result**

- Passed 2026-07-31. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`,
  `pnpm test` (9 files, 43 tests), `pnpm db:migrate:check` (4 assertions),
  `pnpm build`, and `pnpm cf:dry-run` passed. A local Wrangler Worker on
  `127.0.0.1:8787` passed direct `GET`, `HEAD`, `OPTIONS`, malformed-filter,
  mutation, feed, and OpenAPI smoke checks with `API_RATE_LIMITER` resolved as
  `120 requests/60s`.

### ACC-OPS-004 — Phase 4 validation gate

**Priority:** Critical<br>
**Automation:** Playwright, accessibility, and HTTP evidence<br>
**Status:** Passed

**Expected result**

- All Phase 4 live SSR, no-JavaScript, responsive, accessibility, and tracker
  checks pass.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md` entries plus browser artifacts.

**Last result**

- Passed 2026-07-31. Phase 4 implementation, live-catalog browser/HTTP
  verification, responsive/no-JavaScript coverage, accessibility checks, and
  tracker synchronization passed.

### ACC-OPS-005 — Phase 5 validation gate

**Priority:** Critical<br>
**Automation:** Package/safety tests and documentation review<br>
**Status:** Passed

**Expected result**

- The Agent Skill package, install instructions, local matching safety tests,
  and tracker evidence pass.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md` entries plus package artifacts.

**Last result**

- Passed 2026-07-31. Phase 5 package, documentation, deterministic matching,
  prompt-injection safety tests, and tracker evidence passed; `pnpm skill:check`
  passed with the full repository validation suite.

### ACC-OPS-006 — Phase 6 production validation gate

**Priority:** Critical<br>
**Automation:** Wrangler, production HTTP, and operator evidence<br>
**Status:** Passed

**Expected result**

- Production D1, deployment, ingestion, public site/API, security, backup, and
  suspension recovery checks pass with no unresolved blocker.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, `WORKLOG.md`, Wrangler output, and production
  HTTP/browser artifacts.

**Last result**

- Passed 2026-07-31. Production D1, deployment, direct schedule, authenticated
  bootstrap, public HTTP/Chromium reads, security headers, operations runbook,
  and non-destructive WWR suspension/recovery all passed. No required blocker
  remains for the in-scope Phase 6 delivery.

## Phase 10 — JS Guru Jobs and clean index

### ACC-JSGURU-001 — Source contract is bounded and attributable

**Priority:** Critical<br>
**Automation:** Unit test and documentation review<br>
**Status:** Passed

**Prerequisites**

- Public JS Guru Jobs pages are reachable.
- The provider is enabled in a test environment.

**Steps**

1. Inspect the configured provider endpoints.
2. Run the JS Guru Jobs adapter fixture test.
3. Review source policy and application-routing documentation.

**Expected result**

- The adapter fetches exactly `https://jsgurujobs.com/jobs`,
  `https://jsgurujobs.com/jobs?page=2`, and
  `https://jsgurujobs.com/jobs?page=3`.
- Stable `/jobs/:id` listing identities are retained.
- Every normalized record is attributed to JS Guru Jobs and links back to its
  source listing.
- Raw HTML payloads are not persisted.

**Evidence**

- Adapter tests, `docs/source-policy.md`, and `docs/operations.md`.

**Last result**

- Passed 2026-08-01. Unit assertions and documentation readback confirmed
  exactly three server-rendered pages, stable numeric listing identity, visible
  `JS Guru Jobs` attribution, source-listing routing, and no raw HTML
  persistence.

### ACC-JSGURU-002 — Server-rendered listings normalize deterministically

**Priority:** Critical<br>
**Automation:** Vitest fixture and bounded live-fetch test<br>
**Status:** Passed

**Prerequisites**

- Sanitized page fixtures exist for representative valid, duplicate, and
  malformed listings.

**Steps**

1. Parse all three fixtures.
2. Inspect normalized title, company, listing URL, labels, description, and
   publication data.
3. Repeat parsing and compare output.

**Expected result**

- Valid job cards normalize without browser execution.
- Duplicate listing IDs across pages collapse within the provider.
- Malformed cards are rejected with bounded counts.
- Sanitization removes executable markup and deterministic payload hashes are
  stable across repeated runs.

**Evidence**

- `tests/unit/adapters.test.ts` and JS Guru Jobs fixture.

**Last result**

- Passed 2026-08-01. Fixture coverage confirmed browser-free parsing,
  duplicate-ID aggregation, malformed-card rejection, executable-markup
  sanitization, and deterministic hashes. The bounded live check fetched 30
  records from 3/3 HTTP 200 pages with 0 rejected and 0 duplicate records.

### ACC-JSGURU-003 — Provider participates in lifecycle and deduplication

**Priority:** Critical<br>
**Automation:** Vitest integration tests<br>
**Status:** Passed

**Steps**

1. Run a complete three-provider ingestion cycle.
2. Repeat the cycle with an unchanged JS Guru Jobs observation.
3. Create an equivalent cross-source record and rebuild canonical jobs.
4. Suspend only JS Guru Jobs and rebuild again.

**Expected result**

- The provider has independent health, lock, lifecycle, and suspension state.
- Unchanged records remain idempotent.
- JS Guru Jobs records enter the existing deterministic/semantic cross-source
  dedupe flow instead of creating a separate catalog.
- Suspension hides unsupported source-only jobs without deleting retained
  source history.

**Evidence**

- Ingestion and canonical integration tests.

**Last result**

- Passed 2026-08-01. Integration coverage confirmed independent provider
  health and suspension, idempotent repeated observations, canonical
  cross-source deduplication, and lifecycle behavior without deleting retained
  source history.

### ACC-JSGURU-004 — Public attribution and source filters include JS Guru Jobs

**Priority:** Critical<br>
**Automation:** API contract and Playwright tests<br>
**Status:** Passed

**Steps**

1. Open the Index with a catalog containing a JS Guru Jobs source.
2. Filter by `source=jsguru`.
3. Open the matching job detail and public API record.
4. Inspect source label and destination.

**Expected result**

- The structured source selector accepts JS Guru Jobs.
- Job rows, detail provenance, API records, taxonomy, and metadata use the
  stable `jsguru` key and visible `JS Guru Jobs` attribution.
- The source listing destination is preserved.

**Evidence**

- API tests and Playwright artifacts.

**Last result**

- Passed 2026-08-01. API and browser coverage confirmed the `jsguru` structured
  source filter, taxonomy and metadata exposure, visible row/detail
  attribution, and preserved source destinations.

### ACC-CLEAN-INDEX-001 — Index is a clean, separated directory

**Priority:** Critical<br>
**Automation:** Playwright plus screenshot review<br>
**Status:** Passed

**Steps**

1. Open `/jobs` at a desktop viewport.
2. Inspect the heading, filter panel, result list, and first three jobs.
3. Tab through filters and job links.

**Expected result**

- The page uses one legible sans-serif family with no decorative serif display.
- Filters occupy one clearly bounded panel.
- Every job occupies a clearly separated bordered card.
- Title, company, eligibility, employment, salary when known, tags, age, and
  source attribution have an obvious scan order.
- Exact structured filtering remains; no keyword or `q` search is introduced.

**Evidence**

- Stitch screen `c3a57344463d4ca19a18d44e0c2fdeac` and Playwright
  screenshots.

**Last result**

- Passed 2026-08-01. Desktop Chromium and screenshot review confirmed the
  Geist-only directory hierarchy, bounded filter panel, individually bordered
  cards, clear scan order, and absence of keyword search.

### ACC-CLEAN-INDEX-002 — Clean index remains responsive and accessible

**Priority:** Critical<br>
**Automation:** Playwright and axe<br>
**Status:** Passed

**Steps**

1. Open `/jobs` at 390 CSS pixels.
2. Apply a structured filter, expand advanced filters, and open a job.
3. Check horizontal overflow, touch targets, focus visibility, headings, and
   serious/critical axe findings.

**Expected result**

- Controls and cards collapse to one column with no clipped content or
  horizontal overflow.
- Core filtering still works without JavaScript.
- Interactive targets are at least 44px and visible focus is retained.
- No serious or critical accessibility violation is introduced.

**Evidence**

- Mobile Playwright screenshot, no-JavaScript case, and axe result.

**Last result**

- Passed 2026-08-01. Mobile, no-JavaScript, overflow, focus, and axe coverage
  passed with no horizontal overflow and no serious or critical accessibility
  violations.

### ACC-OPS-010 — Phase 10 validation gate

**Priority:** Critical<br>
**Automation:** CLI, Vitest, Playwright, live fetch, and build<br>
**Status:** Passed

**Expected result**

- All Phase 10 implementation tasks, technical checks, relevant acceptance
  cases, tracker updates, and process cleanup pass.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, `WORKLOG.md`, command output, and browser
  artifacts.

**Last result**

- Passed 2026-08-01. `pnpm validate` passed formatting, lint, TypeScript, 52
  Vitest tests, 5 migration assertions, and the production build.
  `pnpm test:e2e` passed 18 cases with 10 documented environment-gated skips.
  Live fetch, local D1 migration, Cloudflare type generation, both deployment
  dry-runs, final formatting, diff hygiene, and process cleanup also passed.

## Search discovery

### ACC-SEO-001 — Sitemap exposes canonical indexable pages

**Priority:** Critical<br>
**Automation:** Vitest and live HTTP verification<br>
**Status:** Passed

**Prerequisites**

- The application has a D1 catalog containing active jobs.
- At least one source provider is enabled.

**Steps**

1. Request `/sitemap.xml`.
2. Parse the response as XML.
3. Inspect the static and job-detail locations.

**Expected result**

- The response is HTTP 200 with an XML content type.
- All locations use the `https://remotelens.co` origin.
- The sitemap includes `/`, `/jobs`, `/api`, `/skills/install`, `/about`, and
  `/privacy`.
- Active job-detail locations are present with valid `lastmod` values.
- Every location is unique and XML-safe.

**Evidence**

- Sitemap unit tests and production HTTP response.

**Last result**

- Passed 2026-08-01. The production response was valid XML with 175 unique
  canonical locations: six static pages and 169 active job-detail pages. Every
  job location had a valid `lastmod`; `/jobs` returned HTTP 200 with a matching
  canonical tag.

### ACC-SEO-002 — Sitemap excludes non-indexable URLs

**Priority:** Critical<br>
**Automation:** Vitest and live HTTP verification<br>
**Status:** Passed

**Steps**

1. Request `/sitemap.xml`.
2. Search the locations for redirects, API data endpoints, feeds, query
   strings, and inactive or provider-disabled jobs.

**Expected result**

- `/methodology` and `/sources` are absent because they redirect.
- `/api/v1/*`, `/feeds/*`, and filtered `/jobs?...` URLs are absent.
- Closed, stale, and provider-disabled jobs are absent.

**Evidence**

- Sitemap query/unit tests and production HTTP response.

**Last result**

- Passed 2026-08-01. The production sitemap contained no redirect routes,
  `/api/v1` endpoints, feeds, query strings, foreign origins, duplicate
  locations, or inactive/provider-disabled jobs.

### ACC-SEO-003 — Crawler policy permits search discovery

**Priority:** High<br>
**Automation:** Vitest and live HTTP verification<br>
**Status:** Passed

**Steps**

1. Request `/robots.txt`.
2. Inspect the canonical-domain crawl rules.
3. Request the Worker fallback and inspect its sitemap directive.

**Expected result**

- The canonical response is HTTP 200 and explicitly permits search indexing.
- Googlebot is not disallowed.
- Where Cloudflare does not replace the Worker response, the sitemap directive
  is exactly
  `Sitemap: https://remotelens.co/sitemap.xml`.

**Evidence**

- Robots unit tests and production HTTP response.

**Last result**

- Passed 2026-08-01 with a documented edge distinction. The Worker fallback
  returns `User-agent: *`, `Allow: /`, and the canonical sitemap directive.
  On `remotelens.co`, Cloudflare Managed Content replaces the Worker body with
  `Content-Signal: search=yes` and `Allow: /`, while disallowing named AI
  training crawlers including `Google-Extended`; it does not disallow Googlebot
  or prevent direct sitemap submission.

### ACC-OPS-011 — Sitemap production release gate

**Priority:** Critical<br>
**Automation:** CLI, Vitest, build, Wrangler, and live HTTP verification<br>
**Status:** Passed

**Expected result**

- Focused sitemap tests and the full repository validation pass.
- The production migration state is reviewed and any required migration is
  applied before the current Worker is deployed.
- Production `/sitemap.xml` and `/robots.txt` pass their acceptance checks on
  `https://remotelens.co`.
- Existing home, catalog metadata, and one sitemap-listed job remain healthy.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, `WORKLOG.md`, command output, and production HTTP
  responses.

**Last result**

- Passed 2026-08-01. `pnpm validate` passed formatting, ESLint, TypeScript, 56
  Vitest tests, 5 migration assertions, and the production build. Production
  dry run and diff hygiene passed; `0002_jsguru_provider.sql` was reviewed,
  applied, and confirmed current. Worker version
  `0a887ba8-9784-42b7-b038-5b08b0d8e67a` was deployed. Live sitemap XML,
  canonical Index, one listed job, home, and catalog metadata returned HTTP 200.

### ACC-SEO-004 — Search engines receive consistent site and hierarchy signals

**Priority:** Critical<br>
**Automation:** Vitest, build inspection, and live HTTP verification<br>
**Status:** Passed

**Steps**

1. Request the home, Index, Agent Skill, API, About, Privacy, and one active job
   page.
2. Inspect titles, descriptions, canonicals, social metadata, robots metadata,
   structured data, and internal navigation labels.
3. Parse every JSON-LD block.

**Expected result**

- Every indexable page has one descriptive title, one useful description, and
  one absolute `https://remotelens.co` canonical.
- The home page exposes `WebSite` identity with the exact name `RemoteLens` and
  the associated Organization/logo.
- Subpages expose valid breadcrumb hierarchy without inventing artificial
  category pages.
- Primary internal links use concise labels for Index, Agent Skill, API, About,
  and Privacy.
- Active jobs are indexable and inactive jobs remain `noindex,follow`.

**Evidence**

- SEO unit tests, production HTML inspection, and structured-data parse output.

**Last result**

- Passed 2026-08-01. The home, Index, Agent Skill, API, About, Privacy, and one
  active job returned HTTP 200 with one unique title, one description, one
  absolute canonical, and parseable structured data. The home exposes
  `WebSite`/Organization identity for RemoteLens; every tested subpage exposes
  `BreadcrumbList` hierarchy. Open Graph site/page metadata, crawler directives,
  and descriptive header/footer links are present.

### ACC-SEO-005 — Browser and crawler favicon assets are complete

**Priority:** Critical<br>
**Automation:** Deterministic icon validation, build inspection, and live HTTP verification<br>
**Status:** Passed

**Steps**

1. Inspect the favicon master and validation sheet at 16–512 pixels.
2. Request favicon SVG/ICO/PNG, Apple touch, PWA, maskable, and manifest assets.
3. Inspect homepage icon and manifest links.

**Expected result**

- All assets use the approved RemoteLens lens/crosshair geometry.
- Icon geometry is centered and identical across coordinated variants.
- The ICO contains browser-compatible sizes including 48 pixels.
- Every linked asset returns HTTP 200 with the correct content type.
- The manifest references valid 192, 512, and maskable icons.

**Evidence**

- `artifacts/icon-v1/previews-v2/icon-validation-sheet.png`,
  `artifacts/icon-v1/previews-v2/icon-validation-report.json`, and production
  HTTP responses.

**Last result**

- Passed 2026-08-01. Deterministic validation confirmed identical geometry,
  exact centering, one-color foreground, transparent master corners, true
  monochrome variants, and a valid maskable safe zone. Production returned the
  exact local SVG, ICO, 16/32 PNG, Apple touch, 192/512 PWA, maskable, and
  manifest bytes with correct content types. The ICO contains 16, 24, 32, 48,
  and 64 pixel frames.

### ACC-OPS-012 — Search identity and favicon production release gate

**Priority:** Critical<br>
**Automation:** CLI, Vitest, build, Wrangler, and live HTTP verification<br>
**Status:** Passed

**Expected result**

- Icon validation and focused SEO tests pass.
- Full repository validation, production dry run, and diff hygiene pass.
- The deployed home and critical subpages expose the expected metadata and
  structured data.
- All favicon/manifest assets return HTTP 200 from the canonical domain.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, `WORKLOG.md`, command output, and production HTTP
  responses.

**Last result**

- Passed 2026-08-01. `pnpm validate` passed formatting, ESLint, TypeScript, 59
  Vitest tests, 5 migration assertions, and the production build.
  `pnpm test:e2e` passed all 20 applicable desktop/mobile cases with 10
  documented environment-gated skips. Production dry run and diff hygiene
  passed. Worker version `9779ff80-3ce8-485d-b98b-ebe6981cba2c` was deployed,
  and live metadata, structured data, favicon links, manifest, and all nine
  icon assets passed canonical-domain verification.

## Phase 13 — Explicit SSR and ISR delivery

### ACC-RENDER-001 — Every public page is server rendered

**Priority:** Critical<br>
**Automation:** Vitest, build inspection, Playwright, and live HTTP verification<br>
**Status:** Passed

**Prerequisites**

- The production Worker is deployed with a reachable D1 catalog.

**Steps**

1. Request the home, Index, Agent Skill, API, About, Privacy, and one active
   job-detail URL with a plain HTTP client.
2. Inspect each response body without executing JavaScript.
3. Inspect the router configuration and route rendering options.

**Expected result**

- TanStack Router has an explicit site-wide SSR default.
- Every response is complete HTML containing the page heading, canonical
  metadata, and route-specific content before hydration.
- The active job response contains its real title, company, job facts,
  description, and source destination in the initial HTML.
- No public HTML route opts into client-only rendering.

**Evidence**

- Rendering unit tests, Playwright no-JavaScript coverage, built server output,
  and production HTML responses.

**Last result**

- Passed 2026-08-01. `src/start.ts` explicitly configures `defaultSsr: true`.
  Plain HTTP responses for every canonical public page contained a complete
  heading, canonical metadata, and route content. The sitemap-selected
  production job contained its real title, source-provided job content, and
  attributed application URL in the initial HTML without client execution.

### ACC-RENDER-002 — Catalog-backed pages use bounded ISR

**Priority:** Critical<br>
**Automation:** Vitest, Playwright, and live HTTP verification<br>
**Status:** Passed

**Steps**

1. Request `/`, `/jobs`, a structured filtered `/jobs` URL, and one active
   `/jobs/:slug` URL.
2. Inspect the response cache headers and initial HTML.
3. Exercise an unavailable-catalog response in deterministic tests.

**Expected result**

- Successful catalog-backed HTML uses a public shared-cache policy with a
  five-minute CDN freshness window and one-hour stale-while-revalidate window.
- Browser freshness remains zero so clients revalidate rather than retaining
  silently stale job data.
- Filtered Index URLs are independently keyed by their complete URL.
- Unavailable-catalog and uncategorized HTML responses remain `no-store` SSR
  and are not cached as successful pages.

**Evidence**

- Rendering unit tests, public-shell Playwright coverage, and production
  response headers.

**Last result**

- Passed 2026-08-01. Home, canonical Index, filtered Index, and a
  sitemap-selected job returned
  `public, max-age=0, s-maxage=300, stale-while-revalidate=3600`, the matching
  CDN policy, and `X-RemoteLens-Render-Mode: isr`. A missing job returned HTTP
  404 with `Cache-Control: no-store` and the explicit SSR marker.

### ACC-RENDER-003 — Stable public pages use long-lived ISR

**Priority:** High<br>
**Automation:** Vitest, Playwright, and live HTTP verification<br>
**Status:** Passed

**Steps**

1. Request `/about`, `/api`, `/privacy`, and `/skills/install`.
2. Inspect their cache headers and initial HTML.

**Expected result**

- Each response is server-rendered HTML.
- Each response uses a public shared-cache policy with a one-day CDN freshness
  window and seven-day stale-while-revalidate window.
- Security headers and route metadata remain present.

**Evidence**

- Rendering unit tests, public-shell Playwright coverage, and production
  response headers.

**Last result**

- Passed 2026-08-01. About, API, Privacy, and Agent Skill returned complete
  server-rendered HTML with
  `public, max-age=0, s-maxage=86400, stale-while-revalidate=604800`, the
  matching CDN policy, the ISR marker, security headers, and canonical
  metadata.

### ACC-OPS-013 — SSR and ISR production release gate

**Priority:** Critical<br>
**Automation:** CLI, Vitest, build, Playwright, Wrangler, and live HTTP verification<br>
**Status:** Passed

**Expected result**

- Focused rendering tests, full repository validation, full applicable
  Playwright coverage, production dry run, and diff hygiene pass.
- Production D1 migration state is current.
- The deployed canonical domain passes all Phase 13 HTML and header checks.
- Existing sitemap, favicon, API, redirect, and security behavior remains
  healthy.

**Evidence**

- `TASKS.md`, `ACCEPTANCE.md`, `WORKLOG.md`, command output, and production HTTP
  responses.

**Last result**

- Passed 2026-08-01. `pnpm validate` passed formatting, ESLint, TypeScript, 64
  Vitest tests, 5 migration assertions, and the production build. The full
  Playwright run passed all 22 applicable desktop/mobile cases with 10
  environment-gated skips. Production dry run, remote migration readback, and
  diff hygiene passed. Worker version
  `e9f6dac1-bcb9-48db-9a39-755d1c42ddc2` was deployed. Three repeated
  canonical-domain and workers.dev header probes passed after edge propagation;
  final SSR content, ISR headers, missing-job SSR, redirects, API, sitemap, and
  favicon regression checks passed.
