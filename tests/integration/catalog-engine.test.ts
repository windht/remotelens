import { describe, expect, it } from 'vitest'
import {
  MemoryCatalog,
  type ProviderObservation,
} from '../../src/ingestion/catalog-engine'
import { sha256 } from '../../src/ingestion/normalization'
import type {
  NormalizedSourceRecord,
  Provider,
} from '../../src/ingestion/types'

async function record(
  provider: Provider,
  sourceKey: string,
  overrides: Partial<NormalizedSourceRecord> = {},
): Promise<NormalizedSourceRecord> {
  const attributions: Record<Provider, NormalizedSourceRecord['attribution']> =
    {
      jsguru: 'JS Guru Jobs',
      remote_ok: 'Remote OK',
      wwr: 'We Work Remotely',
      remotejobs: 'RemoteJobs.org',
      remotive: 'Remotive',
      jobicy: 'Jobicy',
    }
  const bases: Record<Provider, string> = {
    jsguru: 'https://jsgurujobs.com/jobs',
    remote_ok: 'https://remoteok.com/remote-jobs',
    wwr: 'https://weworkremotely.com/remote-jobs',
    remotejobs: 'https://remotejobs.org/remote-jobs',
    remotive: 'https://remotive.com/remote-jobs/software-dev',
    jobicy: 'https://jobicy.com/jobs',
  }
  const base = {
    attribution: attributions[provider],
    company: 'Kumo Systems',
    descriptionHtml: '<p>Safe description.</p>',
    descriptionText: 'Safe description.',
    labels: [],
    listingUrl: `${bases[provider]}/${sourceKey}`,
    provider,
    rawTitle: 'Senior Backend Engineer',
    sourceKey,
    title: 'Senior Backend Engineer',
  }
  const merged = { ...base, ...overrides }
  return { ...merged, payloadHash: await sha256(JSON.stringify(merged)) }
}

function observation(
  provider: Provider,
  records: NormalizedSourceRecord[],
  overrides: Partial<ProviderObservation> = {},
): ProviderObservation {
  return {
    enabled: true,
    fetchedCount: records.length,
    provider,
    records,
    rejectedCount: 0,
    responseHash: `${provider}-hash`,
    status: 'successful',
    ...overrides,
  }
}

describe('fixture-driven catalog ingestion', () => {
  it('is idempotent and creates one stable unresolved cross-source candidate', async () => {
    const catalog = new MemoryCatalog()
    const remoteOk = await record('remote_ok', '101')
    const wwr = await record('wwr', 'wwr-101')

    const first = await catalog.runCycle({
      cycleKey: 'cycle-1',
      now: 1_000,
      observations: [
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })
    const second = await catalog.runCycle({
      cycleKey: 'cycle-2',
      now: 2_000,
      observations: [
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })

    expect(first.status).toBe('successful')
    expect(catalog.records).toHaveLength(2)
    expect(second.providerRuns.map((run) => run.unchangedCount)).toEqual([1, 1])
    expect(catalog.candidates).toHaveLength(1)

    await catalog.runCycle({
      cycleKey: 'cycle-3',
      now: 3_000,
      observations: [
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })
    expect(catalog.candidates).toHaveLength(1)
  })

  it('routes JS Guru Jobs through the shared lifecycle and cross-source candidate flow', async () => {
    const catalog = new MemoryCatalog()
    const jsguru = await record('jsguru', '551')
    const remoteOk = await record('remote_ok', '101')
    const wwr = await record('wwr', 'wwr-101')

    const first = await catalog.runCycle({
      cycleKey: 'three-provider-seed',
      now: 1_000,
      observations: [
        observation('jsguru', [jsguru]),
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })
    const repeated = await catalog.runCycle({
      cycleKey: 'three-provider-repeat',
      now: 2_000,
      observations: [
        observation('jsguru', [jsguru]),
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })

    expect(first.status).toBe('successful')
    expect(repeated.providerRuns.map((run) => run.unchangedCount)).toEqual([
      1, 1, 1,
    ])
    expect(catalog.candidates).toHaveLength(3)

    await catalog.runCycle({
      cycleKey: 'suspend-jsguru',
      now: 3_000,
      observations: [
        observation('jsguru', [], { enabled: false }),
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })
    expect(catalog.health.get('jsguru')?.status).toBe('suspended')
    expect(catalog.records.get('jsguru:551')?.status).toBe('active')
  })

  it('routes RemoteJobs.org, Remotive, and Jobicy through independent lifecycle state', async () => {
    const catalog = new MemoryCatalog()
    const remoteJobs = await record('remotejobs', 'rj-101')
    const remotive = await record('remotive', 'remotive-101')
    const jobicy = await record('jobicy', '150101')

    const first = await catalog.runCycle({
      cycleKey: 'official-providers-seed',
      now: 1_000,
      observations: [
        observation('remotejobs', [remoteJobs]),
        observation('remotive', [remotive]),
        observation('jobicy', [jobicy]),
      ],
    })
    expect(first.status).toBe('successful')
    expect(catalog.records).toHaveLength(3)

    const partial = await catalog.runCycle({
      cycleKey: 'official-providers-partial',
      now: 2_000,
      observations: [
        observation('remotejobs', [], {
          errorCode: 'page_failed',
          status: 'partial',
        }),
        observation('remotive', [remotive]),
        observation('jobicy', [], { enabled: false }),
      ],
    })
    expect(partial.status).toBe('partial')
    expect(catalog.records.get('remotejobs:rj-101')?.missingCount).toBe(0)
    expect(catalog.records.get('jobicy:150101')?.status).toBe('active')
    expect(catalog.health.get('jobicy')?.status).toBe('suspended')
  })

  it('rejects duplicate active claims and allows only expired lock reclaim', () => {
    const catalog = new MemoryCatalog()
    expect(catalog.claimLock('provider:wwr', 'cycle-a', 1_000, 1_000)).toBe(
      true,
    )
    expect(catalog.claimLock('provider:wwr', 'cycle-b', 1_500, 1_000)).toBe(
      false,
    )
    expect(catalog.claimLock('provider:wwr', 'cycle-b', 2_001, 1_000)).toBe(
      true,
    )
  })

  it('does not advance absence on partial or failed runs and rotates only useful cycles', async () => {
    const catalog = new MemoryCatalog()
    const wwr = await record('wwr', 'wwr-1')
    await catalog.runCycle({
      cycleKey: 'seed',
      now: 0,
      observations: [observation('wwr', [wwr])],
    })
    const firstEpoch = catalog.cacheEpoch

    const partial = await catalog.runCycle({
      cycleKey: 'partial',
      now: 1_000,
      observations: [
        observation('wwr', [], {
          errorCode: 'feed_failed',
          errorMessage: 'One feed failed',
          status: 'partial',
        }),
      ],
    })
    expect(partial.status).toBe('partial')
    expect(catalog.records.get('wwr:wwr-1')?.missingCount).toBe(0)
    expect(catalog.cacheEpoch).not.toBe(firstEpoch)
    const partialEpoch = catalog.cacheEpoch

    const failed = await catalog.runCycle({
      cycleKey: 'failed',
      now: 2_000,
      observations: [
        observation('wwr', [], {
          errorCode: 'provider_failed',
          errorMessage: 'All feeds failed',
          status: 'failed',
        }),
      ],
    })
    expect(failed.status).toBe('failed')
    expect(catalog.records.get('wwr:wwr-1')?.missingCount).toBe(0)
    expect(catalog.cacheEpoch).toBe(partialEpoch)
  })

  it('marks missing after two complete omissions, closes after 72 hours, and retains for 60 days', async () => {
    const catalog = new MemoryCatalog()
    const remoteOk = await record('remote_ok', 'old')
    await catalog.runCycle({
      cycleKey: 'seed',
      now: 0,
      observations: [observation('remote_ok', [remoteOk])],
    })
    await catalog.runCycle({
      cycleKey: 'miss-1',
      now: 60 * 60 * 1_000,
      observations: [observation('remote_ok', [])],
    })
    expect(catalog.records.get('remote_ok:old')?.status).toBe('active')

    await catalog.runCycle({
      cycleKey: 'miss-2',
      now: 2 * 60 * 60 * 1_000,
      observations: [observation('remote_ok', [])],
    })
    expect(catalog.records.get('remote_ok:old')?.status).toBe('missing')

    await catalog.runCycle({
      cycleKey: 'close',
      now: 73 * 60 * 60 * 1_000,
      observations: [observation('remote_ok', [])],
    })
    expect(catalog.records.get('remote_ok:old')?.status).toBe('closed')
    const closedAt = catalog.records.get('remote_ok:old')?.closedAt ?? 0

    await catalog.runCycle({
      cycleKey: 'retain',
      now: closedAt + 59 * 24 * 60 * 60 * 1_000,
      observations: [observation('remote_ok', [])],
    })
    expect(catalog.records.has('remote_ok:old')).toBe(true)
    await catalog.runCycle({
      cycleKey: 'delete',
      now: closedAt + 61 * 24 * 60 * 60 * 1_000,
      observations: [observation('remote_ok', [])],
    })
    expect(catalog.records.has('remote_ok:old')).toBe(false)
  })

  it('treats suspension as independent and non-destructive', async () => {
    const catalog = new MemoryCatalog()
    const remoteOk = await record('remote_ok', 'r1')
    const wwr = await record('wwr', 'w1', {
      company: 'Other Company',
      title: 'Frontend Developer',
    })
    await catalog.runCycle({
      cycleKey: 'seed',
      now: 0,
      observations: [
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })
    await catalog.runCycle({
      cycleKey: 'suspend',
      now: 1_000,
      observations: [
        observation('remote_ok', [remoteOk]),
        observation('wwr', [], { enabled: false }),
      ],
    })
    expect(catalog.records.has('wwr:w1')).toBe(true)
    expect(catalog.records.get('wwr:w1')?.status).toBe('active')
    expect(catalog.health.get('wwr')?.status).toBe('suspended')

    await catalog.runCycle({
      cycleKey: 'resume',
      now: 2_000,
      observations: [
        observation('remote_ok', [remoteOk]),
        observation('wwr', [wwr]),
      ],
    })
    expect(catalog.records.get('wwr:w1')?.lastSeenAt).toBe(2_000)
  })
})
