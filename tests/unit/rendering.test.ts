import { describe, expect, it } from 'vitest'
import {
  catalogIsrHeaders,
  stablePageIsrHeaders,
  uncachedSsrHeaders,
  withWebsiteRenderingHeaders,
} from '../../src/lib/rendering'
import { startInstance } from '../../src/start'

describe('website rendering policy', () => {
  it('makes SSR the explicit default for the complete route tree', async () => {
    await expect(startInstance.getOptions()).resolves.toMatchObject({
      defaultSsr: true,
    })
  })

  it('uses bounded ISR for catalog-backed pages', () => {
    expect(catalogIsrHeaders()).toEqual({
      'Cache-Control':
        'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      'CDN-Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'X-RemoteLens-Render-Mode': 'isr',
    })
  })

  it('uses longer ISR for stable public pages', () => {
    expect(stablePageIsrHeaders()).toEqual({
      'Cache-Control':
        'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control':
        'public, max-age=86400, stale-while-revalidate=604800',
      'X-RemoteLens-Render-Mode': 'isr',
    })
  })

  it('keeps unavailable or uncategorized HTML on uncached SSR', async () => {
    expect(uncachedSsrHeaders()).toEqual({
      'Cache-Control': 'no-store',
      'X-RemoteLens-Render-Mode': 'ssr',
    })

    const response = withWebsiteRenderingHeaders(
      new Response('<h1>Unavailable</h1>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    )

    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-remotelens-render-mode')).toBe('ssr')
    expect(await response.text()).toContain('Unavailable')
  })

  it('preserves route-owned ISR headers and non-HTML responses', () => {
    const isrResponse = withWebsiteRenderingHeaders(
      new Response('<h1>Job</h1>', {
        headers: {
          'Cache-Control': catalogIsrHeaders()['Cache-Control'],
          'Content-Type': 'text/html; charset=utf-8',
          'X-RemoteLens-Render-Mode': 'isr',
        },
      }),
    )
    expect(isrResponse.headers.get('cache-control')).toContain('s-maxage=300')
    expect(isrResponse.headers.get('x-remotelens-render-mode')).toBe('isr')

    const jsonResponse = new Response('{}', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(withWebsiteRenderingHeaders(jsonResponse)).toBe(jsonResponse)
  })
})
