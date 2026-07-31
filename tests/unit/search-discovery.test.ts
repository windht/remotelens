import { describe, expect, it } from 'vitest'
import {
  buildSitemapXml,
  handleSearchDiscoveryRequest,
} from '../../src/lib/search-discovery'

function databaseWith(
  results: Array<{ slug: string; updated_at: number }>,
  onQuery?: (query: string, bindings: unknown[]) => void,
) {
  let query = ''
  let bindings: unknown[] = []
  return {
    prepare(value: string) {
      query = value
      return {
        all: () => {
          onQuery?.(query, bindings)
          return Promise.resolve({ results })
        },
        bind(...values: unknown[]) {
          bindings = values
          return this
        },
      }
    },
  } as unknown as D1Database
}

describe('search discovery', () => {
  it('builds canonical XML for static pages and active job rows', () => {
    const xml = buildSitemapXml('https://remotelens.co/path', [
      {
        slug: 'staff-r-d-engineer',
        updated_at: Date.parse('2026-08-01T10:11:12.000Z'),
      },
    ])

    expect(xml).toContain('<loc>https://remotelens.co/</loc>')
    expect(xml).toContain('<loc>https://remotelens.co/jobs</loc>')
    expect(xml).toContain('<loc>https://remotelens.co/api</loc>')
    expect(xml).toContain('<loc>https://remotelens.co/skills/install</loc>')
    expect(xml).toContain('<loc>https://remotelens.co/about</loc>')
    expect(xml).toContain('<loc>https://remotelens.co/privacy</loc>')
    expect(xml).toContain(
      '<loc>https://remotelens.co/jobs/staff-r-d-engineer</loc>',
    )
    expect(xml).toContain('<lastmod>2026-08-01T10:11:12.000Z</lastmod>')
    expect(xml).not.toContain('/methodology')
    expect(xml).not.toContain('/sources')
    expect(xml).not.toContain('/api/v1/')
    expect(xml).not.toContain('/feeds/')
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, location]) => location,
    )
    expect(locations.every((location) => !location?.includes('?'))).toBe(true)
  })

  it('queries only active jobs backed by an enabled provider', async () => {
    const response = await handleSearchDiscoveryRequest(
      new Request('https://remotelens.test/sitemap.xml'),
      {
        DB: databaseWith(
          [{ slug: 'active-job', updated_at: 1_786_000_000_000 }],
          (query, bindings) => {
            expect(query).toContain("j.status = 'active'")
            expect(query).toContain('health.enabled = 1')
            expect(bindings).toEqual([49_994])
          },
        ),
        PUBLIC_SITE_URL: 'https://remotelens.co',
      },
    )

    expect(response?.status).toBe(200)
    expect(response?.headers.get('content-type')).toBe(
      'application/xml; charset=utf-8',
    )
    expect(await response?.text()).toContain(
      '<loc>https://remotelens.co/jobs/active-job</loc>',
    )
  })

  it('advertises the canonical sitemap in robots.txt', async () => {
    const response = await handleSearchDiscoveryRequest(
      new Request('https://remotelens.test/robots.txt'),
      {
        DB: databaseWith([]),
        PUBLIC_SITE_URL: 'https://remotelens.co',
      },
    )

    expect(response?.status).toBe(200)
    expect(response?.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8',
    )
    expect(await response?.text()).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://remotelens.co/sitemap.xml\n',
    )
  })

  it('returns a retryable error instead of an incomplete sitemap', async () => {
    const response = await handleSearchDiscoveryRequest(
      new Request('https://remotelens.test/sitemap.xml'),
      {
        DB: {
          prepare() {
            throw new Error('database unavailable')
          },
        } as unknown as D1Database,
        PUBLIC_SITE_URL: 'https://remotelens.co',
      },
    )

    expect(response?.status).toBe(503)
    expect(response?.headers.get('retry-after')).toBe('60')
    expect(await response?.text()).toBe('Sitemap temporarily unavailable.\n')
  })
})
