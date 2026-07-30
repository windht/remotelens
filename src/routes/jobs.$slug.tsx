import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ProvenanceRail } from '~/components/provenance-rail'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { JOB_FIXTURES } from '~/data/job-fixtures'
import { DEFAULT_JOB_SEARCH } from '~/lib/job-search'

export const Route = createFileRoute('/jobs/$slug')({
  loader: ({ params }) => {
    const job = JOB_FIXTURES.find((candidate) => candidate.slug === params.slug)
    // TanStack Router uses a typed redirect-like value for route-level 404s.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    if (!job) throw notFound()
    return job
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `${loaderData.title} at ${loaderData.company} — RemoteLens`,
          },
          {
            name: 'description',
            content: `${loaderData.locationSummary}. View attributed source evidence and normalized job fields.`,
          },
        ]
      : [],
  }),
  component: JobDetailPage,
})

function JobDetailPage() {
  const job = Route.useLoaderData()
  const primarySource = job.sources[0]

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <div className="grid gap-10 py-[clamp(3rem,8vw,7rem)] lg:grid-cols-12 lg:items-start">
        <article className="grid gap-10 lg:col-span-8">
          <header className="border-line grid gap-6 border-b pb-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">{job.company}</p>
              {job.status === 'active' ? (
                <Badge tone="positive">Active</Badge>
              ) : job.status === 'stale' ? (
                <Badge tone="warning">Stale</Badge>
              ) : (
                <Badge tone="closed">Closed</Badge>
              )}
            </div>
            <h1>{job.title}</h1>
            <dl className="job-facts sm:grid-cols-2">
              <div>
                <dt>Remote eligibility</dt>
                <dd>{job.locationSummary}</dd>
              </div>
              <div>
                <dt>Employment</dt>
                <dd>{job.employmentType.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt>Seniority</dt>
                <dd>{job.seniority}</dd>
              </div>
              <div>
                <dt>Visa sponsorship</dt>
                <dd>{job.visaSponsorship}</dd>
              </div>
              <div>
                <dt>Travel</dt>
                <dd>{job.travelRequired}</dd>
              </div>
              <div>
                <dt>First seen</dt>
                <dd className="data-text">
                  <time dateTime={job.firstSeenAt}>
                    {new Intl.DateTimeFormat('en', {
                      dateStyle: 'medium',
                      timeZone: 'UTC',
                    }).format(new Date(job.firstSeenAt))}
                  </time>
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              {job.tags
                .filter((tag) => tag.filterable)
                .map((tag) => (
                  <Link
                    className="tag-link"
                    key={tag.normalized}
                    search={{ ...DEFAULT_JOB_SEARCH, tag: tag.normalized }}
                    to="/jobs"
                  >
                    {tag.sourceValue}
                  </Link>
                ))}
            </div>
            {primarySource ? (
              <Button asChild className="w-fit">
                <a href={primarySource.listingUrl} rel="noreferrer">
                  View on {primarySource.label}
                </a>
              </Button>
            ) : null}
          </header>

          <div
            className="content-prose"
            dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
          />

          <section className="border-line grid gap-5 border-t pt-10">
            <p className="eyebrow">All attributed destinations</p>
            <h2 className="!text-[clamp(2rem,4vw,3.5rem)]">
              Sources remain visible.
            </h2>
            <p className="lede">
              Fixture destinations link to provider home pages. Live ingestion
              will preserve the original listing URL for every source record.
            </p>
            <div className="border-line-strong border-t">
              {job.sources.map((source) => (
                <div className="provider-row" key={source.key}>
                  <strong>
                    [{source.marker}] {source.label}
                  </strong>
                  <a
                    className="text-pine inline-flex min-h-11 items-center justify-self-start font-semibold underline-offset-4 hover:underline md:justify-self-end"
                    href={source.listingUrl}
                    rel="noreferrer"
                  >
                    View attributed source
                  </a>
                </div>
              ))}
            </div>
          </section>
        </article>

        <div className="lg:col-span-4">
          <ProvenanceRail job={job} />
          {job.sources.length > 1 ? (
            <div className="border-ochre bg-ochre-soft mt-4 border p-5">
              <p className="text-ochre font-semibold">
                Source conflict retained
              </p>
              <p className="mt-2 text-sm">
                Providers may disagree about a location or application
                destination. RemoteLens preserves both records instead of hiding
                the disagreement.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
