import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const migrationPath = fileURLToPath(
  new URL(
    '../../drizzle/migrations/0000_complex_changeling.sql',
    import.meta.url,
  ),
)
const canonicalMigrationPath = fileURLToPath(
  new URL('../../drizzle/migrations/0001_canonical_jobs.sql', import.meta.url),
)
const jsguruMigrationPath = fileURLToPath(
  new URL('../../drizzle/migrations/0002_jsguru_provider.sql', import.meta.url),
)

let database: DatabaseSync | undefined

afterEach(() => {
  database?.close()
  database = undefined
})

function migratedDatabase() {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(
    readFileSync(migrationPath, 'utf8').replaceAll(
      '--> statement-breakpoint',
      '',
    ),
  )
  database = db
  return db
}

describe('initial D1 migration', () => {
  it('creates the complete Phase 1 schema and initial catalog state', () => {
    const db = migratedDatabase()
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => row.name)

    expect(tables).toEqual([
      'catalog_state',
      'dedupe_candidates',
      'dedupe_decisions',
      'ingestion_cycles',
      'ingestion_locks',
      'ingestion_source_runs',
      'job_provenance',
      'jobs',
      'source_health',
      'source_labels',
      'source_records',
    ])
    expect(
      db
        .prepare("SELECT cache_epoch FROM catalog_state WHERE key = 'live'")
        .get(),
    ).toEqual({ cache_epoch: 'initial' })
    expect(
      db
        .prepare('SELECT provider FROM source_health ORDER BY provider')
        .all()
        .map((row) => row.provider),
    ).toEqual(['remote_ok', 'wwr'])
  })

  it('enforces stable source identity, lock expiry, and decision outcomes', () => {
    const db = migratedDatabase()
    const now = 1_000
    db.prepare(
      `INSERT INTO source_records (
        id, provider, source_key, attribution, listing_url, raw_title, title,
        company, description_html, description_text, payload_hash,
        first_seen_at, last_seen_at, last_checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'source-a',
      'remote_ok',
      '123',
      'Remote OK',
      'https://remoteok.com/remote-jobs/123',
      'Developer',
      'Developer',
      'Example',
      '<p>Safe</p>',
      'Safe',
      'hash',
      now,
      now,
      now,
    )

    expect(() =>
      db
        .prepare(
          `INSERT INTO source_records (
            id, provider, source_key, attribution, listing_url, raw_title,
            title, company, description_html, description_text, payload_hash,
            first_seen_at, last_seen_at, last_checked_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          'source-b',
          'remote_ok',
          '123',
          'Remote OK',
          'https://remoteok.com/remote-jobs/123',
          'Developer',
          'Developer',
          'Example',
          '<p>Safe</p>',
          'Safe',
          'hash',
          now,
          now,
          now,
        ),
    ).toThrow(/UNIQUE constraint failed/)

    db.prepare(
      `INSERT INTO source_records (
        id, provider, source_key, attribution, listing_url, raw_title, title,
        company, description_html, description_text, payload_hash,
        first_seen_at, last_seen_at, last_checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'source-z',
      'wwr',
      'wwr-123',
      'We Work Remotely',
      'https://weworkremotely.com/remote-jobs/123',
      'Example: Developer',
      'Developer',
      'Example',
      '<p>Safe</p>',
      'Safe',
      'hash-2',
      now,
      now,
      now,
    )
    db.prepare(
      `INSERT INTO dedupe_candidates (
        id, left_source_record_id, right_source_record_id, evidence_hash,
        status, created_at, updated_at
      ) VALUES ('candidate-1', 'source-a', 'source-z', 'evidence', 'unresolved', ?, ?)`,
    ).run(now, now)
    for (const outcome of ['merge', 'separate', 'uncertain', 'failed']) {
      db.prepare(
        `INSERT INTO dedupe_decisions (
          candidate_id, outcome, model, input_hash, schema_version, decided_at
        ) VALUES ('candidate-1', ?, 'future-model', ?, 'v1', ?)`,
      ).run(outcome, `input-${outcome}`, now)
    }
    expect(
      db
        .prepare(
          "SELECT outcome FROM dedupe_decisions WHERE candidate_id = 'candidate-1' ORDER BY id",
        )
        .all()
        .map((row) => row.outcome),
    ).toEqual(['merge', 'separate', 'uncertain', 'failed'])
    expect(() =>
      db
        .prepare(
          `INSERT INTO dedupe_decisions (
            candidate_id, outcome, input_hash, schema_version, decided_at
          ) VALUES ('candidate-1', 'maybe', 'bad', 'v1', ?)`,
        )
        .run(now),
    ).toThrow(/CHECK constraint failed/)

    db.prepare(
      `INSERT INTO ingestion_cycles
       (id, cycle_key, status, started_at, cache_epoch_before)
       VALUES ('cycle-1', '2026-07-30T00', 'running', ?, 'initial')`,
    ).run(now)
    expect(() =>
      db
        .prepare(
          `INSERT INTO ingestion_locks
           (lock_key, owner_cycle_id, claimed_at, expires_at)
           VALUES ('provider:remote_ok', 'cycle-1', ?, ?)`,
        )
        .run(now, now),
    ).toThrow(/CHECK constraint failed/)
  })

  it('contains no raw payload or archive table', () => {
    const db = migratedDatabase()
    const schema = String(
      db
        .prepare(
          "SELECT group_concat(sql, ' ') AS sql FROM sqlite_master WHERE sql IS NOT NULL",
        )
        .get()?.sql ?? '',
    )

    expect(schema).not.toMatch(/\braw_payload\b/i)
    expect(schema).not.toMatch(/\br2\b/i)
    expect(schema).not.toMatch(/\bcv\b/i)
  })

  it('extends the schema for canonical jobs and field provenance', () => {
    const db = migratedDatabase()
    db.exec(
      readFileSync(canonicalMigrationPath, 'utf8').replaceAll(
        '--> statement-breakpoint',
        '',
      ),
    )
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => row.name)
    expect(tables).toContain('job_tags')
    expect(tables).toContain('job_field_provenance')
    expect(
      db
        .prepare("SELECT name FROM pragma_table_info('jobs')")
        .all()
        .map((row) => row.name),
    ).toEqual(expect.arrayContaining(['slug', 'remote_scope', 'published_at']))
    expect(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'jobs_slug_uidx'",
        )
        .get(),
    ).toEqual({ name: 'jobs_slug_uidx' })
  })

  it('adds JS Guru Jobs health state idempotently', () => {
    const db = migratedDatabase()
    const migration = readFileSync(jsguruMigrationPath, 'utf8').replaceAll(
      '--> statement-breakpoint',
      '',
    )
    db.exec(migration)
    db.exec(migration)

    expect(
      db
        .prepare('SELECT provider FROM source_health ORDER BY provider')
        .all()
        .map((row) => row.provider),
    ).toEqual(['jsguru', 'remote_ok', 'wwr'])
  })
})
