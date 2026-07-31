const CANONICAL_STATIC_PATHS = [
  '/',
  '/jobs',
  '/api',
  '/skills/install',
  '/about',
  '/privacy',
] as const

const MAX_SITEMAP_URLS = 50_000
const MAX_JOB_URLS = MAX_SITEMAP_URLS - CANONICAL_STATIC_PATHS.length

type SitemapJob = {
  slug: string
  updated_at: number
}

type SearchDiscoveryEnv = {
  DB: D1Database
  PUBLIC_SITE_URL: string
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function canonicalOrigin(siteUrl: string) {
  const url = new URL(siteUrl)
  return `${url.protocol}//${url.host}`
}

export function buildSitemapXml(siteUrl: string, jobs: SitemapJob[]) {
  const origin = canonicalOrigin(siteUrl)
  const staticUrls = CANONICAL_STATIC_PATHS.map(
    (path) =>
      `  <url><loc>${xmlEscape(new URL(path, origin).href)}</loc></url>`,
  )
  const jobUrls = jobs.map((job) => {
    const location = new URL(`/jobs/${encodeURIComponent(job.slug)}`, origin)
    return [
      '  <url>',
      `    <loc>${xmlEscape(location.href)}</loc>`,
      `    <lastmod>${new Date(job.updated_at).toISOString()}</lastmod>`,
      '  </url>',
    ].join('\n')
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...jobUrls,
    '</urlset>',
    '',
  ].join('\n')
}

async function listIndexableJobs(db: D1Database) {
  const rows = await db
    .prepare(
      `SELECT j.slug, j.updated_at
       FROM jobs AS j
       WHERE j.status = 'active'
         AND EXISTS (
           SELECT 1
           FROM job_provenance AS provenance
           JOIN source_records AS source
             ON source.id = provenance.source_record_id
           JOIN source_health AS health
             ON health.provider = source.provider
           WHERE provenance.job_id = j.id
             AND health.enabled = 1
         )
       ORDER BY j.updated_at DESC, j.id DESC
       LIMIT ?`,
    )
    .bind(MAX_JOB_URLS)
    .all<SitemapJob>()

  return rows.results
}

function responseBody(request: Request, body: string) {
  return request.method.toUpperCase() === 'HEAD' ? null : body
}

export async function handleSearchDiscoveryRequest(
  request: Request,
  runtime: SearchDiscoveryEnv,
) {
  const method = request.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') return null

  const url = new URL(request.url)
  if (url.pathname === '/robots.txt') {
    const origin = canonicalOrigin(runtime.PUBLIC_SITE_URL)
    const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
    return new Response(responseBody(request, body), {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }

  if (url.pathname !== '/sitemap.xml') return null

  try {
    const body = buildSitemapXml(
      runtime.PUBLIC_SITE_URL,
      await listIndexableJobs(runtime.DB),
    )
    return new Response(responseBody(request, body), {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  } catch {
    return new Response(
      responseBody(request, 'Sitemap temporarily unavailable.\n'),
      {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8',
          'Retry-After': '60',
        },
        status: 503,
      },
    )
  }
}
