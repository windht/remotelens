import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { env } from 'cloudflare:workers'
import { handlePublicApiRequest } from '~/api/handler'
import { isAllowedPublicMethod, withSecurityHeaders } from '~/lib/http-security'

export { CatalogIngestionWorkflow } from '~/ingestion/workflow'

function withWebsiteCacheHeaders(response: Response) {
  if (!response.headers.get('Content-Type')?.includes('text/html')) {
    return response
  }
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export default createServerEntry({
  async fetch(request) {
    const publicApiResponse = await handlePublicApiRequest(request, env)
    if (publicApiResponse) return withSecurityHeaders(publicApiResponse)

    if (!isAllowedPublicMethod(request.method)) {
      return withSecurityHeaders(
        Response.json(
          {
            error: {
              code: 'method_not_allowed',
              message: 'RemoteLens is a public read-only service.',
            },
          },
          {
            status: 405,
            headers: { Allow: 'GET, HEAD, OPTIONS' },
          },
        ),
      )
    }

    if (request.method === 'OPTIONS') {
      return withSecurityHeaders(
        new Response(null, {
          status: 204,
          headers: { Allow: 'GET, HEAD, OPTIONS' },
        }),
      )
    }

    return withSecurityHeaders(
      withWebsiteCacheHeaders(await handler.fetch(request)),
    )
  },
})
