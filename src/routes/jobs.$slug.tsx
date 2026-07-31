import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ProvenanceRail } from '~/components/provenance-rail'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { loadWebsiteJob } from '~/catalog/server-functions'
import { DEFAULT_JOB_SEARCH } from '~/lib/job-search'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMeta,
} from '~/lib/seo'
import { catalogIsrHeaders, uncachedSsrHeaders } from '~/lib/rendering'

export const Route = createFileRoute('/jobs/$slug')({
  loader: async ({ params }) => {
    const result = await loadWebsiteJob({ data: { identifier: params.slug } })
    if (result.unavailable) return result
    const job = result.job
    // TanStack Router uses a typed redirect-like value for route-level 404s.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    if (!job) throw notFound()
    return result
  },
  headers: ({ loaderData }) =>
    loaderData?.unavailable ? uncachedSsrHeaders() : catalogIsrHeaders(),
  head: ({ loaderData }) => ({
    meta: loaderData?.job
      ? [
          ...pageMeta({
            title: `${loaderData.job.title} at ${loaderData.job.company} — RemoteLens`,
            description: `${loaderData.job.locationSummary}. View attributed source evidence and normalized job fields.`,
            path: `/jobs/${loaderData.job.slug}`,
          }),
          {
            name: 'robots',
            content:
              loaderData.job.status === 'active'
                ? 'index,follow,max-image-preview:large,max-snippet:-1'
                : 'noindex,follow',
          },
        ]
      : [],
    links: loaderData?.job
      ? [
          {
            href: absoluteUrl(`/jobs/${loaderData.job.slug}`),
            rel: 'canonical',
          },
        ]
      : [],
    scripts: loaderData?.job
      ? [
          jsonLdScript(
            breadcrumbJsonLd([
              { name: 'RemoteLens', path: '/' },
              { name: 'Remote Developer Jobs', path: '/jobs' },
              {
                name: loaderData.job.title,
                path: `/jobs/${loaderData.job.slug}`,
              },
            ]),
          ),
        ]
      : [],
  }),
  component: JobDetailPage,
})

function JobDetailPage() {
  const result = Route.useLoaderData()
  if (result.unavailable) {
    return (
      <main className="narrow-shell py-24" id="main-content" tabIndex={-1}>
        <p className="eyebrow">Catalog unavailable</p>
        <h1 className="mt-4">This job cannot be checked right now.</h1>
        <p className="lede mt-8">
          The live catalog did not respond. Try again shortly; RemoteLens will
          not invent a job record or source destination.
        </p>
        <a
          className="text-pine mt-8 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
          href="/jobs"
        >
          Return to the structured index
        </a>
      </main>
    )
  }
  const job = result.job
  if (!job) return null
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
                <dd>{job.employmentType?.replace('_', ' ') ?? 'Unknown'}</dd>
              </div>
              <div>
                <dt>Seniority</dt>
                <dd>{job.seniority ?? 'Unknown'}</dd>
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
              Every destination below is retained from an attributed source
              record. RemoteLens does not replace conflicting destinations with
              a guessed canonical URL.
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
