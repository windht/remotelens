import type { JobFixture, SourceKey } from '../data/job-fixtures'
import { JOB_FIXTURES } from '../data/job-fixtures'
import { readCatalogMeta, type CatalogMeta } from '../api/catalog'
import { normalizeCompany } from '../ingestion/normalization'
import type { JobSearch } from '../lib/job-search'

export type WebsiteCatalogResult = {
  fallback: boolean
  jobs: JobFixture[]
  meta: CatalogMeta | null
  total: number
  unavailable: boolean
}

type JobRow = {
  company: string
  company_domain: string | null
  description_excerpt: string
  description_html_sanitized: string
  description_text: string
  eligible_countries: string
  eligible_regions: string
  employment_type: JobFixture['employmentType']
  excluded_countries: string
  excluded_regions: string
  first_seen_at: number
  id: string
  last_checked_at: number
  last_seen_at: number
  location_summary: string
  normalized_company: string
  published_at: number | null
  remote_scope: JobFixture['remoteScope']
  salary_currency: string | null
  salary_max: number | null
  salary_min: number | null
  salary_period: 'hour' | 'month' | 'year' | null
  seniority: JobFixture['seniority']
  slug: string
  status: JobFixture['status']
  title: string
  timezone_requirements: string
  travel_required: JobFixture['travelRequired']
  visa_sponsorship: JobFixture['visaSponsorship']
}

type SourceRow = {
  attribution: string
  job_id: string
  last_checked_at: number
  listing_url: string
  provider: SourceKey
  source_record_id: string
}

type SourceLabelRow = {
  source_record_id: string
  source_value: string
}

type TagRow = {
  filterable: number
  job_id: string
  normalized: string
  source_value: string
}

type ProvenanceRow = {
  field: string
  job_id: string
  origin: 'source-stated' | 'parsed' | 'normalized'
  source_record_id: string
  value: string
}

function arrayValue(value: string | null | undefined) {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function iso(value: number | null) {
  return value === null ? null : new Date(value).toISOString()
}

function sourceLabel(provider: SourceKey) {
  const labels: Record<SourceKey, string> = {
    jsguru: 'JS Guru Jobs',
    remote_ok: 'Remote OK',
    wwr: 'We Work Remotely',
    remotejobs: 'RemoteJobs.org',
    remotive: 'Remotive',
    jobicy: 'Jobicy',
  }
  return labels[provider]
}

function buildWhere(search: JobSearch) {
  const conditions = [
    `EXISTS (
       SELECT 1
       FROM job_provenance AS visible_provenance
       JOIN source_records AS visible_source
         ON visible_source.id = visible_provenance.source_record_id
       JOIN source_health AS visible_health
         ON visible_health.provider = visible_source.provider
       WHERE visible_provenance.job_id = j.id
         AND visible_health.enabled = 1
     )`,
  ]
  const values: Array<string | number> = []
  conditions.push('j.role_family = ?')
  values.push(search.role_family)
  if (search.status === 'active') conditions.push("j.status = 'active'")
  if (search.company) {
    conditions.push('j.normalized_company = ?')
    values.push(normalizeCompany(search.company).toLocaleLowerCase())
  }
  if (search.country) {
    conditions.push(
      `(
        (j.remote_scope = 'worldwide' AND NOT EXISTS (
          SELECT 1 FROM json_each(j.excluded_countries)
          WHERE json_each.value = ?
        ))
        OR EXISTS (
          SELECT 1 FROM json_each(j.eligible_countries)
          WHERE json_each.value = ?
        )
      )`,
    )
    values.push(search.country, search.country)
  }
  if (search.employment_type) {
    conditions.push('j.employment_type = ?')
    values.push(search.employment_type)
  }
  if (search.remote_scope) {
    conditions.push('j.remote_scope = ?')
    values.push(search.remote_scope)
  } else {
    conditions.push(
      "j.remote_scope IN ('worldwide', 'countries', 'region', 'timezone')",
    )
  }
  if (search.seniority) {
    conditions.push('j.seniority = ?')
    values.push(search.seniority)
  }
  if (search.source.length > 0) {
    const placeholders = search.source.map(() => '?').join(', ')
    conditions.push(
      `EXISTS (
         SELECT 1
         FROM job_provenance AS source_provenance
         JOIN source_records AS source_record
           ON source_record.id = source_provenance.source_record_id
         JOIN source_health AS source_health_row
           ON source_health_row.provider = source_record.provider
         WHERE source_provenance.job_id = j.id
           AND source_health_row.enabled = 1
           AND source_record.provider IN (${placeholders})
       )`,
    )
    values.push(...search.source)
  }
  if (search.tag) {
    conditions.push(
      `EXISTS (
         SELECT 1 FROM job_tags AS requested_tag
         WHERE requested_tag.job_id = j.id
           AND requested_tag.normalized = ?
           AND requested_tag.filterable = 1
       )`,
    )
    values.push(search.tag)
  }
  return { conditions, values }
}

async function jobRows(db: D1Database, search: JobSearch, limit = 10) {
  const { conditions, values } = buildWhere(search)
  const order =
    search.sort === 'newest_published'
      ? 'j.published_at DESC, j.id DESC'
      : 'j.first_seen_at DESC, j.id DESC'
  const rows = await db
    .prepare(
      `SELECT j.company, j.company_domain, j.description_excerpt,
              j.description_html_sanitized, j.description_text,
              j.eligible_countries, j.eligible_regions, j.employment_type,
              j.excluded_countries, j.excluded_regions, j.first_seen_at,
              j.id, j.last_checked_at, j.last_seen_at, j.location_summary,
              j.normalized_company, j.published_at, j.remote_scope,
              j.salary_currency, j.salary_max, j.salary_min, j.salary_period,
              j.seniority, j.slug, j.status, j.title, j.timezone_requirements,
              j.travel_required, j.visa_sponsorship
       FROM jobs AS j
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${order}
       LIMIT ?`,
    )
    .bind(...values, limit)
    .all<JobRow>()
  return rows.results
}

async function catalogCount(db: D1Database) {
  const row = await db
    .prepare('SELECT count(*) AS count FROM jobs')
    .first<{ count: number }>()
  return row?.count ?? 0
}

async function matchingCount(db: D1Database, search: JobSearch) {
  const { conditions, values } = buildWhere(search)
  const row = await db
    .prepare(
      `SELECT count(*) AS count
       FROM jobs AS j
       WHERE ${conditions.join(' AND ')}`,
    )
    .bind(...values)
    .first<{ count: number }>()
  return row?.count ?? 0
}

async function associations(db: D1Database, jobIds: string[]) {
  if (jobIds.length === 0) {
    return {
      labels: [] as SourceLabelRow[],
      provenance: [] as ProvenanceRow[],
      sources: [] as SourceRow[],
      tags: [] as TagRow[],
    }
  }
  const placeholders = jobIds.map(() => '?').join(', ')
  const [sources, tags, provenance, labels] = await Promise.all([
    db
      .prepare(
        `SELECT provenance.job_id, source.id AS source_record_id,
                source.provider, source.attribution, source.listing_url,
                source.last_checked_at
         FROM job_provenance AS provenance
         JOIN source_records AS source ON source.id = provenance.source_record_id
         WHERE provenance.job_id IN (${placeholders})
         ORDER BY provenance.job_id, source.provider, source.id`,
      )
      .bind(...jobIds)
      .all<SourceRow>(),
    db
      .prepare(
        `SELECT job_id, normalized, source_value, filterable
         FROM job_tags WHERE job_id IN (${placeholders})
         ORDER BY job_id, normalized`,
      )
      .bind(...jobIds)
      .all<TagRow>(),
    db
      .prepare(
        `SELECT job_id, source_record_id, field, origin, value
         FROM job_field_provenance WHERE job_id IN (${placeholders})
         ORDER BY job_id, field`,
      )
      .bind(...jobIds)
      .all<ProvenanceRow>(),
    db
      .prepare(
        `SELECT labels.source_record_id, labels.source_value
         FROM source_labels AS labels
         JOIN job_provenance AS provenance
           ON provenance.source_record_id = labels.source_record_id
         WHERE provenance.job_id IN (${placeholders})`,
      )
      .bind(...jobIds)
      .all<SourceLabelRow>(),
  ])
  return {
    labels: labels.results,
    provenance: provenance.results,
    sources: sources.results,
    tags: tags.results,
  }
}

function mapRows(
  rows: JobRow[],
  related: Awaited<ReturnType<typeof associations>>,
) {
  const sourcesByJob = new Map<string, SourceRow[]>()
  for (const source of related.sources) {
    const items = sourcesByJob.get(source.job_id) ?? []
    items.push(source)
    sourcesByJob.set(source.job_id, items)
  }
  const labelsBySource = new Map<string, string[]>()
  for (const label of related.labels) {
    const items = labelsBySource.get(label.source_record_id) ?? []
    items.push(label.source_value)
    labelsBySource.set(label.source_record_id, items)
  }
  const tagsByJob = new Map<string, TagRow[]>()
  for (const tag of related.tags) {
    const items = tagsByJob.get(tag.job_id) ?? []
    items.push(tag)
    tagsByJob.set(tag.job_id, items)
  }
  const provenanceByJob = new Map<string, ProvenanceRow[]>()
  for (const item of related.provenance) {
    const items = provenanceByJob.get(item.job_id) ?? []
    items.push(item)
    provenanceByJob.set(item.job_id, items)
  }

  return rows.map((row) => {
    const sourceRows = sourcesByJob.get(row.id) ?? []
    const sourceMarkers = new Map(
      sourceRows.map((source, index) => [source.source_record_id, index + 1]),
    )
    const sources = sourceRows.map((source, index) => ({
      categories: labelsBySource.get(source.source_record_id) ?? [],
      checkedAt: iso(source.last_checked_at) ?? new Date(0).toISOString(),
      key: source.provider,
      label: sourceLabel(source.provider),
      listingUrl: source.listing_url,
      marker: index + 1,
    }))
    const provenance = (provenanceByJob.get(row.id) ?? []).map((item) => ({
      field: item.field,
      marker: sourceMarkers.get(item.source_record_id) ?? 1,
      origin: item.origin,
      value: item.value,
    }))
    const salary =
      row.salary_min !== null &&
      row.salary_max !== null &&
      row.salary_currency !== null &&
      row.salary_period !== null
        ? {
            currency: row.salary_currency,
            max: row.salary_max,
            min: row.salary_min,
            period: row.salary_period,
          }
        : null
    return {
      company: row.company,
      companyDomain: row.company_domain,
      descriptionHtml: row.description_html_sanitized,
      eligibleCountries: arrayValue(row.eligible_countries),
      eligibleRegions: arrayValue(row.eligible_regions),
      employmentType: row.employment_type,
      excludedCountries: arrayValue(row.excluded_countries),
      excludedRegions: arrayValue(row.excluded_regions),
      firstSeenAt: iso(row.first_seen_at) ?? new Date(0).toISOString(),
      id: row.id,
      locationSummary: row.location_summary,
      provenance,
      publishedAt: iso(row.published_at),
      remoteScope: row.remote_scope,
      salary,
      seniority: row.seniority,
      slug: row.slug,
      sources,
      status: row.status,
      tags: (tagsByJob.get(row.id) ?? []).map((tag) => ({
        filterable: tag.filterable === 1,
        normalized: tag.normalized,
        sourceValue: tag.source_value,
      })),
      title: row.title,
      timezoneRequirements: arrayValue(row.timezone_requirements),
      travelRequired: row.travel_required,
      visaSponsorship: row.visa_sponsorship,
    } satisfies JobFixture
  })
}

export async function listCanonicalJobs(
  db: D1Database,
  search: JobSearch,
  limit = 10,
): Promise<{ hasCatalog: boolean; jobs: JobFixture[]; total: number }> {
  const [count, total, rows] = await Promise.all([
    catalogCount(db),
    matchingCount(db, search),
    jobRows(db, search, limit),
  ])
  const related = await associations(
    db,
    rows.map((row) => row.id),
  )
  return { hasCatalog: count > 0, jobs: mapRows(rows, related), total }
}

export async function getCanonicalJob(
  db: D1Database,
  identifier: string,
): Promise<{ hasCatalog: boolean; job: JobFixture | null }> {
  const count = await catalogCount(db)
  const row = await db
    .prepare(
      `SELECT company, company_domain, description_excerpt,
              description_html_sanitized, description_text,
              eligible_countries, eligible_regions, employment_type,
              excluded_countries, excluded_regions, first_seen_at,
              id, last_checked_at, last_seen_at, location_summary,
              normalized_company, published_at, remote_scope,
              salary_currency, salary_max, salary_min, salary_period,
              seniority, slug, status, title, timezone_requirements,
              travel_required, visa_sponsorship
       FROM jobs WHERE id = ? OR slug = ? LIMIT 1`,
    )
    .bind(identifier, identifier)
    .first<JobRow>()
  if (!row) return { hasCatalog: count > 0, job: null }
  const related = await associations(db, [row.id])
  return { hasCatalog: count > 0, job: mapRows([row], related)[0] ?? null }
}

export async function websiteJobs(
  db: D1Database | undefined,
  search: JobSearch,
  production = false,
): Promise<WebsiteCatalogResult> {
  if (!db) {
    if (production) {
      return {
        fallback: false,
        jobs: [],
        meta: null,
        total: 0,
        unavailable: true,
      }
    }
    const matches = filterFixtures(search)
    return {
      fallback: true,
      jobs: matches.slice(0, 10),
      meta: await readCatalogMeta(undefined, false),
      total: matches.length,
      unavailable: false,
    }
  }
  try {
    const result = await listCanonicalJobs(db, search)
    if (!result.hasCatalog && !production) {
      const matches = filterFixtures(search)
      return {
        fallback: true,
        jobs: matches.slice(0, 10),
        meta: await readCatalogMeta(db, false),
        total: matches.length,
        unavailable: false,
      }
    }
    return {
      fallback: false,
      jobs: result.jobs,
      meta: await readCatalogMeta(db, production),
      total: result.total,
      unavailable: false,
    }
  } catch {
    return {
      fallback: false,
      jobs: [],
      meta: null,
      total: 0,
      unavailable: true,
    }
  }
}

export async function websiteJob(
  db: D1Database | undefined,
  identifier: string,
  production = false,
): Promise<WebsiteCatalogResult & { job: JobFixture | null }> {
  if (!db) {
    if (production) {
      return {
        fallback: false,
        job: null,
        jobs: [],
        meta: null,
        total: 0,
        unavailable: true,
      }
    }
    return {
      fallback: true,
      job: JOB_FIXTURES.find((item) => item.slug === identifier) ?? null,
      jobs: [],
      meta: await readCatalogMeta(undefined, false),
      total: 0,
      unavailable: false,
    }
  }
  try {
    const result = await getCanonicalJob(db, identifier)
    if (!result.hasCatalog && !production) {
      return {
        fallback: true,
        job: JOB_FIXTURES.find((item) => item.slug === identifier) ?? null,
        jobs: [],
        meta: await readCatalogMeta(db, false),
        total: 0,
        unavailable: false,
      }
    }
    return {
      fallback: false,
      job: result.job,
      jobs: [],
      meta: await readCatalogMeta(db, production),
      total: 0,
      unavailable: false,
    }
  } catch {
    return {
      fallback: false,
      job: null,
      jobs: [],
      meta: null,
      total: 0,
      unavailable: true,
    }
  }
}

export async function websiteMeta(
  db: D1Database | undefined,
  production = false,
): Promise<{ meta: CatalogMeta | null; unavailable: boolean }> {
  if (!db && production) return { meta: null, unavailable: true }
  try {
    return {
      meta: await readCatalogMeta(db, production),
      unavailable: false,
    }
  } catch {
    return { meta: null, unavailable: true }
  }
}

function filterFixtures(search: JobSearch) {
  if (search.error) return []
  const source = search.source as SourceKey[]
  return JOB_FIXTURES.filter((job) => {
    if (search.role_family !== 'engineering') return false
    if (search.status === 'active' && job.status !== 'active') return false
    if (
      search.company &&
      normalizeCompany(job.company) !== normalizeCompany(search.company)
    )
      return false
    if (search.country) {
      const worldwide =
        job.remoteScope === 'worldwide' &&
        !job.excludedCountries.includes(search.country)
      const explicit = job.eligibleCountries.includes(search.country)
      if (!worldwide && !explicit) return false
    }
    if (search.employment_type && job.employmentType !== search.employment_type)
      return false
    if (search.remote_scope && job.remoteScope !== search.remote_scope)
      return false
    if (
      !search.remote_scope &&
      !['worldwide', 'countries', 'region', 'timezone'].includes(
        job.remoteScope,
      )
    )
      return false
    if (search.seniority && job.seniority !== search.seniority) return false
    if (
      source.length > 0 &&
      !job.sources.some((item) => source.includes(item.key))
    )
      return false
    if (
      search.tag &&
      !job.tags.some(
        (item) => item.filterable && item.normalized === search.tag,
      )
    )
      return false
    return true
  }).toSorted((left, right) => {
    if (
      search.sort === 'newest_published' &&
      (!left.publishedAt || !right.publishedAt)
    )
      return 0
    const leftDate =
      search.sort === 'newest_published'
        ? (left.publishedAt ?? '')
        : left.firstSeenAt
    const rightDate =
      search.sort === 'newest_published'
        ? (right.publishedAt ?? '')
        : right.firstSeenAt
    return rightDate.localeCompare(leftDate) || left.id.localeCompare(right.id)
  })
}
