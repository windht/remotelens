import { z } from 'zod'
import {
  labelsFromValues,
  normalizeCompany,
  normalizeLexical,
  normalizeTitle,
  safeHttpUrl,
  sanitizeDescription,
  sha256,
} from '../normalization'
import type {
  NormalizedSourceRecord,
  ParseResult,
  SourceAdapter,
} from '../types'

export const REMOTEJOBS_BASE_URL = 'https://remotejobs.org'
export const REMOTEJOBS_PAGE_SIZE = 50
export const REMOTEJOBS_MAX_PAGES = 10
export const REMOTEJOBS_URL = `${REMOTEJOBS_BASE_URL}/api/v1/jobs?category=programming&limit=${REMOTEJOBS_PAGE_SIZE}&offset=0`

const remoteJobsRecordSchema = z
  .object({
    id: z.union([z.string().min(1), z.number()]),
    title: z.string().min(1),
    url: z.string().min(1),
    apply_url: z.string().optional(),
    company: z.unknown(),
    category: z
      .object({
        name: z.string().optional(),
        slug: z.string().optional(),
      })
      .loose()
      .optional(),
    location: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    posted_at: z.string().optional(),
    published_at: z.string().optional(),
    created_at: z.string().optional(),
  })
  .loose()

const remoteJobsEnvelopeSchema = z
  .object({
    data: z.array(z.unknown()),
    pagination: z
      .object({
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().optional(),
        has_more: z.boolean().optional(),
      })
      .loose()
      .optional(),
  })
  .loose()

type RemoteJobsPageParseResult = ParseResult & { hasMore: boolean }

function textValue(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function companyValue(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    const name = (value as { name?: unknown }).name
    return textValue(name)
  }
  return ''
}

function isProgrammingCategory(values: string[]) {
  return values.some((value) => {
    const normalized = normalizeLexical(value)
    return normalized === 'programming' || normalized.includes('software')
  })
}

function parsedDate(...values: Array<string | undefined>) {
  const value = values.find((candidate) => candidate?.trim())
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

export function remoteJobsPageUrl(offset: number) {
  const url = new URL(`${REMOTEJOBS_BASE_URL}/api/v1/jobs`)
  url.searchParams.set('category', 'programming')
  url.searchParams.set('limit', String(REMOTEJOBS_PAGE_SIZE))
  url.searchParams.set('offset', String(offset))
  return url.toString()
}

export async function parseRemoteJobsPayload(
  payload: string,
): Promise<RemoteJobsPageParseResult> {
  const responseHash = await sha256(payload)
  const envelope = remoteJobsEnvelopeSchema.parse(JSON.parse(payload))
  const records: NormalizedSourceRecord[] = []
  let rejectedCount = 0

  for (const candidate of envelope.data) {
    const parsed = remoteJobsRecordSchema.safeParse(candidate)
    if (!parsed.success) {
      rejectedCount += 1
      continue
    }

    const record = parsed.data
    const categoryValues = [
      record.category?.name,
      record.category?.slug,
    ].filter((value): value is string => Boolean(value?.trim()))
    if (!isProgrammingCategory(categoryValues)) {
      rejectedCount += 1
      continue
    }

    const sourceKey = String(record.id).trim()
    const company = normalizeCompany(companyValue(record.company))
    if (!sourceKey || !company) {
      rejectedCount += 1
      continue
    }

    let listingUrl: string
    try {
      listingUrl = safeHttpUrl(record.url, REMOTEJOBS_BASE_URL)
    } catch {
      rejectedCount += 1
      continue
    }

    const title = normalizeTitle(record.title)
    const description = sanitizeDescription(record.description ?? '')
    const labels = labelsFromValues([
      ...categoryValues,
      record.type ?? '',
      record.location ?? '',
    ])
    const publishedAt = parsedDate(
      record.posted_at,
      record.published_at,
      record.created_at,
    )
    const canonicalPayload = JSON.stringify({
      company,
      description: description.descriptionHtml,
      labels,
      listingUrl,
      sourceKey,
      title,
    })

    records.push({
      attribution: 'RemoteJobs.org',
      company,
      ...description,
      labels,
      listingUrl,
      payloadHash: await sha256(canonicalPayload),
      provider: 'remotejobs',
      ...(publishedAt === undefined ? {} : { publishedAt }),
      rawTitle: record.title,
      sourceKey,
      title,
    })
  }

  const pageSize = envelope.pagination?.limit ?? REMOTEJOBS_PAGE_SIZE
  return {
    fetchedCount: envelope.data.length,
    hasMore: envelope.pagination?.has_more ?? envelope.data.length >= pageSize,
    records: records.toSorted((a, b) => a.sourceKey.localeCompare(b.sourceKey)),
    rejectedCount,
    responseHash,
  }
}

export type RemoteJobsFetchResult = {
  errors: string[]
  hasMore: boolean
  parsed: ParseResult | null
  successfulPageCount: number
}

export async function fetchRemoteJobs(
  fetcher: typeof fetch,
): Promise<RemoteJobsFetchResult> {
  const records = new Map<string, NormalizedSourceRecord>()
  const payloads: string[] = []
  const errors: string[] = []
  let fetchedCount = 0
  let rejectedCount = 0
  let successfulPageCount = 0
  let hasMore = true

  for (let page = 0; page < REMOTEJOBS_MAX_PAGES; page += 1) {
    const offset = page * REMOTEJOBS_PAGE_SIZE
    try {
      const response = await fetcher(remoteJobsPageUrl(offset), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RemoteLens/0.1 (+https://remotelens.co/source-policy)',
        },
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) {
        throw new Error(`RemoteJobs.org returned HTTP ${response.status}`)
      }
      const payload = await response.text()
      const parsed = await parseRemoteJobsPayload(payload)
      payloads.push(payload)
      successfulPageCount += 1
      fetchedCount += parsed.fetchedCount
      rejectedCount += parsed.rejectedCount
      for (const record of parsed.records) records.set(record.sourceKey, record)
      hasMore = parsed.hasMore
      if (!hasMore) break
    } catch (error) {
      errors.push(`page ${page + 1}: ${String(error)}`)
      hasMore = true
      break
    }
  }

  if (successfulPageCount === 0) {
    return { errors, hasMore: true, parsed: null, successfulPageCount }
  }

  return {
    errors,
    hasMore,
    parsed: {
      fetchedCount,
      records: [...records.values()].toSorted((a, b) =>
        a.sourceKey.localeCompare(b.sourceKey),
      ),
      rejectedCount,
      responseHash: await sha256(payloads.join('\n')),
    },
    successfulPageCount,
  }
}

export const remoteJobsAdapter: SourceAdapter = {
  provider: 'remotejobs',
  async fetchAndParse(fetcher) {
    const result = await fetchRemoteJobs(fetcher)
    if (!result.parsed) {
      throw new Error(result.errors[0] ?? 'RemoteJobs.org returned no pages')
    }
    return result.parsed
  },
}
