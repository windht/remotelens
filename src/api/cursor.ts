import type { ApiFilters, CursorPosition } from './contracts'
import { normalizedContract } from './contracts'

const FALLBACK_CURSOR_SECRET = 'remotelens-local-development-cursor-secret'

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

function base64UrlDecode(value: string) {
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  )
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign'],
  )
  const bytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value),
  )
  let binary = ''
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

export function cursorSecret(secret: string | undefined, production = false) {
  if (secret) return secret
  return production ? null : FALLBACK_CURSOR_SECRET
}

export async function createCursor(
  filters: ApiFilters,
  position: CursorPosition,
  secret: string,
) {
  const payload = base64UrlEncode(
    JSON.stringify({
      contract: normalizedContract(filters),
      id: position.id,
      sort: position.sort,
      value: position.value,
    }),
  )
  return `${payload}.${await signature(payload, secret)}`
}

export async function verifyCursor(
  cursor: string,
  filters: ApiFilters,
  secret: string,
): Promise<CursorPosition | null> {
  const [payload, providedSignature, ...extra] = cursor.split('.')
  if (!payload || !providedSignature || extra.length > 0) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(base64UrlDecode(payload))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const record = parsed as Record<string, unknown>
  if (
    record.contract !== normalizedContract(filters) ||
    (record.sort !== 'recently_discovered' &&
      record.sort !== 'newest_published') ||
    typeof record.id !== 'string' ||
    typeof record.value !== 'number' ||
    !Number.isFinite(record.value)
  ) {
    return null
  }
  const expectedSignature = await signature(payload, secret)
  if (expectedSignature !== providedSignature) return null
  return {
    id: record.id,
    sort: record.sort,
    value: record.value,
  }
}
