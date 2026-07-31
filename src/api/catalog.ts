import type { JobFixture, SourceKey } from '~/data/job-fixtures'
import { JOB_FIXTURES } from '~/data/job-fixtures'
import {
  normalizeCompany,
  sanitizeDescription,
} from '~/ingestion/normalization'
import type {
  ApiFilters,
  ApiJobDetailSchema,
  ApiJobSummarySchema,
  CursorPosition,
} from './contracts'
import { regionValues } from './contracts'
import type { z } from 'zod'

type ApiJobSummary = z.infer<typeof ApiJobSummarySchema>
type ApiJobDetail = z.infer<typeof ApiJobDetailSchema>

type CatalogRow = {
  company: string
  company_domain: string | null
  description_excerpt: string
  description_html_sanitized: string
  description_text: string
  eligible_countries: string
  eligible_regions: string
  employment_type: ApiJobSummary['employment_type']
  excluded_countries: string
  excluded_regions: string
  first_seen_at: number
  id: string
  last_checked_at: number
  location_summary: string
  published_at: number | null
  remote_scope: ApiJobSummary['remote_scope']
  role_family: 'engineering'
  salary_currency: string | null
  salary_max: number | null
  salary_min: number | null
  salary_period: 'hour' | 'month' | 'year' | null
  seniority: ApiJobSummary['seniority']
  slug: string
  status: 'active' | 'stale' | 'closed'
  title: string
  timezone_requirements: string
  travel_required: ApiJobSummary['travel_required']
  visa_sponsorship: ApiJobSummary['visa_sponsorship']
}

type SourceRow = {
  attribution: string
  categories: string[]
  company: string
  job_id: string
  last_checked_at: number
  listing_url: string
  provider: SourceKey
  source_record_id: string
  title: string
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

type LabelRow = {
  source_record_id: string
  source_value: string
}

type Related = {
  labels: LabelRow[]
  provenance: ProvenanceRow[]
  sources: SourceRow[]
  tags: TagRow[]
}

export type CatalogMeta = {
  cache_epoch: string
  last_completed_cycle: {
    finished_at: string
    status: string
  } | null
  providers: Array<{
    active_count: number
    enabled: boolean
    key: SourceKey
    last_complete_at: string | null
    last_successful_at: string | null
    status: string
  }>
  total_active_jobs: number
}

function jsonArray(value: string | null | undefined) {
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

function regionStorageValues(region: string) {
  const normalized = region.trim().toUpperCase()
  const values = regionValues(region)
  const legacyLabels: Record<string, string> = {
    '009': 'Asia Pacific',
    '030': 'Asia',
    '034': 'Southern Asia',
    '035': 'South-eastern Asia',
    '142': 'Asia',
    '143': 'Central Asia',
    '145': 'Western Asia',
    '150': 'Europe',
    '151': 'Eastern Europe',
    '154': 'Northern Europe',
    '155': 'Western Europe',
    '002': 'Africa',
    '014': 'Eastern Africa',
    '015': 'Northern Africa',
    '017': 'Middle Africa',
    '018': 'Southern Africa',
    '019': 'Americas',
    '021': 'Northern America',
    '029': 'Caribbean',
    '013': 'Central America',
    '005': 'South America',
    '001': 'World',
  }
  return [
    ...new Set([
      normalized,
      ...values,
      ...values.map((value) => legacyLabels[value] ?? value),
    ]),
  ]
}

function buildWhere(filters: ApiFilters, cursor: CursorPosition | null) {
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

  if (filters.status === 'active') conditions.push("j.status = 'active'")
  if (filters.status === 'closed') conditions.push("j.status = 'closed'")
  if (filters.role_family) conditions.push('j.role_family = ?')
  values.push(filters.role_family)

  if (filters.company) {
    conditions.push('j.normalized_company = ?')
    values.push(normalizeCompany(filters.company).toLocaleLowerCase())
  }
  if (filters.country) {
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
    values.push(filters.country, filters.country)
  }
  if (filters.region) {
    const regionValuesForQuery = regionStorageValues(filters.region)
    conditions.push(
      `EXISTS (
         SELECT 1 FROM json_each(j.eligible_regions)
         WHERE json_each.value IN (${regionValuesForQuery.map(() => '?').join(', ')})
       )`,
    )
    values.push(...regionValuesForQuery)
  }
  if (filters.timezone) {
    conditions.push(
      `EXISTS (
         SELECT 1 FROM json_each(j.timezone_requirements)
         WHERE json_each.value = ?
       )`,
    )
    values.push(filters.timezone)
  }
  if (filters.employment_type) {
    conditions.push('j.employment_type = ?')
    values.push(filters.employment_type)
  }
  if (filters.remote_scope) {
    conditions.push('j.remote_scope = ?')
    values.push(filters.remote_scope)
  } else {
    conditions.push(
      "j.remote_scope IN ('worldwide', 'countries', 'region', 'timezone')",
    )
  }
  if (filters.seniority) {
    conditions.push('j.seniority = ?')
    values.push(filters.seniority)
  }
  if (filters.visa_sponsorship) {
    conditions.push('j.visa_sponsorship = ?')
    values.push(filters.visa_sponsorship)
  }
  if (filters.travel_required) {
    conditions.push('j.travel_required = ?')
    values.push(filters.travel_required)
  }
  if (filters.source.length > 0) {
    const placeholders = filters.source.map(() => '?').join(', ')
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
    values.push(...filters.source)
  }
  if (filters.tag.length > 0) {
    if (filters.tag_mode === 'all') {
      for (const tag of filters.tag) {
        conditions.push(
          `EXISTS (
             SELECT 1 FROM job_tags AS requested_tag
             WHERE requested_tag.job_id = j.id
               AND requested_tag.normalized = ?
               AND requested_tag.filterable = 1
           )`,
        )
        values.push(tag)
      }
    } else {
      conditions.push(
        `EXISTS (
           SELECT 1 FROM job_tags AS requested_tag
           WHERE requested_tag.job_id = j.id
             AND requested_tag.normalized IN (${filters.tag.map(() => '?').join(', ')})
             AND requested_tag.filterable = 1
         )`,
      )
      values.push(...filters.tag)
    }
  }
  if (filters.salary_min !== undefined) {
    conditions.push(
      'j.salary_min >= ? AND j.salary_currency = ? AND j.salary_period = ?',
    )
    values.push(
      filters.salary_min,
      filters.salary_currency as string,
      filters.salary_period as string,
    )
  }
  if (filters.published_after) {
    conditions.push('j.published_at > ?')
    values.push(Date.parse(filters.published_after))
  }
  if (filters.first_seen_after) {
    conditions.push('j.first_seen_at > ?')
    values.push(Date.parse(filters.first_seen_after))
  }

  const order =
    filters.sort === 'newest_published'
      ? 'j.published_at DESC, j.id DESC'
      : 'j.first_seen_at DESC, j.id DESC'
  if (filters.sort === 'newest_published')
    conditions.push('j.published_at IS NOT NULL')
  if (cursor) {
    const column =
      filters.sort === 'newest_published' ? 'j.published_at' : 'j.first_seen_at'
    conditions.push(`(${column} < ? OR (${column} = ? AND j.id < ?))`)
    values.push(cursor.value, cursor.value, cursor.id)
  }

  return { conditions, order, values }
}

async function catalogRows(
  db: D1Database,
  filters: ApiFilters,
  cursor: CursorPosition | null,
) {
  const { conditions, order, values } = buildWhere(filters, cursor)
  const rows = await db
    .prepare(
      `SELECT company, company_domain, description_excerpt,
              description_html_sanitized, description_text,
              eligible_countries, eligible_regions, employment_type,
              excluded_countries, excluded_regions, first_seen_at,
              id, last_checked_at, location_summary, published_at,
              remote_scope, role_family, salary_currency, salary_max,
              salary_min, salary_period, seniority, slug, status, title,
              timezone_requirements, travel_required, visa_sponsorship
       FROM jobs AS j
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${order}
       LIMIT ?`,
    )
    .bind(...values, filters.limit + 1)
    .all<CatalogRow>()
  return rows.results
}

async function catalogCount(db: D1Database) {
  const row = await db
    .prepare('SELECT count(*) AS count FROM jobs')
    .first<{ count: number }>()
  return row?.count ?? 0
}

async function related(db: D1Database, jobIds: string[]): Promise<Related> {
  if (jobIds.length === 0) {
    return { labels: [], provenance: [], sources: [], tags: [] }
  }
  const placeholders = jobIds.map(() => '?').join(', ')
  const [sources, tags, provenance, labels] = await Promise.all([
    db
      .prepare(
        `SELECT provenance.job_id, source.id AS source_record_id,
              source.provider, source.attribution, source.listing_url,
              source.last_checked_at, source.title, source.company
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
      .all<LabelRow>(),
  ])
  return {
    labels: labels.results,
    provenance: provenance.results,
    sources: sources.results,
    tags: tags.results,
  }
}

function summaryFromRow(
  row: CatalogRow,
  sources: SourceRow[],
  tags: TagRow[],
): ApiJobSummary {
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
    company_domain: row.company_domain,
    description_excerpt: row.description_excerpt,
    eligible_countries: jsonArray(row.eligible_countries),
    eligible_regions: jsonArray(row.eligible_regions),
    employment_type: row.employment_type,
    excluded_countries: jsonArray(row.excluded_countries),
    excluded_regions: jsonArray(row.excluded_regions),
    first_seen_at: iso(row.first_seen_at) ?? new Date(0).toISOString(),
    id: row.id,
    location_summary: row.location_summary,
    published_at: iso(row.published_at),
    remote_scope: row.remote_scope,
    role_family: row.role_family,
    salary,
    seniority: row.seniority,
    slug: row.slug,
    sources: sources.map((source) => ({
      attribution: source.attribution,
      provider: source.provider,
    })),
    status: row.status,
    tags: tags.map((tag) => ({
      filterable: tag.filterable === 1,
      normalized: tag.normalized,
      source_value: tag.source_value,
    })),
    timezone_requirements: jsonArray(row.timezone_requirements),
    title: row.title,
    travel_required: row.travel_required,
    visa_sponsorship: row.visa_sponsorship,
  }
}

function detailFromRow(row: CatalogRow, data: Related): ApiJobDetail {
  const summary = summaryFromRow(
    row,
    data.sources.filter((source) => source.job_id === row.id),
    data.tags.filter((tag) => tag.job_id === row.id),
  )
  const sources = data.sources.filter((source) => source.job_id === row.id)
  const sourceMarkers = new Map(
    sources.map((source, index) => [source.source_record_id, index + 1]),
  )
  const provenance = data.provenance
    .filter((item) => item.job_id === row.id)
    .map((item) => ({
      field: item.field,
      marker: sourceMarkers.get(item.source_record_id) ?? 1,
      origin: item.origin,
      value: item.value,
    }))
  const sourceRecords = sources.map((source) => ({
    attribution: source.attribution,
    categories: data.labels
      .filter((label) => label.source_record_id === source.source_record_id)
      .map((label) => label.source_value),
    checked_at: iso(source.last_checked_at) ?? new Date(0).toISOString(),
    company: source.company,
    listing_url: source.listing_url,
    provider: source.provider,
    title: source.title,
  }))
  const conflicts = (['company', 'title'] as const)
    .map(
      (field) =>
        [
          field,
          [...new Set(sourceRecords.map((source) => source[field]))],
        ] as const,
    )
    .filter(([, values]) => values.length > 1)
    .map(([field, source_values]) => ({
      field,
      source_values: [...source_values],
    }))
  return {
    ...summary,
    conflicts,
    description_html: row.description_html_sanitized,
    description_text: row.description_text,
    provenance,
    source_records: sourceRecords,
  }
}

function fixtureSummary(job: JobFixture): ApiJobSummary {
  const descriptionText = sanitizeDescription(
    job.descriptionHtml,
  ).descriptionText
  return {
    company: job.company,
    company_domain: job.companyDomain,
    description_excerpt:
      descriptionText.length > 280
        ? `${descriptionText.slice(0, 277)}...`
        : descriptionText,
    eligible_countries: job.eligibleCountries,
    eligible_regions: job.eligibleRegions ?? [],
    employment_type: job.employmentType,
    excluded_countries: job.excludedCountries,
    excluded_regions: job.excludedRegions ?? [],
    first_seen_at: job.firstSeenAt,
    id: job.id,
    location_summary: job.locationSummary,
    published_at: job.publishedAt,
    remote_scope: job.remoteScope,
    role_family: 'engineering',
    salary: job.salary,
    seniority: job.seniority,
    slug: job.slug,
    sources: job.sources.map((source) => ({
      attribution: source.label,
      provider: source.key,
    })),
    status: job.status,
    tags: job.tags.map((tag) => ({
      filterable: tag.filterable,
      normalized: tag.normalized,
      source_value: tag.sourceValue,
    })),
    timezone_requirements: job.timezoneRequirements ?? [],
    title: job.title,
    travel_required: job.travelRequired,
    visa_sponsorship: job.visaSponsorship,
  }
}

function fixtureMatches(job: JobFixture, filters: ApiFilters) {
  if (filters.status === 'active' && job.status !== 'active') return false
  if (filters.status === 'closed' && job.status !== 'closed') return false
  if (
    filters.company &&
    normalizeCompany(job.company) !== normalizeCompany(filters.company)
  )
    return false
  if (filters.country) {
    const worldwide =
      job.remoteScope === 'worldwide' &&
      !job.excludedCountries.includes(filters.country)
    if (!worldwide && !job.eligibleCountries.includes(filters.country))
      return false
  }
  if (filters.region) {
    const requested = regionStorageValues(filters.region)
    if (
      !(job.eligibleRegions ?? []).some((region) =>
        requested.includes(region.toUpperCase()),
      )
    )
      return false
  }
  if (
    filters.timezone &&
    !(job.timezoneRequirements ?? []).includes(filters.timezone)
  )
    return false
  if (filters.role_family !== 'engineering') return false
  if (filters.employment_type && job.employmentType !== filters.employment_type)
    return false
  if (filters.remote_scope && job.remoteScope !== filters.remote_scope)
    return false
  if (
    !filters.remote_scope &&
    !['worldwide', 'countries', 'region', 'timezone'].includes(job.remoteScope)
  )
    return false
  if (filters.seniority && job.seniority !== filters.seniority) return false
  if (
    filters.visa_sponsorship &&
    job.visaSponsorship !== filters.visa_sponsorship
  )
    return false
  if (filters.travel_required && job.travelRequired !== filters.travel_required)
    return false
  if (
    filters.source.length > 0 &&
    !job.sources.some((source) => filters.source.includes(source.key))
  )
    return false
  if (filters.tag.length > 0) {
    const tags = job.tags
      .filter((tag) => tag.filterable)
      .map((tag) => tag.normalized)
    if (
      filters.tag_mode === 'all' &&
      !filters.tag.every((tag) => tags.includes(tag))
    )
      return false
    if (
      filters.tag_mode === 'any' &&
      !filters.tag.some((tag) => tags.includes(tag))
    )
      return false
  }
  if (filters.salary_min !== undefined) {
    if (
      !job.salary ||
      job.salary.currency !== filters.salary_currency ||
      job.salary.period !== filters.salary_period
    )
      return false
    if (job.salary.min < filters.salary_min) return false
  }
  if (
    filters.published_after &&
    (!job.publishedAt ||
      Date.parse(job.publishedAt) <= Date.parse(filters.published_after))
  )
    return false
  if (
    filters.first_seen_after &&
    Date.parse(job.firstSeenAt) <= Date.parse(filters.first_seen_after)
  )
    return false
  if (filters.sort === 'newest_published' && !job.publishedAt) return false
  return true
}

function fixturePosition(
  job: JobFixture,
  sort: ApiFilters['sort'],
): CursorPosition {
  return {
    id: job.id,
    sort,
    value: Date.parse(
      sort === 'newest_published'
        ? (job.publishedAt ?? job.firstSeenAt)
        : job.firstSeenAt,
    ),
  }
}

function comparePosition(left: CursorPosition, right: CursorPosition) {
  return right.value - left.value || right.id.localeCompare(left.id)
}

function listFixtures(filters: ApiFilters, cursor: CursorPosition | null) {
  const jobs = JOB_FIXTURES.filter((job) =>
    fixtureMatches(job, filters),
  ).toSorted((left, right) =>
    comparePosition(
      fixturePosition(left, filters.sort),
      fixturePosition(right, filters.sort),
    ),
  )
  const afterCursor = cursor
    ? jobs.filter((job) => {
        const position = fixturePosition(job, filters.sort)
        return (
          position.value < cursor.value ||
          (position.value === cursor.value && position.id < cursor.id)
        )
      })
    : jobs
  const page = afterCursor.slice(0, filters.limit + 1)
  const hasNext = page.length > filters.limit
  const visible = page.slice(0, filters.limit)
  return {
    hasCatalog: false,
    jobs: visible.map(fixtureSummary),
    nextPosition: hasNext
      ? fixturePosition(afterCursor[filters.limit] as JobFixture, filters.sort)
      : null,
  }
}

export async function listApiJobs(
  db: D1Database | undefined,
  filters: ApiFilters,
  cursor: CursorPosition | null,
  production = false,
) {
  if (!db) {
    if (production) throw new Error('catalog_database_unavailable')
    return listFixtures(filters, cursor)
  }
  try {
    const [count, rows] = await Promise.all([
      catalogCount(db),
      catalogRows(db, filters, cursor),
    ])
    if (count === 0 && !production) return listFixtures(filters, cursor)
    const visibleRows = rows.slice(0, filters.limit)
    const data = await related(
      db,
      visibleRows.map((row) => row.id),
    )
    const nextRow = rows[filters.limit]
    return {
      hasCatalog: true,
      jobs: visibleRows.map((row) =>
        summaryFromRow(
          row,
          data.sources.filter((source) => source.job_id === row.id),
          data.tags.filter((tag) => tag.job_id === row.id),
        ),
      ),
      nextPosition: nextRow
        ? {
            id: nextRow.id,
            sort: filters.sort,
            value:
              filters.sort === 'newest_published'
                ? (nextRow.published_at ?? 0)
                : nextRow.first_seen_at,
          }
        : null,
    }
  } catch (error) {
    if (production) throw error
    return listFixtures(filters, cursor)
  }
}

export async function getApiJob(
  db: D1Database | undefined,
  identifier: string,
  production = false,
): Promise<ApiJobDetail | null> {
  if (!db) {
    if (production) throw new Error('catalog_database_unavailable')
    const job = JOB_FIXTURES.find(
      (item) => item.id === identifier || item.slug === identifier,
    )
    if (!job) return null
    const summary = fixtureSummary(job)
    return {
      ...summary,
      conflicts:
        job.sources.length > 1
          ? [
              {
                field: 'source_records',
                source_values: job.sources.map((source) => source.label),
              },
            ]
          : [],
      description_html: job.descriptionHtml,
      description_text: sanitizeDescription(job.descriptionHtml)
        .descriptionText,
      provenance: job.provenance,
      source_records: job.sources.map((source) => ({
        attribution: source.label,
        categories: source.categories,
        checked_at: source.checkedAt,
        company: job.company,
        listing_url: source.listingUrl,
        provider: source.key,
        title: job.title,
      })),
    }
  }
  try {
    const row = await db
      .prepare(
        `SELECT company, company_domain, description_excerpt,
              description_html_sanitized, description_text,
              eligible_countries, eligible_regions, employment_type,
              excluded_countries, excluded_regions, first_seen_at,
              id, last_checked_at, location_summary, published_at,
              remote_scope, role_family, salary_currency, salary_max,
              salary_min, salary_period, seniority, slug, status, title,
              timezone_requirements, travel_required, visa_sponsorship
       FROM jobs AS j
       WHERE (j.id = ? OR j.slug = ?)
         AND EXISTS (
           SELECT 1
           FROM job_provenance AS visible_provenance
           JOIN source_records AS visible_source
             ON visible_source.id = visible_provenance.source_record_id
           JOIN source_health AS visible_health
             ON visible_health.provider = visible_source.provider
           WHERE visible_provenance.job_id = j.id
             AND visible_health.enabled = 1
         )
       LIMIT 1`,
      )
      .bind(identifier, identifier)
      .first<CatalogRow>()
    if (!row) return null
    return detailFromRow(row, await related(db, [row.id]))
  } catch (error) {
    if (production) throw error
    return getApiJob(undefined, identifier, false)
  }
}

function fixtureMeta(): CatalogMeta {
  const checkedAt = JOB_FIXTURES.flatMap((job) => job.sources)
    .map((source) => Date.parse(source.checkedAt))
    .filter(Number.isFinite)
  const latest =
    checkedAt.length > 0 ? new Date(Math.max(...checkedAt)).toISOString() : null
  return {
    cache_epoch: 'fixture',
    last_completed_cycle: null,
    providers: (['jsguru', 'remote_ok', 'wwr'] as const).map((key) => ({
      active_count: JOB_FIXTURES.filter(
        (job) =>
          job.status === 'active' &&
          job.sources.some((source) => source.key === key),
      ).length,
      enabled: true,
      key,
      last_complete_at: latest,
      last_successful_at: latest,
      status: 'healthy',
    })),
    total_active_jobs: JOB_FIXTURES.filter((job) => job.status === 'active')
      .length,
  }
}

export async function readCatalogMeta(
  db: D1Database | undefined,
  production = false,
): Promise<CatalogMeta> {
  if (!db) {
    if (production) throw new Error('catalog_database_unavailable')
    return fixtureMeta()
  }
  try {
    const [state, providers, active, cycle] = await Promise.all([
      db
        .prepare("SELECT cache_epoch FROM catalog_state WHERE key = 'live'")
        .first<{ cache_epoch: string }>(),
      db
        .prepare(
          `SELECT provider, enabled, status, last_successful_at,
                last_complete_at, active_count
         FROM source_health ORDER BY provider`,
        )
        .all<{
          active_count: number
          enabled: number
          key?: SourceKey
          last_complete_at: number | null
          last_successful_at: number | null
          provider: SourceKey
          status: string
        }>(),
      db
        .prepare(
          `SELECT count(*) AS count FROM jobs AS j
         WHERE j.status = 'active' AND EXISTS (
           SELECT 1 FROM job_provenance AS p
           JOIN source_records AS s ON s.id = p.source_record_id
           JOIN source_health AS h ON h.provider = s.provider
           WHERE p.job_id = j.id AND h.enabled = 1
         )`,
        )
        .first<{ count: number }>(),
      db
        .prepare(
          `SELECT status, finished_at FROM ingestion_cycles
         WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1`,
        )
        .first<{ finished_at: number; status: string }>(),
    ])
    return {
      cache_epoch: state?.cache_epoch ?? 'unknown',
      last_completed_cycle: cycle
        ? {
            finished_at: new Date(cycle.finished_at).toISOString(),
            status: cycle.status,
          }
        : null,
      providers: providers.results.map((provider) => ({
        active_count: provider.active_count,
        enabled: provider.enabled === 1,
        key: provider.provider,
        last_complete_at: iso(provider.last_complete_at),
        last_successful_at: iso(provider.last_successful_at),
        status: provider.status,
      })),
      total_active_jobs: active?.count ?? 0,
    }
  } catch (error) {
    if (production) throw error
    return fixtureMeta()
  }
}
