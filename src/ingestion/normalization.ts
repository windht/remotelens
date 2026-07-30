import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'
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
