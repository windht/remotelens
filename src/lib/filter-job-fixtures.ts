import type { JobFixture } from '~/data/job-fixtures'
import type { JobSearch } from './job-search'

function normalizeCompany(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s+(inc|llc|ltd|limited|corp|corporation)\.?$/u, '')
}

function isEligible(job: JobFixture, country: string) {
  if (job.excludedCountries.includes(country)) return false
  if (job.remoteScope === 'worldwide') return true
  return job.eligibleCountries.includes(country)
}

export function filterJobFixtures(jobs: JobFixture[], search: JobSearch) {
  if (search.error) return []

  const filtered = jobs.filter((job) => {
    if (search.status === 'active' && job.status !== 'active') return false
    if (
      search.company &&
      normalizeCompany(job.company) !== normalizeCompany(search.company)
    ) {
      return false
    }
    if (search.country && !isEligible(job, search.country)) return false
    if (
      search.employment_type &&
      job.employmentType !== search.employment_type
    ) {
      return false
    }
    if (search.remote_scope && job.remoteScope !== search.remote_scope) {
      return false
    }
    if (search.seniority && job.seniority !== search.seniority) return false
    if (
      search.source.length > 0 &&
      !job.sources.some((source) => search.source.includes(source.key))
    ) {
      return false
    }
    if (
      search.tag &&
      !job.tags.some((tag) => tag.filterable && tag.normalized === search.tag)
    ) {
      return false
    }
    return true
  })

  return filtered.toSorted((a, b) => {
    const field =
      search.sort === 'newest_published' ? 'publishedAt' : 'firstSeenAt'
    return b[field].localeCompare(a[field]) || a.id.localeCompare(b.id)
  })
}
