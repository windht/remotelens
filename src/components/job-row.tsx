import { Link } from '@tanstack/react-router'
import type { JobFixture } from '~/data/job-fixtures'
import { DEFAULT_JOB_SEARCH } from '~/lib/job-search'
import { Badge } from './ui/badge'

function formatSalary(job: JobFixture) {
  if (!job.salary) return null
  const formatter = new Intl.NumberFormat('en', {
    currency: job.salary.currency,
    maximumFractionDigits: 0,
    style: 'currency',
  })
  return `${formatter.format(job.salary.min)}–${formatter.format(job.salary.max)} / ${job.salary.period}`
}

export function JobRow({ job }: { job: JobFixture }) {
  return (
    <article className="job-row">
      <div className="grid gap-3">
        <div className="text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
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
            <dd>{job.employmentType.replace('_', ' ')}</dd>
          </div>
          <div>
            <dt>Seniority</dt>
            <dd>{job.seniority}</dd>
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
