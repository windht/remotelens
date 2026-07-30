# RemoteLens

RemoteLens is a public, read-only remote developer-job index for people and AI
agents. It exposes source evidence and exact structured filters without
accounts, ads, promoted jobs, CV uploads, application tracking, or auto-apply.

This repository currently implements Phase 0 and Phase 1 only:

- a fixture-backed, accessible TanStack Start public shell on Cloudflare Workers;
- a D1/Drizzle ingestion foundation for Remote OK and the four approved We Work
  Remotely programming RSS feeds.

Later public API, feed, live-catalog UI, Agent Skill, and production deployment
phases are intentionally not enabled.

## Requirements

- Node.js 22 or newer
- pnpm 10.14.0

## Local development

```bash
pnpm install
pnpm cf:typegen
pnpm dev
```

Copy `.env.example` or `.dev.vars.example` only when overriding documented local
defaults. Do not add production credentials to either file.

## Validation

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm db:migrate:check
pnpm build
pnpm cf:dry-run
pnpm test:e2e:install
pnpm test:e2e
```

`pnpm test:e2e` starts and stops an isolated preview server. Migration commands
operate on Wrangler's local D1 state unless `--remote` is supplied explicitly.
No production deployment is part of Phase 0–1.

## Public routes

- `/` — product boundary and featured fixtures
- `/jobs` — SSR-first exact structured filters
- `/jobs/:slug` — attributed job detail and provenance
- `/sources` and `/methodology` — source and lifecycle policy
- `/api` and `/skills/install` — clearly labeled later-phase contract previews

Implementation scope lives in `IMPLEMENTATION_PLAN.md`, execution state in
`TASKS.md`, user-facing checks in `ACCEPTANCE.md`, and command evidence in
`WORKLOG.md`.
