import { z } from 'zod'
import {
  labelsFromValues,
  normalizeCompany,
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

export const JOBICY_BASE_URL = 'https://jobicy.com'
export const JOBICY_API_URL =
  'https://jobicy.com/api/v2/remote-jobs?count=100&industry=engineering'
export const JOBICY_URL = JOBICY_API_URL

const jobicyRecordSchema = z
  .object({
    id: z.union([z.string().min(1), z.number()]),
    url: z.string().min(1),
    jobTitle: z.string().min(1),
    companyName: z.string().min(1),
    jobIndustry: z.unknown().optional(),
    jobType: z.unknown().optional(),
    jobGeo: z.unknown().optional(),
    jobLevel: z.unknown().optional(),
    jobExcerpt: z.unknown().optional(),
    jobDescription: z.unknown().optional(),
    pubDate: z.unknown().optional(),
  })
  .loose()

const jobicyEnvelopeSchema = z
  .object({
    jobs: z.array(z.unknown()),
  })
  .loose()

function textValue(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

function textValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const text = textValue(item)
      return text ? [text] : []
    })
  }
  const text = textValue(value)
  return text ? [text] : []
}

export async function parseJobicyPayload(
  payload: string,
): Promise<ParseResult> {
  const responseHash = await sha256(payload)
  const envelope = jobicyEnvelopeSchema.parse(JSON.parse(payload))
  const records = new Map<string, NormalizedSourceRecord>()
  let rejectedCount = 0

  for (const candidate of envelope.jobs) {
    const parsed = jobicyRecordSchema.safeParse(candidate)
    if (!parsed.success) {
      rejectedCount += 1
      continue
    }
    const record = parsed.data
    const sourceKey = String(record.id).trim()
    const company = normalizeCompany(record.companyName)
    if (!sourceKey || !company) {
      rejectedCount += 1
      continue
    }

    let listingUrl: string
    try {
      listingUrl = safeHttpUrl(record.url, JOBICY_BASE_URL)
    } catch {
      rejectedCount += 1
      continue
    }

    const title = normalizeTitle(record.jobTitle)
    const rawDescription =
      textValue(record.jobDescription) || textValue(record.jobExcerpt)
    const description = sanitizeDescription(rawDescription)
    const labels = labelsFromValues([
      ...textValues(record.jobIndustry),
      ...textValues(record.jobType),
      ...textValues(record.jobGeo),
      ...textValues(record.jobLevel),
    ])
    const canonicalPayload = JSON.stringify({
      company,
      description: description.descriptionHtml,
      labels,
      listingUrl,
      sourceKey,
      title,
    })
    const publishedText = textValue(record.pubDate)
    const publishedAt = publishedText ? Date.parse(publishedText) : Number.NaN

    records.set(sourceKey, {
      attribution: 'Jobicy',
      company,
      ...description,
      labels,
      listingUrl,
      payloadHash: await sha256(canonicalPayload),
      provider: 'jobicy',
      ...(Number.isNaN(publishedAt) ? {} : { publishedAt }),
      rawTitle: record.jobTitle,
      sourceKey,
      title,
    })
  }

  return {
    fetchedCount: envelope.jobs.length,
    records: [...records.values()].toSorted((a, b) =>
      a.sourceKey.localeCompare(b.sourceKey),
    ),
    rejectedCount,
    responseHash,
  }
}

export const jobicyAdapter: SourceAdapter = {
  provider: 'jobicy',
  async fetchAndParse(fetcher) {
    const response = await fetcher(JOBICY_API_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RemoteLens/0.1 (+https://remotelens.co/source-policy)',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      throw new Error(`Jobicy returned HTTP ${response.status}`)
    }
    return parseJobicyPayload(await response.text())
  },
}
