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
import type { NormalizedSourceRecord, ParseResult } from '../types'

const WWR_BASE = 'https://weworkremotely.com'

export const WWR_FEEDS = [
  {
    category: 'Remote Full-Stack Programming Jobs',
    url: `${WWR_BASE}/categories/remote-full-stack-programming-jobs.rss`,
  },
  {
    category: 'Remote Back-End Programming Jobs',
    url: `${WWR_BASE}/categories/remote-back-end-programming-jobs.rss`,
  },
  {
    category: 'Remote Front-End Programming Jobs',
    url: `${WWR_BASE}/categories/remote-front-end-programming-jobs.rss`,
  },
  {
    category: 'Remote Programming Jobs',
    url: `${WWR_BASE}/categories/remote-programming-jobs.rss`,
  },
] as const

const itemSchema = z
  .object({
    title: z.unknown(),
    link: z.unknown(),
    guid: z.unknown().optional(),
    description: z.unknown().optional(),
    pubDate: z.string().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .loose()

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function textValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    const candidate = value as Record<string, unknown>
    for (const key of ['#text', '__cdata']) {
      if (typeof candidate[key] === 'string') return candidate[key]
    }
  }
  return ''
}

export function splitWwrTitle(rawTitle: string) {
  const separator = rawTitle.indexOf(':')
  if (separator <= 0 || separator >= rawTitle.length - 1) {
    return { company: 'Unknown company', title: normalizeTitle(rawTitle) }
  }
  const company = normalizeCompany(rawTitle.slice(0, separator))
  const title = normalizeTitle(rawTitle.slice(separator + 1))
  if (!company || !title) {
    return { company: 'Unknown company', title: normalizeTitle(rawTitle) }
  }
  return { company, title }
}

export async function parseWwrFeeds(
  feeds: Array<{ category: string; payload: string; url: string }>,
): Promise<ParseResult> {
  const parser = new XMLParser({
    cdataPropName: '__cdata',
    ignoreAttributes: false,
    trimValues: true,
  })
  const aggregated = new Map<
    string,
    {
      categories: Set<string>
      description: string
      guid: string
      link: string
      pubDate?: string
      rawTitle: string
    }
  >()
  let fetchedCount = 0
  let rejectedCount = 0

  for (const feed of feeds) {
    const parsed = parser.parse(feed.payload) as {
      rss?: { channel?: { item?: unknown } }
    }
    for (const candidate of asArray(parsed.rss?.channel?.item)) {
      const item = itemSchema.safeParse(candidate)
      if (!item.success) {
        rejectedCount += 1
        continue
      }
      fetchedCount += 1
      const rawTitle = textValue(item.data.title).trim()
      const guid = textValue(item.data.guid).trim()
      const rawLink = textValue(item.data.link).trim()
      if (!rawTitle || !rawLink) {
        rejectedCount += 1
        continue
      }
      const link = safeHttpUrl(rawLink, WWR_BASE)
      const sourceKey = guid || link
      if (!sourceKey) {
        rejectedCount += 1
        continue
      }
      const existing = aggregated.get(sourceKey)
      const categories = [feed.category, ...asArray(item.data.category)].filter(
        Boolean,
      )
      if (existing) {
        for (const category of categories) existing.categories.add(category)
      } else {
        aggregated.set(sourceKey, {
          categories: new Set(categories),
          description: textValue(item.data.description),
          guid: sourceKey,
          link,
          ...(item.data.pubDate ? { pubDate: item.data.pubDate } : {}),
          rawTitle,
        })
      }
    }
  }

  const records: NormalizedSourceRecord[] = []
  for (const record of aggregated.values()) {
    const { company, title } = splitWwrTitle(record.rawTitle)
    const description = sanitizeDescription(record.description)
    const labels = labelsFromValues([...record.categories])
    const canonicalPayload = JSON.stringify({
      company,
      description: description.descriptionHtml,
      labels,
      listingUrl: record.link,
      sourceKey: record.guid,
      title,
    })
    records.push({
      attribution: 'We Work Remotely',
      company,
      ...description,
      labels,
      listingUrl: record.link,
      payloadHash: await sha256(canonicalPayload),
      provider: 'wwr',
      ...(record.pubDate && !Number.isNaN(Date.parse(record.pubDate))
        ? { publishedAt: Date.parse(record.pubDate) }
        : {}),
      rawTitle: record.rawTitle,
      sourceKey: record.guid,
      title,
    })
  }

  return {
    fetchedCount,
    records: records.toSorted((a, b) => a.sourceKey.localeCompare(b.sourceKey)),
    rejectedCount,
    responseHash: await sha256(
      feeds.map((feed) => `${feed.url}:${feed.payload}`).join('\n'),
    ),
  }
}

export async function fetchWwrFeeds(fetcher: typeof fetch) {
  const results = await Promise.allSettled(
    WWR_FEEDS.map(async (feed) => {
      const response = await fetcher(feed.url, {
        headers: {
          Accept: 'application/rss+xml, application/xml;q=0.9',
          'User-Agent':
            'RemoteLens/0.1 (+https://remotelens.dev/source-policy)',
        },
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) {
        throw new Error(`WWR ${feed.category} returned HTTP ${response.status}`)
      }
      return { ...feed, payload: await response.text() }
    }),
  )
  const successful = results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
  const errors = results.flatMap((result) =>
    result.status === 'rejected' ? [String(result.reason)] : [],
  )
  return {
    errors,
    parsed: successful.length > 0 ? await parseWwrFeeds(successful) : null,
    successfulFeedCount: successful.length,
  }
}
