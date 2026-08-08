# RemoteLens Full Delivery Tasks

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
  - Two complete missing checks, 72-hour closure, configured retention; partial or
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

## Phase 2 — Canonical jobs and deduplication

- [x] **P2-001 — Extend the D1 model for canonical jobs and field provenance**
  - Add canonical fields, normalized filter projections, job tags, field
    provenance, stable slugs, and the indexes required by public reads.
  - Acceptance: `ACC-CANONICAL-001`, `ACC-DB-002`
- [x] **P2-002 — Implement deterministic canonical-field derivation**
  - Parse only documented source evidence, preserve unknowns, select fields by
    deterministic priority, and generate stable fingerprints and slugs.
  - Acceptance: `ACC-CANONICAL-002`, `ACC-INGEST-003`
- [x] **P2-003 — Implement deduplication decisions and canonical rebuilds**
  - Apply exact identity/fingerprint merges, keep non-duplicates separate,
    record append-only decisions, and use the bounded DeepSeek path only for
    unresolved cross-source candidates.
  - Acceptance: `ACC-CANONICAL-001`, `ACC-CANONICAL-003`, `ACC-DEDUPE-002`
- [x] **P2-004 — Connect lifecycle, suspension, and provenance to canonical jobs**
  - Keep canonical jobs public only when an enabled provider has an eligible
    source record; preserve conflicts and source history through closure.
  - Acceptance: `ACC-CANONICAL-004`, `ACC-FLAGS-002`, `ACC-STALE-002`
- [x] **P2-005 — Add Phase 2 unit, migration, and integration coverage**
  - Cover duplicate merges, separate listings, field selection, provenance,
    stale/closed transitions, and repeatable rebuilds.
  - Acceptance: all Phase 2 automated cases
- [x] **P2-006 — Pass the Phase 2 validation gate**
  - Format, lint, typecheck, unit/integration tests, migrations, build, and
    Cloudflare dry-run pass with tracker evidence.
  - Acceptance: `ACC-OPS-002`

## Phase 3 — Public API and feeds

- [x] **P3-001 — Implement the versioned public API contract**
  - Add `/api/v1/jobs`, `/api/v1/jobs/:id`, `/api/v1/taxonomy`, and
    `/api/v1/meta` with stable Zod-validated envelopes and request IDs.
  - Acceptance: `ACC-API-001`, `ACC-API-002`, `ACC-API-003`
- [x] **P3-002 — Implement exact filters and opaque cursor pagination**
  - Support the documented structured filters, sort modes, eligibility rules,
    same-currency salary constraints, cursor binding, and invalid-filter errors.
  - Acceptance: `ACC-API-001`, `ACC-API-004`
- [x] **P3-003 — Implement JSON/RSS feeds, OpenAPI, CORS, caching, and limits**
  - Add active-job feeds, OpenAPI output, epoch-keyed successful-response
    caching, public GET/HEAD CORS, and the 120 requests/minute API guard.
  - Acceptance: `ACC-API-003`, `ACC-API-005`
- [x] **P3-004 — Add API contract and regression tests**
  - Validate response schemas, provenance, cursor rejection, empty versus
    malformed filters, feed output, security headers, and method boundaries.
  - Acceptance: all Phase 3 automated cases
- [x] **P3-005 — Pass the Phase 3 validation gate**
  - Format, lint, typecheck, unit/integration tests, production build, and
    direct HTTP API smoke checks pass.
  - Acceptance: `ACC-OPS-003`

## Phase 4 — Live public SSR website

- [x] **P4-001 — Replace fixture-only public reads with the live catalog service**
  - Use D1-backed canonical jobs for SSR and client navigation, with sanitized
    fixtures retained only as an explicit local empty-catalog fallback.
  - Acceptance: `ACC-WEB-001`, `ACC-WEB-002`
- [x] **P4-002 — Complete live provenance, freshness, SEO, and empty/error states**
  - Render source destinations, conflicts, field origins, provider freshness,
    canonical metadata, sitemap behavior, and safe unavailable-catalog states.
  - Acceptance: `ACC-WEB-003`, `ACC-WEB-004`
- [x] **P4-003 — Update API and Skill documentation for shipped behavior**
  - Remove Phase 3/5 preview claims and document the live endpoints, limits,
    installation package, and client-local CV boundary.
  - Acceptance: `ACC-WEB-005`
- [x] **P4-004 — Run desktop/mobile, no-JavaScript, keyboard, and axe coverage**
  - Exercise critical routes against the live-catalog adapter and retain the
    Phase 0 regression coverage.
  - Acceptance: `ACC-WEB-001`, `ACC-WEB-006`
- [x] **P4-005 — Pass the Phase 4 validation gate**
  - Full relevant browser, accessibility, build, and HTTP smoke checks pass.
  - Acceptance: `ACC-OPS-004`

## Phase 5 — RemoteLens Agent Skill

- [x] **P5-001 — Ship the repository-owned Agent Skill package**
  - Add `skills/remotelens/SKILL.md`, API, matching, CV-safety, client-local
    workflow references, and the example configuration.
  - Acceptance: `ACC-SKILL-001`
- [x] **P5-002 — Document Codex, Claude Code, and generic installation**
  - Provide copyable installation and configuration instructions without
    inventing an unavailable package registry or requiring a private API key.
  - Acceptance: `ACC-SKILL-002`
- [x] **P5-003 — Add local matching and prompt-injection safety coverage**
  - Verify selected-file-only CV reads, structured API use, explainable matches,
    no CV upload, no tracker mutation, and untrusted-content refusal.
  - Acceptance: `ACC-SKILL-003`, `ACC-SKILL-004`
- [x] **P5-004 — Pass the Phase 5 validation gate**
  - Markdown/package checks, safety tests, browser documentation checks, and
    tracker evidence pass.
  - Acceptance: `ACC-OPS-005`

## Phase 6 — Production deployment and hardening

- [x] **P6-001 — Create and migrate the production D1 catalog**
  - Replace placeholder binding metadata with the real Hutong531 D1 database,
    apply all migrations, and verify schema/readback without exposing secrets.
  - Acceptance: `ACC-PROD-001`
- [x] **P6-002 — Deploy the Worker and direct scheduled Workflow**
  - Deploy the validated application with both providers enabled, the
    `0 */12 * * *` Workflow schedule, security headers, and observability.
  - Acceptance: `ACC-PROD-002`, `ACC-PROD-003`
- [x] **P6-003 — Run authenticated initial ingestion and verify public reads**
  - Trigger the first Workflow run through authenticated Wrangler tooling,
    inspect bounded run summaries, and verify the site/API against production.
  - Acceptance: `ACC-PROD-004`, `ACC-PROD-005`
- [x] **P6-004 — Add the backup/export and operations runbook**
  - Document safe export, restore/time-travel, provider suspension, failed-run
    diagnosis, secret hygiene, and process cleanup.
  - Acceptance: `ACC-PROD-006`
- [x] **P6-005 — Verify independent provider suspension and recovery**
  - Exercise WWR suspension/re-enable semantics without deleting or mass-closing
    its retained source records.
  - Acceptance: `ACC-PROD-007`
- [x] **P6-006 — Pass the production acceptance gate**
  - Confirm schedule, bootstrap, API/site availability, freshness metadata,
    security, and no required blocker remains.
  - Acceptance: `ACC-OPS-006`

## Phase 7 — Browser-comment product refinement

- [x] **P7-001 — Simplify the public information architecture**
  - Rename the primary Jobs navigation item to Index, remove Sources and
    Methodology from the primary product navigation, preserve safe redirects,
    remove the DevOps exclusion warning, and remove the API freshness section.
  - Acceptance: `ACC-REFINE-001`
- [x] **P7-002 — Restore the selected landing-page direction**
  - Recompose the landing hero and trust ledger around the reviewed Stitch
    direction and render the ten latest jobs as the landing preview.
  - Acceptance: `ACC-REFINE-002`
- [x] **P7-003 — Rebuild the dedicated Index layout and filters**
  - Remove the oversized browse hero, use a compact bounded responsive filter
    panel, replace native enhanced selects with shadcn/Radix Select while
    retaining no-JavaScript fallbacks, and preserve shareable GET URLs. The
    original sticky treatment was superseded by P10-004.
  - Acceptance: `ACC-REFINE-003`, `ACC-REFINE-005`
- [x] **P7-004 — Add bounded SSR and infinite result loading**
  - Server-render at most ten matching jobs, report the complete matching
    count, and append subsequent cursor-backed API pages on intersection with
    accessible loading, retry, and completion states.
  - Acceptance: `ACC-REFINE-004`
- [x] **P7-005 — Add provider branding and publishable Skill install command**
  - Render local Remote OK/WWR favicon-derived marks in job rows and replace
    checkout-copy instructions with the GitHub-ready `npx skills add` command.
  - Acceptance: `ACC-REFINE-006`
- [x] **P7-006 — Pass targeted and full validation**
  - Run formatting, lint, typecheck, unit/integration tests, production build,
    desktop/mobile/no-JavaScript Playwright coverage, visual browser review,
    and production deployment verification.
  - Acceptance: `ACC-OPS-007`

## Phase 8 — Public domain and Skill install correction

- [x] **P8-001 — Correct the repository Skill install command**
  - Use the publishable repository command
    `npx skills add windht/remotelens` consistently across the installation
    page, repository documentation, Skill references, and tests.
  - Acceptance: `ACC-SKILL-005`
- [x] **P8-002 — Bind the production Worker to remotelens.co**
  - Add the apex custom domain to the selected Hutong531 Cloudflare zone and
    make `https://remotelens.co` the production site/API origin without
    disabling the existing workers.dev fallback.
  - Acceptance: `ACC-DOMAIN-001`
- [x] **P8-003 — Validate and deploy the domain correction**
  - Run the relevant full validation, production dry run, deploy, DNS/TLS/HTTP
    verification, canonical-URL checks, and process cleanup.
  - Acceptance: `ACC-OPS-008`

## Phase 9 — Open-source release hygiene

- [x] **P9-001 — Audit repository and Git history for sensitive material**
  - Inspect tracked, ignored, untracked, generated, and all reachable Git blob
    content for credentials, private keys, tokens, local paths, personal
    identifiers, and unnecessary production-resource metadata without printing
    secret values.
  - Acceptance: `ACC-OSS-001`
- [x] **P9-002 — Sharpen README for public users**
  - Replace internal phase, deployment, operator, and tracker narration with a
    concise product overview, live links, Agent Skill installation, public API
    examples, local setup, validation, architecture, and contribution guidance.
  - Acceptance: `ACC-OSS-002`
- [x] **P9-003 — Pass the open-source release gate**
  - Validate documentation formatting and links, rerun repository secret and
    history checks, run relevant technical validation, synchronize evidence,
    and confirm process cleanup.
  - Acceptance: `ACC-OSS-003`

## Phase 10 — JS Guru Jobs source and clean index presentation

- [x] **P10-001 — Approve and document JS Guru Jobs as a bounded provider**
  - Record the server-rendered three-page HTML contract, stable listing identity,
    visible attribution, source flag, application routing, and no-payload
    persistence policy before enabling the provider.
  - Acceptance: `ACC-JSGURU-001`
- [x] **P10-002 — Implement the JS Guru Jobs Cheerio adapter**
  - Fetch exactly `/jobs`, `/jobs?page=2`, and `/jobs?page=3`, parse and
    normalize developer listings, aggregate duplicate listing IDs across pages,
    sanitize excerpts, and emit deterministic hashes and labels.
  - Acceptance: `ACC-JSGURU-001`, `ACC-JSGURU-002`
- [x] **P10-003 — Route JS Guru Jobs through ingestion and deduplication**
  - Add the independent provider flag, Workflow observation, D1/provider
    metadata, canonical rebuild, structured source filters, API contracts, and
    visible site/API attribution.
  - Acceptance: `ACC-JSGURU-003`, `ACC-JSGURU-004`
- [x] **P10-004 — Apply the Stitch clean-index redesign**
  - Replace the serif/editorial presentation with the selected Geist-based
    directory system, a bounded filter panel, and clearly separated job cards
    on desktop and mobile without adding keyword search.
  - Acceptance: `ACC-CLEAN-INDEX-001`, `ACC-CLEAN-INDEX-002`
- [x] **P10-005 — Pass the Phase 10 validation and acceptance gate**
  - Run focused adapter, ingestion, API, browser, accessibility, responsive,
    live-fetch, build, and full repository validation; synchronize tracker
    evidence and confirm process cleanup.
  - Acceptance: `ACC-OPS-010`

## Phase 11 — Search discovery sitemap

- [x] **P11-001 — Serve a canonical production sitemap**
  - Add a dynamic `/sitemap.xml` response containing the indexable static pages
    and every active canonical job backed by an enabled provider.
  - Exclude redirects, API endpoints, feeds, filtered result URLs, and
    unavailable jobs.
  - Acceptance: `ACC-SEO-001`, `ACC-SEO-002`
- [x] **P11-002 — Preserve crawler access and provide a robots fallback**
  - Serve `/robots.txt` with the canonical production sitemap location where
    Cloudflare does not replace the response, and verify that the
    Cloudflare-managed apex policy explicitly permits search indexing.
  - Acceptance: `ACC-SEO-003`
- [x] **P11-003 — Validate and deploy the sitemap release**
  - Run focused tests, full validation, production dry run, pending production
    migration review/application, production deployment, and live canonical
    domain verification.
  - Acceptance: `ACC-OPS-011`

## Phase 12 — Search identity and favicon delivery

- [x] **P12-001 — Align search-result identity and hierarchy signals**
  - Add consistent site-name metadata, absolute canonicals, unique page titles
    and descriptions, Open Graph metadata, WebSite/Organization identity, and
    breadcrumb structured data without creating artificial pages.
  - Keep primary subpages discoverable through stable descriptive internal
    links.
  - Acceptance: `ACC-SEO-004`
- [x] **P12-002 — Deliver a complete RemoteLens favicon system**
  - Preserve the approved lens/crosshair brand geometry and export SVG, ICO,
    16/32 PNG, Apple touch, 192/512 PWA, and maskable assets with a valid web
    manifest.
  - Acceptance: `ACC-SEO-005`
- [x] **P12-003 — Validate and deploy the search-identity release**
  - Run icon validation, focused SEO tests, full repository validation,
    production dry run/deploy, and live metadata/favicon verification.
  - Acceptance: `ACC-OPS-012`

## Phase 13 — Explicit SSR and ISR delivery

- [x] **P13-001 — Make server rendering the explicit site-wide default**
  - Configure TanStack Router to server-render every route unless a route
    explicitly opts out; retain SSR for uncached errors and unavailable-catalog
    responses.
  - Acceptance: `ACC-RENDER-001`
- [x] **P13-002 — Add bounded ISR policies to public HTML pages**
  - Apply short-lived CDN revalidation to the home, Index, and job-detail
    pages, including stale-while-revalidate; apply a longer policy to stable
    About, API, Privacy, and Agent Skill pages.
  - Do not let the server entry overwrite route-owned cache policies.
  - Acceptance: `ACC-RENDER-002`, `ACC-RENDER-003`
- [x] **P13-003 — Validate and deploy the rendering release**
  - Run focused rendering tests, the full validation and browser suites,
    production dry run/deploy, and live HTML/header/content verification for
    every public page class and a sitemap-listed job.
  - Acceptance: `ACC-OPS-013`

## Phase 14 — Browser-comment copy and filter refinement

- [x] **P14-001 — Correct public country examples and ordering**
  - Use `CN` in public country-code examples, make the public API base URL the
    RemoteLens default, and keep Japan out of the first country option.
  - Acceptance: `ACC-REFINE-007`, `ACC-SKILL-006`
- [x] **P14-002 — Clarify local CV setup and manual application-form guidance**
  - Explain how the Skill helps users provide or create a local CV/profile and
    prepare form answers without opening, filling, or submitting applications.
  - Acceptance: `ACC-SKILL-006`
- [x] **P14-003 — Rebuild the Index filter disclosure layout**
  - Keep Employment, Seniority, and Sort in the primary row; move all other
    filters into a multi-row extra-filter area, center its controls, and switch
    the disclosure label between More and Hide.
  - Acceptance: `ACC-REFINE-007`, `ACC-REFINE-008`
- [x] **P14-004 — Pass the browser-comment refinement gate**
  - Run focused Skill and browser checks, full repository validation, and
    responsive visual/interaction review; synchronize all tracker evidence.
  - Acceptance: `ACC-OPS-014`

## Phase 15 — Scheduled 60-day catalog cleanup

- [x] **P15-001 — Define the 60-day catalog retention contract**
  - Retain closed source records for 60 days, remove retired canonical data only
    after its provenance is no longer needed, and prune completed ingestion
    history older than the same boundary without touching active or suspended
    source data.
  - Acceptance: `ACC-RETENTION-001`, `ACC-RETENTION-002`
- [x] **P15-002 — Run retention cleanup with successful ingestion**
  - Add an idempotent post-finalization cleanup step to the existing twice-daily
    Workflow, preserve failed/partial stale-state safeguards, rebuild remaining
    canonical jobs, and rotate the catalog cache epoch when public data changes.
  - Acceptance: `ACC-RETENTION-001`, `ACC-WORKFLOW-001`, `ACC-STALE-001`
- [x] **P15-003 — Pass the retention release gate and deploy**
  - Run focused retention/migration checks, the full validation suite, the
    production dry run, push the validated commit, deploy it, and verify the
    live Worker schedule and bounded cleanup readback.
  - Acceptance: `ACC-OPS-015`

## Phase 16 — Official RemoteJobs.org, Remotive, and Jobicy sources

- [x] **P16-001 — Define and document the three official provider contracts**
  - Add independent provider keys, source-policy entries, attribution rules,
    official endpoint boundaries, and safe partial/failure semantics for
    RemoteJobs.org, Remotive software-development RSS, and Jobicy engineering
    API results.
  - Acceptance: `ACC-REMOTEJOBS-001`, `ACC-REMOTIVE-001`, `ACC-JOBICY-001`
- [x] **P16-002 — Implement and test the RemoteJobs.org adapter**
  - Use the official programming-category JSON API, bounded `limit`/`offset`
    pagination, source-local identity, sanitized descriptions, and explicit
    source attribution without treating the aggregator detail page as an
    employer application URL.
  - Acceptance: `ACC-REMOTEJOBS-001`, `ACC-REMOTEJOBS-002`
- [x] **P16-003 — Implement and test the Remotive software-development RSS adapter**
  - Parse the user-specified official RSS feed, support single or repeated
    items and CDATA/content fields, preserve the feed's software-development
    boundary, and reject malformed records deterministically.
  - Acceptance: `ACC-REMOTIVE-001`, `ACC-REMOTIVE-002`
- [x] **P16-004 — Implement and test the Jobicy engineering API adapter**
  - Use the official API with the engineering filter and bounded 100-result
    response, normalize its array/scalar fields, retain the original Jobicy
    listing URL, and keep required Jobicy attribution/application-routing
    rules visible in documentation.
  - Acceptance: `ACC-JOBICY-001`, `ACC-JOBICY-002`
- [x] **P16-005 — Route all three providers through lifecycle and public surfaces**
  - Add D1 migration state, independent flags, Workflow observations and
    summaries, canonical priority, source filters, API taxonomy/meta, UI
    attribution, and fixture metadata for all three providers.
  - Acceptance: `ACC-SOURCES-003`, `ACC-API-003`, `ACC-WORKFLOW-003`
- [x] **P16-006 — Pass the three-source validation and acceptance gate**
  - Run adapter, migration, workflow, integration, formatting, lint, strict
    typecheck, full tests, build, and diff hygiene checks; record any bounded
    live-fetch result without deploying production.
  - Acceptance: `ACC-OPS-016`
- [x] **P16-007 — Deploy and publish the three-source release**
  - Review the production migration state, apply the new D1 migration if it is
    pending, deploy the validated Worker and Workflow configuration, and verify
    the canonical domain, public metadata, Workflow schedule, and bounded
    aggregate provider health.
  - Update the README and synchronized release trackers with the deployment
    evidence, then commit and push the complete scoped change to GitHub.
  - Acceptance: `ACC-OPS-017`

## Operator-directed Cloudflare setup

- [x] **OPS-001 — Bind the project to the Hutong531 Cloudflare account and
      upload local secrets**
  - Uploaded `DEEPSEEK_API_KEY`, `DEEPSEEK_API_BASE_URL`,
    `DEEPSEEK_API_MODEL`, and `API_CURSOR_SECRET` as encrypted Worker secrets.
  - No secret values are stored in the trackers or Wrangler configuration.
  - Acceptance: `ACC-CF-SECRETS-001`
