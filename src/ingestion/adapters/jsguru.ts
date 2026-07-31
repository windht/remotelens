import { load } from 'cheerio'
import {
  labelsFromValues,
  normalizeCompany,
  normalizeTitle,
  safeHttpUrl,
  sanitizeDescription,
  sha256,
} from '../normalization'
import type { NormalizedSourceRecord, ParseResult } from '../types'

const JSGURU_BASE_URL = 'https://jsgurujobs.com'

export const JSGURU_PAGES = [
  `${JSGURU_BASE_URL}/jobs`,
  `${JSGURU_BASE_URL}/jobs?page=2`,
  `${JSGURU_BASE_URL}/jobs?page=3`,
] as const

function compact(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function cleanModeLabel(value: string) {
  return compact(value)
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .trim()
}

type PendingRecord = {
  company: string
  descriptionHtml: string
  labels: string[]
  listingUrl: string
  rawTitle: string
  sourceKey: string
}

export async function parseJsguruPages(
  pages: Array<{ payload: string; url: string }>,
): Promise<ParseResult> {
  const aggregated = new Map<string, PendingRecord>()
  let fetchedCount = 0
  let rejectedCount = 0

  for (const page of pages) {
    const $ = load(page.payload)
    const anchors = $('a[href]').filter((_, element) => {
      const href = $(element).attr('href')
      if (!href) return false
      try {
        return /^\/jobs\/\d+$/.test(new URL(href, JSGURU_BASE_URL).pathname)
      } catch {
        return false
      }
    })

    anchors.each((_, anchor) => {
      fetchedCount += 1
      const href = $(anchor).attr('href')
      const card = $(anchor).closest('div.p-6')
      const rawTitle = compact($(anchor).text())
      const company = normalizeCompany(
        compact(card.find('p.mt-1.text-sm.text-gray-500').first().text()),
      )
      if (!href || card.length === 0 || !rawTitle || !company) {
        rejectedCount += 1
        return
      }

      const listingUrl = safeHttpUrl(href, JSGURU_BASE_URL)
      const sourceKey = new URL(listingUrl).pathname.split('/').at(-1) ?? ''
      if (!/^\d+$/.test(sourceKey)) {
        rejectedCount += 1
        return
      }

      const facts = card
        .find('div.mt-2.flex.items-center.text-sm.text-gray-500')
        .first()
        .children('span')
        .toArray()
        .map((element) => compact($(element).text()))
        .filter(Boolean)
      const modes = card
        .find('div.mt-2.flex.items-center.gap-1\\.5 span')
        .toArray()
        .map((element) => cleanModeLabel($(element).text()))
        .filter(Boolean)
      const technologies = card
        .find('div.mt-4.flex.flex-wrap.gap-2.ml-16 > span')
        .toArray()
        .map((element) => compact($(element).text()))
        .filter(Boolean)
      const excerpt = compact(
        card.find('div.mt-4.text-sm.text-gray-600.ml-16').first().text(),
      )
      const descriptionHtml = [
        facts.length > 0 ? `<p>${escapeHtml(facts.join(' · '))}</p>` : '',
        excerpt ? `<p>${escapeHtml(excerpt)}</p>` : '',
      ].join('')
      const existing = aggregated.get(sourceKey)
      if (existing) {
        existing.labels.push(...modes, ...technologies)
        return
      }
      aggregated.set(sourceKey, {
        company,
        descriptionHtml,
        labels: [...modes, ...technologies],
        listingUrl,
        rawTitle,
        sourceKey,
      })
    })
  }

  const records: NormalizedSourceRecord[] = []
  for (const record of aggregated.values()) {
    const title = normalizeTitle(record.rawTitle)
    const description = sanitizeDescription(record.descriptionHtml)
    const labels = labelsFromValues(record.labels)
    const canonicalPayload = JSON.stringify({
      company: record.company,
      description: description.descriptionHtml,
      labels,
      listingUrl: record.listingUrl,
      sourceKey: record.sourceKey,
      title,
    })
    records.push({
      attribution: 'JS Guru Jobs',
      company: record.company,
      ...description,
      labels,
      listingUrl: record.listingUrl,
      payloadHash: await sha256(canonicalPayload),
      provider: 'jsguru',
      rawTitle: record.rawTitle,
      sourceKey: record.sourceKey,
      title,
    })
  }

  return {
    fetchedCount,
    records: records.toSorted((left, right) =>
      left.sourceKey.localeCompare(right.sourceKey),
    ),
    rejectedCount,
    responseHash: await sha256(
      pages.map((page) => `${page.url}:${page.payload}`).join('\n'),
    ),
  }
}

export async function fetchJsguruPages(fetcher: typeof fetch) {
  const results = await Promise.allSettled(
    JSGURU_PAGES.map(async (url) => {
      const response = await fetcher(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent':
            'RemoteLens/1.0 (+https://remotelens.co/privacy#sources)',
        },
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) {
        throw new Error(`JS Guru Jobs ${url} returned HTTP ${response.status}`)
      }
      return { payload: await response.text(), url }
    }),
  )
  const successful = results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
  return {
    errors: results.flatMap((result) =>
      result.status === 'rejected' ? [String(result.reason)] : [],
    ),
    parsed: successful.length > 0 ? await parseJsguruPages(successful) : null,
    successfulPageCount: successful.length,
  }
}
