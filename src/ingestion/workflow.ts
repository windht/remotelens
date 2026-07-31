import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers'
import { remoteOkAdapter } from './adapters/remote-ok'
import { WWR_FEEDS, fetchWwrFeeds } from './adapters/wwr'
import {
  claimCycle,
  finalizeCycle,
  persistProviderObservation,
} from './d1-catalog'
import { boundedError } from './normalization'
import type { ProviderRunSummary } from './types'
import { parseRuntimeEnv } from '~/lib/env'

type WorkflowParams = {
  cycleKey?: string
}

export class CatalogIngestionWorkflow extends WorkflowEntrypoint<
  Cloudflare.Env,
  WorkflowParams
> {
  override async run(
    event: Readonly<WorkflowEvent<WorkflowParams>>,
    step: WorkflowStep,
  ) {
    const environment = parseRuntimeEnv(
      this.env as unknown as Record<string, unknown>,
    )
    const claim = await step.do('claim ingestion cycle', async () => {
      const now = Date.now()
      const cycleKey =
        event.payload?.cycleKey ??
        new Date(event.timestamp).toISOString().slice(0, 13)
      return claimCycle(this.env.DB, {
        cycleKey,
        enabledProviders: [
          ...(environment.ENABLE_SOURCE_REMOTE_OK
            ? (['remote_ok'] as const)
            : []),
          ...(environment.ENABLE_SOURCE_WWR ? (['wwr'] as const) : []),
        ],
        lockTtlMilliseconds: environment.INGESTION_LOCK_TTL_SECONDS * 1_000,
        now,
      })
    })
    if (!claim.claimed) {
      return { cycleId: claim.cycleId, status: 'not_claimed' as const }
    }

    const remoteOk = await step.do(
      'ingest Remote OK',
      {
        retries: { backoff: 'exponential', delay: '10 seconds', limit: 2 },
        timeout: '2 minutes',
      },
      async () => {
        const now = Date.now()
        if (!environment.ENABLE_SOURCE_REMOTE_OK) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: 0,
            now,
            provider: 'remote_ok',
            records: [],
            rejectedCount: 0,
            status: 'suspended',
          })
        }
        try {
          const parsed = await remoteOkAdapter.fetchAndParse(fetch)
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: parsed.fetchedCount,
            now,
            provider: 'remote_ok',
            records: parsed.records,
            rejectedCount: parsed.rejectedCount,
            responseHash: parsed.responseHash,
            status: 'successful',
          })
        } catch (error) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            errorCode: 'remote_ok_fetch_failed',
            errorMessage: boundedError(error),
            fetchedCount: 0,
            now,
            provider: 'remote_ok',
            records: [],
            rejectedCount: 0,
            status: 'failed',
          })
        }
      },
    )

    const wwr = await step.do(
      'ingest We Work Remotely',
      {
        retries: { backoff: 'exponential', delay: '10 seconds', limit: 2 },
        timeout: '3 minutes',
      },
      async () => {
        const now = Date.now()
        if (!environment.ENABLE_SOURCE_WWR) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: 0,
            now,
            provider: 'wwr',
            records: [],
            rejectedCount: 0,
            status: 'suspended',
          })
        }
        try {
          const result = await fetchWwrFeeds(fetch)
          const status =
            result.successfulFeedCount === WWR_FEEDS.length
              ? 'successful'
              : result.successfulFeedCount > 0
                ? 'partial'
                : 'failed'
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            ...(result.errors.length > 0
              ? {
                  errorCode: 'wwr_feed_failed',
                  errorMessage: boundedError(result.errors.join('; ')),
                }
              : {}),
            fetchedCount: result.parsed?.fetchedCount ?? 0,
            now,
            provider: 'wwr',
            records: result.parsed?.records ?? [],
            rejectedCount: result.parsed?.rejectedCount ?? 0,
            ...(result.parsed
              ? { responseHash: result.parsed.responseHash }
              : {}),
            status,
          })
        } catch (error) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            errorCode: 'wwr_fetch_failed',
            errorMessage: boundedError(error),
            fetchedCount: 0,
            now,
            provider: 'wwr',
            records: [],
            rejectedCount: 0,
            status: 'failed',
          })
        }
      },
    )

    return step.do('finalize ingestion cycle', async () =>
      finalizeCycle(this.env.DB, {
        cacheEpochBefore: claim.cacheEpochBefore,
        cycleId: claim.cycleId,
        now: Date.now(),
        semantic: {
          apiKey: (this.env as Cloudflare.Env & { DEEPSEEK_API_KEY?: string })
            .DEEPSEEK_API_KEY,
          baseUrl: (
            this.env as Cloudflare.Env & { DEEPSEEK_API_BASE_URL?: string }
          ).DEEPSEEK_API_BASE_URL,
          model:
            (this.env as Cloudflare.Env & { DEEPSEEK_API_MODEL?: string })
              .DEEPSEEK_API_MODEL ?? environment.DEEPSEEK_MODEL,
          retryCount: environment.DEEPSEEK_SCHEMA_RETRY_COUNT,
        },
        semanticMaxPerRun: environment.SEMANTIC_DEDUPE_MAX_PER_RUN,
        providerRuns: [remoteOk, wwr] as ProviderRunSummary[],
      }),
    )
  }
}
