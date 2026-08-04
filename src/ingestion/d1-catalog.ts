import {
  boundedError,
  normalizeCompany,
  normalizeTitle,
  sha256,
} from './normalization'
import { rebuildCanonicalJobs } from './canonical-jobs'
import { resolveDedupeCandidates } from './dedupe'
import type { SemanticDedupeConfig } from './semantic-dedupe'
import type {
  NormalizedSourceRecord,
  Provider,
  ProviderRunSummary,
} from './types'

const HOURS = 60 * 60 * 1_000
const DAYS = 24 * HOURS

export type ClaimedCycle = {
  cacheEpochBefore: string
  claimed: boolean
  cycleId: string
}

export async function claimCycle(
  db: D1Database,
  input: {
    cycleKey: string
    enabledProviders: Provider[]
    lockTtlMilliseconds: number
    now: number
  },
): Promise<ClaimedCycle> {
  const current = await db
    .prepare("SELECT cache_epoch FROM catalog_state WHERE key = 'live'")
    .first<{ cache_epoch: string }>()
  if (!current) throw new Error('catalog_state live row is missing')

  const cycleId = `cycle:${(await sha256(input.cycleKey)).slice(0, 24)}`
  const cycleInsert = await db
    .prepare(
      `INSERT INTO ingestion_cycles
       (id, cycle_key, status, started_at, cache_epoch_before)
       VALUES (?, ?, 'running', ?, ?)
       ON CONFLICT(cycle_key) DO NOTHING`,
    )
    .bind(cycleId, input.cycleKey, input.now, current.cache_epoch)
    .run()
  if (cycleInsert.meta.changes !== 1) {
    return {
      cacheEpochBefore: current.cache_epoch,
      claimed: false,
      cycleId,
    }
  }

  const lockResults = await db.batch(
    input.enabledProviders.map((provider) =>
      db
        .prepare(
          `INSERT INTO ingestion_locks
           (lock_key, owner_cycle_id, claimed_at, expires_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(lock_key) DO UPDATE SET
             owner_cycle_id = excluded.owner_cycle_id,
             claimed_at = excluded.claimed_at,
             expires_at = excluded.expires_at
           WHERE ingestion_locks.expires_at <= excluded.claimed_at`,
        )
        .bind(
          `provider:${provider}`,
          cycleId,
          input.now,
          input.now + input.lockTtlMilliseconds,
        ),
    ),
  )
  if (lockResults.some((result) => result.meta.changes !== 1)) {
    await db.batch([
      db
        .prepare(
          `UPDATE ingestion_cycles
           SET status = 'failed', finished_at = ?
           WHERE id = ?`,
        )
        .bind(input.now, cycleId),
      db
        .prepare('DELETE FROM ingestion_locks WHERE owner_cycle_id = ?')
        .bind(cycleId),
    ])
    return {
      cacheEpochBefore: current.cache_epoch,
      claimed: false,
      cycleId,
    }
  }

  return {
    cacheEpochBefore: current.cache_epoch,
    claimed: true,
    cycleId,
  }
}

async function sourceRecordId(record: NormalizedSourceRecord) {
  return `src_${record.provider}_${(await sha256(record.sourceKey)).slice(0, 24)}`
}

export async function persistProviderObservation(
  db: D1Database,
  input: {
    cycleId: string
    errorCode?: string
    errorMessage?: string
    fetchedCount: number
    now: number
    provider: Provider
    records: NormalizedSourceRecord[]
    rejectedCount: number
    responseHash?: string
    status: 'successful' | 'partial' | 'failed' | 'suspended'
  },
): Promise<ProviderRunSummary> {
  const existingRows = await db
    .prepare(
      'SELECT source_key, payload_hash FROM source_records WHERE provider = ?',
    )
    .bind(input.provider)
    .all<{ source_key: string; payload_hash: string }>()
  const existing = new Map(
    existingRows.results.map((row) => [row.source_key, row.payload_hash]),
  )
  let insertedCount = 0
  let updatedCount = 0
  let unchangedCount = 0
  const seenKeys: string[] = []
  const statements: D1PreparedStatement[] = []

  if (input.status === 'successful' || input.status === 'partial') {
    for (const record of input.records) {
      seenKeys.push(record.sourceKey)
      const previousHash = existing.get(record.sourceKey)
      if (previousHash === undefined) insertedCount += 1
      else if (previousHash === record.payloadHash) unchangedCount += 1
      else updatedCount += 1

      const id = await sourceRecordId(record)
      statements.push(
        db
          .prepare(
            `INSERT INTO source_records (
              id, provider, source_key, attribution, listing_url, raw_title,
              title, company, description_html, description_text,
              source_published_at, payload_hash, status, first_seen_at,
              last_seen_at, last_checked_at, missing_count, missing_since,
              closed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, 0, NULL, NULL)
            ON CONFLICT(provider, source_key) DO UPDATE SET
              attribution = excluded.attribution,
              listing_url = excluded.listing_url,
              raw_title = excluded.raw_title,
              title = excluded.title,
              company = excluded.company,
              description_html = excluded.description_html,
              description_text = excluded.description_text,
              source_published_at = excluded.source_published_at,
              payload_hash = excluded.payload_hash,
              status = 'active',
              last_seen_at = excluded.last_seen_at,
              last_checked_at = excluded.last_checked_at,
              missing_count = 0,
              missing_since = NULL,
              closed_at = NULL`,
          )
          .bind(
            id,
            record.provider,
            record.sourceKey,
            record.attribution,
            record.listingUrl,
            record.rawTitle,
            record.title,
            record.company,
            record.descriptionHtml,
            record.descriptionText,
            record.publishedAt ?? null,
            record.payloadHash,
            input.now,
            input.now,
            input.now,
          ),
      )
      if (previousHash !== record.payloadHash) {
        statements.push(
          db
            .prepare('DELETE FROM source_labels WHERE source_record_id = ?')
            .bind(id),
        )
        for (const label of record.labels) {
          statements.push(
            db
              .prepare(
                `INSERT INTO source_labels
                 (source_record_id, normalized, source_value, kind)
                 VALUES (?, ?, ?, ?)`,
              )
              .bind(id, label.normalized, label.sourceValue, label.kind),
          )
        }
      }
    }
  }

  for (let index = 0; index < statements.length; index += 500) {
    await db.batch(statements.slice(index, index + 500))
  }

  if (input.status === 'successful') {
    const notSeenClause =
      seenKeys.length > 0
        ? 'AND source_key NOT IN (SELECT value FROM json_each(?))'
        : ''
    await db
      .prepare(
        `UPDATE source_records
         SET
           last_checked_at = ?,
           missing_count = missing_count + 1,
           missing_since = CASE
             WHEN missing_count + 1 >= 2 THEN COALESCE(missing_since, ?)
             ELSE missing_since
           END,
           status = CASE
             WHEN missing_count + 1 >= 2 AND ? - last_seen_at >= ? THEN 'closed'
             WHEN missing_count + 1 >= 2 THEN 'missing'
             ELSE status
           END,
           closed_at = CASE
             WHEN missing_count + 1 >= 2 AND ? - last_seen_at >= ? THEN COALESCE(closed_at, ?)
             ELSE closed_at
           END
         WHERE provider = ? AND status != 'closed' ${notSeenClause}`,
      )
      .bind(
        input.now,
        input.now,
        input.now,
        72 * HOURS,
        input.now,
        72 * HOURS,
        input.now,
        input.provider,
        ...(seenKeys.length > 0 ? [JSON.stringify(seenKeys)] : []),
      )
      .run()
  }

  const errorMessage = input.errorMessage
    ? boundedError(input.errorMessage)
    : undefined
  const summary: ProviderRunSummary = {
    admittedCount: input.records.length,
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(errorMessage ? { errorMessage } : {}),
    fetchedCount: input.fetchedCount,
    insertedCount,
    provider: input.provider,
    rejectedCount: input.rejectedCount,
    ...(input.responseHash ? { responseHash: input.responseHash } : {}),
    status: input.status,
    unchangedCount,
    updatedCount,
  }
  const activeCount =
    (await db
      .prepare(
        "SELECT count(*) AS count FROM source_records WHERE provider = ? AND status = 'active'",
      )
      .bind(input.provider)
      .first<number>('count')) ?? 0
  const healthStatus =
    input.status === 'successful'
      ? 'healthy'
      : input.status === 'suspended'
        ? 'suspended'
        : input.status

  await db.batch([
    db
      .prepare(
        `INSERT INTO ingestion_source_runs (
          id, cycle_id, provider, status, started_at, finished_at,
          fetched_count, admitted_count, inserted_count, updated_count,
          unchanged_count, rejected_count, response_hash, error_code,
          error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        `run:${input.cycleId}:${input.provider}`,
        input.cycleId,
        input.provider,
        input.status,
        input.now,
        input.now,
        input.fetchedCount,
        input.records.length,
        insertedCount,
        updatedCount,
        unchangedCount,
        input.rejectedCount,
        input.responseHash ?? null,
        input.errorCode ?? null,
        errorMessage ?? null,
      ),
    db
      .prepare(
        `UPDATE source_health SET
          enabled = ?,
          status = ?,
          last_attempt_at = ?,
          last_successful_at = CASE
            WHEN ? IN ('successful','partial') THEN ? ELSE last_successful_at END,
          last_complete_at = CASE
            WHEN ? = 'successful' THEN ? ELSE last_complete_at END,
          last_error_code = ?,
          last_error_message = ?,
          consecutive_failures = CASE
            WHEN ? = 'failed' THEN consecutive_failures + 1 ELSE 0 END,
          active_count = ?,
          updated_at = ?
         WHERE provider = ?`,
      )
      .bind(
        input.status === 'suspended' ? 0 : 1,
        healthStatus,
        input.now,
        input.status,
        input.now,
        input.status,
        input.now,
        input.errorCode ?? null,
        errorMessage ?? null,
        input.status,
        activeCount,
        input.now,
        input.provider,
      ),
  ])

  return summary
}

export type CatalogCleanupSummary = {
  cacheEpoch?: string
  cutoff: number
  deletedIngestionCycles: number
  deletedLocks: number
  deletedSourceRecords: number
}

export function shouldRunCatalogRetention(status: string) {
  return status === 'successful'
}

export async function cleanupCatalogRetention(
  db: D1Database,
  input: { now: number; retentionDays: number },
): Promise<CatalogCleanupSummary> {
  const cutoff = input.now - input.retentionDays * DAYS
  const retiredSource = await db
    .prepare(
      `SELECT 1 AS present
       FROM source_records
       WHERE status = 'closed' AND closed_at IS NOT NULL AND closed_at <= ?`,
    )
    .bind(cutoff)
    .first<{ present: number }>()

  let cacheEpoch: string | undefined
  let deletedSourceRecords = 0
  if (retiredSource) {
    // Canonical provenance uses restrict semantics. Drop the derived jobs first,
    // remove decisions for retired source pairs, then delete the source rows.
    // The rebuild below restores the remaining canonical catalog deterministically.
    await db.prepare('DELETE FROM jobs').run()
    await db
      .prepare(
        `DELETE FROM dedupe_decisions
         WHERE candidate_id IN (
           SELECT candidate.id
           FROM dedupe_candidates AS candidate
           JOIN source_records AS retired
             ON retired.id = candidate.left_source_record_id
             OR retired.id = candidate.right_source_record_id
           WHERE retired.status = 'closed'
             AND retired.closed_at IS NOT NULL
             AND retired.closed_at <= ?
         )`,
      )
      .bind(cutoff)
      .run()
    const deleted = await db
      .prepare(
        `DELETE FROM source_records
         WHERE status = 'closed' AND closed_at IS NOT NULL AND closed_at <= ?`,
      )
      .bind(cutoff)
      .run()
    deletedSourceRecords = deleted.meta.changes

    await rebuildCanonicalJobs(db, input.now)
    const current = await db
      .prepare("SELECT cache_epoch FROM catalog_state WHERE key = 'live'")
      .first<{ cache_epoch: string }>()
    if (!current) throw new Error('catalog_state live row is missing')
    cacheEpoch = `epoch:${(
      await sha256(
        `${current.cache_epoch}:retention:${input.now}:${deletedSourceRecords}`,
      )
    ).slice(0, 24)}`
    await db
      .prepare(
        `UPDATE catalog_state
         SET cache_epoch = ?, updated_at = ?
         WHERE key = 'live'`,
      )
      .bind(cacheEpoch, input.now)
      .run()
  }

  const deletedIngestionCycles = (
    await db
      .prepare(
        `DELETE FROM ingestion_cycles
         WHERE status != 'running'
           AND finished_at IS NOT NULL
           AND finished_at <= ?`,
      )
      .bind(cutoff)
      .run()
  ).meta.changes
  const deletedLocks = (
    await db
      .prepare('DELETE FROM ingestion_locks WHERE expires_at <= ?')
      .bind(input.now)
      .run()
  ).meta.changes

  return {
    ...(cacheEpoch ? { cacheEpoch } : {}),
    cutoff,
    deletedIngestionCycles,
    deletedLocks,
    deletedSourceRecords,
  }
}

export async function createDedupeCandidates(db: D1Database, now: number) {
  const pairs = await db
    .prepare(
      `SELECT
         left_record.id AS left_id,
         right_record.id AS right_id,
         left_record.company AS left_company,
         right_record.company AS right_company,
         left_record.title AS left_title,
         right_record.title AS right_title,
         left_record.listing_url AS left_listing_url,
         right_record.listing_url AS right_listing_url
       FROM source_records AS left_record
       JOIN source_records AS right_record
         ON left_record.provider < right_record.provider
       WHERE left_record.status != 'closed' AND right_record.status != 'closed'`,
    )
    .all<{
      left_id: string
      left_company: string
      left_listing_url: string
      left_title: string
      right_id: string
      right_company: string
      right_listing_url: string
      right_title: string
    }>()
  const statements: D1PreparedStatement[] = []
  for (const pair of pairs.results) {
    const sameCompany =
      normalizeCompany(pair.left_company).toLocaleLowerCase() ===
      normalizeCompany(pair.right_company).toLocaleLowerCase()
    const sameTitle =
      normalizeTitle(pair.left_title).toLocaleLowerCase() ===
      normalizeTitle(pair.right_title).toLocaleLowerCase()
    const sameListing =
      pair.left_listing_url.trim().toLocaleLowerCase() ===
      pair.right_listing_url.trim().toLocaleLowerCase()
    if ((!sameCompany || !sameTitle) && !sameListing) continue
    const [leftId, rightId] = [pair.left_id, pair.right_id].toSorted()
    const evidenceHash = await sha256(
      JSON.stringify({
        company: normalizeCompany(pair.left_company).toLocaleLowerCase(),
        leftId,
        rightId,
        title: normalizeTitle(pair.left_title).toLocaleLowerCase(),
      }),
    )
    statements.push(
      db
        .prepare(
          `INSERT INTO dedupe_candidates (
            id, left_source_record_id, right_source_record_id, evidence_hash,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'unresolved', ?, ?)
          ON CONFLICT(left_source_record_id, right_source_record_id)
          DO UPDATE SET evidence_hash = excluded.evidence_hash,
                        updated_at = excluded.updated_at`,
        )
        .bind(
          `candidate:${evidenceHash.slice(0, 24)}`,
          leftId,
          rightId,
          evidenceHash,
          now,
          now,
        ),
    )
  }
  if (statements.length > 0) await db.batch(statements)
  return statements.length
}

export async function finalizeCycle(
  db: D1Database,
  input: {
    cacheEpochBefore: string
    cycleId: string
    now: number
    semantic?: SemanticDedupeConfig
    semanticMaxPerRun?: number
    providerRuns: ProviderRunSummary[]
  },
) {
  const actionable = input.providerRuns.filter(
    (run) => run.status !== 'suspended',
  )
  const useful = actionable.some((run) =>
    ['successful', 'partial'].includes(run.status),
  )
  const incomplete = actionable.some((run) =>
    ['partial', 'failed'].includes(run.status),
  )
  const status = !useful ? 'failed' : incomplete ? 'partial' : 'successful'
  const cacheEpoch =
    status === 'failed'
      ? input.cacheEpochBefore
      : `epoch:${(
          await sha256(
            `${input.cycleId}:${input.now}:${input.providerRuns
              .map(
                (run) =>
                  `${run.provider}:${run.status}:${run.responseHash ?? ''}`,
              )
              .join('|')}`,
          )
        ).slice(0, 24)}`

  if (status !== 'failed') {
    await createDedupeCandidates(db, input.now)
    await resolveDedupeCandidates(db, {
      maxPerRun: input.semanticMaxPerRun ?? 50,
      now: input.now,
      ...(input.semantic ? { semantic: input.semantic } : {}),
    })
    await rebuildCanonicalJobs(db, input.now)
  }
  await db.batch([
    db
      .prepare(
        `UPDATE ingestion_cycles
         SET status = ?, finished_at = ?, cache_epoch_after = ?
         WHERE id = ?`,
      )
      .bind(status, input.now, cacheEpoch, input.cycleId),
    db
      .prepare(
        `UPDATE catalog_state
         SET cache_epoch = ?, updated_at = ?
         WHERE key = 'live'`,
      )
      .bind(cacheEpoch, input.now),
    db
      .prepare('DELETE FROM ingestion_locks WHERE owner_cycle_id = ?')
      .bind(input.cycleId),
  ])
  return { cacheEpoch, status }
}
