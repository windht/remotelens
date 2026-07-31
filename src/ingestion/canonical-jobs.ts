import {
  deriveJobFields,
  normalizeCompany,
  normalizeTitle,
  sha256,
} from './normalization'

type SourceRow = {
  attribution: string
  company: string
  description_html: string
  description_text: string
  first_seen_at: number
  id: string
  last_checked_at: number
  last_seen_at: number
  listing_url: string
  provider: 'jsguru' | 'remote_ok' | 'wwr'
  source_key: string
  source_published_at: number | null
  status: 'active' | 'missing' | 'closed'
  title: string
  closed_at: number | null
}

type LabelRow = {
  kind: 'filterable' | 'provenance'
  normalized: string
  source_record_id: string
  source_value: string
}

type DecisionRow = {
  left_source_record_id: string
  outcome: 'merge' | 'separate' | 'uncertain' | 'failed'
  right_source_record_id: string
}

type CanonicalGroup = {
  records: SourceRow[]
  id: string
}

const PROVIDER_PRIORITY: Record<SourceRow['provider'], number> = {
  remote_ok: 0,
  wwr: 1,
  jsguru: 2,
}

function sourcePriority(record: SourceRow) {
  return [
    record.status === 'active' ? 0 : record.status === 'missing' ? 1 : 2,
    PROVIDER_PRIORITY[record.provider],
    record.id,
  ] as const
}

function sortedRecords(records: SourceRow[]) {
  return records.toSorted((left, right) => {
    const leftPriority = sourcePriority(left)
    const rightPriority = sourcePriority(right)
    return (
      leftPriority[0] - rightPriority[0] ||
      leftPriority[1] - rightPriority[1] ||
      leftPriority[2].localeCompare(rightPriority[2])
    )
  })
}

function slugify(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function excerpt(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length > 280 ? `${compact.slice(0, 277)}...` : compact
}

function json(value: string[]) {
  return JSON.stringify([...new Set(value)].toSorted())
}

function firstNonEmpty<T>(values: Array<T | null | undefined>, fallback: T) {
  return (
    values.find((value): value is T => value !== null && value !== undefined) ??
    fallback
  )
}

function statusFor(records: SourceRow[]) {
  if (records.some((record) => record.status === 'active'))
    return 'active' as const
  if (records.some((record) => record.status === 'missing'))
    return 'stale' as const
  return 'closed' as const
}

function unionFind(ids: string[]) {
  const parent = new Map(ids.map((id) => [id, id]))
  const find = (id: string): string => {
    const current = parent.get(id) ?? id
    if (current === id) return current
    const root = find(current)
    parent.set(id, root)
    return root
  }
  const union = (left: string, right: string) => {
    const leftRoot = find(left)
    const rightRoot = find(right)
    if (leftRoot !== rightRoot) {
      const ordered = [leftRoot, rightRoot].toSorted()
      parent.set(ordered[1] ?? rightRoot, ordered[0] ?? leftRoot)
    }
  }
  return { find, union }
}

async function groupsFromDatabase(db: D1Database): Promise<CanonicalGroup[]> {
  const sourceRows = await db
    .prepare(
      `SELECT id, provider, source_key, attribution, listing_url, title, company,
              description_html, description_text, source_published_at, status,
              first_seen_at, last_seen_at, last_checked_at, closed_at
       FROM source_records
       ORDER BY id`,
    )
    .all<SourceRow>()
  const records = sourceRows.results
  const byId = new Map(records.map((record) => [record.id, record]))
  const find = unionFind(records.map((record) => record.id))
  const decisions = await db
    .prepare(
      `SELECT candidate.left_source_record_id, candidate.right_source_record_id,
              decision.outcome
       FROM dedupe_candidates AS candidate
       JOIN dedupe_decisions AS decision
         ON decision.candidate_id = candidate.id
       WHERE decision.id = (
         SELECT latest.id
         FROM dedupe_decisions AS latest
         WHERE latest.candidate_id = candidate.id
         ORDER BY latest.decided_at DESC, latest.id DESC
         LIMIT 1
       )
         AND decision.outcome = 'merge'`,
    )
    .all<DecisionRow>()
  for (const decision of decisions.results) {
    if (
      byId.has(decision.left_source_record_id) &&
      byId.has(decision.right_source_record_id)
    ) {
      find.union(
        decision.left_source_record_id,
        decision.right_source_record_id,
      )
    }
  }

  const grouped = new Map<string, SourceRow[]>()
  for (const record of records) {
    const root = find.find(record.id)
    const group = grouped.get(root) ?? []
    group.push(record)
    grouped.set(root, group)
  }
  const result: CanonicalGroup[] = []
  for (const group of grouped.values()) {
    const sorted = sortedRecords(group)
    const hash = await sha256(sorted.map((record) => record.id).join('|'))
    result.push({ id: `job_${hash.slice(0, 24)}`, records: sorted })
  }
  return result.toSorted((left, right) => left.id.localeCompare(right.id))
}

export async function rebuildCanonicalJobs(db: D1Database, now: number) {
  const groups = await groupsFromDatabase(db)
  const labels = await db
    .prepare(
      `SELECT source_record_id, normalized, source_value, kind
       FROM source_labels
       ORDER BY source_record_id, kind, normalized`,
    )
    .all<LabelRow>()
  const labelsByRecord = new Map<string, LabelRow[]>()
  for (const label of labels.results) {
    const current = labelsByRecord.get(label.source_record_id) ?? []
    current.push(label)
    labelsByRecord.set(label.source_record_id, current)
  }

  const jobStatements: D1PreparedStatement[] = [db.prepare('DELETE FROM jobs')]
  const associationStatements: D1PreparedStatement[] = []

  for (const group of groups) {
    const [selected] = group.records
    if (!selected) continue
    const selectedFields = deriveJobFields(
      selected.title,
      selected.description_text,
    )
    const allFields = group.records.map((record) =>
      deriveJobFields(record.title, record.description_text),
    )
    const status = statusFor(group.records)
    const title = selected.title
    const company = selected.company
    const normalizedTitle = normalizeTitle(title).toLocaleLowerCase()
    const normalizedCompany = normalizeCompany(company).toLocaleLowerCase()
    const slugBase = slugify(`${title}-${company}`) || 'job'
    const slug = `${slugBase}-${group.id.slice(-12).toLocaleLowerCase()}`
    const descriptionRecord =
      group.records.toSorted(
        (left, right) =>
          right.description_text.length - left.description_text.length ||
          sourcePriority(left)[1] - sourcePriority(right)[1] ||
          left.id.localeCompare(right.id),
      )[0] ?? selected
    const description = deriveJobFields(
      descriptionRecord.title,
      descriptionRecord.description_text,
    )
    const remoteScope = allFields.some(
      (fields) => fields.remoteScope === 'worldwide',
    )
      ? 'worldwide'
      : firstNonEmpty(
          allFields
            .map((fields) => fields.remoteScope)
            .filter((value) => value !== 'unspecified'),
          selectedFields.remoteScope,
        )
    const eligibleCountries = allFields.flatMap(
      (fields) => fields.eligibleCountries,
    )
    const excludedCountries = allFields.flatMap(
      (fields) => fields.excludedCountries,
    )
    const eligibleRegions = allFields.flatMap(
      (fields) => fields.eligibleRegions,
    )
    const excludedRegions = allFields.flatMap(
      (fields) => fields.excludedRegions,
    )
    const timezones = allFields.flatMap((fields) => fields.timezoneRequirements)
    const salary = firstNonEmpty(
      allFields.map((fields) => fields.salary),
      null,
    )
    const employmentType = firstNonEmpty(
      allFields
        .map((fields) => fields.employmentType)
        .filter((value) => value !== null),
      null,
    )
    const seniority = firstNonEmpty(
      allFields
        .map((fields) => fields.seniority)
        .filter((value) => value !== null),
      null,
    )
    const visaSponsorship = firstNonEmpty(
      allFields
        .map((fields) => fields.visaSponsorship)
        .filter((value) => value !== 'unknown'),
      'unknown',
    )
    const travelRequired = firstNonEmpty(
      allFields
        .map((fields) => fields.travelRequired)
        .filter((value) => value !== 'unknown'),
      'unknown',
    )
    const firstSeenAt = Math.min(
      ...group.records.map((record) => record.first_seen_at),
    )
    const lastSeenAt = Math.max(
      ...group.records.map((record) => record.last_seen_at),
    )
    const lastCheckedAt = Math.max(
      ...group.records.map((record) => record.last_checked_at),
    )
    const publishedAt = firstNonEmpty(
      sortedRecords(group.records)
        .map((record) => record.source_published_at)
        .filter((value) => value !== null),
      null,
    )
    const deactivatedAt =
      status === 'closed'
        ? Math.max(...group.records.map((record) => record.closed_at ?? now))
        : null

    jobStatements.push(
      db
        .prepare(
          `INSERT INTO jobs (
             id, slug, title, normalized_title, company, normalized_company,
             company_domain, company_logo_url, description_text,
             description_html_sanitized, description_excerpt, employment_type,
             seniority, role_family, remote_scope, location_summary,
             timezone_requirements, eligible_countries, excluded_countries,
             eligible_regions, excluded_regions, languages, salary_min, salary_max,
             salary_currency, salary_period, salary_raw, visa_sponsorship,
             travel_required, canonical_application_url, published_at,
             first_seen_at, last_seen_at, last_checked_at, deactivated_at,
             status, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, 'engineering',
                     ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?,
                     ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             slug = excluded.slug,
             title = excluded.title,
             normalized_title = excluded.normalized_title,
             company = excluded.company,
             normalized_company = excluded.normalized_company,
             description_text = excluded.description_text,
             description_html_sanitized = excluded.description_html_sanitized,
             description_excerpt = excluded.description_excerpt,
             employment_type = excluded.employment_type,
             seniority = excluded.seniority,
             remote_scope = excluded.remote_scope,
             location_summary = excluded.location_summary,
             timezone_requirements = excluded.timezone_requirements,
             eligible_countries = excluded.eligible_countries,
             excluded_countries = excluded.excluded_countries,
             eligible_regions = excluded.eligible_regions,
             excluded_regions = excluded.excluded_regions,
             salary_min = excluded.salary_min,
             salary_max = excluded.salary_max,
             salary_currency = excluded.salary_currency,
             salary_period = excluded.salary_period,
             salary_raw = excluded.salary_raw,
             visa_sponsorship = excluded.visa_sponsorship,
             travel_required = excluded.travel_required,
             published_at = excluded.published_at,
             first_seen_at = excluded.first_seen_at,
             last_seen_at = excluded.last_seen_at,
             last_checked_at = excluded.last_checked_at,
             deactivated_at = excluded.deactivated_at,
             status = excluded.status,
             updated_at = excluded.updated_at`,
        )
        .bind(
          group.id,
          slug,
          title,
          normalizedTitle,
          company,
          normalizedCompany,
          descriptionRecord.description_text,
          descriptionRecord.description_html,
          excerpt(descriptionRecord.description_text),
          employmentType,
          seniority,
          remoteScope,
          description.locationSummary,
          json(timezones),
          json(eligibleCountries),
          json(excludedCountries),
          json(eligibleRegions),
          json(excludedRegions),
          salary?.min ?? null,
          salary?.max ?? null,
          salary?.currency ?? null,
          salary?.period ?? null,
          salary ? JSON.stringify(salary) : null,
          visaSponsorship,
          travelRequired,
          publishedAt,
          firstSeenAt,
          lastSeenAt,
          lastCheckedAt,
          deactivatedAt,
          status,
          firstSeenAt,
          now,
        ),
    )

    for (const record of group.records) {
      associationStatements.push(
        db
          .prepare(
            `INSERT INTO job_provenance (job_id, source_record_id, attached_at)
             VALUES (?, ?, ?)
             ON CONFLICT(job_id, source_record_id) DO UPDATE SET attached_at = excluded.attached_at`,
          )
          .bind(group.id, record.id, now),
      )
    }

    const tagMap = new Map<string, LabelRow>()
    for (const record of group.records) {
      for (const label of labelsByRecord.get(record.id) ?? []) {
        const current = tagMap.get(label.normalized)
        if (
          !current ||
          (label.kind === 'filterable' && current.kind !== 'filterable')
        ) {
          tagMap.set(label.normalized, label)
        }
      }
    }
    for (const tag of tagMap.values()) {
      associationStatements.push(
        db
          .prepare(
            `INSERT INTO job_tags (job_id, normalized, source_value, filterable)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(job_id, normalized) DO UPDATE SET
               source_value = excluded.source_value,
               filterable = excluded.filterable`,
          )
          .bind(
            group.id,
            tag.normalized,
            tag.source_value,
            tag.kind === 'filterable' ? 1 : 0,
          ),
      )
    }

    const provenanceFields = [
      {
        field: 'title',
        origin: 'source-stated' as const,
        value: title,
      },
      {
        field: 'company',
        origin: 'source-stated' as const,
        value: company,
      },
      {
        field: 'role_family',
        origin: 'normalized' as const,
        value: 'engineering',
      },
      {
        field: 'remote_scope',
        origin: 'parsed' as const,
        value: remoteScope,
      },
      {
        field: 'location',
        origin: 'parsed' as const,
        value: description.locationSummary,
      },
      {
        field: 'employment_type',
        origin: 'parsed' as const,
        value: employmentType ?? 'unknown',
      },
      {
        field: 'seniority',
        origin: 'parsed' as const,
        value: seniority ?? 'unknown',
      },
      {
        field: 'salary',
        origin: 'parsed' as const,
        value: salary ? JSON.stringify(salary) : 'unknown',
      },
      {
        field: 'visa_sponsorship',
        origin: 'parsed' as const,
        value: visaSponsorship,
      },
      {
        field: 'travel_required',
        origin: 'parsed' as const,
        value: travelRequired,
      },
    ]
    for (const [index, field] of provenanceFields.entries()) {
      const source = group.records[index % group.records.length] ?? selected
      associationStatements.push(
        db
          .prepare(
            `INSERT INTO job_field_provenance (
               id, job_id, source_record_id, field, origin, value, created_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET value = excluded.value, created_at = excluded.created_at`,
          )
          .bind(
            `${group.id}:${field.field}`,
            group.id,
            source.id,
            field.field,
            field.origin,
            field.value,
            now,
          ),
      )
    }
  }

  const statements = [...jobStatements, ...associationStatements]
  for (let index = 0; index < statements.length; index += 450) {
    await db.batch(statements.slice(index, index + 450))
  }
  return {
    canonicalJobs: groups.length,
    sourceRecords: groups.reduce(
      (count, group) => count + group.records.length,
      0,
    ),
  }
}
