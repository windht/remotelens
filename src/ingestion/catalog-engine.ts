import {
  boundedError,
  normalizeCompany,
  normalizeTitle,
  sha256,
} from './normalization'
import type {
  NormalizedSourceRecord,
  Provider,
  ProviderRunStatus,
  ProviderRunSummary,
} from './types'

const HOURS = 60 * 60 * 1_000
const DAYS = 24 * HOURS
const CLOSED_RETENTION_DAYS = 60

export type StoredSourceRecord = NormalizedSourceRecord & {
  closedAt?: number
  firstSeenAt: number
  id: string
  lastCheckedAt: number
  lastSeenAt: number
  missingCount: number
  missingSince?: number
  status: 'active' | 'missing' | 'closed'
}

export type ProviderObservation = {
  enabled: boolean
  errorCode?: string
  errorMessage?: string
  fetchedCount: number
  provider: Provider
  records: NormalizedSourceRecord[]
  rejectedCount: number
  responseHash?: string
  status: Exclude<ProviderRunStatus, 'suspended'>
}

export type CycleResult = {
  cacheEpoch: string
  claimed: boolean
  cycleId: string
  providerRuns: ProviderRunSummary[]
  status: 'successful' | 'partial' | 'failed'
}

type HealthRecord = {
  enabled: boolean
  lastAttemptAt?: number
  lastCompleteAt?: number
  lastErrorMessage?: string
  lastSuccessfulAt?: number
  provider: Provider
  status: 'healthy' | 'partial' | 'failed' | 'suspended'
}

export class MemoryCatalog {
  readonly candidates = new Map<
    string,
    {
      evidenceHash: string
      id: string
      leftSourceRecordId: string
      rightSourceRecordId: string
      status: 'unresolved'
    }
  >()
  readonly cycles = new Map<string, CycleResult>()
  readonly health = new Map<Provider, HealthRecord>()
  readonly locks = new Map<
    string,
    { expiresAt: number; ownerCycleId: string }
  >()
  readonly records = new Map<string, StoredSourceRecord>()
  cacheEpoch = 'initial'

  claimLock(
    lockKey: string,
    ownerCycleId: string,
    now: number,
    ttlMilliseconds: number,
  ) {
    const current = this.locks.get(lockKey)
    if (
      current &&
      current.expiresAt > now &&
      current.ownerCycleId !== ownerCycleId
    ) {
      return false
    }
    this.locks.set(lockKey, {
      expiresAt: now + ttlMilliseconds,
      ownerCycleId,
    })
    return true
  }

  async runCycle(input: {
    cycleKey: string
    lockTtlMilliseconds?: number
    now: number
    observations: ProviderObservation[]
  }): Promise<CycleResult> {
    const existing = this.cycles.get(input.cycleKey)
    if (existing) return { ...existing, claimed: false }

    const cycleId = `cycle:${input.cycleKey}`
    const lockTtl = input.lockTtlMilliseconds ?? 30 * 60 * 1_000
    for (const observation of input.observations) {
      if (
        observation.enabled &&
        !this.claimLock(
          `provider:${observation.provider}`,
          cycleId,
          input.now,
          lockTtl,
        )
      ) {
        const blocked: CycleResult = {
          cacheEpoch: this.cacheEpoch,
          claimed: false,
          cycleId,
          providerRuns: [],
          status: 'failed',
        }
        this.cycles.set(input.cycleKey, blocked)
        return blocked
      }
    }

    const providerRuns: ProviderRunSummary[] = []
    for (const observation of input.observations) {
      providerRuns.push(this.applyObservation(observation, input.now))
    }

    const actionable = providerRuns.filter((run) => run.status !== 'suspended')
    const hasUsefulRun = actionable.some((run) =>
      ['successful', 'partial'].includes(run.status),
    )
    const hasIncomplete = actionable.some((run) =>
      ['partial', 'failed'].includes(run.status),
    )
    const status = !hasUsefulRun
      ? 'failed'
      : hasIncomplete
        ? 'partial'
        : 'successful'

    if (status !== 'failed') {
      this.cacheEpoch = `epoch:${input.now}:${await sha256(
        providerRuns
          .map(
            (run) => `${run.provider}:${run.status}:${run.responseHash ?? ''}`,
          )
          .join('|'),
      ).then((hash) => hash.slice(0, 16))}`
      await this.createDeterministicCandidates()
    }

    for (const observation of input.observations) {
      this.locks.delete(`provider:${observation.provider}`)
    }

    const result: CycleResult = {
      cacheEpoch: this.cacheEpoch,
      claimed: true,
      cycleId,
      providerRuns,
      status,
    }
    this.cycles.set(input.cycleKey, result)
    return result
  }

  private applyObservation(
    observation: ProviderObservation,
    now: number,
  ): ProviderRunSummary {
    if (!observation.enabled) {
      this.health.set(observation.provider, {
        enabled: false,
        provider: observation.provider,
        status: 'suspended',
      })
      return {
        admittedCount: 0,
        fetchedCount: 0,
        insertedCount: 0,
        provider: observation.provider,
        rejectedCount: 0,
        status: 'suspended',
        unchangedCount: 0,
        updatedCount: 0,
      }
    }

    if (observation.status === 'failed') {
      this.health.set(observation.provider, {
        enabled: true,
        lastAttemptAt: now,
        lastErrorMessage: boundedError(observation.errorMessage ?? 'failed'),
        provider: observation.provider,
        status: 'failed',
      })
      return {
        admittedCount: 0,
        ...(observation.errorCode ? { errorCode: observation.errorCode } : {}),
        ...(observation.errorMessage
          ? { errorMessage: boundedError(observation.errorMessage) }
          : {}),
        fetchedCount: observation.fetchedCount,
        insertedCount: 0,
        provider: observation.provider,
        rejectedCount: observation.rejectedCount,
        ...(observation.responseHash
          ? { responseHash: observation.responseHash }
          : {}),
        status: 'failed',
        unchangedCount: 0,
        updatedCount: 0,
      }
    }

    let insertedCount = 0
    let updatedCount = 0
    let unchangedCount = 0
    const seen = new Set<string>()

    for (const record of observation.records) {
      const id = `${record.provider}:${record.sourceKey}`
      seen.add(id)
      const current = this.records.get(id)
      if (!current) {
        this.records.set(id, {
          ...record,
          firstSeenAt: now,
          id,
          lastCheckedAt: now,
          lastSeenAt: now,
          missingCount: 0,
          status: 'active',
        })
        insertedCount += 1
      } else if (current.payloadHash === record.payloadHash) {
        current.lastCheckedAt = now
        current.lastSeenAt = now
        current.missingCount = 0
        current.status = 'active'
        delete current.missingSince
        delete current.closedAt
        unchangedCount += 1
      } else {
        const updated: StoredSourceRecord = {
          ...current,
          ...record,
          lastCheckedAt: now,
          lastSeenAt: now,
          missingCount: 0,
          status: 'active',
        }
        delete updated.closedAt
        delete updated.missingSince
        this.records.set(id, updated)
        updatedCount += 1
      }
    }

    if (observation.status === 'successful') {
      for (const [id, record] of this.records) {
        if (record.provider !== observation.provider || seen.has(id)) continue
        record.lastCheckedAt = now
        if (record.status !== 'closed') {
          record.missingCount += 1
          if (record.missingCount >= 2) {
            record.status = 'missing'
            record.missingSince ??= now
            if (now - record.lastSeenAt >= 72 * HOURS) {
              record.status = 'closed'
              record.closedAt = now
            }
          }
        } else if (
          record.closedAt !== undefined &&
          now - record.closedAt >= CLOSED_RETENTION_DAYS * DAYS
        ) {
          this.records.delete(id)
        }
      }
    }

    this.health.set(observation.provider, {
      enabled: true,
      lastAttemptAt: now,
      ...(observation.status === 'successful'
        ? { lastCompleteAt: now, lastSuccessfulAt: now }
        : { lastSuccessfulAt: now }),
      ...(observation.errorMessage
        ? { lastErrorMessage: boundedError(observation.errorMessage) }
        : {}),
      provider: observation.provider,
      status: observation.status === 'successful' ? 'healthy' : 'partial',
    })

    return {
      admittedCount: observation.records.length,
      ...(observation.errorCode ? { errorCode: observation.errorCode } : {}),
      ...(observation.errorMessage
        ? { errorMessage: boundedError(observation.errorMessage) }
        : {}),
      fetchedCount: observation.fetchedCount,
      insertedCount,
      provider: observation.provider,
      rejectedCount: observation.rejectedCount,
      ...(observation.responseHash
        ? { responseHash: observation.responseHash }
        : {}),
      status: observation.status,
      unchangedCount,
      updatedCount,
    }
  }

  private async createDeterministicCandidates() {
    const active = [...this.records.values()].filter(
      (record) => record.status !== 'closed',
    )
    for (let leftIndex = 0; leftIndex < active.length; leftIndex += 1) {
      const left = active[leftIndex]
      if (!left) continue
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < active.length;
        rightIndex += 1
      ) {
        const right = active[rightIndex]
        if (!right || left.provider === right.provider) continue
        if (
          normalizeCompany(left.company).toLocaleLowerCase() !==
            normalizeCompany(right.company).toLocaleLowerCase() ||
          normalizeTitle(left.title).toLocaleLowerCase() !==
            normalizeTitle(right.title).toLocaleLowerCase()
        ) {
          continue
        }
        const sortedIds = [left.id, right.id].toSorted()
        const leftId = sortedIds[0]
        const rightId = sortedIds[1]
        if (!leftId || !rightId) continue
        const key = `${leftId}|${rightId}`
        if (this.candidates.has(key)) continue
        const evidenceHash = await sha256(
          JSON.stringify({
            company: normalizeCompany(left.company).toLocaleLowerCase(),
            leftId,
            rightId,
            title: normalizeTitle(left.title).toLocaleLowerCase(),
          }),
        )
        this.candidates.set(key, {
          evidenceHash,
          id: `candidate:${evidenceHash.slice(0, 24)}`,
          leftSourceRecordId: leftId,
          rightSourceRecordId: rightId,
          status: 'unresolved',
        })
      }
    }
  }
}
