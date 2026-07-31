import { ISO_COUNTRY_CODES } from './countries'

export const SOURCE_KEYS = ['remote_ok', 'wwr'] as const
export const ROLE_FAMILIES = ['engineering'] as const
export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship',
  'freelance',
] as const
export const SENIORITIES = [
  'entry',
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
  'lead',
  'manager',
] as const
export const REMOTE_SCOPES = [
  'worldwide',
  'countries',
  'region',
  'timezone',
  'hybrid',
  'unspecified',
] as const

type InvalidFilter = {
  code: 'invalid_filter'
  field: string
  message: string
}

export type JobSearch = {
  company?: string
  country?: string
  employment_type?: (typeof EMPLOYMENT_TYPES)[number]
  error?: InvalidFilter
  role_family: (typeof ROLE_FAMILIES)[number]
  remote_scope?: (typeof REMOTE_SCOPES)[number]
  seniority?: (typeof SENIORITIES)[number]
  sort: 'recently_discovered' | 'newest_published'
  source: (typeof SOURCE_KEYS)[number][]
  status: 'active' | 'all'
  tag?: string
}

export const DEFAULT_JOB_SEARCH: Pick<
  JobSearch,
  'role_family' | 'sort' | 'source' | 'status'
> = {
  role_family: 'engineering',
  sort: 'recently_discovered',
  source: [],
  status: 'active',
}

function firstValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

function values(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

function normalizedTag(value: string | undefined) {
  return value
    ?.trim()
    .toLocaleLowerCase()
    .replace(/[\s_]+/g, '-')
}

export function parseJobSearch(input: Record<string, unknown>): JobSearch {
  const company = firstValue(input.company)?.trim()
  const country = firstValue(input.country)?.toUpperCase()
  const sourceValues = values(input.source)
  const employmentType = firstValue(input.employment_type)
  const remoteScope = firstValue(input.remote_scope)
  const roleFamily = firstValue(input.role_family) ?? 'engineering'
  const seniority = firstValue(input.seniority)
  const status = firstValue(input.status) ?? 'active'
  const sort = firstValue(input.sort) ?? 'recently_discovered'
  const tag = normalizedTag(firstValue(input.tag))

  let error: InvalidFilter | undefined

  const invalidSource = sourceValues.find(
    (value) => !SOURCE_KEYS.includes(value as (typeof SOURCE_KEYS)[number]),
  )
  if (invalidSource) {
    error = {
      code: 'invalid_filter',
      field: 'source',
      message: `“${invalidSource}” is not a configured RemoteLens source.`,
    }
  } else if (country && !ISO_COUNTRY_CODES.has(country)) {
    error = {
      code: 'invalid_filter',
      field: 'country',
      message: 'Country must be a valid ISO 3166-1 alpha-2 code, such as JP.',
    }
  } else if (
    employmentType &&
    !EMPLOYMENT_TYPES.includes(
      employmentType as (typeof EMPLOYMENT_TYPES)[number],
    )
  ) {
    error = {
      code: 'invalid_filter',
      field: 'employment_type',
      message: 'Employment type is not part of the V1 taxonomy.',
    }
  } else if (
    !ROLE_FAMILIES.includes(roleFamily as (typeof ROLE_FAMILIES)[number])
  ) {
    error = {
      code: 'invalid_filter',
      field: 'role_family',
      message: 'Role family is not part of the V1 taxonomy.',
    }
  } else if (
    remoteScope &&
    !REMOTE_SCOPES.includes(remoteScope as (typeof REMOTE_SCOPES)[number])
  ) {
    error = {
      code: 'invalid_filter',
      field: 'remote_scope',
      message: 'Remote scope is not part of the V1 taxonomy.',
    }
  } else if (
    seniority &&
    !SENIORITIES.includes(seniority as (typeof SENIORITIES)[number])
  ) {
    error = {
      code: 'invalid_filter',
      field: 'seniority',
      message: 'Seniority is not part of the V1 taxonomy.',
    }
  } else if (status !== 'active' && status !== 'all') {
    error = {
      code: 'invalid_filter',
      field: 'status',
      message: 'Status must be active or all.',
    }
  } else if (sort !== 'recently_discovered' && sort !== 'newest_published') {
    error = {
      code: 'invalid_filter',
      field: 'sort',
      message: 'Sort must be recently_discovered or newest_published.',
    }
  }

  return {
    ...(company ? { company } : {}),
    ...(country ? { country } : {}),
    ...(employmentType &&
    EMPLOYMENT_TYPES.includes(
      employmentType as (typeof EMPLOYMENT_TYPES)[number],
    )
      ? {
          employment_type: employmentType as (typeof EMPLOYMENT_TYPES)[number],
        }
      : {}),
    ...(error ? { error } : {}),
    ...(remoteScope &&
    REMOTE_SCOPES.includes(remoteScope as (typeof REMOTE_SCOPES)[number])
      ? { remote_scope: remoteScope as (typeof REMOTE_SCOPES)[number] }
      : {}),
    role_family: ROLE_FAMILIES.includes(
      roleFamily as (typeof ROLE_FAMILIES)[number],
    )
      ? (roleFamily as (typeof ROLE_FAMILIES)[number])
      : 'engineering',
    ...(seniority &&
    SENIORITIES.includes(seniority as (typeof SENIORITIES)[number])
      ? { seniority: seniority as (typeof SENIORITIES)[number] }
      : {}),
    sort:
      sort === 'newest_published' ? 'newest_published' : 'recently_discovered',
    source: sourceValues.filter(
      (value): value is (typeof SOURCE_KEYS)[number] =>
        SOURCE_KEYS.includes(value as (typeof SOURCE_KEYS)[number]),
    ),
    status: status === 'all' ? 'all' : 'active',
    ...(tag ? { tag } : {}),
  }
}
