import { ulid } from 'ulid'
import { z } from 'zod'
import OPENAPI_DOCUMENT from '../../docs/openapi.json'
import {
  API_TAXONOMY,
  API_VERSION,
  ApiErrorEnvelopeSchema,
  ApiJobDetailSchema,
  ApiJobSummarySchema,
  ApiMetaSchema,
  ApiTaxonomySchema,
  TAXONOMY_VERSION,
  parseApiFilters,
} from './contracts'
import { createCursor, cursorSecret, verifyCursor } from './cursor'
import { getApiJob, listApiJobs, readCatalogMeta } from './catalog'

export type PublicApiRuntime = {
  API_CURSOR_SECRET?: string
  API_RATE_LIMITER?: Pick<RateLimit, 'limit'>
  APP_ENV?: string
  DB?: D1Database
  PUBLIC_SITE_URL?: string
}

export type PublicApiHandlerOptions = {
  cache?: Cache
  clock?: () => Date
  localRateLimit?: number
  localRateWindowMs?: number
}

type RateResult = { success: boolean }

class CatalogNotFoundError extends Error {
  constructor() {
    super('not_found')
  }
}

const LOCAL_RATE_STATE = new Map<
  string,
  { count: number; windowStarted: number }
>()
const PUBLIC_PATHS = new Set([
  '/api/openapi.json',
  '/api/v1/jobs',
  '/api/v1/meta',
  '/api/v1/taxonomy',
  '/feeds/jobs.json',
  '/feeds/jobs.xml',
])
const API_PREFIX = '/api/v1/'

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname === '/api/v1' ||
    pathname.startsWith('/api/v1/')
  )
}

function isApiPath(pathname: string) {
  return pathname.startsWith(API_PREFIX)
}

function requestId() {
  return ulid()
}

function generatedAt(clock: () => Date) {
  return clock().toISOString()
}

function requestKey(request: Request) {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    request.headers.get('X-Real-IP') ??
    'anonymous'
  )
}

function corsHeaders(headers: Headers) {
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type')
  headers.set('Access-Control-Max-Age', '600')
}

function responseHeaders(
  request: Request,
  requestIdValue: string,
  extra?: HeadersInit,
) {
  const headers = new Headers(extra)
  headers.set('X-Request-ID', requestIdValue)
  headers.set('X-Content-Type-Options', 'nosniff')
  if (isPublicPath(new URL(request.url).pathname)) corsHeaders(headers)
  return headers
}

function errorResponse(
  request: Request,
  requestIdValue: string,
  status: number,
  code: string,
  message: string,
  field?: string,
  extra?: HeadersInit,
) {
  const error = {
    code,
    message,
    ...(field ? { field } : {}),
  }
  const payload = ApiErrorEnvelopeSchema.parse({
    error,
    meta: {
      generated_at: new Date().toISOString(),
      request_id: requestIdValue,
    },
  })
  const headers = responseHeaders(request, requestIdValue, {
    ...Object.fromEntries(new Headers(extra)),
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  return new Response(JSON.stringify(payload), { status, headers })
}

function cacheFor(options: PublicApiHandlerOptions) {
  if (options.cache) return options.cache
  if (typeof caches !== 'undefined') {
    const cloudflareCaches = globalThis.caches as CacheStorage & {
      default?: Cache
    }
    return cloudflareCaches.default
  }
  return undefined
}

function cacheKey(request: Request, epoch: string) {
  const url = new URL(request.url)
  url.searchParams.set('__remotelens_cache_epoch', epoch)
  return new Request(url, { method: 'GET' })
}

async function readCached(
  request: Request,
  epoch: string,
  options: PublicApiHandlerOptions,
) {
  const cache = cacheFor(options)
  if (!cache) return undefined
  try {
    return await cache.match(cacheKey(request, epoch))
  } catch {
    return undefined
  }
}

async function writeCached(
  request: Request,
  epoch: string,
  response: Response,
  options: PublicApiHandlerOptions,
) {
  const cache = cacheFor(options)
  if (!cache || response.status !== 200) return
  try {
    await cache.put(cacheKey(request, epoch), response.clone())
  } catch {
    // Cache availability is an optimization; the catalog response is still valid.
  }
}

function asHead(request: Request, response: Response) {
  if (request.method !== 'HEAD') return response
  return new Response(null, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  })
}

async function rateLimited(
  request: Request,
  runtime: PublicApiRuntime,
  options: PublicApiHandlerOptions,
): Promise<boolean | null> {
  const key = requestKey(request)
  if (runtime.API_RATE_LIMITER) {
    try {
      const result: RateResult = await runtime.API_RATE_LIMITER.limit({ key })
      return !result.success
    } catch {
      return runtime.APP_ENV === 'production' ? null : false
    }
  }

  if (runtime.APP_ENV === 'production') return null
  const now = Date.now()
  const windowMs = options.localRateWindowMs ?? 60_000
  const limit = options.localRateLimit ?? 120
  const current = LOCAL_RATE_STATE.get(key)
  if (!current || now - current.windowStarted >= windowMs) {
    LOCAL_RATE_STATE.set(key, { count: 1, windowStarted: now })
    return false
  }
  current.count += 1
  return current.count > limit
}

function rateLimitResponse(request: Request, requestIdValue: string) {
  return errorResponse(
    request,
    requestIdValue,
    429,
    'rate_limited',
    'The public API limit is 120 requests per minute per client.',
    undefined,
    { 'Retry-After': '60' },
  )
}

function unavailableResponse(request: Request, requestIdValue: string) {
  return errorResponse(
    request,
    requestIdValue,
    503,
    'catalog_unavailable',
    'The RemoteLens catalog is temporarily unavailable. Try again shortly.',
  )
}

function jsonBody(
  request: Request,
  requestIdValue: string,
  body: unknown,
  epoch: string,
) {
  const headers = responseHeaders(request, requestIdValue, {
    'Cache-Control':
      'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
    'Content-Type': 'application/json; charset=utf-8',
    ETag: `W/"${epoch}"`,
    'X-RemoteLens-Cache-Epoch': epoch,
  })
  return new Response(JSON.stringify(body), { status: 200, headers })
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function siteUrl(request: Request, runtime: PublicApiRuntime) {
  return (runtime.PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(
    /\/$/u,
    '',
  )
}

function rssBody(
  request: Request,
  runtime: PublicApiRuntime,
  jobs: Array<z.infer<typeof ApiJobSummarySchema>>,
) {
  const items = jobs
    .map(
      (job) => `
      <item>
        <guid isPermaLink="false">${xmlEscape(job.id)}</guid>
        <title>${xmlEscape(`${job.title} — ${job.company}`)}</title>
        <link>${xmlEscape(`${siteUrl(request, runtime)}/jobs/${job.slug}`)}</link>
        <description>${xmlEscape(job.description_excerpt)}</description>
        <pubDate>${xmlEscape(job.published_at ?? job.first_seen_at)}</pubDate>
        <remoteLens:status>${xmlEscape(job.status)}</remoteLens:status>
        <remoteLens:source>${xmlEscape(job.sources.map((source) => source.attribution).join(', '))}</remoteLens:source>
      </item>`,
    )
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:remoteLens="https://remotelens.example/ns">
  <channel>
    <title>RemoteLens active remote developer jobs</title>
    <link>${xmlEscape(siteUrl(request, runtime))}</link>
    <description>Attributed, structured remote developer jobs. CV comparison stays local.</description>
    ${items}
  </channel>
</rss>`
}

async function catalogContext(runtime: PublicApiRuntime, production: boolean) {
  return readCatalogMeta(runtime.DB, production)
}

async function cachedCatalogResponse(
  request: Request,
  runtime: PublicApiRuntime,
  options: PublicApiHandlerOptions,
  render: (input: {
    generated_at: string
    request_id: string
  }) =>
    | Promise<{ body: unknown; contentType?: string }>
    | { body: unknown; contentType?: string },
) {
  const id = requestId()
  const clock = options.clock ?? (() => new Date())
  const production = runtime.APP_ENV === 'production'
  let catalog
  try {
    catalog = await catalogContext(runtime, production)
  } catch {
    return unavailableResponse(request, id)
  }
  const hit = await readCached(request, catalog.cache_epoch, options)
  if (hit) return asHead(request, hit)

  try {
    const rendered = await render({
      generated_at: generatedAt(clock),
      request_id: id,
    })
    const response =
      rendered.contentType === 'application/rss+xml'
        ? new Response(String(rendered.body), {
            status: 200,
            headers: responseHeaders(request, id, {
              'Cache-Control':
                'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
              'Content-Type': 'application/rss+xml; charset=utf-8',
              ETag: `W/"${catalog.cache_epoch}"`,
              'X-RemoteLens-Cache-Epoch': catalog.cache_epoch,
            }),
          })
        : jsonBody(request, id, rendered.body, catalog.cache_epoch)
    await writeCached(request, catalog.cache_epoch, response, options)
    return asHead(request, response)
  } catch (error: unknown) {
    if (error instanceof CatalogNotFoundError) throw error
    return unavailableResponse(request, id)
  }
}

function parseErrorResponse(
  request: Request,
  requestIdValue: string,
  error: { field: string; message: string },
) {
  return errorResponse(
    request,
    requestIdValue,
    400,
    'invalid_filter',
    error.message,
    error.field,
  )
}

export async function handlePublicApiRequest(
  request: Request,
  runtime: PublicApiRuntime,
  options: PublicApiHandlerOptions = {},
): Promise<Response | null> {
  const url = new URL(request.url)
  if (!isPublicPath(url.pathname)) return null

  const id = requestId()
  if (request.method === 'OPTIONS') {
    const headers = responseHeaders(request, id, {
      Allow: 'GET, HEAD, OPTIONS',
      'Content-Length': '0',
    })
    return new Response(null, { status: 204, headers })
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return errorResponse(
      request,
      id,
      405,
      'method_not_allowed',
      'RemoteLens is a public read-only service.',
      undefined,
      { Allow: 'GET, HEAD, OPTIONS' },
    )
  }

  if (isApiPath(url.pathname)) {
    const limited = await rateLimited(request, runtime, options)
    if (limited === null) {
      return errorResponse(
        request,
        id,
        503,
        'rate_limiter_unavailable',
        'The public API is temporarily unavailable. Try again shortly.',
      )
    }
    if (limited) return rateLimitResponse(request, id)
  }

  if (url.pathname === '/api/openapi.json') {
    return cachedCatalogResponse(request, runtime, options, () => ({
      body: {
        ...OPENAPI_DOCUMENT,
      },
    }))
  }

  if (url.pathname === '/api/v1/taxonomy') {
    return cachedCatalogResponse(request, runtime, options, (meta) => ({
      body: {
        data: ApiTaxonomySchema.parse(API_TAXONOMY),
        meta,
      },
    }))
  }

  if (url.pathname === '/api/v1/meta') {
    return cachedCatalogResponse(
      request,
      runtime,
      options,
      async (envelope) => {
        const catalog = await catalogContext(
          runtime,
          runtime.APP_ENV === 'production',
        )
        const data = ApiMetaSchema.parse({
          api_version: API_VERSION,
          cache_epoch: catalog.cache_epoch,
          last_completed_cycle: catalog.last_completed_cycle,
          providers: catalog.providers,
          taxonomy_version: TAXONOMY_VERSION,
          total_active_jobs: catalog.total_active_jobs,
        })
        return { body: { data, meta: envelope } }
      },
    )
  }

  if (url.pathname === '/api/v1/jobs') {
    const parsed = parseApiFilters(url)
    if ('error' in parsed) return parseErrorResponse(request, id, parsed.error)
    const secret = cursorSecret(
      runtime.API_CURSOR_SECRET,
      runtime.APP_ENV === 'production',
    )
    if (parsed.cursor && !secret) {
      return errorResponse(
        request,
        id,
        503,
        'api_cursor_unavailable',
        'The public API cursor service is temporarily unavailable.',
      )
    }
    const position =
      parsed.cursor && secret
        ? await verifyCursor(parsed.cursor, parsed.filters, secret)
        : null
    if (parsed.cursor && !position) {
      return errorResponse(
        request,
        id,
        400,
        'invalid_cursor',
        'The cursor is invalid or belongs to a different filter contract.',
        'cursor',
      )
    }
    return cachedCatalogResponse(request, runtime, options, async (meta) => {
      const catalog = await catalogContext(
        runtime,
        runtime.APP_ENV === 'production',
      )
      const result = await listApiJobs(
        runtime.DB,
        parsed.filters,
        position,
        runtime.APP_ENV === 'production',
      )
      const data = z.array(ApiJobSummarySchema).parse(result.jobs)
      const nextCursor =
        result.nextPosition && secret
          ? await createCursor(parsed.filters, result.nextPosition, secret)
          : null
      return {
        body: {
          data,
          meta: {
            ...meta,
            next_cursor: nextCursor,
            catalog_epoch: catalog.cache_epoch,
          },
        },
      }
    })
  }

  if (url.pathname.startsWith('/api/v1/jobs/')) {
    let identifier: string
    try {
      identifier = decodeURIComponent(
        url.pathname.slice('/api/v1/jobs/'.length),
      )
    } catch {
      return errorResponse(
        request,
        id,
        404,
        'not_found',
        'The requested job was not found.',
      )
    }
    if (!identifier || identifier.includes('/')) {
      return errorResponse(
        request,
        id,
        404,
        'not_found',
        'The requested job was not found.',
      )
    }
    return cachedCatalogResponse(request, runtime, options, async (meta) => {
      const job = await getApiJob(
        runtime.DB,
        identifier,
        runtime.APP_ENV === 'production',
      )
      if (!job) throw new CatalogNotFoundError()
      return {
        body: {
          data: ApiJobDetailSchema.parse(job),
          meta,
        },
      }
    }).catch((error: unknown) => {
      if (error instanceof CatalogNotFoundError) {
        return errorResponse(
          request,
          id,
          404,
          'not_found',
          'The requested job was not found.',
        )
      }
      return unavailableResponse(request, id)
    })
  }

  if (
    url.pathname === '/feeds/jobs.json' ||
    url.pathname === '/feeds/jobs.xml'
  ) {
    const parsed = parseApiFilters(url)
    if ('error' in parsed) return parseErrorResponse(request, id, parsed.error)
    if (parsed.filters.status !== 'active') {
      return errorResponse(
        request,
        id,
        400,
        'invalid_filter',
        'Feeds contain active jobs only; omit status or use status=active.',
        'status',
      )
    }
    return cachedCatalogResponse(request, runtime, options, async (meta) => {
      const result = await listApiJobs(
        runtime.DB,
        { ...parsed.filters, status: 'active' },
        null,
        runtime.APP_ENV === 'production',
      )
      const data = z.array(ApiJobSummarySchema).parse(result.jobs)
      if (url.pathname.endsWith('.xml')) {
        return {
          body: rssBody(request, runtime, data),
          contentType: 'application/rss+xml',
        }
      }
      return { body: { data, meta } }
    })
  }

  return errorResponse(
    request,
    id,
    404,
    'not_found',
    'The requested API route was not found.',
  )
}
