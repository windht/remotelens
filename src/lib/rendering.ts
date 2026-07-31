const FIVE_MINUTES = 5 * 60
const ONE_HOUR = 60 * 60
const ONE_DAY = 24 * 60 * 60
const ONE_WEEK = 7 * ONE_DAY

type RenderMode = 'isr' | 'ssr'

function isrHeaders(sharedMaxAge: number, staleWhileRevalidate: number) {
  return {
    'Cache-Control': `public, max-age=0, s-maxage=${sharedMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    'CDN-Cache-Control': `public, max-age=${sharedMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    'X-RemoteLens-Render-Mode': 'isr',
  }
}

export function catalogIsrHeaders() {
  return isrHeaders(FIVE_MINUTES, ONE_HOUR)
}

export function stablePageIsrHeaders() {
  return isrHeaders(ONE_DAY, ONE_WEEK)
}

export function uncachedSsrHeaders() {
  return {
    'Cache-Control': 'no-store',
    'X-RemoteLens-Render-Mode': 'ssr',
  }
}

function inferRenderMode(cacheControl: string): RenderMode {
  return cacheControl.includes('no-store') ? 'ssr' : 'isr'
}

export function withWebsiteRenderingHeaders(response: Response) {
  if (!response.headers.get('Content-Type')?.includes('text/html')) {
    return response
  }

  const headers = new Headers(response.headers)
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store')
  }
  if (!headers.has('X-RemoteLens-Render-Mode')) {
    headers.set(
      'X-RemoteLens-Render-Mode',
      inferRenderMode(headers.get('Cache-Control') ?? 'no-store'),
    )
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}
