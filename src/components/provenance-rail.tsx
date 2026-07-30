import type { JobFixture } from '~/data/job-fixtures'
import { Badge } from './ui/badge'

export function ProvenanceRail({ job }: { job: JobFixture }) {
  return (
    <aside aria-labelledby="provenance-heading" className="provenance-rail">
      <p className="eyebrow">Field provenance</p>
      <h2 id="provenance-heading">Evidence, field by field</h2>
      <ol className="provenance-list">
        {job.provenance.map((item) => (
          <li key={`${item.field}-${item.marker}`}>
            <span className="source-marker" aria-hidden="true">
              {item.marker}
            </span>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{item.field}</strong>
                <Badge>{item.origin}</Badge>
              </div>
              <span>{item.value}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="border-line mt-8 grid gap-4 border-t pt-6">
        {job.sources.map((source) => (
          <div className="grid gap-2" key={source.key}>
            <p className="font-semibold">
              [{source.marker}] {source.label}
            </p>
            <p className="data-text text-ink-muted">
              Checked{' '}
              <time dateTime={source.checkedAt}>
                {new Intl.DateTimeFormat('en', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'UTC',
                }).format(new Date(source.checkedAt))}{' '}
                UTC
              </time>
            </p>
          </div>
        ))}
      </div>
    </aside>
  )
}
