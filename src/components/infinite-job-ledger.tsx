import { useCallback, useEffect, useRef, useState } from 'react'
import type { JobSearch } from '~/lib/job-search'
import { JobRow, type JobRowData } from './job-row'

type ApiJob = {
  company: string
  employment_type: string | null
  first_seen_at: string
  id: string
  location_summary: string
  salary: JobRowData['salary']
  seniority: string | null
  slug: string
  sources: Array<{
    attribution: string
    provider: 'remote_ok' | 'wwr'
  }>
  status: JobRowData['status']
  tags: Array<{
    filterable: boolean
    normalized: string
    source_value: string
  }>
  title: string
}

type ApiPage = {
  data: ApiJob[]
  meta: {
    next_cursor?: string | null
  }
}

function apiQuery(search: JobSearch, cursor?: string) {
  const params = new URLSearchParams({
    limit: '10',
    role_family: search.role_family,
    sort: search.sort,
    status: search.status === 'all' ? 'all' : 'active',
  })
  if (search.company) params.set('company', search.company)
  if (search.country) params.set('country', search.country)
  if (search.employment_type)
    params.set('employment_type', search.employment_type)
  if (search.remote_scope) params.set('remote_scope', search.remote_scope)
  if (search.seniority) params.set('seniority', search.seniority)
  if (search.tag) params.append('tag', search.tag)
  for (const source of search.source) params.append('source', source)
  if (cursor) params.set('cursor', cursor)
  return params
}

function rowFromApi(job: ApiJob): JobRowData {
  return {
    company: job.company,
    employmentType: job.employment_type,
    firstSeenAt: job.first_seen_at,
    id: job.id,
    locationSummary: job.location_summary,
    salary: job.salary,
    seniority: job.seniority,
    slug: job.slug,
    sources: job.sources.map((source, index) => ({
      label: source.attribution,
      marker: index + 1,
      provider: source.provider,
    })),
    status: job.status,
    tags: job.tags.map((tag) => ({
      filterable: tag.filterable,
      normalized: tag.normalized,
      sourceValue: tag.source_value,
    })),
    title: job.title,
  }
}

export function InfiniteJobLedger({
  initialJobs,
  search,
  total,
}: {
  initialJobs: JobRowData[]
  search: JobSearch
  total: number
}) {
  const [jobs, setJobs] = useState(initialJobs)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [ready, setReady] = useState(total <= initialJobs.length)
  const [state, setState] = useState<'complete' | 'error' | 'idle' | 'loading'>(
    total <= initialJobs.length ? 'complete' : 'loading',
  )
  const sentinelRef = useRef<HTMLDivElement>(null)

  const requestPage = useCallback(
    async (cursor?: string) => {
      const response = await fetch(
        `/api/v1/jobs?${apiQuery(search, cursor).toString()}`,
        { headers: { Accept: 'application/json' } },
      )
      if (!response.ok) throw new Error(`catalog_page_${response.status}`)
      const page: ApiPage = await response.json()
      return page
    },
    [search],
  )

  useEffect(() => {
    if (total <= initialJobs.length) return
    let active = true
    void requestPage()
      .then((page) => {
        if (!active) return
        setNextCursor(page.meta.next_cursor ?? null)
        setReady(true)
        setState(page.meta.next_cursor ? 'idle' : 'complete')
      })
      .catch(() => {
        if (!active) return
        setReady(true)
        setState('error')
      })
    return () => {
      active = false
    }
  }, [initialJobs.length, requestPage, total])

  const loadNext = useCallback(async () => {
    if (!ready || state === 'loading') return
    setState('loading')
    try {
      const page = await requestPage(nextCursor ?? undefined)
      const incoming = page.data.map(rowFromApi)
      setJobs((current) => {
        const known = new Set(current.map((job) => job.id))
        return [
          ...current,
          ...incoming.filter((job) => {
            if (known.has(job.id)) return false
            known.add(job.id)
            return true
          }),
        ]
      })
      setNextCursor(page.meta.next_cursor ?? null)
      setState(page.meta.next_cursor ? 'idle' : 'complete')
    } catch {
      setState('error')
    }
  }, [nextCursor, ready, requestPage, state])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !ready || !nextCursor) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadNext()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadNext, nextCursor, ready])

  return (
    <>
      <div className="job-ledger" data-testid="job-ledger">
        {jobs.map((job) => (
          <JobRow job={job} key={job.id} />
        ))}
      </div>
      <div aria-live="polite" className="index-load-state" ref={sentinelRef}>
        {state === 'loading' ? (
          <p className="data-text">Loading the next 10 jobs…</p>
        ) : state === 'error' ? (
          <div className="grid justify-items-center gap-3">
            <p>Could not load the next page.</p>
            <button
              className="index-load-button"
              onClick={() => void loadNext()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : state === 'complete' ? (
          <p className="data-text">
            End of index · {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}{' '}
            shown
          </p>
        ) : (
          <button
            className="index-load-button"
            onClick={() => void loadNext()}
            type="button"
          >
            Load the next 10 jobs
          </button>
        )}
      </div>
      <noscript>
        <p className="text-ink-muted py-6 text-sm">
          Showing the first {initialJobs.length} matching jobs. Enable
          JavaScript for incremental loading or use the cursor-paginated public
          API.
        </p>
      </noscript>
    </>
  )
}
