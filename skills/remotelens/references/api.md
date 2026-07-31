# RemoteLens API contract

The client uses the public, unauthenticated API base configured by the user.
For a local checkout this is usually `http://localhost:3000/api/v1`. Do not
guess a production hostname; use the deployment URL supplied by the operator.

## Read-only endpoints

- `GET /api/v1/meta` — API version, cache epoch, provider health, last completed
  cycle, and active count.
- `GET /api/v1/taxonomy` — fixed role, country, region, source, employment,
  seniority, status, and tag-filter contract.
- `GET /api/v1/jobs` — active canonical job summaries by default.
- `GET /api/v1/jobs/:id-or-slug` — one job with sanitized description,
  source-record URLs, conflicts, tags, and field provenance.
- `GET /feeds/jobs.json` and `GET /feeds/jobs.xml` — active compact feeds when a
  feed is useful; they do not replace detail reads.

There is no `q` parameter, account flow, CV upload, mutation endpoint, or
provider-page scraping requirement.

## Exact filters

Use only documented parameters such as `role_family=engineering`, ISO
`country`, `region`, `timezone`, normalized `company`, `employment_type`,
`remote_scope`, `seniority`, `visa_sponsorship`, `travel_required`, repeatable
`source`/`tag`, `salary_min` with exact `salary_currency` and `salary_period`,
`published_after`, `first_seen_after`, `status`, `sort`, and `limit`.

Valid unknown companies and tags are ordinary empty results. Malformed enums,
country codes, timezones, dates, salary contracts, parameters, or cursors are
errors; do not broaden them into text search.

## Pagination and limits

Use `limit` no larger than 25 unless the user asks for a larger page (the API
maximum is 100). Treat `meta.next_cursor` as opaque. Reuse it only with the
exact same filter and sort contract. Stop when it is `null`.

The public limit is 120 requests per minute per client. Cache metadata and do
not poll. Successful responses carry a cache epoch; errors are not cacheable.
