import { describe, expect, it } from 'vitest'
import {
  isAllowedPublicMethod,
  withSecurityHeaders,
} from '../../src/lib/http-security'

describe('public HTTP boundary', () => {
  it('permits only read-only methods', () => {
    expect(isAllowedPublicMethod('GET')).toBe(true)
    expect(isAllowedPublicMethod('head')).toBe(true)
    expect(isAllowedPublicMethod('OPTIONS')).toBe(true)
    expect(isAllowedPublicMethod('POST')).toBe(false)
    expect(isAllowedPublicMethod('DELETE')).toBe(false)
  })

  it('sets the required browser security headers without dropping response data', async () => {
    const response = withSecurityHeaders(
      new Response('RemoteLens', {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60' },
      }),
    )

    expect(response.headers.get('content-security-policy')).toContain(
      "frame-ancestors 'none'",
    )
    expect(response.headers.get('permissions-policy')).toBe(
      'camera=(), geolocation=(), microphone=()',
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('cache-control')).toBe('public, max-age=60')
    expect(await response.text()).toBe('RemoteLens')
  })
})
