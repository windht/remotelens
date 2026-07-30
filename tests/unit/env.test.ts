import { describe, expect, it } from 'vitest'
import { parseRuntimeEnv } from '../../src/lib/env'

const validEnvironment = {
  APP_ENV: 'test',
  DEEPSEEK_MODEL: 'not-configured-in-phase-1',
  DEEPSEEK_SCHEMA_RETRY_COUNT: '1',
  ENABLE_SOURCE_REMOTE_OK: 'true',
  ENABLE_SOURCE_WWR: 'false',
  INGESTION_LOCK_TTL_SECONDS: '1800',
  PUBLIC_API_BASE_URL: 'http://localhost:3000/api/v1',
  PUBLIC_SITE_URL: 'http://localhost:3000',
  SEMANTIC_DEDUPE_MAX_PER_RUN: '50',
  SOURCE_CLOSE_AFTER_HOURS: '72',
  SOURCE_CLOSED_RETENTION_DAYS: '30',
  SOURCE_MISSING_RUN_THRESHOLD: '2',
}

describe('runtime environment validation', () => {
  it('coerces documented string bindings into typed values', () => {
    expect(parseRuntimeEnv(validEnvironment)).toMatchObject({
      APP_ENV: 'test',
      ENABLE_SOURCE_REMOTE_OK: true,
      ENABLE_SOURCE_WWR: false,
      INGESTION_LOCK_TTL_SECONDS: 1800,
      SEMANTIC_DEDUPE_MAX_PER_RUN: 50,
    })
  })

  it('rejects unsafe lifecycle and semantic-dedupe limits', () => {
    expect(() =>
      parseRuntimeEnv({
        ...validEnvironment,
        SEMANTIC_DEDUPE_MAX_PER_RUN: '51',
      }),
    ).toThrow()
    expect(() =>
      parseRuntimeEnv({
        ...validEnvironment,
        SOURCE_MISSING_RUN_THRESHOLD: '1',
      }),
    ).toThrow()
  })
})
