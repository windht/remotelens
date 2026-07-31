import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'
import { COUNTRY_OPTIONS } from '../lib/countries'
import type { SourceLabel } from './types'

const httpUrlSchema = z
  .url()
  .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol))

const FILTERABLE_LABELS = new Set([
  'api',
  'backend',
  'cloud',
  'data',
  'distributed-systems',
  'django',
  'front-end',
  'frontend',
  'full-stack',
  'fullstack',
  'go',
  'golang',
  'ios',
  'java',
  'javascript',
  'kotlin',
  'kubernetes',
  'mobile',
  'node',
  'node-js',
  'php',
  'python',
  'rails',
  'react',
  'ruby',
  'rust',
  'software',
  'swift',
  'typescript',
])

export function normalizeLexical(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+#.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeCompany(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s+(inc|llc|ltd|limited|corp|corporation)\.?$/iu, '')
}

export function normalizeTitle(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ')
}

export function safeHttpUrl(value: string, base?: string) {
  const url = base ? new URL(value, base).toString() : value
  return httpUrlSchema.parse(url)
}

export function sanitizeDescription(value: string) {
  const descriptionHtml = sanitizeHtml(value, {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'a',
      'blockquote',
      'code',
      'pre',
    ],
    allowedAttributes: {
      a: ['href'],
    },
    allowedSchemes: ['http', 'https'],
    disallowedTagsMode: 'discard',
  }).trim()
  const descriptionText = sanitizeHtml(descriptionHtml, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, ' ')
    .trim()

  return { descriptionHtml, descriptionText }
}

export function labelsFromValues(values: string[]): SourceLabel[] {
  const byKey = new Map<string, SourceLabel>()
  for (const sourceValue of values) {
    const normalized = normalizeLexical(sourceValue)
    if (!normalized) continue
    const kind = FILTERABLE_LABELS.has(normalized) ? 'filterable' : 'provenance'
    byKey.set(`${kind}:${normalized}`, { kind, normalized, sourceValue })
  }
  return [...byKey.values()].toSorted((a, b) =>
    `${a.kind}:${a.normalized}`.localeCompare(`${b.kind}:${b.normalized}`),
  )
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function boundedError(error: unknown, maxLength = 500) {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/\s+/g, ' ').slice(0, maxLength)
}

export type DerivedJobFields = {
  eligibleCountries: string[]
  eligibleRegions: string[]
  excludedCountries: string[]
  excludedRegions: string[]
  employmentType:
    | 'contract'
    | 'full_time'
    | 'part_time'
    | 'temporary'
    | 'internship'
    | 'freelance'
    | null
  locationSummary: string
  remoteScope:
    'countries' | 'region' | 'timezone' | 'worldwide' | 'hybrid' | 'unspecified'
  salary: {
    currency: string
    max: number
    min: number
    period: 'hour' | 'month' | 'year'
  } | null
  seniority:
    | 'entry'
    | 'junior'
    | 'mid'
    | 'senior'
    | 'staff'
    | 'principal'
    | 'lead'
    | 'manager'
    | null
  timezoneRequirements: string[]
  travelRequired: 'no' | 'unknown' | 'yes'
  visaSponsorship: 'no' | 'unknown' | 'yes'
}

const REGION_MARKERS = [
  ['EMEA', 'EMEA'],
  ['APAC', 'APAC'],
  ['Europe', 'Europe'],
  ['Asia Pacific', 'Asia Pacific'],
  ['North America', 'North America'],
] as const

const TIMEZONE_RE =
  /\b(?:UTC|GMT)[+-]\d{1,2}(?::\d{2})?\b|\b(?:America|Europe|Asia|Australia|Pacific)\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\b/g

function firstCountryCodes(value: string) {
  return COUNTRY_OPTIONS.filter(([, name]) =>
    new RegExp(`\\b${name.replaceAll(' ', '\\s+')}\\b`, 'iu').test(value),
  ).map(([code]) => code)
}

function parseSalary(value: string): DerivedJobFields['salary'] {
  const match = value.match(
    /(?:(USD|EUR|GBP|JPY|CAD|AUD)\s*)?\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?(?:\s*(?:-|–|to)\s*(?:(USD|EUR|GBP|JPY|CAD|AUD)\s*)?\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?)?\s*(?:per\s+|\/)\s*(hour|month|year|annum)|(?:(USD|EUR|GBP|JPY|CAD|AUD)\s*)?\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?\s*(?:-|–|to)\s*(?:(USD|EUR|GBP|JPY|CAD|AUD)\s*)?\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?\s*(hourly|monthly|annual|yearly)/iu,
  )
  if (!match) return null

  const currency = (match[1] ?? match[8] ?? 'USD').toUpperCase()
  const firstValue = Number.parseFloat(
    (match[2] ?? match[9] ?? '').replaceAll(',', ''),
  )
  const secondValue = Number.parseFloat(
    (match[5] ?? match[12] ?? '').replaceAll(',', ''),
  )
  const firstK = Boolean(match[3] ?? match[10])
  const secondK = Boolean(match[6] ?? match[13])
  const periodText = (match[7] ?? match[14] ?? 'year').toLocaleLowerCase()
  if (!Number.isFinite(firstValue)) return null
  const min = firstValue * (firstK ? 1_000 : 1)
  const max = Number.isFinite(secondValue)
    ? secondValue * (secondK ? 1_000 : 1)
    : min
  const period = periodText.startsWith('hour')
    ? 'hour'
    : periodText.startsWith('month')
      ? 'month'
      : 'year'
  return { currency, max: Math.max(min, max), min: Math.min(min, max), period }
}

export function deriveJobFields(
  title: string,
  descriptionText: string,
): DerivedJobFields {
  const text = `${title}\n${descriptionText}`
  const lower = text.toLocaleLowerCase()
  const eligibleCountries = firstCountryCodes(text)
  const exclusionContext = lower.match(
    /(?:except|excluding|not available in|unavailable in)([^.!?]{0,120})/iu,
  )?.[1]
  const excludedCountries = exclusionContext
    ? firstCountryCodes(exclusionContext)
    : []
  const eligibleRegions = REGION_MARKERS.filter(([marker]) =>
    lower.includes(marker.toLocaleLowerCase()),
  ).map(([, normalized]) => normalized)
  const excludedRegions = REGION_MARKERS.filter(([marker]) =>
    exclusionContext?.toLocaleLowerCase().includes(marker.toLocaleLowerCase()),
  ).map(([, normalized]) => normalized)

  const remoteScope = lower.includes('hybrid')
    ? 'hybrid'
    : /worldwide|work from anywhere|anywhere in the world|global remote/u.test(
          lower,
        )
      ? 'worldwide'
      : eligibleCountries.length > 0
        ? 'countries'
        : eligibleRegions.length > 0
          ? 'region'
          : TIMEZONE_RE.test(text) || /timezone|overlap/u.test(lower)
            ? 'timezone'
            : 'unspecified'
  TIMEZONE_RE.lastIndex = 0
  const timezoneRequirements = [...new Set(text.match(TIMEZONE_RE) ?? [])]
  const employmentType = /\bfull[- ]?time\b/u.test(lower)
    ? 'full_time'
    : /\bpart[- ]?time\b/u.test(lower)
      ? 'part_time'
      : /\b(?:contract|contractor)\b/u.test(lower)
        ? 'contract'
        : /\bfreelance\b/u.test(lower)
          ? 'freelance'
          : /\b(?:intern|internship)\b/u.test(lower)
            ? 'internship'
            : /\btemporary\b/u.test(lower)
              ? 'temporary'
              : null
  const seniority = /\b(?:chief|cto|manager)\b/u.test(lower)
    ? 'manager'
    : /\bprincipal\b/u.test(lower)
      ? 'principal'
      : /\bstaff\b/u.test(lower)
        ? 'staff'
        : /\blead\b/u.test(lower)
          ? 'lead'
          : /\bsenior|sr\.?\b/u.test(lower)
            ? 'senior'
            : /\bjunior|jr\.?\b/u.test(lower)
              ? 'junior'
              : /\bentry[- ]level|graduate\b/u.test(lower)
                ? 'entry'
                : /\bmid[- ]level\b/u.test(lower)
                  ? 'mid'
                  : null
  const travelRequired =
    /\b(?:travel required|travel up to|occasional travel)\b/u.test(lower)
      ? 'yes'
      : /\b(?:no travel|travel is not required)\b/u.test(lower)
        ? 'no'
        : 'unknown'
  const visaSponsorship =
    /\b(?:visa sponsorship available|sponsor(?:ship)? provided)\b/u.test(lower)
      ? 'yes'
      : /\b(?:no visa sponsorship|cannot sponsor|will not sponsor)\b/u.test(
            lower,
          )
        ? 'no'
        : 'unknown'
  const locationSummary =
    remoteScope === 'worldwide'
      ? excludedCountries.length > 0
        ? `Worldwide, except ${excludedCountries.join(', ')}`
        : 'Worldwide'
      : eligibleCountries.length > 0
        ? eligibleCountries.join(', ')
        : eligibleRegions.length > 0
          ? eligibleRegions.join(', ')
          : timezoneRequirements.length > 0
            ? `Timezone: ${timezoneRequirements.join(', ')}`
            : 'Eligibility not specified by source'

  return {
    eligibleCountries: [...new Set(eligibleCountries)].filter(
      (code) => !excludedCountries.includes(code),
    ),
    eligibleRegions: [...new Set(eligibleRegions)].filter(
      (region) => !excludedRegions.includes(region),
    ),
    excludedCountries: [...new Set(excludedCountries)],
    excludedRegions: [...new Set(excludedRegions)],
    employmentType,
    locationSummary,
    remoteScope,
    salary: parseSalary(text),
    seniority,
    timezoneRequirements,
    travelRequired,
    visaSponsorship,
  }
}
