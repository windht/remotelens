import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { env } from 'cloudflare:workers'
import { handlePublicApiRequest } from '~/api/handler'
import { isAllowedPublicMethod, withSecurityHeaders } from '~/lib/http-security'
import { withWebsiteRenderingHeaders } from '~/lib/rendering'
import { handleSearchDiscoveryRequest } from '~/lib/search-discovery'

export { CatalogIngestionWorkflow } from '~/ingestion/workflow'

export default createServerEntry({
  async fetch(request) {
    const searchDiscoveryResponse = await handleSearchDiscoveryRequest(
      request,
      env,
    )
    if (searchDiscoveryResponse) {
      return withSecurityHeaders(searchDiscoveryResponse)
    }

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
      withWebsiteRenderingHeaders(await handler.fetch(request)),
    )
  },
})
