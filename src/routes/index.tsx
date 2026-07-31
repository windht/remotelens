import { Link, createFileRoute } from '@tanstack/react-router'
import { JobRow, jobRowDataFromFixture } from '~/components/job-row'
import { Button } from '~/components/ui/button'
import { loadWebsiteJobs } from '~/catalog/server-functions'
import { DEFAULT_JOB_SEARCH } from '~/lib/job-search'

export const Route = createFileRoute('/')({
  loader: () => loadWebsiteJobs({ data: DEFAULT_JOB_SEARCH }),
  head: () => ({
    meta: [
      { title: 'RemoteLens — See which remote jobs actually fit' },
      {
        name: 'description',
        content:
          'Browse attributed remote developer jobs without ads, promoted listings, login walls, or CV uploads.',
      },
    ],
    links: [{ rel: 'canonical', href: '/' }],
  }),
  component: HomePage,
})

function HomePage() {
  const catalog = Route.useLoaderData()
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="home-hero page-shell">
        <div className="home-hero-copy">
          <p className="eyebrow">Source-led remote work</p>
          <h1>
            <span>See which remote jobs</span> <em>actually fit.</em>
          </h1>
          <p className="lede">
            A clean index for humans and AI agents. Your CV stays local—
            comparison happens on your machine, not our server.
          </p>
        </div>
        <div className="home-actions">
          <Button asChild className="home-primary-action">
            <Link search={DEFAULT_JOB_SEARCH} to="/jobs">
              <span>Browse the Index</span>
              <span aria-hidden="true">→</span>
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/skills/install">
              <span>Install the Agent Skill</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </Button>
          <Link className="home-api-link" to="/api">
            API documentation
          </Link>
        </div>
      </section>

      <div aria-label="Product promises" className="promise-ledger page-shell">
        <span>No ads</span>
        <span>No promoted jobs</span>
        <span>No login</span>
        <span>CV stays local</span>
      </div>

      <section className="home-index page-shell">
        <div className="home-index-heading">
          <div className="grid gap-3">
            <p className="eyebrow">
              {catalog.unavailable
                ? 'Catalog unavailable'
                : catalog.fallback
                  ? 'Local fixture fallback'
                  : 'Live catalog'}
            </p>
            <h2>Live Index Ledger</h2>
          </div>
          <Link className="index-sync" search={DEFAULT_JOB_SEARCH} to="/jobs">
            <span aria-hidden="true" className="sync-dot" />
            Open full Index
          </Link>
        </div>
        {catalog.unavailable ? (
          <div className="border-rust bg-rust-soft border p-6" role="alert">
            <p className="text-rust font-semibold">
              The catalog is temporarily unavailable.
            </p>
            <p className="mt-2 text-sm">
              No jobs were fabricated for this request. Refresh shortly to try
              the live catalog again.
            </p>
          </div>
        ) : catalog.jobs.length > 0 ? (
          <div className="job-ledger">
            {catalog.jobs.map((job) => (
              <JobRow job={jobRowDataFromFixture(job)} key={job.id} />
            ))}
          </div>
        ) : (
          <div className="border-line-strong border-y py-10">
            <p className="eyebrow">No active jobs</p>
            <p className="lede mt-4">
              The catalog is ready, but no active canonical jobs currently
              satisfy the public engineering-role boundary.
            </p>
          </div>
        )}
      </section>

      <section className="page-shell mt-section border-line grid border-y lg:grid-cols-2">
        <div className="lg:border-line grid gap-8 py-12 lg:border-r lg:pr-12">
          <p className="eyebrow">01 / Agent Skill</p>
          <h2>Compare locally.</h2>
          <p className="lede">
            Give Codex or Claude access to clean RemoteLens job data while
            keeping your CV local. The skill queries the public API; it does not
            scrape source pages or upload personal files.
          </p>
          <Link
            className="text-pine inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
            to="/skills/install"
          >
            Read the installation guide
          </Link>
        </div>
        <div className="border-line grid gap-8 border-t py-12 lg:border-t-0 lg:pl-12">
          <p className="eyebrow">02 / Public API</p>
          <h2>Query exact fields.</h2>
          <p className="lede">
            Use structured eligibility, source, company, salary, date, and
            filterable-tag constraints. There is no keyword, title, description,
            vector, or semantic search.
          </p>
          <pre className="paper-code">
            <code>
              GET /api/v1/jobs?country=JP&amp;source=wwr&amp;tag=javascript
            </code>
          </pre>
        </div>
      </section>

      <section className="source-note page-shell mt-section" id="sources">
        <div id="methodology">
          <p className="eyebrow">The small print</p>
          <p>
            RemoteLens indexes Remote OK and four approved We Work Remotely
            programming feeds. Exact source evidence stays attached; ambiguous
            facts stay unknown.
          </p>
        </div>
        <Link className="footer-link text-pine" to="/api">
          Inspect the public contract
        </Link>
      </section>
    </main>
  )
}
