import {
  Link,
  createFileRoute,
  stripSearchParams,
} from '@tanstack/react-router'
import { loadWebsiteJobs } from '~/catalog/server-functions'
import { InfiniteJobLedger } from '~/components/infinite-job-ledger'
import { jobRowDataFromFixture } from '~/components/job-row'
import { Button } from '~/components/ui/button'
import { Field, controlClassName } from '~/components/ui/field'
import {
  EnhancedSelect,
  SelectField,
  type SelectOption,
} from '~/components/ui/select'
import { COUNTRY_OPTIONS } from '~/lib/countries'
import {
  DEFAULT_JOB_SEARCH,
  EMPLOYMENT_TYPES,
  REMOTE_SCOPES,
  ROLE_FAMILIES,
  SENIORITIES,
  SOURCE_KEYS,
  parseJobSearch,
} from '~/lib/job-search'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMeta,
} from '~/lib/seo'
import { catalogIsrHeaders, uncachedSsrHeaders } from '~/lib/rendering'

export const Route = createFileRoute('/jobs/')({
  validateSearch: parseJobSearch,
  search: {
    middlewares: [stripSearchParams(DEFAULT_JOB_SEARCH)],
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ deps }) => loadWebsiteJobs({ data: deps.search }),
  headers: ({ loaderData }) =>
    loaderData?.unavailable ? uncachedSsrHeaders() : catalogIsrHeaders(),
  head: () => ({
    meta: pageMeta({
      title: 'Remote Developer Jobs — RemoteLens',
      description:
        'Filter attributed remote developer jobs by eligibility, company, seniority, employment type, salary, and source.',
      path: '/jobs',
    }),
    links: [{ rel: 'canonical', href: absoluteUrl('/jobs') }],
    scripts: [
      jsonLdScript(
        breadcrumbJsonLd([
          { name: 'RemoteLens', path: '/' },
          { name: 'Remote Developer Jobs', path: '/jobs' },
        ]),
      ),
    ],
  }),
  component: JobsPage,
})

function labelValue(value: string) {
  return value.replaceAll('_', ' ')
}

function option(value: string, label = labelValue(value)): SelectOption {
  return { label, value }
}

const COUNTRY_SELECT_OPTIONS = [
  option('', 'Any eligible country'),
  ...COUNTRY_OPTIONS.map(([code, name]) => option(code, `${name} (${code})`)),
]
const ROLE_OPTIONS = ROLE_FAMILIES.map((value) => option(value))
const SCOPE_OPTIONS = [
  option('', 'Default remote scopes'),
  ...REMOTE_SCOPES.map((value) => option(value)),
]
const EMPLOYMENT_OPTIONS = [
  option('', 'Any stated type'),
  ...EMPLOYMENT_TYPES.map((value) => option(value)),
]
const SENIORITY_OPTIONS = [
  option('', 'Any stated seniority'),
  ...SENIORITIES.map((value) => option(value)),
]
const SOURCE_OPTIONS = [
  option('', 'Any provider'),
  ...SOURCE_KEYS.map((value) => {
    if (value === 'wwr') return option(value, 'We Work Remotely')
    if (value === 'jsguru') return option(value, 'JS Guru Jobs')
    return option(value, 'Remote OK')
  }),
]
const SORT_OPTIONS = [
  option('recently_discovered', 'Recently discovered'),
  option('newest_published', 'Newest published'),
]

function JobsPage() {
  const search = Route.useSearch()
  const catalog = Route.useLoaderData()
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
  const initialJobs = catalog.jobs.map(jobRowDataFromFixture)

  return (
    <main id="main-content" tabIndex={-1}>
      <header className="index-heading page-shell">
        <div>
          <p className="eyebrow">
            {catalog.unavailable
              ? 'Catalog unavailable'
              : catalog.fallback
                ? 'Local fixture index'
                : 'Live catalog'}
          </p>
          <h1>Available remote engineering jobs</h1>
        </div>
        <p className="index-heading-copy">
          {catalog.total.toLocaleString('en')}{' '}
          {catalog.total === 1 ? 'job' : 'jobs'} found. Exact filters, visible
          source evidence, and no promoted listings.
        </p>
      </header>

      {search.error ? (
        <div
          aria-live="polite"
          className="border-rust bg-rust-soft page-shell mb-5 border p-5"
          role="alert"
        >
          <p className="text-rust font-semibold">
            {search.error.code}: {search.error.field}
          </p>
          <p className="mt-2">{search.error.message}</p>
        </div>
      ) : null}

      <div className="index-toolbar">
        <form
          action="/jobs"
          className="page-shell index-filter-form"
          method="get"
        >
          <div className="filter-row">
            <SelectField label="Employment">
              <EnhancedSelect
                defaultValue={search.employment_type ?? ''}
                label="Employment type"
                name="employment_type"
                options={EMPLOYMENT_OPTIONS}
              />
            </SelectField>
            <SelectField label="Seniority">
              <EnhancedSelect
                defaultValue={search.seniority ?? ''}
                label="Seniority"
                name="seniority"
                options={SENIORITY_OPTIONS}
              />
            </SelectField>
            <SelectField label="Sort">
              <EnhancedSelect
                defaultValue={search.sort}
                label="Sort"
                name="sort"
                options={SORT_OPTIONS}
              />
            </SelectField>
            <Button className="filter-apply" type="submit">
              Apply
            </Button>
          </div>

          <details className="index-more-filters">
            <summary>
              <span className="index-more-label-closed">
                More exact filters
              </span>
              <span className="index-more-label-open">Hide extra filters</span>
            </summary>
            <div className="index-more-grid">
              <SelectField label="Country">
                <EnhancedSelect
                  defaultValue={search.country ?? ''}
                  label="Country eligibility"
                  name="country"
                  options={COUNTRY_SELECT_OPTIONS}
                />
              </SelectField>
              <SelectField label="Role">
                <EnhancedSelect
                  defaultValue={search.role_family}
                  label="Role family"
                  name="role_family"
                  options={ROLE_OPTIONS}
                />
              </SelectField>
              <SelectField label="Scope">
                <EnhancedSelect
                  defaultValue={search.remote_scope ?? ''}
                  label="Remote scope"
                  name="remote_scope"
                  options={SCOPE_OPTIONS}
                />
              </SelectField>
              <Field
                description="Exact lexical value; there is no autocomplete."
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
              <Field
                description="Exact after company-name normalization."
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
              <SelectField label="Source">
                <EnhancedSelect
                  defaultValue={search.source[0] ?? ''}
                  label="Source"
                  name="source"
                  options={SOURCE_OPTIONS}
                />
              </SelectField>
              <label className="filter-checkbox">
                <input
                  defaultChecked={search.status === 'all'}
                  name="status"
                  type="checkbox"
                  value="all"
                />
                Include stale and closed jobs
              </label>
              <Link
                className="index-clear"
                search={DEFAULT_JOB_SEARCH}
                to="/jobs"
              >
                Clear all filters
              </Link>
            </div>
          </details>
        </form>
      </div>

      <section
        aria-labelledby="results-heading"
        className="page-shell index-results"
      >
        <div className="index-results-header">
          <h2 id="results-heading">Index</h2>
          {activeFilters.length > 0 ? (
            <div aria-label="Active filters" className="active-filter-row">
              {activeFilters.map((filter) => (
                <span className="active-filter" key={filter}>
                  {filter}
                </span>
              ))}
            </div>
          ) : (
            <p className="data-text text-ink-muted">
              All active engineering jobs
            </p>
          )}
        </div>

        {catalog.unavailable ? (
          <div className="border-rust bg-rust-soft border p-6" role="alert">
            <p className="text-rust font-semibold">
              The live catalog is temporarily unavailable.
            </p>
            <p className="mt-2 text-sm">
              No fallback jobs are substituted for a failed production read.
            </p>
          </div>
        ) : catalog.total > 0 ? (
          <InfiniteJobLedger
            initialJobs={initialJobs}
            key={JSON.stringify(search)}
            search={search}
            total={catalog.total}
          />
        ) : (
          <div className="border-line-strong border-y py-16">
            <p className="eyebrow">No exact matches</p>
            <h2 className="mt-4 !text-[clamp(2rem,4vw,3.5rem)]">
              These structured constraints return no jobs.
            </h2>
            <p className="lede mt-6">
              Remove one exact constraint or clear the filters. RemoteLens does
              not broaden the request with keyword or semantic search.
            </p>
            <Button asChild className="mt-8" variant="secondary">
              <Link search={DEFAULT_JOB_SEARCH} to="/jobs">
                Clear all filters
              </Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
