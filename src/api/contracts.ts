import { ISO_COUNTRY_CODES } from '~/lib/countries'
import {
  EMPLOYMENT_TYPES,
  REMOTE_SCOPES,
  SENIORITIES,
  SOURCE_KEYS,
} from '~/lib/job-search'
import { z } from 'zod'

export const API_VERSION = '1'
export const TAXONOMY_VERSION = '2026-07-31'

export const REGION_CODES = [
  '001',
  '002',
  '003',
  '005',
  '009',
  '013',
  '014',
  '015',
  '017',
  '018',
  '019',
  '021',
  '029',
  '030',
  '034',
  '035',
  '039',
  '053',
  '054',
  '057',
  '061',
  '142',
  '143',
  '145',
  '150',
  '151',
  '154',
  '155',
  '202',
  '419',
] as const

export type RegionCode = (typeof REGION_CODES)[number]

const REGION_ALIASES: Record<string, RegionCode[]> = {
  APAC: ['009', '030', '034', '035', '142', '143'],
  EMEA: ['002', '014', '015', '017', '018', '150', '151'],
  EUROPE: ['150'],
}

export const API_SOURCE_KEYS = SOURCE_KEYS
export const API_EMPLOYMENT_TYPES = EMPLOYMENT_TYPES
export const API_SENIORITIES = SENIORITIES
export const API_REMOTE_SCOPES = REMOTE_SCOPES
export const API_STATUSES = ['active', 'closed', 'all'] as const
export const API_SORTS = ['recently_discovered', 'newest_published'] as const
export const API_SALARY_CURRENCIES = [
  'AUD',
  'CAD',
  'EUR',
  'GBP',
  'JPY',
  'USD',
] as const
export const API_SALARY_PERIODS = ['hour', 'month', 'year'] as const
export const API_BOOLEAN_ENUM = ['yes', 'no'] as const

export type ApiFilters = {
  company?: string
  country?: string
  employment_type?: (typeof API_EMPLOYMENT_TYPES)[number]
  first_seen_after?: string
  limit: number
  published_after?: string
  region?: string
  remote_scope?: (typeof API_REMOTE_SCOPES)[number]
  role_family: 'engineering'
  salary_currency?: (typeof API_SALARY_CURRENCIES)[number]
  salary_min?: number
  salary_period?: (typeof API_SALARY_PERIODS)[number]
  seniority?: (typeof API_SENIORITIES)[number]
  sort: (typeof API_SORTS)[number]
  source: (typeof API_SOURCE_KEYS)[number][]
  status: (typeof API_STATUSES)[number]
  tag: string[]
  tag_mode: 'all' | 'any'
  timezone?: string
  travel_required?: (typeof API_BOOLEAN_ENUM)[number]
  visa_sponsorship?: (typeof API_BOOLEAN_ENUM)[number]
}

export type CursorPosition = {
  id: string
  sort: (typeof API_SORTS)[number]
  value: number
}

const allowedQueryKeys = new Set([
  'company',
  'country',
  'cursor',
  'employment_type',
  'first_seen_after',
  'limit',
  'published_after',
  'region',
  'remote_scope',
  'role_family',
  'salary_currency',
  'salary_min',
  'salary_period',
  'seniority',
  'sort',
  'source',
  'status',
  'tag',
  'tag_mode',
  'timezone',
  'travel_required',
  'visa_sponsorship',
])

function isIanaTimezone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return value.includes('/')
  } catch {
    return false
  }
}

function timestampString(value: string) {
  return Number.isFinite(Date.parse(value))
}

function queryRegionValues(value: string) {
  const normalized = value.trim().toUpperCase()
  if (REGION_CODES.includes(normalized as RegionCode)) {
    return [normalized]
  }
  return REGION_ALIASES[normalized] ?? []
}

export function regionValues(value: string) {
  return queryRegionValues(value)
}

export function parseApiFilters(
  url: URL,
):
  | { filters: ApiFilters; cursor: string | undefined }
  | { error: { field: string; message: string } } {
  for (const key of url.searchParams.keys()) {
    if (!allowedQueryKeys.has(key)) {
      return {
        error: {
          field: key,
          message: `Query parameter “${key}” is not part of the structured API contract.`,
        },
      }
    }
  }

  const raw = {
    company: url.searchParams.get('company') ?? undefined,
    country: url.searchParams.get('country')?.toUpperCase() ?? undefined,
    employment_type: url.searchParams.get('employment_type') ?? undefined,
    first_seen_after: url.searchParams.get('first_seen_after') ?? undefined,
    limit: url.searchParams.get('limit') ?? '25',
    published_after: url.searchParams.get('published_after') ?? undefined,
    region: url.searchParams.get('region') ?? undefined,
    remote_scope: url.searchParams.get('remote_scope') ?? undefined,
    role_family: url.searchParams.get('role_family') ?? 'engineering',
    salary_currency: url.searchParams.get('salary_currency') ?? undefined,
    salary_min: url.searchParams.get('salary_min') ?? undefined,
    salary_period: url.searchParams.get('salary_period') ?? undefined,
    seniority: url.searchParams.get('seniority') ?? undefined,
    sort: url.searchParams.get('sort') ?? 'recently_discovered',
    source: url.searchParams.getAll('source'),
    status: url.searchParams.get('status') ?? 'active',
    tag: url.searchParams.getAll('tag'),
    tag_mode: url.searchParams.get('tag_mode') ?? 'all',
    timezone: url.searchParams.get('timezone') ?? undefined,
    travel_required: url.searchParams.get('travel_required') ?? undefined,
    visa_sponsorship: url.searchParams.get('visa_sponsorship') ?? undefined,
  }

  const schema = z
    .object({
      company: z.string().trim().min(1).optional(),
      country: z
        .string()
        .refine((value) => ISO_COUNTRY_CODES.has(value), {
          message:
            'Country must be a valid ISO 3166-1 alpha-2 code, such as CN.',
        })
        .optional(),
      employment_type: z.enum(API_EMPLOYMENT_TYPES).optional(),
      first_seen_after: z
        .string()
        .refine(timestampString, {
          message: 'first_seen_after must be an ISO timestamp.',
        })
        .optional(),
      limit: z.coerce.number().int().min(1).max(100),
      published_after: z
        .string()
        .refine(timestampString, {
          message: 'published_after must be an ISO timestamp.',
        })
        .optional(),
      region: z
        .string()
        .refine((value) => queryRegionValues(value).length > 0, {
          message:
            'Region must be a supported UN M49 code or documented alias.',
        })
        .optional(),
      remote_scope: z.enum(API_REMOTE_SCOPES).optional(),
      role_family: z.literal('engineering'),
      salary_currency: z.enum(API_SALARY_CURRENCIES).optional(),
      salary_min: z.coerce.number().int().nonnegative().optional(),
      salary_period: z.enum(API_SALARY_PERIODS).optional(),
      seniority: z.enum(API_SENIORITIES).optional(),
      sort: z.enum(API_SORTS),
      source: z.array(z.enum(API_SOURCE_KEYS)),
      status: z.enum(API_STATUSES),
      tag: z.array(z.string().trim().min(1)),
      tag_mode: z.enum(['all', 'any']),
      timezone: z
        .string()
        .refine(isIanaTimezone, {
          message: 'Timezone must be a valid IANA timezone name.',
        })
        .optional(),
      travel_required: z.enum(API_BOOLEAN_ENUM).optional(),
      visa_sponsorship: z.enum(API_BOOLEAN_ENUM).optional(),
    })
    .superRefine((value, context) => {
      const hasSalaryPart =
        value.salary_min !== undefined ||
        value.salary_currency !== undefined ||
        value.salary_period !== undefined
      if (
        hasSalaryPart &&
        (value.salary_min === undefined ||
          value.salary_currency === undefined ||
          value.salary_period === undefined)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['salary_min'],
          message: 'salary_min requires salary_currency and salary_period.',
        })
      }
    })

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      error: {
        field: String(issue?.path[0] ?? 'query'),
        message: issue?.message ?? 'Query parameters are invalid.',
      },
    }
  }

  const normalized = {
    ...parsed.data,
    source: [...parsed.data.source].toSorted(),
    tag: [...parsed.data.tag]
      .map((tag) => tag.toLocaleLowerCase().replace(/[\s_]+/g, '-'))
      .toSorted(),
  }
  for (const key of Object.keys(normalized) as Array<keyof typeof normalized>) {
    if (normalized[key] === undefined) delete normalized[key]
  }

  return {
    cursor: url.searchParams.get('cursor') ?? undefined,
    filters: normalized as ApiFilters,
  }
}

export function normalizedContract(filters: ApiFilters) {
  return JSON.stringify({
    ...filters,
    source: [...filters.source].toSorted(),
    tag: [...filters.tag].toSorted(),
  })
}

export const ApiSourceBadgeSchema = z.object({
  attribution: z.string(),
  provider: z.enum(API_SOURCE_KEYS),
})

export const ApiTagSchema = z.object({
  filterable: z.boolean(),
  normalized: z.string(),
  source_value: z.string(),
})

export const ApiSalarySchema = z.object({
  currency: z.string(),
  max: z.number(),
  min: z.number(),
  period: z.enum(API_SALARY_PERIODS),
})

export const ApiJobSummarySchema = z.object({
  company: z.string(),
  company_domain: z.string().nullable(),
  description_excerpt: z.string(),
  eligible_countries: z.array(z.string()),
  eligible_regions: z.array(z.string()),
  employment_type: z.string().nullable(),
  excluded_countries: z.array(z.string()),
  excluded_regions: z.array(z.string()),
  first_seen_at: z.string(),
  id: z.string(),
  location_summary: z.string(),
  published_at: z.string().nullable(),
  remote_scope: z.enum(API_REMOTE_SCOPES),
  role_family: z.literal('engineering'),
  salary: ApiSalarySchema.nullable(),
  seniority: z.string().nullable(),
  slug: z.string(),
  sources: z.array(ApiSourceBadgeSchema),
  status: z.enum(['active', 'stale', 'closed']),
  tags: z.array(ApiTagSchema),
  timezone_requirements: z.array(z.string()),
  title: z.string(),
  travel_required: z.enum(['yes', 'no', 'unknown']),
  visa_sponsorship: z.enum(['yes', 'no', 'unknown']),
})

export const ApiProvenanceSchema = z.object({
  field: z.string(),
  marker: z.number().int().positive(),
  origin: z.enum(['source-stated', 'parsed', 'normalized']),
  value: z.string(),
})

export const ApiSourceRecordSchema = z.object({
  attribution: z.string(),
  categories: z.array(z.string()),
  checked_at: z.string(),
  company: z.string(),
  listing_url: z.string().url(),
  provider: z.enum(API_SOURCE_KEYS),
  title: z.string(),
})

export const ApiConflictSchema = z.object({
  field: z.string(),
  source_values: z.array(z.string()),
})

export const ApiJobDetailSchema = ApiJobSummarySchema.extend({
  conflicts: z.array(ApiConflictSchema),
  description_html: z.string(),
  description_text: z.string(),
  provenance: z.array(ApiProvenanceSchema),
  source_records: z.array(ApiSourceRecordSchema),
})

export const ApiResponseMetaSchema = z.object({
  generated_at: z.string(),
  next_cursor: z.string().nullable().optional(),
  request_id: z.string(),
})

export const ApiErrorSchema = z.object({
  code: z.string(),
  field: z.string().optional(),
  message: z.string(),
})

export const ApiErrorEnvelopeSchema = z.object({
  error: ApiErrorSchema,
  meta: z.object({
    generated_at: z.string(),
    request_id: z.string(),
  }),
})

export const ApiTaxonomySchema = z.object({
  employment_types: z.array(z.string()),
  remote_scopes: z.array(z.string()),
  role_families: z.array(z.literal('engineering')),
  salary_currencies: z.array(z.string()),
  salary_periods: z.array(z.string()),
  seniorities: z.array(z.string()),
  sorts: z.array(z.string()),
  sources: z.array(z.string()),
  statuses: z.array(z.string()),
  tag_modes: z.array(z.enum(['all', 'any'])),
  travel_required: z.array(z.enum(['yes', 'no'])),
  visa_sponsorship: z.array(z.enum(['yes', 'no'])),
})

export const ApiMetaProviderSchema = z.object({
  active_count: z.number().int().nonnegative(),
  enabled: z.boolean(),
  key: z.enum(API_SOURCE_KEYS),
  last_complete_at: z.string().nullable(),
  last_successful_at: z.string().nullable(),
  status: z.string(),
})

export const ApiMetaSchema = z.object({
  api_version: z.string(),
  cache_epoch: z.string(),
  last_completed_cycle: z
    .object({
      finished_at: z.string(),
      status: z.string(),
    })
    .nullable(),
  providers: z.array(ApiMetaProviderSchema),
  taxonomy_version: z.string(),
  total_active_jobs: z.number().int().nonnegative(),
})

export const API_TAXONOMY = {
  employment_types: [...API_EMPLOYMENT_TYPES],
  remote_scopes: [...API_REMOTE_SCOPES],
  role_families: ['engineering'] as const,
  salary_currencies: [...API_SALARY_CURRENCIES],
  salary_periods: [...API_SALARY_PERIODS],
  seniorities: [...API_SENIORITIES],
  sorts: [...API_SORTS],
  sources: [...API_SOURCE_KEYS],
  statuses: [...API_STATUSES],
  tag_modes: ['all', 'any'] as const,
  travel_required: ['yes', 'no'] as const,
  visa_sponsorship: ['yes', 'no'] as const,
} satisfies z.infer<typeof ApiTaxonomySchema>
