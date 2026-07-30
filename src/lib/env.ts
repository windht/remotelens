import { z } from 'zod'

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')

const positiveIntegerString = z.coerce.number().int().positive()

export const runtimeEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
  PUBLIC_SITE_URL: z.url(),
  PUBLIC_API_BASE_URL: z.url(),
  ENABLE_SOURCE_REMOTE_OK: booleanString,
  ENABLE_SOURCE_WWR: booleanString,
  INGESTION_LOCK_TTL_SECONDS: positiveIntegerString,
  SEMANTIC_DEDUPE_MAX_PER_RUN: z.coerce.number().int().min(0).max(50),
  SOURCE_MISSING_RUN_THRESHOLD: z.coerce.number().int().min(2),
  SOURCE_CLOSE_AFTER_HOURS: positiveIntegerString,
  SOURCE_CLOSED_RETENTION_DAYS: positiveIntegerString,
  DEEPSEEK_MODEL: z.string().min(1),
  DEEPSEEK_SCHEMA_RETRY_COUNT: z.coerce.number().int().min(0).max(1),
})

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>

export function parseRuntimeEnv(input: Record<string, unknown>): RuntimeEnv {
  return runtimeEnvSchema.parse(input)
}
