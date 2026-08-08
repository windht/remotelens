import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers'
import { fetchRemoteJobs, REMOTEJOBS_MAX_PAGES } from './adapters/remotejobs'
import { jobicyAdapter } from './adapters/jobicy'
import { fetchJsguruPages, JSGURU_PAGES } from './adapters/jsguru'
import { remoteOkAdapter } from './adapters/remote-ok'
import { remotiveAdapter } from './adapters/remotive'
import { WWR_FEEDS, fetchWwrFeeds } from './adapters/wwr'
import {
  claimCycle,
  cleanupCatalogRetention,
  finalizeCycle,
  persistProviderObservation,
  shouldRunCatalogRetention,
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
          ...(environment.ENABLE_SOURCE_JSGURU ? (['jsguru'] as const) : []),
          ...(environment.ENABLE_SOURCE_REMOTE_OK
            ? (['remote_ok'] as const)
            : []),
          ...(environment.ENABLE_SOURCE_WWR ? (['wwr'] as const) : []),
          ...(environment.ENABLE_SOURCE_REMOTEJOBS
            ? (['remotejobs'] as const)
            : []),
          ...(environment.ENABLE_SOURCE_REMOTIVE
            ? (['remotive'] as const)
            : []),
          ...(environment.ENABLE_SOURCE_JOBICY ? (['jobicy'] as const) : []),
        ],
        lockTtlMilliseconds: environment.INGESTION_LOCK_TTL_SECONDS * 1_000,
        now,
      })
    })
    if (!claim.claimed) {
      return { cycleId: claim.cycleId, status: 'not_claimed' as const }
    }

    const jsguru = await step.do(
      'ingest JS Guru Jobs',
      {
        retries: { backoff: 'exponential', delay: '10 seconds', limit: 2 },
        timeout: '3 minutes',
      },
      async () => {
        const now = Date.now()
        if (!environment.ENABLE_SOURCE_JSGURU) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: 0,
            now,
            provider: 'jsguru',
            records: [],
            rejectedCount: 0,
            status: 'suspended',
          })
        }
        try {
          const result = await fetchJsguruPages(fetch)
          const status =
            result.successfulPageCount === JSGURU_PAGES.length
              ? 'successful'
              : result.successfulPageCount > 0
                ? 'partial'
                : 'failed'
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            ...(result.errors.length > 0
              ? {
                  errorCode: 'jsguru_page_failed',
                  errorMessage: boundedError(result.errors.join('; ')),
                }
              : {}),
            fetchedCount: result.parsed?.fetchedCount ?? 0,
            now,
            provider: 'jsguru',
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
            errorCode: 'jsguru_fetch_failed',
            errorMessage: boundedError(error),
            fetchedCount: 0,
            now,
            provider: 'jsguru',
            records: [],
            rejectedCount: 0,
            status: 'failed',
          })
        }
      },
    )

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

    const remoteJobs = await step.do(
      'ingest RemoteJobs.org',
      {
        retries: { backoff: 'exponential', delay: '10 seconds', limit: 2 },
        timeout: '5 minutes',
      },
      async () => {
        const now = Date.now()
        if (!environment.ENABLE_SOURCE_REMOTEJOBS) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: 0,
            now,
            provider: 'remotejobs',
            records: [],
            rejectedCount: 0,
            status: 'suspended',
          })
        }
        try {
          const result = await fetchRemoteJobs(fetch)
          const status =
            result.parsed && !result.hasMore && result.errors.length === 0
              ? 'successful'
              : result.parsed
                ? 'partial'
                : 'failed'
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            ...(result.errors.length > 0
              ? {
                  errorCode: 'remotejobs_page_failed',
                  errorMessage: boundedError(result.errors.join('; ')),
                }
              : status === 'partial'
                ? {
                    errorCode: 'remotejobs_page_bound_reached',
                    errorMessage: boundedError(
                      `RemoteJobs.org pagination reached the ${REMOTEJOBS_MAX_PAGES}-page safety bound`,
                    ),
                  }
                : {}),
            fetchedCount: result.parsed?.fetchedCount ?? 0,
            now,
            provider: 'remotejobs',
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
            errorCode: 'remotejobs_fetch_failed',
            errorMessage: boundedError(error),
            fetchedCount: 0,
            now,
            provider: 'remotejobs',
            records: [],
            rejectedCount: 0,
            status: 'failed',
          })
        }
      },
    )

    const remotive = await step.do(
      'ingest Remotive software development',
      {
        retries: { backoff: 'exponential', delay: '10 seconds', limit: 2 },
        timeout: '2 minutes',
      },
      async () => {
        const now = Date.now()
        if (!environment.ENABLE_SOURCE_REMOTIVE) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: 0,
            now,
            provider: 'remotive',
            records: [],
            rejectedCount: 0,
            status: 'suspended',
          })
        }
        try {
          const parsed = await remotiveAdapter.fetchAndParse(fetch)
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: parsed.fetchedCount,
            now,
            provider: 'remotive',
            records: parsed.records,
            rejectedCount: parsed.rejectedCount,
            responseHash: parsed.responseHash,
            status: 'successful',
          })
        } catch (error) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            errorCode: 'remotive_fetch_failed',
            errorMessage: boundedError(error),
            fetchedCount: 0,
            now,
            provider: 'remotive',
            records: [],
            rejectedCount: 0,
            status: 'failed',
          })
        }
      },
    )

    const jobicy = await step.do(
      'ingest Jobicy engineering',
      {
        retries: { backoff: 'exponential', delay: '10 seconds', limit: 2 },
        timeout: '2 minutes',
      },
      async () => {
        const now = Date.now()
        if (!environment.ENABLE_SOURCE_JOBICY) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: 0,
            now,
            provider: 'jobicy',
            records: [],
            rejectedCount: 0,
            status: 'suspended',
          })
        }
        try {
          const parsed = await jobicyAdapter.fetchAndParse(fetch)
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            fetchedCount: parsed.fetchedCount,
            now,
            provider: 'jobicy',
            records: parsed.records,
            rejectedCount: parsed.rejectedCount,
            responseHash: parsed.responseHash,
            status: 'successful',
          })
        } catch (error) {
          return persistProviderObservation(this.env.DB, {
            cycleId: claim.cycleId,
            errorCode: 'jobicy_fetch_failed',
            errorMessage: boundedError(error),
            fetchedCount: 0,
            now,
            provider: 'jobicy',
            records: [],
            rejectedCount: 0,
            status: 'failed',
          })
        }
      },
    )

    const finalized = await step.do('finalize ingestion cycle', async () =>
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
        providerRuns: [
          jsguru,
          remoteOk,
          wwr,
          remoteJobs,
          remotive,
          jobicy,
        ] as ProviderRunSummary[],
      }),
    )

    const cleanup = await step.do('clean up retired catalog data', async () => {
      if (!shouldRunCatalogRetention(finalized.status)) {
        return {
          reason: 'retention waits for a fully successful fetch',
          status: 'skipped' as const,
        }
      }
      return cleanupCatalogRetention(this.env.DB, {
        now: Date.now(),
        retentionDays: environment.SOURCE_CLOSED_RETENTION_DAYS,
      })
    })

    return { ...finalized, cleanup }
  }
}
