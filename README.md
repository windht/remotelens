# RemoteLens

RemoteLens is a public, read-only index of remote developer jobs. It combines
structured filters with source attribution so people and AI agents can discover
jobs without accounts, ads, promoted listings, or opaque ranking.

[Browse the Index](https://remotelens.co/jobs) ·
[Read the API docs](https://remotelens.co/api) ·
[Install the Agent Skill](https://remotelens.co/skills/install)

## What RemoteLens provides

- Exact filters for country eligibility, remote scope, employment type,
  seniority, company, tags, and source.
- Server-rendered job pages with provider attribution and field-level
  provenance.
- A public, unauthenticated JSON API with signed cursor pagination.
- JSON and RSS feeds for active jobs.
- A repository-owned Agent Skill that compares public job data with one
  explicitly selected local CV.

RemoteLens does not accept applications, track candidates, upload CVs, or
automate application submission.

## Agent Skill

Install the RemoteLens Agent Skill from GitHub:

```bash
npx skills add windht/remotelens
```

The skill reads only the CV file you explicitly select. CV text, metadata, and
local paths stay on your computer and are never sent to RemoteLens.

See the [Agent Skill package](skills/remotelens/SKILL.md) for its workflow,
matching policy, API contract, and safety boundaries.

## Public API

The API is read-only, unauthenticated, and available at
`https://remotelens.co/api/v1`.

```bash
curl --get https://remotelens.co/api/v1/jobs \
  --data-urlencode "source=wwr" \
  --data-urlencode "remote_scope=worldwide" \
  --data-urlencode "limit=10"
```

Available resources:

- `GET /api/v1/jobs` — list and filter jobs
- `GET /api/v1/jobs/:id` — retrieve one job with source evidence
- `GET /api/v1/taxonomy` — retrieve supported filter values
- `GET /api/v1/meta` — retrieve catalog and provider status
- `GET /feeds/jobs.json` — active jobs as JSON
- `GET /feeds/jobs.xml` — active jobs as RSS

See the [API guide](https://remotelens.co/api) or the
[OpenAPI document](docs/openapi.json) for the complete contract.

## Data sources and privacy

RemoteLens currently indexes developer jobs from
[Remote OK](https://remoteok.com/) and the approved programming feeds from
[We Work Remotely](https://weworkremotely.com/).

Provider content is treated as untrusted data. RemoteLens preserves source
links and attribution, exposes uncertainty instead of inventing facts, and
keeps CV handling entirely outside the hosted service.

Read the [source policy](docs/source-policy.md) and
[privacy page](https://remotelens.co/privacy) for details.

## Local development

Requirements:

- Node.js 22 or newer
- pnpm 10.14.0

Install dependencies and start the development server:

```bash
pnpm install
pnpm cf:typegen
pnpm dev
```

The local app uses fixture data when a D1 catalog is unavailable. Copy
`.env.example` or `.dev.vars.example` only when you need to override the
documented defaults. Never add production credentials to either file.

## Validation

Run the complete local validation suite:

```bash
pnpm validate
pnpm test:e2e:install
pnpm test:e2e
```

`pnpm validate` checks formatting, linting, types, unit and integration tests,
database migrations, and the production build. The Playwright suite covers the
desktop and mobile public experience.

## Technology

RemoteLens uses TanStack Start and React for server rendering, Cloudflare
Workers and Workflows for the runtime, D1 with Drizzle for the catalog, and
Vitest plus Playwright for validation.

## Contributing

Issues and pull requests are welcome. Keep changes within RemoteLens's
read-only data-provider boundary, preserve source attribution, and include
tests for user-visible behavior or API contract changes.
