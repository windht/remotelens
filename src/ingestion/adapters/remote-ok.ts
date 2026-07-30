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

export const REMOTE_OK_URL = 'https://remoteok.com/api'

export const REMOTE_OK_POSITIVE_TITLE_MARKERS = [
  'developer',
  'software engineer',
  'backend engineer',
  'back-end engineer',
  'frontend engineer',
  'front-end engineer',
  'full stack engineer',
  'full-stack engineer',
  'web engineer',
  'mobile engineer',
  'data engineer',
  'platform engineer',
  'devops engineer',
  'site reliability engineer',
  'programmer',
] as const

const QUALIFYING_TAGS = new Set([
  'api',
  'backend',
  'cloud',
  'data',
  'dev',
  'developer',
  'devops',
  'django',
  'engineer',
  'engineering',
  'frontend',
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
  'php',
  'programming',
  'python',
  'rails',
  'react',
  'ruby',
  'rust',
  'software',
  'swift',
  'typescript',
])

const NEGATIVE_TITLE_MARKERS =
  /\b(marketing|sales|designer|design lead|support|recruiter|recruiting|product manager|project manager|account executive|customer success|copywriter|writer)\b/i

const remoteOkRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    slug: z.string().optional(),
    url: z.string().optional(),
    position: z.string().min(1),
    company: z.string().min(1),
    description: z.string().default(''),
    date: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })
  .loose()

export function isRemoteOkDeveloperJob(title: string, tags: string[]) {
  const normalizedTitle = normalizeTitle(title).toLocaleLowerCase()
  if (NEGATIVE_TITLE_MARKERS.test(normalizedTitle)) return false
  const hasPositiveTitle = REMOTE_OK_POSITIVE_TITLE_MARKERS.some((marker) =>
    normalizedTitle.includes(marker),
  )
  const hasQualifyingTag = tags.some((tag) =>
    QUALIFYING_TAGS.has(
      tag
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, ''),
    ),
  )
  return hasPositiveTitle && hasQualifyingTag
}

export async function parseRemoteOkPayload(
  payload: string,
): Promise<ParseResult> {
  const responseHash = await sha256(payload)
  const envelope = z.array(z.unknown()).parse(JSON.parse(payload))
  const records: NormalizedSourceRecord[] = []
  let fetchedCount = 0
  let rejectedCount = 0

  for (const candidate of envelope) {
    const parsed = remoteOkRecordSchema.safeParse(candidate)
    if (!parsed.success) {
      if (
        typeof candidate === 'object' &&
        candidate !== null &&
        ('legal' in candidate || 'last_updated' in candidate)
      ) {
        continue
      }
      rejectedCount += 1
      continue
    }

    fetchedCount += 1
    const record = parsed.data
    if (!isRemoteOkDeveloperJob(record.position, record.tags)) {
      rejectedCount += 1
      continue
    }

    const sourceKey = String(
      record.id ?? record.slug ?? record.url ?? '',
    ).trim()
    if (!sourceKey) {
      rejectedCount += 1
      continue
    }

    const listingUrl = safeHttpUrl(
      record.url ?? `/remote-jobs/${record.slug ?? sourceKey}`,
      'https://remoteok.com',
    )
    const title = normalizeTitle(record.position)
    const company = normalizeCompany(record.company)
    const description = sanitizeDescription(record.description)
    const labels = labelsFromValues(record.tags)
    const canonicalPayload = JSON.stringify({
      company,
      description: description.descriptionHtml,
      labels,
      listingUrl,
      sourceKey,
      title,
    })

    records.push({
      attribution: 'Remote OK',
      company,
      ...description,
      labels,
      listingUrl,
      payloadHash: await sha256(canonicalPayload),
      provider: 'remote_ok',
      ...(record.date && !Number.isNaN(Date.parse(record.date))
        ? { publishedAt: Date.parse(record.date) }
        : {}),
      rawTitle: record.position,
      sourceKey,
      title,
    })
  }

  return { fetchedCount, records, rejectedCount, responseHash }
}

export const remoteOkAdapter: SourceAdapter = {
  provider: 'remote_ok',
  async fetchAndParse(fetcher) {
    const response = await fetcher(REMOTE_OK_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RemoteLens/0.1 (+https://remotelens.dev/source-policy)',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      throw new Error(`Remote OK returned HTTP ${response.status}`)
    }
    return parseRemoteOkPayload(await response.text())
  },
}
