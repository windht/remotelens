import { Link, createFileRoute } from '@tanstack/react-router'
import { JobRow } from '~/components/job-row'
import { Button } from '~/components/ui/button'
import { FEATURED_JOBS } from '~/data/job-fixtures'
import { DEFAULT_JOB_SEARCH } from '~/lib/job-search'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'RemoteLens — See which remote jobs actually fit' },
      {
        name: 'description',
        content:
          'Browse attributed remote developer jobs without ads, promoted listings, login walls, or CV uploads.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="page-shell border-line grid gap-12 border-b py-[clamp(4rem,11vw,10rem)] lg:grid-cols-12 lg:items-end">
        <div className="grid gap-8 lg:col-span-8">
          <p className="eyebrow">Public remote developer-job index</p>
          <h1>See which remote jobs actually fit.</h1>
          <p className="lede">
            RemoteLens is a clean remote-job index for humans and AI agents.
            Browse fresh listings without ads, promoted jobs, or account
            walls—or let Codex or Claude compare them with a CV that stays on
            your computer.
          </p>
        </div>
        <div className="grid gap-3 lg:col-span-4 lg:col-start-9">
          <Button asChild>
            <Link search={DEFAULT_JOB_SEARCH} to="/jobs">
              Browse remote jobs
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/skills/install">Install the Agent Skill</Link>
          </Button>
          <Link
            className="text-pine flex min-h-11 items-center justify-center text-sm font-semibold underline-offset-4 hover:underline"
            to="/api"
          >
            Read the API documentation
          </Link>
        </div>
      </section>

      <div
        aria-label="Product promises"
        className="page-shell border-line grid grid-cols-2 border-b py-6 text-xs font-semibold tracking-[0.04em] uppercase md:grid-cols-4"
      >
        <span>No ads</span>
        <span>No promoted jobs</span>
        <span>No login</span>
        <span>CV stays local</span>
      </div>

      <section className="page-shell mt-section">
        <div className="grid gap-8 pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-3">
            <p className="eyebrow">Index preview</p>
            <h2>Developer roles, with the evidence attached.</h2>
          </div>
          <Link
            className="text-pine inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
            search={DEFAULT_JOB_SEARCH}
            to="/jobs"
          >
            View the structured index
          </Link>
        </div>
        <div className="job-ledger">
          {FEATURED_JOBS.map((job) => (
            <JobRow job={job} key={job.id} />
          ))}
        </div>
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
            Read the installation preview
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

      <section className="page-shell mt-section">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="grid gap-4 lg:col-span-5">
            <p className="eyebrow">Provider freshness</p>
            <h2>Freshness belongs to each source.</h2>
          </div>
          <div className="border-line-strong border-t lg:col-span-6 lg:col-start-7">
            <div className="provider-row">
              <strong>Remote OK</strong>
              <span className="data-text">
                Fixture checked 30 Jul · 14:43 UTC
              </span>
            </div>
            <div className="provider-row">
              <strong>We Work Remotely</strong>
              <span className="data-text">
                Fixture checked 30 Jul · 14:48 UTC
              </span>
            </div>
            <p className="text-ink-muted pt-5 text-sm">
              Phase 0 uses sanitized fixtures. Live source health is introduced
              in Phase 1 and is always reported per provider.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
