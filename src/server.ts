import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { isAllowedPublicMethod, withSecurityHeaders } from '~/lib/http-security'

export { CatalogIngestionWorkflow } from '~/ingestion/workflow'

export default createServerEntry({
  async fetch(request) {
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

    return withSecurityHeaders(await handler.fetch(request))
  },
})
