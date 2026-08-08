import { XMLParser } from 'fast-xml-parser'
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

export const REMOTIVE_FEED_URL =
  'https://remotive.com/remote-jobs/feed/software-development'

const remotiveItemSchema = z
  .object({
    title: z.unknown(),
    link: z.unknown(),
    guid: z.unknown().optional(),
    description: z.unknown().optional(),
    'content:encoded': z.unknown().optional(),
    pubDate: z.unknown().optional(),
    category: z.unknown().optional(),
  })
  .loose()

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function textValue(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object' && value !== null) {
    const candidate = value as Record<string, unknown>
    for (const key of ['#text', '__cdata', '@_href']) {
      if (typeof candidate[key] === 'string') return candidate[key].trim()
    }
  }
  return ''
}

function textValues(value: unknown) {
  return asArray(value)
    .map((candidate) => textValue(candidate))
    .filter(Boolean)
}

export function splitRemotiveTitle(rawTitle: string) {
  const separator = rawTitle.indexOf(':')
  if (separator > 0 && separator < rawTitle.length - 1) {
    const company = normalizeCompany(rawTitle.slice(0, separator))
    const title = normalizeTitle(rawTitle.slice(separator + 1))
    if (company && title) return { company, title }
  }

  const atMatch = rawTitle.match(/^(.+?)\s+at\s+(.+)$/iu)
  if (atMatch?.[1] && atMatch[2]) {
    return {
      company: normalizeCompany(atMatch[2]),
      title: normalizeTitle(atMatch[1]),
    }
  }

  return { company: 'Unknown company', title: normalizeTitle(rawTitle) }
}

export async function parseRemotiveFeed(payload: string): Promise<ParseResult> {
  const responseHash = await sha256(payload)
  const parser = new XMLParser({
    cdataPropName: '__cdata',
    ignoreAttributes: false,
    trimValues: true,
  })
  const parsed = parser.parse(payload) as {
    rss?: { channel?: { item?: unknown } }
  }
  const records: NormalizedSourceRecord[] = []
  let fetchedCount = 0
  let rejectedCount = 0

  for (const candidate of asArray(parsed.rss?.channel?.item)) {
    const item = remotiveItemSchema.safeParse(candidate)
    if (!item.success) {
      rejectedCount += 1
      continue
    }
    fetchedCount += 1
    const rawTitle = textValue(item.data.title)
    const rawLink = textValue(item.data.link)
    const guid = textValue(item.data.guid)
    if (!rawTitle || !rawLink) {
      rejectedCount += 1
      continue
    }

    let listingUrl: string
    try {
      listingUrl = safeHttpUrl(rawLink, 'https://remotive.com')
    } catch {
      rejectedCount += 1
      continue
    }
    const sourceKey = guid || listingUrl
    const { company, title } = splitRemotiveTitle(rawTitle)
    const rawDescription =
      textValue(item.data['content:encoded']) ||
      textValue(item.data.description)
    const description = sanitizeDescription(rawDescription)
    const labels = labelsFromValues(textValues(item.data.category))
    const canonicalPayload = JSON.stringify({
      company,
      description: description.descriptionHtml,
      labels,
      listingUrl,
      sourceKey,
      title,
    })
    const publishedText = textValue(item.data.pubDate)
    const publishedAt = publishedText ? Date.parse(publishedText) : Number.NaN

    records.push({
      attribution: 'Remotive',
      company,
      ...description,
      labels,
      listingUrl,
      payloadHash: await sha256(canonicalPayload),
      provider: 'remotive',
      ...(Number.isNaN(publishedAt) ? {} : { publishedAt }),
      rawTitle,
      sourceKey,
      title,
    })
  }

  return {
    fetchedCount,
    records: records.toSorted((a, b) => a.sourceKey.localeCompare(b.sourceKey)),
    rejectedCount,
    responseHash,
  }
}

export const remotiveAdapter: SourceAdapter = {
  provider: 'remotive',
  async fetchAndParse(fetcher) {
    const response = await fetcher(REMOTIVE_FEED_URL, {
      headers: {
        Accept: 'application/rss+xml, application/xml;q=0.9',
        'User-Agent': 'RemoteLens/0.1 (+https://remotelens.co/source-policy)',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      throw new Error(`Remotive returned HTTP ${response.status}`)
    }
    return parseRemotiveFeed(await response.text())
  },
}
