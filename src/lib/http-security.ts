const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function isAllowedPublicMethod(method: string) {
  return ALLOWED_METHODS.has(method.toUpperCase())
}

export function withSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers)
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'self'",
      "font-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
    ].join('; '),
  )
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}
