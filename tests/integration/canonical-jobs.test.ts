import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { listCanonicalJobs, websiteJobs } from '../../src/catalog/catalog-db'
import { createDedupeCandidates } from '../../src/ingestion/d1-catalog'
import { resolveDedupeCandidates } from '../../src/ingestion/dedupe'
import { rebuildCanonicalJobs } from '../../src/ingestion/canonical-jobs'

type Statement = {
  bind: (...values: unknown[]) => Statement
  all: <T>() => Promise<{ results: T[] }>
  first: <T>(column?: string) => Promise<T | null>
  run: () => Promise<{ meta: { changes: number } }>
}

class MockD1 {
  constructor(private readonly database: DatabaseSync) {}

  prepare(sql: string): Statement {
    let values: unknown[] = []
    return {
      all: <T>() =>
        Promise.resolve({
          results: this.database
            .prepare(sql)
            .all(...(values as never[])) as T[],
        }),
      bind: (...nextValues: unknown[]) => {
        values = nextValues
        return this.prepareBound(sql, values)
      },
      first: <T>(column?: string) =>
        Promise.resolve(
          (() => {
            const row = this.database
              .prepare(sql)
              .get(...(values as never[])) as
              Record<string, unknown> | undefined
            if (!row) return null
            return (column ? row[column] : row) as T
          })(),
        ),
      run: () =>
        Promise.resolve(
          (() => {
            const result = this.database
              .prepare(sql)
              .run(...(values as never[]))
            return { meta: { changes: Number(result.changes) } }
          })(),
        ),
    }
  }

  private prepareBound(sql: string, values: unknown[]): Statement {
    return {
      all: <T>() =>
        Promise.resolve({
          results: this.database
            .prepare(sql)
            .all(...(values as never[])) as T[],
        }),
      bind: (...nextValues: unknown[]) => this.prepareBound(sql, nextValues),
      first: <T>(column?: string) =>
        Promise.resolve(
          (() => {
            const row = this.database
              .prepare(sql)
              .get(...(values as never[])) as
              Record<string, unknown> | undefined
            if (!row) return null
            return (column ? row[column] : row) as T
          })(),
        ),
      run: () =>
        Promise.resolve(
          (() => {
            const result = this.database
              .prepare(sql)
              .run(...(values as never[]))
            return { meta: { changes: Number(result.changes) } }
          })(),
        ),
    }
  }

  async batch(statements: Statement[]) {
    return Promise.all(statements.map((statement) => statement.run()))
  }
}

let database: DatabaseSync | undefined

afterEach(() => {
  database?.close()
  database = undefined
})

function migratedDatabase() {
  database = new DatabaseSync(':memory:')
  database.exec('PRAGMA foreign_keys = ON')
  for (const name of [
    '0000_complex_changeling.sql',
    '0001_canonical_jobs.sql',
  ]) {
    const path = fileURLToPath(
      new URL(`../../drizzle/migrations/${name}`, import.meta.url),
    )
    database.exec(
      readFileSync(path, 'utf8').replaceAll('--> statement-breakpoint', ''),
    )
  }
  return database
}

function insertSource(
  db: DatabaseSync,
  input: {
    company: string
    description: string
    id: string
    provider: 'remote_ok' | 'wwr'
    sourceKey: string
    title: string
  },
) {
  db.prepare(
    `INSERT INTO source_records (
      id, provider, source_key, attribution, listing_url, raw_title, title,
      company, description_html, description_text, payload_hash,
      first_seen_at, last_seen_at, last_checked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1000, 1000, 1000)`,
  ).run(
    input.id,
    input.provider,
    input.sourceKey,
    input.provider === 'remote_ok' ? 'Remote OK' : 'We Work Remotely',
    `https://example.test/${input.sourceKey}`,
    input.title,
    input.title,
    input.company,
    `<p>${input.description}</p>`,
    input.description,
    input.id,
  )
}

describe('canonical job rebuild', () => {
  it('merges exact cross-source duplicates and keeps separate listings separate', async () => {
    const db = migratedDatabase()
    insertSource(db, {
      company: 'Kumo Systems LLC',
      description: 'Worldwide role. USD 100,000-120,000 per year.',
      id: 'source-a',
      provider: 'remote_ok',
      sourceKey: 'remote-1',
      title: 'Senior Backend Engineer',
    })
    insertSource(db, {
      company: 'Kumo Systems',
      description: 'Worldwide role. USD 100,000-120,000 per year.',
      id: 'source-b',
      provider: 'wwr',
      sourceKey: 'wwr-1',
      title: 'Senior Backend Engineer',
    })
    insertSource(db, {
      company: 'Kumo Systems',
      description: 'Build user interfaces in Europe.',
      id: 'source-c',
      provider: 'wwr',
      sourceKey: 'wwr-2',
      title: 'Staff Frontend Engineer',
    })
    db.prepare(
      `INSERT INTO source_labels (source_record_id, normalized, source_value, kind)
       VALUES ('source-a', 'backend', 'Backend', 'filterable'),
              ('source-b', 'backend', 'Backend', 'filterable'),
              ('source-c', 'frontend', 'Front-End', 'filterable')`,
    ).run()

    const d1 = new MockD1(db) as unknown as D1Database
    expect(await createDedupeCandidates(d1, 1000)).toBe(1)
    const resolution = await resolveDedupeCandidates(d1, {
      maxPerRun: 50,
      now: 1000,
    })
    expect(resolution.merged).toBe(1)
    const result = await rebuildCanonicalJobs(d1, 1000)

    expect(result.canonicalJobs).toBe(2)
    expect(db.prepare('SELECT count(*) AS count FROM jobs').get()).toEqual({
      count: 2,
    })
    expect(
      db
        .prepare(
          `SELECT count(*) AS count
           FROM job_provenance
           GROUP BY job_id
           ORDER BY count DESC
           LIMIT 1`,
        )
        .get(),
    ).toEqual({ count: 2 })
    expect(
      db.prepare('SELECT outcome, model FROM dedupe_decisions').get(),
    ).toEqual({ model: 'deterministic-v1', outcome: 'merge' })
    expect(
      db
        .prepare(
          `SELECT title, remote_scope, salary_currency, salary_min
           FROM jobs WHERE normalized_title = 'senior backend engineer'`,
        )
        .get(),
    ).toMatchObject({
      remote_scope: 'worldwide',
      salary_currency: 'USD',
      salary_min: 100000,
      title: 'Senior Backend Engineer',
    })

    const firstIdentity = db
      .prepare('SELECT id, slug FROM jobs ORDER BY id')
      .all()
    await rebuildCanonicalJobs(d1, 2_000)
    expect(db.prepare('SELECT id, slug FROM jobs ORDER BY id').all()).toEqual(
      firstIdentity,
    )
    expect(
      db.prepare('SELECT count(*) AS count FROM dedupe_decisions').get(),
    ).toEqual({ count: 1 })
  })

  it('serves canonical rows, uses only the local empty fallback, and bounds read failures', async () => {
    const db = migratedDatabase()
    const d1 = new MockD1(db) as unknown as D1Database
    const emptyResult = await websiteJobs(
      d1,
      {
        role_family: 'engineering',
        sort: 'recently_discovered',
        source: [],
        status: 'active',
      },
      false,
    )
    expect(emptyResult).toMatchObject({ fallback: true, unavailable: false })
    expect(emptyResult.jobs.length).toBeGreaterThan(0)

    insertSource(db, {
      company: 'Catalog Website',
      description: 'Worldwide role.',
      id: 'website-source',
      provider: 'wwr',
      sourceKey: 'website-source',
      title: 'Catalog Website Engineer',
    })
    await rebuildCanonicalJobs(d1, 1_000)

    const live = await websiteJobs(
      d1,
      {
        role_family: 'engineering',
        sort: 'recently_discovered',
        source: [],
        status: 'active',
      },
      false,
    )
    expect(live).toMatchObject({ fallback: false, unavailable: false })
    expect(live.jobs.map((job) => job.title)).toEqual([
      'Catalog Website Engineer',
    ])
    expect(live.meta?.providers).toHaveLength(2)

    const broken = {
      prepare() {
        throw new Error('private sql detail')
      },
    } as unknown as D1Database
    const unavailable = await websiteJobs(
      broken,
      {
        role_family: 'engineering',
        sort: 'recently_discovered',
        source: [],
        status: 'active',
      },
      true,
    )
    expect(unavailable).toEqual({
      fallback: false,
      jobs: [],
      meta: null,
      total: 0,
      unavailable: true,
    })
  })

  it('aggregates lifecycle state and hides suspended-provider-only jobs', async () => {
    const db = migratedDatabase()
    insertSource(db, {
      company: 'Lifecycle Remote',
      description: 'Worldwide role.',
      id: 'lifecycle-remote',
      provider: 'remote_ok',
      sourceKey: 'lifecycle-remote',
      title: 'Lifecycle Backend Engineer',
    })
    insertSource(db, {
      company: 'Lifecycle Remote',
      description: 'Worldwide role.',
      id: 'lifecycle-wwr',
      provider: 'wwr',
      sourceKey: 'lifecycle-wwr',
      title: 'Lifecycle Backend Engineer',
    })
    const initialD1 = new MockD1(db) as unknown as D1Database
    await createDedupeCandidates(initialD1, 1_000)
    await resolveDedupeCandidates(initialD1, { maxPerRun: 50, now: 1_000 })
    await rebuildCanonicalJobs(initialD1, 1_000)

    db.prepare(
      "UPDATE source_records SET status = 'closed', closed_at = 2_000 WHERE id = 'lifecycle-wwr'",
    ).run()
    await rebuildCanonicalJobs(new MockD1(db) as unknown as D1Database, 2_000)
    expect(
      db
        .prepare(
          `SELECT jobs.status
           FROM jobs
           JOIN job_provenance ON job_provenance.job_id = jobs.id
           WHERE job_provenance.source_record_id = 'lifecycle-wwr'`,
        )
        .get(),
    ).toEqual({ status: 'active' })

    db.prepare(
      "UPDATE source_records SET status = 'missing', missing_count = 2, missing_since = 3_000 WHERE id = 'lifecycle-remote'",
    ).run()
    await rebuildCanonicalJobs(new MockD1(db) as unknown as D1Database, 3_000)
    expect(
      db
        .prepare(
          `SELECT jobs.status
           FROM jobs
           JOIN job_provenance ON job_provenance.job_id = jobs.id
           WHERE job_provenance.source_record_id = 'lifecycle-remote'`,
        )
        .get(),
    ).toEqual({ status: 'stale' })

    db.prepare(
      "UPDATE source_records SET status = 'closed', closed_at = 4_000 WHERE id = 'lifecycle-remote'",
    ).run()
    await rebuildCanonicalJobs(new MockD1(db) as unknown as D1Database, 4_000)
    expect(
      db
        .prepare(
          `SELECT jobs.status
           FROM jobs
           JOIN job_provenance ON job_provenance.job_id = jobs.id
           WHERE job_provenance.source_record_id = 'lifecycle-remote'`,
        )
        .get(),
    ).toEqual({ status: 'closed' })
    expect(
      db
        .prepare(
          "SELECT count(*) AS count FROM source_records WHERE id LIKE 'lifecycle-%'",
        )
        .get(),
    ).toEqual({ count: 2 })

    insertSource(db, {
      company: 'Suspended WWR',
      description: 'Worldwide role.',
      id: 'lifecycle-suspended',
      provider: 'wwr',
      sourceKey: 'lifecycle-suspended',
      title: 'Suspended Provider Engineer',
    })
    const d1 = new MockD1(db) as unknown as D1Database
    await rebuildCanonicalJobs(d1, 5_000)
    const activeSearch = {
      role_family: 'engineering' as const,
      sort: 'recently_discovered' as const,
      source: [],
      status: 'active' as const,
    }
    expect(
      (await listCanonicalJobs(d1, activeSearch)).jobs.map((job) => job.title),
    ).toContain('Suspended Provider Engineer')

    db.prepare(
      "UPDATE source_health SET enabled = 0, status = 'suspended' WHERE provider = 'wwr'",
    ).run()
    expect(
      (await listCanonicalJobs(d1, activeSearch)).jobs.map((job) => job.title),
    ).not.toContain('Suspended Provider Engineer')
    expect(
      db
        .prepare(
          "SELECT status FROM source_records WHERE id = 'lifecycle-suspended'",
        )
        .get(),
    ).toEqual({ status: 'active' })
  })
})

describe('semantic dedupe contract', () => {
  function insertCandidate(
    db: DatabaseSync,
    input: { id: string; left: string; right: string; createdAt: number },
  ) {
    db.prepare(
      `INSERT INTO dedupe_candidates (
        id, left_source_record_id, right_source_record_id, evidence_hash,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'unresolved', ?, ?)`,
    ).run(
      input.id,
      input.left,
      input.right,
      `evidence-${input.id}`,
      input.createdAt,
      input.createdAt,
    )
  }

  it('validates bounded structured outcomes and records failures without source HTML', async () => {
    const db = migratedDatabase()
    for (const index of [0, 1, 2]) {
      insertSource(db, {
        company: `Company ${index}`,
        description: `Safe description ${index}`,
        id: `semantic-left-${index}`,
        provider: 'remote_ok',
        sourceKey: `semantic-left-${index}`,
        title: `Role ${index}`,
      })
      insertSource(db, {
        company: `Other Company ${index}`,
        description: `Safe description ${index}`,
        id: `semantic-right-${index}`,
        provider: 'wwr',
        sourceKey: `semantic-right-${index}`,
        title: `Different Role ${index}`,
      })
      insertCandidate(db, {
        createdAt: index,
        id: `semantic-candidate-${index}`,
        left: `semantic-left-${index}`,
        right: `semantic-right-${index}`,
      })
    }
    insertSource(db, {
      company: 'Failure Company',
      description: 'Safe failure description',
      id: 'semantic-left-failure',
      provider: 'remote_ok',
      sourceKey: 'semantic-left-failure',
      title: 'Failure Role',
    })
    insertSource(db, {
      company: 'Other Failure Company',
      description: 'Safe failure description',
      id: 'semantic-right-failure',
      provider: 'wwr',
      sourceKey: 'semantic-right-failure',
      title: 'Different Failure Role',
    })
    insertCandidate(db, {
      createdAt: 4,
      id: 'semantic-candidate-failure',
      left: 'semantic-left-failure',
      right: 'semantic-right-failure',
    })

    const requests: string[] = []
    let call = 0
    const d1 = new MockD1(db) as unknown as D1Database
    const result = await resolveDedupeCandidates(d1, {
      maxPerRun: 50,
      now: 100,
      semantic: {
        apiKey: 'test-key',
        baseUrl: 'https://api.deepseek.test/v1',
        fetcher: (_input, init) => {
          const requestBody =
            typeof init?.body === 'string'
              ? init.body
              : JSON.stringify(init?.body ?? null)
          requests.push(requestBody ?? '')
          call += 1
          if (call > 3) {
            return Promise.resolve(
              new Response('upstream failure', { status: 503 }),
            )
          }
          const outcomes = ['merge', 'separate', 'uncertain'] as const
          return Promise.resolve(
            Response.json({
              choices: [
                {
                  message: {
                    content: JSON.stringify({ outcome: outcomes[call - 1] }),
                  },
                },
              ],
            }),
          )
        },
        model: 'deepseek-chat',
        retryCount: 1,
      },
    })

    expect(result).toMatchObject({
      considered: 4,
      failed: 1,
      merged: 1,
      separate: 1,
      uncertain: 1,
    })
    expect(call).toBe(5)
    expect(requests.join('\n')).toContain('Safe description')
    expect(requests.join('\n')).not.toMatch(/<script|description_html|cv/i)
    expect(
      db
        .prepare(
          `SELECT outcome, model, schema_version, error_code
           FROM dedupe_decisions ORDER BY id`,
        )
        .all(),
    ).toEqual([
      {
        error_code: null,
        model: 'deepseek-chat',
        outcome: 'merge',
        schema_version: 'dedupe-v1',
      },
      {
        error_code: null,
        model: 'deepseek-chat',
        outcome: 'separate',
        schema_version: 'dedupe-v1',
      },
      {
        error_code: null,
        model: 'deepseek-chat',
        outcome: 'uncertain',
        schema_version: 'dedupe-v1',
      },
      {
        error_code: 'semantic dedupe returned HTTP 503',
        model: 'deepseek-chat',
        outcome: 'failed',
        schema_version: 'dedupe-v1',
      },
    ])
  })

  it('never considers more than 50 semantic candidates in one run', async () => {
    const db = migratedDatabase()
    for (let index = 0; index < 51; index += 1) {
      const left = `cap-left-${index.toString().padStart(2, '0')}`
      const right = `cap-right-${index.toString().padStart(2, '0')}`
      insertSource(db, {
        company: `Cap Left ${index}`,
        description: `Cap description ${index}`,
        id: left,
        provider: 'remote_ok',
        sourceKey: left,
        title: `Cap Role Left ${index}`,
      })
      insertSource(db, {
        company: `Cap Right ${index}`,
        description: `Cap description ${index}`,
        id: right,
        provider: 'wwr',
        sourceKey: right,
        title: `Cap Role Right ${index}`,
      })
      insertCandidate(db, {
        createdAt: index,
        id: `cap-candidate-${index.toString().padStart(2, '0')}`,
        left,
        right,
      })
    }

    let calls = 0
    const d1 = new MockD1(db) as unknown as D1Database
    const result = await resolveDedupeCandidates(d1, {
      maxPerRun: 500,
      now: 200,
      semantic: {
        apiKey: 'test-key',
        baseUrl: 'https://api.deepseek.test/v1',
        fetcher: () => {
          calls += 1
          return Promise.resolve(
            Response.json({
              choices: [{ message: { content: '{"outcome":"uncertain"}' } }],
            }),
          )
        },
        model: 'deepseek-chat',
        retryCount: 0,
      },
    })

    expect(result.considered).toBe(50)
    expect(calls).toBe(50)
    expect(
      db
        .prepare(
          "SELECT count(*) AS count FROM dedupe_decisions WHERE outcome = 'uncertain'",
        )
        .get(),
    ).toEqual({ count: 50 })
    expect(
      db
        .prepare(
          "SELECT count(*) AS count FROM dedupe_candidates WHERE status = 'unresolved'",
        )
        .get(),
    ).toEqual({ count: 1 })
  })
})
