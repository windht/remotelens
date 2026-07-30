import { Link, createFileRoute } from '@tanstack/react-router'
import { JobRow } from '~/components/job-row'
import { PageIntro } from '~/components/page-intro'
import { Button } from '~/components/ui/button'
import { Field, controlClassName } from '~/components/ui/field'
import { JOB_FIXTURES } from '~/data/job-fixtures'
import { COUNTRY_OPTIONS } from '~/lib/countries'
import { filterJobFixtures } from '~/lib/filter-job-fixtures'
import {
  DEFAULT_JOB_SEARCH,
  EMPLOYMENT_TYPES,
  REMOTE_SCOPES,
  SENIORITIES,
  SOURCE_KEYS,
  parseJobSearch,
} from '~/lib/job-search'

export const Route = createFileRoute('/jobs/')({
  validateSearch: parseJobSearch,
  head: () => ({
    meta: [
      { title: 'Browse remote developer jobs — RemoteLens' },
      {
        name: 'description',
        content:
          'Use exact structured filters to browse attributed remote developer jobs.',
      },
    ],
  }),
  component: JobsPage,
})

function labelValue(value: string) {
  return value.replaceAll('_', ' ')
}

function JobsPage() {
  const search = Route.useSearch()
  const jobs = filterJobFixtures(JOB_FIXTURES, search)
  const activeFilters = [
    search.country ? `Country: ${search.country}` : null,
    search.company ? `Company: ${search.company}` : null,
    search.remote_scope ? `Scope: ${labelValue(search.remote_scope)}` : null,
    search.employment_type
      ? `Employment: ${labelValue(search.employment_type)}`
      : null,
    search.seniority ? `Seniority: ${search.seniority}` : null,
    search.tag ? `Tag: ${search.tag}` : null,
    ...search.source.map((source) => `Source: ${source}`),
    search.status === 'all' ? 'Including closed' : null,
  ].filter((value): value is string => Boolean(value))

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <PageIntro eyebrow="Structured discovery" title="Remote developer jobs">
        Exact filters, transparent source evidence, and no keyword-search
        shortcuts. Every result in V1 belongs to the engineering role family.
      </PageIntro>

      {search.error ? (
        <div
          aria-live="polite"
          className="border-rust bg-rust-soft mt-8 border p-5"
          role="alert"
        >
          <p className="text-rust font-semibold">
            {search.error.code}: {search.error.field}
          </p>
          <p className="mt-2">{search.error.message}</p>
        </div>
      ) : null}

      <div className="grid gap-12 py-12 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <aside>
          <form
            action="/jobs"
            className="border-line-strong grid gap-6 border-t pt-6"
            method="get"
          >
            <div className="grid gap-2">
              <p className="eyebrow">Filter ledger</p>
              <p className="text-ink-muted text-sm">
                These controls submit an ordinary shareable URL.
              </p>
            </div>

            <Field label="Country eligibility">
              <select
                className={controlClassName}
                defaultValue={search.country ?? ''}
                name="country"
              >
                <option value="">Any deterministically known country</option>
                {COUNTRY_OPTIONS.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Remote scope">
              <select
                className={controlClassName}
                defaultValue={search.remote_scope ?? ''}
                name="remote_scope"
              >
                <option value="">Default remote scopes</option>
                {REMOTE_SCOPES.map((value) => (
                  <option key={value} value={value}>
                    {labelValue(value)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Employment type">
              <select
                className={controlClassName}
                defaultValue={search.employment_type ?? ''}
                name="employment_type"
              >
                <option value="">Any stated type</option>
                {EMPLOYMENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {labelValue(value)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Seniority">
              <select
                className={controlClassName}
                defaultValue={search.seniority ?? ''}
                name="seniority"
              >
                <option value="">Any stated seniority</option>
                {SENIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {labelValue(value)}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              description="Exact lexical value. There is no tag autocomplete or directory."
              label="Exact filterable tag"
            >
              <input
                className={controlClassName}
                defaultValue={search.tag ?? ''}
                name="tag"
                placeholder="for example: rust"
                type="text"
              />
            </Field>

            <details className="border-line border-y py-3">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
                More exact filters
              </summary>
              <div className="grid gap-6 py-4">
                <Field
                  description="Exact after company-name normalization; no fuzzy matching."
                  label="Company"
                >
                  <input
                    className={controlClassName}
                    defaultValue={search.company ?? ''}
                    name="company"
                    placeholder="for example: Kumo Systems"
                    type="text"
                  />
                </Field>
                <Field label="Source">
                  <select
                    className={controlClassName}
                    defaultValue={search.source[0] ?? ''}
                    name="source"
                  >
                    <option value="">Either approved provider</option>
                    {SOURCE_KEYS.map((value) => (
                      <option key={value} value={value}>
                        {value === 'wwr' ? 'We Work Remotely' : 'Remote OK'}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="flex min-h-11 items-center gap-3 font-semibold">
                  <input
                    defaultChecked={search.status === 'all'}
                    name="status"
                    type="checkbox"
                    value="all"
                  />
                  Include stale and closed fixtures
                </label>
              </div>
            </details>

            <input name="sort" type="hidden" value={search.sort} />
            <Button type="submit">Apply filters</Button>
            <Link
              className="text-pine flex min-h-11 items-center justify-center text-sm font-semibold underline-offset-4 hover:underline"
              search={DEFAULT_JOB_SEARCH}
              to="/jobs"
            >
              Clear all filters
            </Link>
          </form>
        </aside>

        <section aria-labelledby="results-heading">
          <div className="grid gap-5 pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <p className="eyebrow">Fixture-backed public shell</p>
              <h2
                className="!text-[clamp(2rem,4vw,3.5rem)]"
                id="results-heading"
              >
                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
              </h2>
            </div>
            <form action="/jobs" className="grid gap-2" method="get">
              {search.country ? (
                <input name="country" type="hidden" value={search.country} />
              ) : null}
              {search.company ? (
                <input name="company" type="hidden" value={search.company} />
              ) : null}
              {search.tag ? (
                <input name="tag" type="hidden" value={search.tag} />
              ) : null}
              {search.source.map((source) => (
                <input
                  key={source}
                  name="source"
                  type="hidden"
                  value={source}
                />
              ))}
              <label className="grid gap-2 text-sm font-semibold">
                Sort
                <select
                  className={controlClassName}
                  defaultValue={search.sort}
                  name="sort"
                  onChange={(event) =>
                    event.currentTarget.form?.requestSubmit()
                  }
                >
                  <option value="recently_discovered">
                    Recently discovered
                  </option>
                  <option value="newest_published">Newest published</option>
                </select>
              </label>
              <noscript>
                <Button type="submit" variant="secondary">
                  Apply sort
                </Button>
              </noscript>
            </form>
          </div>

          {activeFilters.length > 0 ? (
            <div
              className="mb-8 flex flex-wrap gap-2"
              aria-label="Active filters"
            >
              {activeFilters.map((filter) => (
                <span
                  className="border-pine bg-pine-soft text-pine-strong rounded-[var(--radius-label)] border px-2 py-1 text-xs font-semibold"
                  key={filter}
                >
                  {filter}
                </span>
              ))}
            </div>
          ) : null}

          {jobs.length > 0 ? (
            <div className="job-ledger">
              {jobs.map((job) => (
                <JobRow job={job} key={job.id} />
              ))}
            </div>
          ) : (
            <div className="border-line-strong border-y py-16">
              <p className="eyebrow">No exact matches</p>
              <h2 className="mt-4 !text-[clamp(2rem,4vw,3.5rem)]">
                The selected structured constraints return no fixture jobs.
              </h2>
              <p className="lede mt-6">
                Remove one exact constraint or clear the filter ledger.
                RemoteLens does not broaden this request with keyword or
                semantic search.
              </p>
              <Button asChild className="mt-8" variant="secondary">
                <Link search={DEFAULT_JOB_SEARCH} to="/jobs">
                  Clear all filters
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
