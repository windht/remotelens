import { Link } from '@tanstack/react-router'
import type { JobFixture, SourceKey } from '~/data/job-fixtures'
import { DEFAULT_JOB_SEARCH } from '~/lib/job-search'
import { SourceMark } from './source-mark'
import { Badge } from './ui/badge'

export type JobRowData = {
  company: string
  employmentType: string | null
  firstSeenAt: string
  id: string
  locationSummary: string
  salary: JobFixture['salary']
  seniority: string | null
  slug: string
  sources: Array<{
    label: string
    marker: number
    provider: SourceKey
  }>
  status: JobFixture['status']
  tags: Array<{
    filterable: boolean
    normalized: string
    sourceValue: string
  }>
  title: string
}

export function jobRowDataFromFixture(job: JobFixture): JobRowData {
  return {
    company: job.company,
    employmentType: job.employmentType,
    firstSeenAt: job.firstSeenAt,
    id: job.id,
    locationSummary: job.locationSummary,
    salary: job.salary,
    seniority: job.seniority,
    slug: job.slug,
    sources: job.sources.map((source) => ({
      label: source.label,
      marker: source.marker,
      provider: source.key,
    })),
    status: job.status,
    tags: job.tags,
    title: job.title,
  }
}

function formatSalary(job: JobRowData) {
  if (!job.salary) return null
  const formatter = new Intl.NumberFormat('en', {
    currency: job.salary.currency,
    maximumFractionDigits: 0,
    style: 'currency',
  })
  return `${formatter.format(job.salary.min)}–${formatter.format(job.salary.max)} / ${job.salary.period}`
}

function formatEnum(value: string | null) {
  return value ? value.replaceAll('_', ' ') : 'Unknown'
}

export function JobRow({ job }: { job: JobRowData }) {
  return (
    <article className="job-row">
      <div className="grid gap-3">
        <div className="text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            {[...new Set(job.sources.map((source) => source.provider))].map(
              (provider) => (
                <SourceMark key={provider} provider={provider} />
              ),
            )}
          </span>
          <span className="text-ink font-semibold">{job.company}</span>
          <span aria-label="Sources">
            {job.sources.map((source) => `[${source.marker}]`).join(' ')}
          </span>
          {job.status === 'stale' ? (
            <Badge tone="warning">Stale</Badge>
          ) : job.status === 'closed' ? (
            <Badge tone="closed">Closed</Badge>
          ) : (
            <Badge tone="positive">Active</Badge>
          )}
        </div>
        <h2 className="job-title">
          <Link
            className="hover:text-pine underline-offset-4 hover:underline"
            params={{ slug: job.slug }}
            to="/jobs/$slug"
          >
            {job.title}
          </Link>
        </h2>
        <dl className="job-facts">
          <div>
            <dt>Eligibility</dt>
            <dd>{job.locationSummary}</dd>
          </div>
          <div>
            <dt>Employment</dt>
            <dd>{formatEnum(job.employmentType)}</dd>
          </div>
          <div>
            <dt>Seniority</dt>
            <dd>{formatEnum(job.seniority)}</dd>
          </div>
          {formatSalary(job) ? (
            <div>
              <dt>Salary</dt>
              <dd className="data-text">{formatSalary(job)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="flex flex-wrap gap-2">
          {job.tags
            .filter((tag) => tag.filterable)
            .map((tag) => (
              <Link
                className="tag-link"
                key={`${job.id}-${tag.normalized}`}
                search={{ ...DEFAULT_JOB_SEARCH, tag: tag.normalized }}
                to="/jobs"
              >
                {tag.sourceValue}
              </Link>
            ))}
        </div>
      </div>
      <div className="job-row-meta">
        <p className="data-text">
          First seen{' '}
          <time dateTime={job.firstSeenAt}>
            {new Intl.DateTimeFormat('en', {
              day: 'numeric',
              month: 'short',
            }).format(new Date(job.firstSeenAt))}
          </time>
        </p>
        <p className="text-ink-muted text-xs">
          {job.sources.map((source) => source.label).join(' · ')}
        </p>
      </div>
    </article>
  )
}
