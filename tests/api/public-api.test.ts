import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  ApiErrorEnvelopeSchema,
  ApiJobDetailSchema,
  ApiJobSummarySchema,
  ApiMetaSchema,
  ApiTaxonomySchema,
} from '../../src/api/contracts'
import {
  handlePublicApiRequest,
  type PublicApiRuntime,
} from '../../src/api/handler'

const runtime: PublicApiRuntime = {
  API_CURSOR_SECRET: 'test-cursor-secret',
  APP_ENV: 'development',
}

async function request(
  path: string,
  init?: RequestInit,
  selectedRuntime: PublicApiRuntime = runtime,
) {
  const response = await handlePublicApiRequest(
    new Request(`https://remotelens.test${path}`, init),
    selectedRuntime,
  )
  expect(response).not.toBeNull()
  return response as Response
}

describe('public API contract', () => {
  it('returns exact structured results and rejects a cursor bound to changed filters', async () => {
    const first = await request('/api/v1/jobs?limit=1')
    expect(first.status).toBe(200)
    expect(first.headers.get('access-control-allow-origin')).toBe('*')
    expect(first.headers.get('cache-control')).toContain('s-maxage=300')
    const firstBody = z
      .object({
        data: z.array(z.unknown()),
        meta: z.object({ next_cursor: z.string().nullable() }),
      })
      .parse(await first.json())
    expect(firstBody.data).toHaveLength(1)
    expect(firstBody.meta.next_cursor).toEqual(expect.any(String))
    firstBody.data.forEach((job) => ApiJobSummarySchema.parse(job))

    const second = await request(
      `/api/v1/jobs?limit=1&cursor=${encodeURIComponent(firstBody.meta.next_cursor ?? '')}`,
    )
    expect(second.status).toBe(200)
    const secondBody = z
      .object({ data: z.array(z.object({ id: z.string() })) })
      .parse(await second.json())
    expect(secondBody.data[0]?.id).not.toBe(
      z.object({ id: z.string() }).parse(firstBody.data[0]).id,
    )

    const changedContract = await request(
      `/api/v1/jobs?limit=1&company=Unknown%20Company&cursor=${encodeURIComponent(firstBody.meta.next_cursor ?? '')}`,
    )
    expect(changedContract.status).toBe(400)
    expect(
      ApiErrorEnvelopeSchema.parse(await changedContract.json()).error.code,
    ).toBe('invalid_cursor')

    const changedSort = await request(
      `/api/v1/jobs?limit=1&sort=newest_published&cursor=${encodeURIComponent(firstBody.meta.next_cursor ?? '')}`,
    )
    expect(changedSort.status).toBe(400)
    expect(
      ApiErrorEnvelopeSchema.parse(await changedSort.json()).error.code,
    ).toBe('invalid_cursor')

    const japan = await request('/api/v1/jobs?country=JP')
    expect(japan.status).toBe(200)
    const japanJobs = z
      .object({ data: z.array(ApiJobSummarySchema) })
      .parse(await japan.json()).data
    expect(japanJobs.map((job) => job.company)).toEqual([
      'Kumo Systems',
      'Northstar Labs',
    ])

    const exactSalary = await request(
      '/api/v1/jobs?salary_min=150000&salary_currency=USD&salary_period=year',
    )
    expect(exactSalary.status).toBe(200)
    expect(
      z
        .object({ data: z.array(ApiJobSummarySchema) })
        .parse(await exactSalary.json())
        .data.map((job) => job.company),
    ).toEqual(['Kumo Systems'])

    const validEmpty = await request('/api/v1/jobs?company=Unknown%20Company')
    expect(validEmpty.status).toBe(200)
    expect(
      z.object({ data: z.array(z.unknown()) }).parse(await validEmpty.json())
        .data,
    ).toEqual([])

    const invalid = await request('/api/v1/jobs?country=JAPAN')
    expect(invalid.status).toBe(400)
    expect(ApiErrorEnvelopeSchema.parse(await invalid.json()).error.code).toBe(
      'invalid_filter',
    )

    for (const path of [
      '/api/v1/jobs?source=unknown',
      '/api/v1/jobs?timezone=not-a-timezone',
      '/api/v1/jobs?salary_min=100&salary_currency=USD',
    ]) {
      const malformed = await request(path)
      expect(malformed.status).toBe(400)
      expect(
        ApiErrorEnvelopeSchema.parse(await malformed.json()).error.code,
      ).toBe('invalid_filter')
    }
  })

  it('returns detail provenance, source records, conflicts, and sanitized text', async () => {
    const response = await request(
      '/api/v1/jobs/senior-backend-engineer-kumo-01JRLKUM0F6T',
    )
    expect(response.status).toBe(200)
    const body = z.object({ data: z.unknown() }).parse(await response.json())
    const detail = ApiJobDetailSchema.parse(body.data)
    expect(detail.sources.length).toBeGreaterThan(1)
    expect(detail.source_records.length).toBeGreaterThan(1)
    expect(detail.provenance.length).toBeGreaterThan(0)
    expect(detail.description_text).toContain('Build and operate')
    expect(detail.description_html).not.toContain('onerror')
  })

  it('keeps taxonomy, metadata, JSON feed, RSS, and OpenAPI consistent', async () => {
    const taxonomy = await request('/api/v1/taxonomy')
    expect(taxonomy.status).toBe(200)
    const taxonomyBody = z
      .object({ data: z.unknown() })
      .parse(await taxonomy.json())
    expect(ApiTaxonomySchema.parse(taxonomyBody.data).role_families).toEqual([
      'engineering',
    ])

    const meta = await request('/api/v1/meta')
    expect(meta.status).toBe(200)
    const metaBody = z.object({ data: z.unknown() }).parse(await meta.json())
    expect(ApiMetaSchema.parse(metaBody.data).providers).toHaveLength(2)

    const jsonFeed = await request('/feeds/jobs.json?limit=2')
    expect(jsonFeed.status).toBe(200)
    const jsonFeedBody = z
      .object({ data: z.array(z.unknown()) })
      .parse(await jsonFeed.json())
    expect(jsonFeedBody.data).toHaveLength(2)
    expect(jsonFeedBody.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'active' })]),
    )

    const xmlFeed = await request('/feeds/jobs.xml?limit=1')
    expect(xmlFeed.status).toBe(200)
    expect(xmlFeed.headers.get('content-type')).toContain('application/rss+xml')
    expect(await xmlFeed.text()).toContain('<rss')

    const openapi = await request('/api/openapi.json')
    expect(openapi.status).toBe(200)
    const openapiBody = z
      .object({
        openapi: z.string(),
        paths: z.record(z.string(), z.unknown()),
      })
      .parse(await openapi.json())
    expect(openapiBody.openapi).toBe('3.1.0')
    expect(openapiBody.paths['/api/v1/jobs']).toBeDefined()
    expect(JSON.stringify(openapiBody)).not.toContain('"q"')
  })

  it('enforces read-only methods, CORS preflight, and the edge rate guard', async () => {
    const preflight = await request('/api/v1/jobs', { method: 'OPTIONS' })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-methods')).toContain(
      'GET',
    )

    const mutation = await request('/api/v1/jobs', { method: 'POST' })
    expect(mutation.status).toBe(405)
    expect(mutation.headers.get('allow')).toBe('GET, HEAD, OPTIONS')

    const head = await request('/api/v1/jobs', { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')

    const limiter = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    }
    const rateLimited = await request('/api/v1/jobs', undefined, {
      ...runtime,
      API_RATE_LIMITER: limiter,
    })
    expect(rateLimited.status).toBe(429)
    expect(rateLimited.headers.get('retry-after')).toBe('60')
    expect(
      ApiErrorEnvelopeSchema.parse(await rateLimited.json()).error.code,
    ).toBe('rate_limited')
  })

  it('uses the epoch-keyed cache for successful responses only', async () => {
    const entries = new Map<string, Response>()
    const match = vi.fn((key: Request) => entries.get(key.url))
    const put = vi.fn((key: Request, response: Response) => {
      entries.set(key.url, response)
    })
    const cache = { match, put } as unknown as Cache

    const first = await handlePublicApiRequest(
      new Request('https://remotelens.test/api/v1/jobs?limit=1'),
      runtime,
      { cache },
    )
    expect(first?.status).toBe(200)
    expect(put).toHaveBeenCalledTimes(1)

    const second = await handlePublicApiRequest(
      new Request('https://remotelens.test/api/v1/jobs?limit=1'),
      runtime,
      { cache },
    )
    expect(second?.status).toBe(200)
    expect(match).toHaveBeenCalledTimes(2)
    expect(put).toHaveBeenCalledTimes(1)
  })
})
