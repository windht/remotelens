import { createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'
import { Badge } from '~/components/ui/badge'

export const Route = createFileRoute('/api')({
  head: () => ({
    meta: [
      { title: 'API documentation preview — RemoteLens' },
      {
        name: 'description',
        content:
          'Preview the public read-only RemoteLens JSON API and structured filter contract.',
      },
    ],
  }),
  component: ApiPage,
})

function ApiPage() {
  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <PageIntro
        eyebrow="Public read-only API"
        title="Structured job data, without a private key."
      >
        The Phase 0 page documents the settled contract. D1-backed endpoints are
        delivered in Phase 3, so examples below are clearly previews rather than
        live API claims.
      </PageIntro>

      <div className="grid gap-12 py-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          aria-label="API page sections"
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <p className="eyebrow">On this page</p>
          <ol className="border-line mt-4 border-t">
            {['Overview', 'Structured filters', 'Response', 'Freshness'].map(
              (item) => (
                <li className="border-line border-b" key={item}>
                  <a
                    className="hover:text-pine flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline"
                    href={`#${item.toLocaleLowerCase().replace(' ', '-')}`}
                  >
                    {item}
                  </a>
                </li>
              ),
            )}
          </ol>
        </nav>

        <div className="grid gap-16">
          <section className="grid gap-6" id="overview">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">Endpoint preview</p>
              <Badge tone="warning">Phase 3 contract</Badge>
            </div>
            <h2>GET /api/v1/jobs</h2>
            <p className="lede">
              Public, unauthenticated, read-only, cursor-paginated, and
              Zod-validated. There is no <code>q</code> parameter and no
              fallback from structured constraints to text matching.
            </p>
            <pre className="paper-code">
              <code>
                GET /api/v1/jobs?country=JP&amp;source=wwr&amp;tag=javascript
              </code>
            </pre>
          </section>

          <section className="grid gap-6" id="structured-filters">
            <p className="eyebrow">Exact contract</p>
            <h2>Structured filters</h2>
            <div className="border-line-strong border-t">
              {[
                ['country', 'ISO alpha-2 eligibility, for example JP'],
                ['company', 'exact after company-name normalization'],
                ['tag', 'exact documented filterable source label'],
                ['source', 'repeatable exact provider key with OR semantics'],
                ['salary_min', 'requires exact currency and period'],
                ['published_after', 'source publication time only'],
                ['first_seen_after', 'RemoteLens discovery time'],
              ].map(([field, explanation]) => (
                <div
                  className="border-line grid gap-2 border-b py-4 sm:grid-cols-[10rem_1fr]"
                  key={field}
                >
                  <code className="data-text text-pine">{field}</code>
                  <span>{explanation}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6" id="response">
            <p className="eyebrow">Compact list response</p>
            <h2>Source evidence travels with the result.</h2>
            <pre className="paper-code" tabIndex={0}>
              <code>{`{
  "data": [{
    "id": "01J...",
    "title": "Senior Backend Engineer",
    "company": "Kumo Systems",
    "remote_scope": "worldwide",
    "sources": ["wwr", "remote_ok"]
  }],
  "meta": {
    "next_cursor": null,
    "generated_at": "2026-07-30T14:48:00Z"
  }
}`}</code>
            </pre>
          </section>

          <section className="grid gap-6" id="freshness">
            <p className="eyebrow">Metadata</p>
            <h2>Freshness is provider-specific.</h2>
            <p className="lede">
              <code>GET /api/v1/meta</code> reports each provider’s enabled or
              suspended state, last successful ingestion, cycle status, active
              count, and the live cache epoch. It does not invent a single
              catalog-freshness badge.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
