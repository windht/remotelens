# RemoteLens Full Delivery Worklog

## Current status

**Phase:** Phase 16 — Official RemoteJobs.org, Remotive, and Jobicy sources<br>
**Current task:** P16-007 — Deploy and publish the three-source release<br>
**Current acceptance:** ACC-OPS-017 pending; ACC-REMOTEJOBS-001 through ACC-OPS-016 passed, with Remotive live access noted below<br>
**Goal status:** In progress

### Production deployment and GitHub publication pending — 2026-08-08

- README, implementation, migration, tests, and the Phase 16 tracker updates
  are present in the reviewed worktree.
- The next controlled actions are remote migration readback/application,
  production Worker/Workflow deployment, bounded live verification, and a
  commit/push to the `windht/remotelens` GitHub remote.
- Production mutation has not started. No secret values will be written to
  trackers or command output, and Remotive's HTTP 403 will remain a bounded
  provider failure if it persists.

### Three official source integration started — 2026-08-08

- The requested scope is to add RemoteJobs.org's official programming API,
  Remotive's official software-development RSS, and Jobicy's official
  engineering-filtered API to the existing read-only ingestion pipeline.
- Added Phase 16 task and acceptance tracking before changing application code.
- The implementation will keep each provider independently suspendable,
  attributed, bounded to its official endpoint, and safe for partial/failed
  fetches. Production deployment was deferred at that stage and is tracked by
  P16-007 below.

### Provider contracts and adapters implemented — 2026-08-08

- Added the official RemoteJobs.org programming API adapter with bounded
  ten-page pagination, programming-category admission, source-ID deduplication,
  sanitized content, response hashes, and partial-fetch reporting.
- Added the user-specified Remotive software-development RSS adapter with
  CDATA/content fallback, GUID/listing identity, safe company/title parsing,
  sanitized content, and deterministic item normalization.
- Added the official Jobicy engineering API adapter with a 100-result cap,
  array/scalar field normalization, description/excerpt fallback, source-ID
  deduplication, sanitized content, and direct Jobicy URL retention.
- Added fixtures and 13 focused adapter tests covering malformed records,
  unsafe markup, pagination, partial fetches, duplicate IDs, and deterministic
  repeated parsing.
- Completed tracker/source-policy contract tasks P16-001 through P16-004.
- Validation: `pnpm exec vitest run tests/unit/adapters.test.ts` — Passed;
  13 tests. Formatting applied to all Phase 16 tracker, policy, adapter, and
  fixture files.

### Three-source lifecycle and public surfaces integrated — 2026-08-08

- Added six-provider source unions and independent runtime flags for
  `remotejobs`, `remotive`, and `jobicy` in Wrangler, generated Worker types,
  D1 schema metadata, source health, canonical priority, API taxonomy/meta,
  structured source filters, source marks, freshness labels, and fixture
  fallback metadata.
- Added idempotent migration
  `drizzle/migrations/0003_remotejobs_remotive_jobicy.sql`; local Wrangler D1
  migration applied all four commands successfully.
- Added one retryable Workflow step per new provider and included all six
  provider summaries in finalization. RemoteJobs page-bound and page-failure
  paths persist `partial`/`failed` without advancing absence closure.
- Added integration, workflow, API, migration, environment, and browser
  regression coverage. The public API accepts the three new keys and the
  Index renders their source options.

### Phase 16 validation and bounded live check — 2026-08-08

- `pnpm validate` — Passed; Prettier, ESLint, strict TypeScript, 75 Vitest
  tests, 6 migration assertions, and the production build.
- `pnpm test:e2e` — Passed; 24 desktop/mobile Chromium cases, including the
  new provider-option visibility assertion; 10 existing live/production cases
  remained environment-gated skips.
- `pnpm cf:prod-dry-run` — Passed; production account/domain, live D1,
  scheduled Workflow, and all six provider flags resolved.
- `pnpm ingest:live-check` — Completed without raw-payload persistence:
  RemoteJobs.org admitted 500 records across the ten-page safety bound and
  correctly reported `hasMore=true` (partial by design); Jobicy admitted 100
  engineering records; Remotive returned HTTP 403 from the source edge and
  was reported as a provider error without bypassing access controls.
- `git diff --check` — Passed. Playwright preview/browser processes exited;
  ports 4173 and 8787 were not listening and no task-owned browser, preview,
  Workerd, or Wrangler process remained.
- P16-001 through P16-006 and ACC-SOURCES-003, ACC-API-003,
  ACC-WORKFLOW-003, and ACC-OPS-016 are complete. P16-007 now tracks the
  authorized production deployment and GitHub publication.

### Scheduled 60-day catalog cleanup started — 2026-08-04

- The requested scope is a 60-day database-retention cleanup that runs with
  the existing twice-daily ingestion Workflow.
- Added the Phase 15 implementation and acceptance tracking before changing
  application code.
- The design keeps partial/failed fetches from advancing retention, preserves
  active and suspended source records, and prunes only retired source data and
  completed ingestion history at the inclusive 60-day boundary.

### 60-day cleanup implemented and local gates passed — 2026-08-04

- Added `cleanupCatalogRetention` to the existing D1 ingestion module. It uses
  the inclusive configured 60-day `closed_at` cutoff, removes retired canonical
  jobs/provenance and dedupe decisions in foreign-key-safe order, rebuilds the
  remaining canonical catalog, rotates the cache epoch when public data
  changes, prunes completed ingestion cycles older than the cutoff, and removes
  expired locks.
- Removed the old hardcoded 30-day per-provider deletion so cleanup cannot run
  before canonical provenance is rebuilt. Production and local Wrangler vars
  now set `SOURCE_CLOSED_RETENTION_DAYS=60`.
- The cleanup is an explicit post-finalization Workflow step and runs only when
  all enabled providers complete successfully. Partial/failed cycles skip it.
- `pnpm exec vitest run tests/integration/canonical-jobs.test.ts
tests/integration/catalog-engine.test.ts tests/unit/workflow-config.test.ts`
  — Passed; 17 tests.
- `pnpm validate` — Passed; formatting, ESLint, strict TypeScript, 66 Vitest
  tests, 5 migration assertions, and the production build.
- `pnpm test:e2e` — Passed; 24 applicable desktop/mobile Chromium cases and
  10 documented live-catalog/production skips.
- `pnpm cf:prod-dry-run` — Passed; production account/domain, live D1,
  Workflow, all providers, and `SOURCE_CLOSED_RETENTION_DAYS="60"` resolved.
- `git diff --check` — Passed. The task-owned Playwright preview exited; ports
  4173 and 8787 are not listening and no task-owned browser/preview process
  remains.

### Retention release pushed, deployed, and live-verified — 2026-08-04

- Commit `b0586b2ec39f045e5f83fd74580502208cad02d2` was pushed to
  `origin/main` and deployed with the account pinned to Hutong531.
- Production Worker version `7f7717ea-f08b-4632-b012-cea9008e124b` is serving
  `remotelens.co` and `remotelens.hutong531.workers.dev`; the deploy output
  resolved `SOURCE_CLOSED_RETENTION_DAYS="60"`, the live D1, and
  `remotelens-catalog-ingestion`.
- `wrangler workflows list/describe` — Passed; the existing
  `CatalogIngestionWorkflow` is registered and modified by this deployment.
- Authenticated production Workflow trigger — Passed;
  `df7b59ff-249b-4c91-a068-8e8c0cb51bae` completed JS Guru, Remote OK, WWR,
  finalization, and `clean up retired catalog data-1`. Cleanup reported
  `deletedSourceRecords=0`, `deletedIngestionCycles=0`, and `deletedLocks=0`
  because no rows were beyond the 60-day boundary at run time.
- Production D1 readback — Passed after the run: source records were 201
  active, 8 missing, and 2 closed; ingestion cycles were 10 successful, 2
  partial, and 1 failed; the live cache epoch was
  `epoch:ca8ce8e7bf448674e53219af`.
- Production HTTP smoke — Passed: `remotelens.co/`, `/jobs`, and
  `/api/v1/meta`, plus the workers.dev root, returned HTTP 200. `/jobs`
  returned the expected ISR cache policy and RemoteLens render-mode header.
- Final process cleanup — Passed; no task-owned preview, browser, Wrangler,
  Workerd, or listening port 4173/8787 remains.

### Browser-comment refinement started — 2026-08-01

- The requested scope is limited to public country examples/order, the default
  RemoteLens API origin in Skill setup, local CV/profile and manual form
  guidance, and the Index filter disclosure/layout.
- RemoteLens remains read-only: the Skill may prepare evidence-based answers
  for a user completing a form, but it does not open a browser, enter data,
  submit an application, or mutate a tracker.
- All Phase 14 acceptance cases passed focused or final validation, including
  the release gate `ACC-OPS-014`.

### Browser-comment copy and Index refinement implemented — 2026-08-01

- Public API/home examples now use `country=CN`; API validation guidance also
  uses CN, and the Index country options begin with China (CN) rather than
  Japan (JP).
- The Skill example now defaults to `https://remotelens.co/api/v1`. Local
  development and alternate deployments are documented as intentional
  overrides only.
- Added local CV/profile setup guidance for users who already have a file or
  need to draft one from supplied facts. Added evidence-based,
  field-by-field application-form preparation guidance while preserving the
  no-browser/no-entry/no-submit/read-only boundary.
- Rebuilt the Index filter panel so Employment, Seniority, Sort, and Apply are
  the primary controls. Country, Role, Scope, tag, Company, Source,
  stale/closed, and clear controls are now in a multi-row extra-filter grid.
  The native disclosure switches between `More exact filters` and
  `Hide extra filters`, with centered grid alignment.
- `pnpm skill:check` — Passed; 3/3 Skill contract and safety tests.
- Focused Vitest — Passed; 15/15 job-search and Skill tests.
- Focused Playwright — Passed; 24/24 desktop/mobile public-shell cases,
  including CN/API/Skill copy, expanded filter screenshots, no-JavaScript GET
  submission, axe, and overflow checks.
- Expanded filter screenshots:
  `test-results/public-shell-public-shell--bcc49-lters-aligned-and-multi-row-desktop-chromium/jobs-filters-expanded.png`
  and the corresponding mobile Chromium artifact.

### Browser-comment refinement release gate — 2026-08-01

- `pnpm validate` — Passed; Prettier, ESLint, strict TypeScript, 13 Vitest
  files/64 tests, 5 migration assertions, and the production build.
- `pnpm test:e2e` — Passed; 24 desktop/mobile Chromium cases. The 10 live
  catalog/production cases remain environment-gated skips by repository design.
- `git diff --check` — Passed.
- Process cleanup — Passed; the task-owned Playwright preview and browser
  processes exited, and ports 4173 and 8787 are not listening. No task-owned
  Vite, Workerd, Playwright, or Wrangler process remains.
- `pnpm cf:prod-dry-run` — Passed with the canonical site/API origins, live D1,
  ingestion Workflow, rate limiter, and all three providers resolved.
- `pnpm cf:prod-deploy` — Passed from pushed commit
  `4a8c623862481989f04df204843935806eb616a0`; Worker version
  `b7d81748-08c8-42db-9b63-50dbc8f6609e` was deployed to `remotelens.co` and
  the workers.dev fallback.
- Tracker-synchronized redeploy from `00a26b0` — Passed; current Worker
  version is `ca464ac4-9bdb-4be8-88d1-9c7ae64e19f8` on both production origins.
- Production HTTP smoke — Passed; home, `/jobs`, `/api`, `/skills/install`, and
  `/api/v1/meta` returned HTTP 200. Catalog HTML retained the ISR policy and
  security headers.
- Production Chromium smoke — Passed at desktop and mobile sizes; CN API
  examples, public Skill API/CV guidance, primary filter grouping, expanded
  disclosure, CN selection, and no horizontal overflow were verified.

### SSR and ISR delivery started — 2026-08-01

- The user requested that every page, especially job details, be delivered
  through SSR or ISR using TanStack Start's documented ISR model.
- Repository and live-production inspection confirmed that TanStack Start
  already server-renders route loaders and complete HTML, but `src/server.ts`
  overwrites every HTML cache policy with `Cache-Control: no-store`.
- The linked TanStack guide defines ISR through route-owned standard
  `Cache-Control` headers, shared-cache freshness, and
  `stale-while-revalidate`.
- The implementation target is an explicit site-wide SSR default, five-minute
  ISR for catalog-backed pages, one-day ISR for stable public pages, and
  uncached SSR for errors or unavailable catalog responses.
- Added the TanStack Start global configuration with `defaultSsr: true`; the
  built hydration payload confirms `ssr: true` for the root and job route.
- Added shared catalog and stable-page ISR policies plus an uncached SSR
  fallback. The server entry now preserves route-owned cache headers instead of
  replacing them with `no-store`.
- Applied five-minute CDN freshness and one-hour stale-while-revalidate to
  home, canonical/filtered Index, and job-detail HTML. Applied one-day CDN
  freshness and seven-day stale-while-revalidate to About, API, Privacy, and
  Agent Skill.
- Added explicit `X-RemoteLens-Render-Mode` evidence and kept 404/unavailable
  HTML at `Cache-Control: no-store`.
- Added focused Vitest coverage and desktop/mobile HTTP acceptance for the
  global SSR default, both ISR policy tiers, preservation by the server entry,
  complete job-detail HTML, and uncached missing-job SSR.
- `pnpm validate` passed formatting, ESLint, TypeScript, 64/64 Vitest tests,
  5/5 migration assertions, and the production build.
- `pnpm test:e2e` passed 22/22 applicable desktop/mobile cases with 10
  environment-gated live-catalog/production cases skipped as designed.
- Production Wrangler dry run, remote migration readback, and
  `git diff --check` passed.
- Deployed production Worker version
  `e9f6dac1-bcb9-48db-9a39-755d1c42ddc2`.
- The first immediate post-deploy request observed mixed old/new edge versions.
  Three subsequent repeated probes across the canonical and workers.dev
  domains returned the new ISR policies for every page class.
- Final canonical-domain verification passed for complete SSR HTML and
  canonicals on home, Index, filtered Index, About, API, Privacy, Agent Skill,
  and one sitemap-listed production job. Missing jobs remained uncached SSR;
  redirects, API metadata, the 175-location sitemap, and favicon remained
  healthy.

### Search identity and favicon delivery started — 2026-08-01

- The user supplied a Google result with expanded sitelinks as the target
  search-result pattern, while explicitly retaining RemoteLens's own subpages.
- Google chooses whether and when to show sitelinks; the implementation target
  is eligibility through consistent site identity, hierarchy, unique metadata,
  canonical URLs, structured data, internal labels, crawlability, and sitemap
  coverage.
- Live inspection found no favicon, manifest, structured data, Open Graph site
  identity, or absolute canonical delivery. `/favicon.ico`, `/favicon.svg`, and
  `/site.webmanifest` returned 404.
- The existing product lens/crosshair mark is the approved icon direction. One
  direct GPT Image master-sheet request was rejected because it introduced
  gradients, shadows, and changed proportions; no second billable image call
  was made.
- Deterministic SVG masters and web exports now preserve the approved geometry.
  The normalized icon validation passed identical geometry, true monochrome
  variants, centering, transparent corners, palette, and maskable safe-zone
  checks.
- Added the complete SVG/ICO/PNG/Apple touch/PWA/maskable asset matrix and web
  manifest, plus explicit root-level icon links.
- Corrected both Wrangler asset-routing configurations so root-level favicon
  and manifest files bypass the Worker and reach Cloudflare's static asset
  layer. The first browser run caught this as a real 404 before deployment.
- Added shared SEO helpers for absolute production URLs, consistent page/social
  metadata, JSON-LD scripts, and breadcrumb hierarchy.
- Added `WebSite` and Organization identity on the home page, unique titles and
  descriptions across primary pages, absolute canonicals, breadcrumb data on
  subpages/jobs, explicit active-job crawler directives, and stable footer
  links to the real primary pages.
- Added focused Vitest coverage and desktop/mobile Playwright coverage for
  identity metadata, JSON-LD parsing, canonicals, favicon files, and manifest
  contents.
- `pnpm validate` passed formatting, ESLint, TypeScript, 59/59 Vitest tests, 5/5
  migration assertions, and the production build.
- `pnpm test:e2e` passed 20/20 applicable desktop/mobile cases with 10
  environment-gated live-catalog/production cases skipped as designed.
- Production Wrangler dry run and `git diff --check` passed.
- Deployed production Worker version
  `9779ff80-3ce8-485d-b98b-ebe6981cba2c`.
- Live home, Index, Agent Skill, API, About, Privacy, and one sitemap-listed job
  returned HTTP 200 with one title, description, absolute canonical, and
  parseable expected structured-data type.
- Live SVG, ICO, 16/32 PNG, Apple touch, 192/512 PWA, maskable, and manifest
  responses returned HTTP 200 with correct content types and byte-for-byte
  matches to the local artifacts. The ICO contains 16, 24, 32, 48, and 64 pixel
  frames.
- No process remains on the Playwright preview port 4173 after the run.

### Search discovery sitemap started — 2026-08-01

- The user requested a production `sitemap.xml` and will perform the final
  Google Search Console submission.
- Production uses `https://remotelens.co` as the canonical site origin.
- The sitemap scope is the six indexable static HTML routes plus active
  canonical job-detail pages backed by at least one enabled provider.
- Redirects, API data endpoints, feeds, filtered result URLs, and inactive jobs
  are excluded.
- Production inspection found `0002_jsguru_provider.sql` pending because the
  completed Phase 10 release is on `main` but has not yet been deployed.
- Added a D1-backed `/sitemap.xml` response containing six static pages and
  every active canonical job backed by at least one enabled provider. The
  query is capped at the sitemap protocol's 50,000-location limit and returns a
  retryable 503 instead of an incomplete sitemap when D1 is unavailable.
- Added focused coverage for canonical origin handling, static and job
  locations, enabled-provider visibility, robots fallback behavior, and the D1
  failure path.
- Stripped default job filters from the Index URL so `/jobs` is a direct HTTP
  200 rather than a redirect to an explicit-default query string; the page
  canonical and sitemap location both use `/jobs`.
- `pnpm validate` passed formatting, ESLint, TypeScript, 56/56 Vitest tests, 5/5
  migration assertions, and the production build.
- Production Wrangler dry run and `git diff --check` passed.
- Reviewed and applied `0002_jsguru_provider.sql`; remote migration readback
  reports no pending migrations.
- Deployed production Worker version
  `0a887ba8-9784-42b7-b038-5b08b0d8e67a`.
- Live `https://remotelens.co/sitemap.xml` returned HTTP 200 with valid XML,
  175 unique canonical locations, 169 active job URLs, 169 valid `lastmod`
  values, and no redirects, API/feed paths, query strings, foreign origins, or
  duplicate locations.
- Live `/jobs`, a sitemap-listed job, `/`, and `/api/v1/meta` returned HTTP
  200; the Index canonical tag is `/jobs`, and catalog metadata retained 169
  active jobs.
- The Worker fallback robots response contains the canonical sitemap
  directive. Cloudflare Managed Content replaces the apex response with
  `search=yes` and `Allow: /`; Googlebot remains allowed, while named AI
  training crawlers are disallowed. Direct Google Search Console sitemap
  submission is unaffected.
- No background process was started; process cleanup was not required.

### Public GitHub release completed — 2026-08-01

- Created the public repository `https://github.com/windht/remotelens`.
- Set the repository homepage to `https://remotelens.co`.
- Set the public description to: “A public, read-only index of remote developer
  jobs with structured filters, source attribution, API feeds, and an Agent
  Skill.”
- Rechecked all reachable commits against the current local DeepSeek key and
  common credential/private-key formats without printing secret values; no
  reachable match was found and no populated secret environment file is
  tracked.
- Pushed local `main` normally. The local-only unreachable secret blob was not
  pruned and was not transferred by the push.

### MIT license selected — 2026-08-01

- The owner selected the MIT License for the open-source release.
- Added the standard MIT text in `LICENSE` with copyright
  `2026 Tony Hu Tong`.
- Declared `"license": "MIT"` in `package.json` and linked the license from
  `README.md`.
- `pnpm validate` passed after the license change: formatting, ESLint,
  TypeScript, 52/52 Vitest tests, 5/5 migration assertions, and the production
  build.
- The license-choice blocker is resolved. Phase 9 remains blocked only on the
  explicit decision to authorize or decline destructive pruning of the
  local-only unreachable Git object.

### JS Guru Jobs and clean-index work completed — 2026-08-01

- The user requested JS Guru Jobs as a data source using only the first three
  server-rendered job pages, followed by the existing normalization and
  deduplication flow with visible attribution.
- Live read-only inspection confirmed `/jobs`, `/jobs?page=2`, and
  `/jobs?page=3` return complete server-rendered listing cards without browser
  execution.
- The Stitch design workflow created `RemoteLens Clean Index 2026` as asset
  `8629006953645284097` in the existing RemoteLens project and generated
  selected desktop screen `c3a57344463d4ca19a18d44e0c2fdeac`.
- The selected direction uses Geist sans-serif, a conventional `72rem` content
  column, a bounded filter panel, and individually bordered job cards. It
  preserves exact structured filtering and rejects a keyword search, large
  editorial hero, serif typography, decorative provenance rails, and sticky
  blur.
- Phase 10 implementation and acceptance coverage was added before code changes.
- Added the Cheerio-backed `jsguru` adapter and fetched exactly `/jobs`,
  `/jobs?page=2`, and `/jobs?page=3`; numeric listing IDs are aggregated before
  the existing cross-source canonical deduplication flow.
- Added the independent provider flag, health/lifecycle state, Workflow
  observation, API/source filters, metadata, documentation, and D1 migration
  `0002_jsguru_provider.sql`.
- The bounded live check fetched 30 admitted listings from 3/3 HTTP 200 pages
  with 0 rejected and 0 duplicate records. The deterministic aggregate hash was
  `1854787deefacc0ab072ca9d659a40a3eb5fec8b4a24716d4bd0289ef5109879`.
- Applied the selected Geist clean-index presentation with neutral surfaces, a
  `72rem` content width, one bounded filter panel, individually bordered job
  cards, and visible `via JS Guru Jobs` attribution.
- `pnpm validate` passed formatting, ESLint, TypeScript, 52/52 Vitest tests,
  5/5 migration assertions, and the production build.
- `pnpm test:e2e` passed 18 cases with 10 environment-gated skips, including
  desktop/mobile, no-JavaScript, overflow, source attribution, and axe coverage
  with no serious or critical violations.
- `pnpm ingest:live-check`, `pnpm db:migrate:local`, `pnpm cf:typegen`,
  `pnpm cf:dry-run`, `pnpm cf:prod-dry-run`, `pnpm format:check`, and
  `git diff --check` passed.
- Production deployment and remote production migration were intentionally not
  performed; validation stopped at the local migration and production dry-run.

### Open-source release audit started — 2026-07-31

- The user requested a pre-publication check for material leaked into Git and a
  README containing only public user-facing content.
- The audit covers the working tree, ignored/generated files, all reachable Git
  blobs, credential patterns, local paths, personal identifiers, and production
  resource metadata. Secret values must not be printed during inspection.
- Confirmed the repository has one reachable commit and no configured remote.
  No reachable commit, ref, reflog entry, or publishable working-tree file
  matches common private-key, cloud-key, GitHub, Slack, Stripe, or JWT
  credential patterns.
- Confirmed `.dev.vars` is populated locally but ignored, was never committed,
  and is not reachable from any Git ref. Only `.env.example` and
  `.dev.vars.example` are tracked; their credential fields are empty or
  documented placeholders.
- Found one unreachable Git blob containing the same populated DeepSeek key as
  the current ignored `.dev.vars`. It is not reachable by a normal push, but
  removing it requires `git gc --prune=now`-style destructive cleanup that
  would discard all unreachable recovery objects. This was not run without
  explicit authorization.
- Classified the committed/working Cloudflare account and D1 IDs as resource
  identifiers, not authentication credentials. They allow no access without
  Cloudflare authentication. No personal email or machine-specific user path
  remains in the publishable working tree.
- Replaced the README with public product, live-site, Agent Skill, API,
  privacy/source, contributor setup, validation, and technology content.
  Removed internal phase, operator, deployment, and tracker narration.
- Added `scripts/sanitize-build-output.mjs`; every `pnpm build` now removes
  generated `.env` and `.dev.vars` copies from `dist` after Vite completes.
- README formatting passed, all three local links exist, the live Index/API/
  Skill/privacy routes and documented API example returned HTTP 200, and
  publishable/reachable credential-pattern rescans returned no findings.
- `pnpm validate` passed after the release-hardening change: formatting, lint,
  TypeScript, 47/47 tests, 4/4 migration tests, and production build. Post-build
  readback found no `.env` or `.dev.vars` file under `dist`.

## Blockers

- None for the public GitHub release. The local-only unreachable secret blob
  remains relevant only if the complete `.git` directory is archived or shared;
  it is not part of the public repository.

### Domain/install correction started — 2026-07-31

- The user confirmed the remaining design and behavior are accepted.
- The requested repository installation command is
  `npx skills add windht/remotelens`; the missing final `n` in the browser
  comment is treated as a typo because the repository and product are named
  `remotelens`.
- Public DNS initially returned NXDOMAIN while the new Cloudflare zone was
  activating. Readback then confirmed active zone
  `e1d3efb38952809b28e954a837206249` in the selected Hutong531 account with
  nameservers `jeremy.ns.cloudflare.com` and `margot.ns.cloudflare.com`.
- Replaced the public install command and client-local workflow reference with
  exactly `npx skills add windht/remotelens`; updated browser coverage and added
  an exact unit-test assertion that rejects the obsolete selector.
- Added the `remotelens.co` custom-domain route to the production Wrangler
  configuration while keeping `workers_dev: true`; production site/API origins
  now point to the apex.
- Targeted validation passed: Skill tests (3/3), TypeScript, production
  Wrangler dry run, and `git diff --check`.
- Full `pnpm validate` passed after the final responsive adjustment: formatting,
  lint, TypeScript, 47/47 tests across 10 files, 4/4 migration tests, and the
  production build.
- Local `pnpm test:e2e` passed 18 applicable desktop/mobile cases with 10
  production-only cases skipped as designed.
- Deployed the apex custom-domain route and preserved the workers.dev fallback.
  Final production version: `64a85888-d1de-4daf-9697-a42785115030`.
- Public Cloudflare DNS-over-HTTPS returned the expected two nameservers and
  Cloudflare anycast A records. TLS verification returned zero errors; `/`,
  redirected `/jobs`, `/skills/install`, and `/api/v1/meta` returned HTTP 200.
  The metadata endpoint reported 169 active jobs, a successful last cycle, and
  both providers healthy.
- Production RSS entries use `https://remotelens.co/jobs/...` absolute links.
  The Skill page contains only `npx skills add windht/remotelens`, while the
  obsolete selector and checkout-copy instructions are absent.
- The first production infinite-loading check ran during edge propagation and
  timed out with the initial ten rows. Direct request tracing confirmed the
  cursor endpoint and observer were healthy; two subsequent full
  desktop/mobile production runs passed all four cases, including infinite
  loading, navigation, redirects, accessibility, and the Skill command.
- Separate desktop/mobile visual QA found and fixed a 28-pixel mobile overflow
  in the installation prose grid. Final 390-pixel viewport readback was
  `scrollWidth: 390`, and the command was visible without clipping.
- Process cleanup passed: the persistent Playwright browser reported
  disconnected after close; no listener remained on ports 4173 or 8787.

### Browser-comment refinement started — 2026-07-31

- The user supplied twelve production-page comments covering information
  architecture, landing/Index composition, filtering, pagination, provider
  marks, and Skill installation.
- The current implementation preserved the Field Index tokens but diverged
  from the selected Stitch composition through an oversized browse hero,
  permanent filter sidebar, redundant editorial routes, and up to 100
  server-rendered result rows.
- Phase 7 was added before implementation with separate acceptance coverage for
  navigation, landing composition, horizontal filters, Radix Select, bounded
  SSR/infinite loading, provider marks, publishable Skill installation, and
  production verification.

### Full-plan execution started — 2026-07-31

- The user asked to finish the complete RemoteLens delivery plan.
- Phases 0–5 are implemented, validated, accepted, and synchronized.
- One phase remained: Phase 6, with six production tasks (P6-001 through P6-006).
- Production work must not be marked complete until live D1, deployment,
  ingestion, public-read, operations, and recovery evidence is recorded.

### Operator-directed Cloudflare setup — 2026-07-31

- Selected the Hutong531 Cloudflare account
  `d06a8c795d2fd2c7718ed48c534dc2ba` and recorded it in `wrangler.jsonc`.
- Confirmed all four requested entries in `.dev.vars` were non-empty without
  printing their values.
- Uploaded `DEEPSEEK_API_KEY`, `DEEPSEEK_API_BASE_URL`,
  `DEEPSEEK_API_MODEL`, and `API_CURSOR_SECRET` with Wrangler bulk secrets.
- Because the Worker did not previously exist, Wrangler created `remotelens`
  and Cloudflare automatically created an initial upload deployment followed by
  a secret-change version.
- Verified all four remote bindings are `secret_text`.
- No application bundle, Workflow schedule, or source ingestion was deployed or
  activated by this setup operation. The production D1 was created and
  migrated later under Phase 6 progress below.

## Completed

### Phase 0

- Preserved the supplied planning, context, source-policy, and ADR documents.
- Created and synchronized `IMPLEMENTATION_PLAN.md`, `TASKS.md`,
  `ACCEPTANCE.md`, and `WORKLOG.md`.
- Created the Stitch project `projects/10358525635842427502`; selected design
  asset `assets/a11ebb7086aa4bad8209e3ecacacdae1`; and recorded all responsive
  screen IDs, tokens, and rejected concepts in `docs/design.md`.
- Implemented the strict TanStack Start/React Cloudflare SSR foundation,
  Tailwind 4, customized shadcn-compatible primitives, responsive public shell,
  skip navigation, security headers, and validated runtime configuration.
- Implemented fixture-backed `/`, `/jobs`, `/jobs/:slug`, `/sources`,
  `/methodology`, `/api`, `/skills/install`, `/privacy`, and `/about` routes.
- Implemented exact URL-driven GET filters, JavaScript-disabled submission,
  empty-result and malformed-filter states, source attribution, provenance, and
  clearly labeled later-phase API/Agent Skill previews.
- Added Vitest, Playwright, axe, CI, README, and process-safe test commands.

### Phase 1

- Added an 11-table Drizzle/D1 schema and initial migration for source records
  and labels, ingestion cycles and provider runs, health, locks, cache state,
  job/provenance scaffolding, and auditable dedupe candidates/decisions.
- Added deterministic normalization, HTML sanitization, lexical label
  classification, hashing, bounded errors, environment validation, and adapter
  contracts.
- Implemented Remote OK admission from positive title markers plus qualifying
  provider tags. Descriptions do not participate in admission.
- Implemented exactly four WWR programming RSS feeds, GUID/listing-URL
  identity, safe title splitting, and cross-feed category aggregation.
- Implemented D1 cycle/lock claims, incremental idempotent upserts, health/run
  summaries, independent suspension, partial-run safeguards, missing/closure
  and 30-day retention logic, cache-epoch rotation, and deterministic
  unresolved cross-source candidate creation.
- Added `CatalogIngestionWorkflow`, bound directly at `0 */12 * * *`. No Cron
  handler or public ingestion route exists.
- Added fixture-driven full, repeated, partial, failed, stale, retention, lock,
  flag, cache-epoch, and dedupe tests.
- Ran the approved bounded live development fetch entirely in memory. No raw
  payload, R2 object, production D1 mutation, secret, or production deployment
  was created.

### Phase 2

- Extended the D1 jobs projection with canonical structured fields, stable
  fingerprints/IDs/slugs, lifecycle timestamps, filter projections, tags, and
  field-level provenance.
- Implemented deterministic field derivation from sanitized source text,
  source-priority selection, conflict-preserving source associations, and
  repeatable canonical rebuilds.
- Implemented exact duplicate grouping, append-only dedupe decisions, bounded
  OpenAI-compatible DeepSeek semantic fallback, structured response validation,
  retry/error recording, and the hard maximum of 50 semantic candidates per
  run.
- Connected canonical visibility to source health, source lifecycle, provider
  suspension, and retained provenance/source history.
- Added canonical schema, deterministic merge/separation, semantic contract,
  stable rebuild, lifecycle, and suspension integration coverage.

### Phase 3

- Added the versioned `/api/v1` contract for job lists, job detail, taxonomy,
  and provider/catalog metadata with signed request-bound cursors and stable
  Zod-validated response/error envelopes.
- Added exact structured eligibility, company, source, tag, salary, date,
  status, timezone, and enum filters. Unknown exact companies/tags return empty
  `200` results; malformed fixed values return `invalid_filter` `400`.
- Added active-only JSON/RSS feeds, maintained `docs/openapi.json`, public
  GET/HEAD/OPTIONS CORS, epoch-keyed successful-response caching, security
  headers, request IDs, and the Cloudflare `API_RATE_LIMITER` binding at
  `120 requests/60s`.
- Added direct API contract coverage for pagination, cursor rejection,
  provenance, filters, feeds, OpenAPI, methods, CORS, rate errors, and cache
  behavior in `tests/api/public-api.test.ts`.

### Phase 4

- Replaced fixture-only public reads with D1-backed SSR catalog reads, retaining
  sanitized fixtures only as an explicit local empty-catalog fallback.
- Added safe unavailable-catalog states, live role-family filtering,
  provider-specific freshness, source destinations, conflict preservation,
  canonical URLs, and noindex metadata for stale/closed jobs.
- Updated API and Skill documentation to shipped behavior and added live D1
  seed/cleanup fixtures plus external Worker Playwright coverage.

### Phase 5

- Added the repository-owned `skills/remotelens/` package with API, matching,
  CV-safety, client-local workflow references, and an example configuration.
- Added deterministic explainable matching and safety tests covering evidence
  citations, selected-file-only access, untrusted job/CV text, and the explicit
  no-upload/no-scraping/no-tracker-mutation/no-submission boundary.
- Added `pnpm skill:check` and updated the installation route and README.

### Phase 6 progress

- Created the APAC production D1 `remotelens-catalog` and replaced the
  placeholder binding ID in `wrangler.jsonc`.
- Applied both repository migrations remotely and verified migration rows,
  expected tables/indexes, no raw-payload table, and zero pre-bootstrap data.
- Added `docs/operations.md` covering export, Time Travel restore, diagnosis,
  provider suspension/recovery, secret hygiene, production smoke, and cleanup.
- Added `wrangler.production.jsonc` plus `cf:prod-dry-run`/`cf:prod-deploy`
  scripts so production values and the built Worker bundle are explicit while
  local development retains fixture-safe defaults.
- Rotated `API_CURSOR_SECRET` with a newly generated value without printing it.
- The user confirmed that the existing DeepSeek key may be reused and confirmed
  rate-limit namespace `1001`; no key value was recorded or printed.
- Deployed the validated Worker and direct Workflow. The final production
  deployment version was `e4df130f-027e-4309-beb0-17aaadc02255`.
- Completed authenticated bootstrap instance
  `729efeff-d0fa-4ffd-be4b-af4a0180e5cb`: Remote OK admitted 2 of 100 fetched;
  WWR admitted 167 of 199 fetched; final cache epoch was
  `epoch:763407dc068ddc9ecb354f7a`.
- Verified production D1 readback: 169 active jobs, 2 active Remote OK records,
  167 active WWR records, healthy/enabled provider rows, and three successful
  cycles.
- Completed controlled WWR suspension/recovery: public visibility dropped to
  the 2 Remote OK jobs during suspension while 167 WWR records were retained,
  then recovered to 169 jobs after re-enabling WWR.

### Phase 7

- Focused the public information architecture on `Index`, `Agent Skill`, and
  `API`; retired `/sources` and `/methodology` now redirect to compact landing
  disclosures.
- Removed the DevOps/Sysadmin warning and the API freshness section.
- Rebuilt the landing page around the selected asymmetric Stitch direction and
  a ten-job latest ledger.
- Made `/jobs` a dedicated Index with a compact sticky horizontal filter row,
  shadcn/Radix Select controls, native no-JavaScript fallbacks, and shareable
  GET URLs.
- Bounded landing and Index SSR to ten jobs, retained the complete matching
  count, and added cursor-backed infinite loading in batches of ten with
  loading, retry, manual fallback, de-duplication, and terminal states.
- Embedded local favicon-derived Remote OK and We Work Remotely marks.
- Updated the Agent Skill installation command to
  `npx skills add windht/remotelens`.
- Added production-only Phase 7 Playwright acceptance coverage and direct
  Workers-IP routing support for environments whose local proxy cannot reach
  `workers.dev`.
- Corrected Cloudflare asset routing so dynamic canonical paths execute the
  current Worker before static-asset lookup while hashed `/assets/*` files
  remain direct. Dynamic HTML now returns `Cache-Control: no-store`.
- Deployed final production version
  `77472bf9-cd45-47e0-910a-46347a339308`.

## Validation

- `pnpm install` — Passed.
- `pnpm cf:typegen` — Passed; generated D1 and Workflow binding types.
- Phase 0–1 baseline `pnpm validate` — Passed:
  - format check — Passed;
  - ESLint — Passed;
  - strict TypeScript — Passed;
  - Vitest — 7 files, 33 tests passed;
  - migration assertions — 3 tests passed;
  - production Worker build — Passed.
- Phase 2 `pnpm format:check` — Passed.
- Phase 2 `pnpm lint` — Passed.
- Phase 2 `pnpm typecheck` — Passed.
- Phase 2 `pnpm test` — Passed; 8 files, 37 tests.
- Phase 2 `pnpm db:migrate:check` — Passed; 4 migration assertions.
- Phase 2 `pnpm build` — Passed.
- Phase 2 `pnpm cf:dry-run` — Passed; canonical Worker bundle, D1 binding, and
  direct Workflow binding resolved.
- Phase 3 `pnpm format:check` — Passed.
- Phase 3 `pnpm lint` — Passed.
- Phase 3 `pnpm typecheck` — Passed.
- Phase 3 `pnpm test` — Passed; 9 files, 43 tests.
- Phase 3 `pnpm db:migrate:check` — Passed; 4 migration assertions.
- Phase 3 `pnpm build` — Passed.
- Phase 3 `pnpm cf:dry-run` — Passed; `API_RATE_LIMITER` resolved as
  `120 requests/60s`, D1 and Workflow bindings remained resolved.
- Phase 3 direct HTTP smoke — Passed through local Wrangler Worker on
  `127.0.0.1:8787`: `GET`, `HEAD`, `OPTIONS`, malformed filters, mutation,
  feeds, and OpenAPI returned the expected status, headers, and envelopes.
- `pnpm db:migrate:local` — Passed; 27 migration commands applied to the local
  disposable D1 state.
- Second `pnpm db:migrate:local` — Passed; reported no migrations to apply.
- After wiring the real production D1 ID, the fresh local D1 state required
  `pnpm db:migrate:local` again; 27 and 33 migration commands then passed across
  the two migrations.
- `pnpm cf:dry-run` — Passed; resolved `CATALOG_INGESTION` as
  `CatalogIngestionWorkflow` and `DB` as the D1 binding.
- `pnpm test:e2e` — Passed after the canonical SSR rebuild fix; 16/16
  desktop/mobile Chromium cases.
- Initial post-binding `pnpm test:e2e` — Failed 6 cases because the new local
  D1 state had not yet been migrated; no code failure was present.
- Rerun after local migration — Passed; 16/16 public-shell desktop/mobile
  Chromium cases, with 6 live-catalog cases intentionally skipped by default.
- External live-catalog Playwright run — Passed; 3/3 tests against the local
  Wrangler Worker with live D1 seed data.
- `pnpm skill:check` — Passed; 3 deterministic Skill contract and safety tests.
- Phase 4–5 final validation — Passed: `pnpm format:check`, `pnpm lint`,
  `pnpm typecheck`, `pnpm test` (10 files, 47 tests),
  `pnpm db:migrate:check` (4 assertions), `pnpm build`, and `pnpm cf:dry-run`.
- `pnpm cf:prod-dry-run` — Passed with `wrangler.production.jsonc`: production
  APP_ENV/URLs, real D1, direct Workflow schedule, both providers,
  observability, and rate-limit binding resolved.
- `wrangler secret list` against the selected account — Passed; four requested
  names returned as `secret_text`.
- `wrangler deployments list` against the selected account — Passed; initial
  upload and secret-change versions present.
- Playwright axe checks — Passed with no serious or critical violations on all
  critical routes.
- JavaScript-disabled structured-filter case — Passed on desktop and mobile.
- Mobile overflow and screenshot assertions — Passed at 390×844.
- Desktop responsive assertions — Passed at 1440×1000.
- `CLOUDFLARE_ACCOUNT_ID=... pnpm exec wrangler d1 migrations list
remotelens-catalog --remote --config wrangler.production.jsonc` — Passed;
  no migrations to apply.
- Production D1 readback with the account pinned — Passed; 169 active jobs,
  2 Remote OK records, 167 WWR records, 3 successful cycles, cache epoch
  `epoch:763407dc068ddc9ecb354f7a`, and both providers enabled/healthy.
- `pnpm exec wrangler workflows list --config wrangler.production.jsonc` —
  Passed; `remotelens-catalog-ingestion` is registered as
  `CatalogIngestionWorkflow` on `remotelens`.
- `pnpm exec wrangler workflows instances list remotelens-catalog-ingestion
--config wrangler.production.jsonc` — Passed; latest instance completed.
- Authenticated Workflow instance description — Passed; instance
  `729efeff-d0fa-4ffd-be4b-af4a0180e5cb` completed its claim, Remote OK, WWR,
  and finalization steps successfully.
- Production HTTP smoke — Passed; home, metadata, jobs, taxonomy, OpenAPI,
  `/feeds/jobs.json`, and `/feeds/jobs.xml` returned expected `200` responses;
  `/api/v1/feeds/jobs.json` correctly returned `404`.
- Production Chromium smoke — Passed; seven dynamic routes rendered, security
  headers were present, no serious/critical axe violations were found, and no
  horizontal overflow was detected. The browser closed in `finally`.
- Final `pnpm validate` — Passed after tracker synchronization: Prettier,
  ESLint, strict TypeScript, 10 Vitest files/47 tests, 4 migration assertions,
  and the production build.
- Final `pnpm cf:prod-dry-run` — Passed after tracker synchronization; the
  production D1, direct Workflow, both provider flags, observability, and
  `API_RATE_LIMITER` (`120 requests/60s`, namespace `1001`) resolved.
- Final `pnpm test:e2e` — Passed: 16 desktop/mobile Chromium tests; 6 live-D1
  fixture tests intentionally skipped by default.
- `git diff --check` — Passed.
- Phase 7 `pnpm validate` — Passed twice after the mobile toolbar and
  Worker-first routing changes: Prettier, ESLint, strict TypeScript, 10 Vitest
  files/47 tests, 4 migration assertions, and the production build.
- Phase 7 `pnpm test:e2e` — Passed: 18 desktop/mobile cases, with 6 live-D1
  fixture cases and 4 production-only cases intentionally skipped by default.
- Phase 7 `pnpm cf:prod-dry-run` — Passed with the production D1, Workflow,
  rate limiter, static assets, and selective Worker-first routing resolved.
- Phase 7 production HTTP verification — Passed: landing and Index canonical
  HTML each contained exactly ten job rows; retired routes returned 301; the
  DevOps warning and API freshness section were absent; and the GitHub-ready
  Skill command was present.
- Phase 7 production Playwright — Passed 4/4 desktop/mobile cases against the
  final deployment. Infinite scroll appended cursor-backed pages without
  duplicate job URLs, mobile toolbar height remained below 160px, and axe
  reported no serious or critical issues.
- Phase 13 focused rendering tests — Passed; explicit global SSR, catalog ISR,
  stable-page ISR, uncached SSR fallback, and response-header preservation.
- Phase 13 `pnpm validate` — Passed: formatting, ESLint, strict TypeScript, 13
  Vitest files/64 tests, 5 migration assertions, and the production build.
- Phase 13 `pnpm test:e2e` — Passed: 22 applicable desktop/mobile Chromium
  cases; 10 live-D1/production cases intentionally skipped by default.
- Phase 13 targeted Playwright rerun — Passed 2/2 desktop/mobile ISR cases
  after strengthening the raw job-HTML assertions.
- Phase 13 `pnpm cf:prod-dry-run` — Passed with production D1, Workflow, rate
  limiter, static assets, and route-owned rendering policies resolved.
- Production D1 migration readback — Passed with the Hutong531 account pinned;
  no migrations remain to apply.
- Phase 13 production HTTP verification — Passed for all public page classes,
  canonical and filtered Index URLs, a sitemap-listed active job, missing-job
  SSR, redirects, API metadata, sitemap, and favicon.

## Live development fetch

Executed 2026-07-30 from `16:15:56Z` to `16:16:00Z`.

- Remote OK: HTTP 200 JSON; 100 job rows inspected; 1 admitted; 99 rejected by
  the strict deterministic contract; response SHA-256
  `3eb0cc2d5cd27b54c1875781dfae69e1746ae3dbc77055b98ba93b94011246de`.
- WWR: all 4/4 approved RSS feeds returned HTTP 200; 224 observations; 190
  normalized source records; 34 cross-feed duplicate observations aggregated;
  response SHA-256
  `ee16d0d8f20b9d8701bf8f9e0b6d769723e3c4222f5701f6ce60577ddde3f52c`.
- WWR errors: none.
- Raw payload persistence: disabled and not performed.

## Acceptance

- All Phase 0 design, shell, navigation, filtering, provenance, documentation,
  accessibility, responsive, operations, and security cases passed.
- All Phase 1 database, Remote OK, WWR, Workflow, locking, idempotency, health,
  partial-run, lifecycle, suspension, cache-epoch, dedupe-foundation, and live
  fetch cases passed.
- All Phase 2 schema, canonicalization, field-derivation, semantic-dedupe,
  lifecycle, suspension, and repeatable-rebuild cases passed.
- All Phase 3 public API, cursor, feed, OpenAPI, CORS, caching, rate-limit, and
  direct HTTP acceptance cases passed.
- All Phase 4 live SSR, filtering, provenance, freshness, SEO, safe-state,
  responsive, accessibility, and documentation cases passed.
- All Phase 5 package, installation, explainable matching, and prompt-injection
  safety cases passed.
- Phase 15 acceptance passed: the exact inclusive 60-day boundary,
  foreign-key-safe canonical rebuild, completed-history pruning, successful-only
  execution, idempotent repeat, pushed commit, production deployment, live
  Workflow cleanup step, D1 readback, and HTTP smoke were verified.
- All Phase 6 acceptance cases passed: production D1, deployment and schedule,
  authenticated bootstrap, public reads, refreshed provenance, runbook, and
  non-destructive WWR suspension/recovery.
- `ACC-OPS-006` passed with no unresolved required blocker.
- All Phase 7 refinement cases passed: focused navigation and redirects,
  selected landing composition, sticky horizontal filters, Radix/native
  select flows, bounded SSR and cursor loading, provider marks, Skill
  installation, production visuals, and deployment routing.
- `ACC-OPS-007` passed with no unresolved required blocker.
- All Phase 13 rendering cases passed: explicit site-wide SSR, complete initial
  job HTML, bounded catalog ISR, longer stable-page ISR, and uncached SSR
  failure/not-found behavior.
- `ACC-OPS-013` passed with no unresolved required blocker.
- `ACCEPTANCE.md` contains the exact user/operator steps and current results.

## Evidence

- Design IDs and implementation direction: `docs/design.md`.
- Browser automation: `tests/e2e/public-shell.spec.ts`.
- Mobile captures:
  `test-results/public-shell-public-shell--6a92a--has-no-horizontal-overflow-mobile-chromium/`.
- Unit and fixture contracts: `tests/unit/` and `tests/fixtures/`.
- Lifecycle/incremental tests: `tests/integration/catalog-engine.test.ts`.
- Canonicalization, semantic dedupe, lifecycle, and provenance tests:
  `tests/integration/canonical-jobs.test.ts`.
- Public API contract tests: `tests/api/public-api.test.ts`.
- OpenAPI contract: `docs/openapi.json`.
- Migration/schema assertions: `tests/migrations/schema.test.ts`.
- D1 migration: `drizzle/migrations/0000_complex_changeling.sql`.
- Canonical D1 migration: `drizzle/migrations/0001_canonical_jobs.sql`.
- Cloudflare configuration: `wrangler.jsonc`.
- Production deployment configuration: `wrangler.production.jsonc`.
- In-memory live-check command: `scripts/live-fetch.ts`.
- Live catalog seed/cleanup: `tests/fixtures/live-catalog.sql` and
  `tests/fixtures/clear-live-catalog.sql`.
- Live Worker browser coverage: `tests/e2e/live-catalog.spec.ts`.
- Final production browser smoke: dynamic Chromium run against
  `https://remotelens.hutong531.workers.dev`; output recorded above.
- Agent Skill package and safety coverage: `skills/remotelens/` and
  `tests/unit/remotelens-skill.test.ts`.
- Phase 7 production browser coverage:
  `tests/e2e/phase7-production.spec.ts`.
- Phase 7 desktop/mobile landing, Index, and Skill screenshots:
  `test-results/phase7-production-Phase-7--07a84-R-then-appends-cursor-pages-*/`
  and
  `test-results/phase7-production-Phase-7--023d4-edirects-API-and-Skill-copy-*/`.
- Phase 10 adapter: `src/ingestion/adapters/jsguru.ts`.
- Phase 10 migration: `drizzle/migrations/0002_jsguru_provider.sql`.
- Phase 10 desktop/mobile screenshots:
  `test-results/public-shell-public-shell--6a92a--has-no-horizontal-overflow-desktop-chromium/jobs.png`
  and the corresponding mobile Chromium result directory.
- Phase 10 automated contracts: `tests/unit/adapters.test.ts`,
  `tests/integration/catalog-engine.test.ts`,
  `tests/integration/canonical-jobs.test.ts`,
  `tests/api/public-api.test.ts`, and `tests/e2e/public-shell.spec.ts`.
- Phase 13 rendering policy: `src/start.ts`, `src/lib/rendering.ts`, and the
  page-route `headers` configurations.
- Phase 13 automated contracts: `tests/unit/rendering.test.ts` and
  `tests/e2e/public-shell.spec.ts`.

## Process cleanup

- Playwright started the isolated preview on `127.0.0.1:4173` and stopped it
  after each browser run.
- Verified no task-owned Vite, Workerd, Playwright, or TSX process remains.
- Verified the latest Playwright preview exited cleanly and TCP ports 4173 and
  8787 are not listening. No task-owned Vite, Workerd, Playwright, or Wrangler
  dev process remains.
- The pre-existing `agent-browser` process with PID `34220` belongs to an
  unrelated checkout and was left untouched.
- The task-owned in-app browser verification tab was finalized; zero tabs
  remained. Production Playwright browsers exited after the four acceptance
  cases, and TCP port 4173 was not listening after the local suite.
- Final Phase 10 readback confirmed TCP ports 4173 and 8787 are not listening
  and no task-owned preview, Wrangler, Workerd, Playwright, or browser process
  remains.
- Phase 13 Playwright preview exited after both the full and targeted runs.
  TCP port 4173 is not listening; no task-owned server or browser process
  remains.

## Next

- None. Phase 15 implementation, acceptance, push, deployment, and live
  verification are complete.

## Known risks

- Local D1 validation uses Wrangler local state and deterministic migration
  assertions; production D1 creation/migration was separately verified by
  remote Wrangler readback.
- Production provider shapes can drift; the strict adapters intentionally reject
  malformed or ambiguous records and retain only bounded health evidence.
- Live catalog counts and freshness are a point-in-time production snapshot;
  the direct Workflow refreshes them every 12 hours.
- ISR depends on the shared cache honoring the standard `Cache-Control` and
  `CDN-Cache-Control` directives. The response policies are live and verified;
  cache-hit telemetry is not exposed in the current public response headers.
- The local proxy intermittently returned `ERR_CONNECTION_CLOSED` for
  `workers.dev`; final production verification bypassed only that local proxy
  with the public Cloudflare edge IP while preserving the production hostname,
  TLS, and browser behavior.
- The existing DeepSeek key is reused only under the user's explicit
  authorization. Its value is not stored in the repository or trackers.

## Blockers

- Phase 10 has no blocker.
- Phase 9 has no public-release blocker. The local-only unreachable Git blob is
  not reachable from the published repository and was not transferred.
- Phase 13 has no blocker.
- Phase 15 has no blocker.
