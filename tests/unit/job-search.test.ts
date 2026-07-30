import { describe, expect, it } from 'vitest'
import { JOB_FIXTURES } from '../../src/data/job-fixtures'
import { filterJobFixtures } from '../../src/lib/filter-job-fixtures'
import { parseJobSearch } from '../../src/lib/job-search'

describe('parseJobSearch', () => {
  it('normalizes repeatable source and lexical tag values', () => {
    expect(
      parseJobSearch({
        source: ['remote_ok', 'wwr'],
        tag: ' Distributed_Systems ',
        country: 'jp',
      }),
    ).toMatchObject({
      country: 'JP',
      source: ['remote_ok', 'wwr'],
      tag: 'distributed-systems',
      status: 'active',
      sort: 'recently_discovered',
    })
  })

  it.each([
    [{ country: 'JAPAN' }, 'country'],
    [{ source: 'unknown' }, 'source'],
    [{ employment_type: 'permanent' }, 'employment_type'],
    [{ remote_scope: 'planet' }, 'remote_scope'],
    [{ seniority: 'wizard' }, 'seniority'],
    [{ status: 'missing' }, 'status'],
    [{ sort: 'relevance' }, 'sort'],
  ])('returns invalid_filter for malformed fixed filters', (input, field) => {
    expect(parseJobSearch(input).error).toMatchObject({
      code: 'invalid_filter',
      field,
    })
  })

  it('does not treat a valid unknown exact company or tag as malformed', () => {
    expect(
      parseJobSearch({ company: 'Unknown Company', tag: 'unknown-stack' })
        .error,
    ).toBeUndefined()
  })
})

describe('filterJobFixtures', () => {
  it('applies exact normalized company and filterable tag semantics', () => {
    const jobs = filterJobFixtures(
      JOB_FIXTURES,
      parseJobSearch({
        company: 'KUMO SYSTEMS LLC',
        tag: 'rust',
      }),
    )

    expect(jobs.map((job) => job.company)).toEqual(['Kumo Systems'])
  })

  it('uses country as eligibility rather than an ingestion boundary', () => {
    const jobs = filterJobFixtures(
      JOB_FIXTURES,
      parseJobSearch({ country: 'JP' }),
    )

    expect(jobs.map((job) => job.company)).toEqual([
      'Kumo Systems',
      'Northstar Labs',
    ])
  })

  it('returns an empty successful result for valid unknown exact values', () => {
    expect(
      filterJobFixtures(
        JOB_FIXTURES,
        parseJobSearch({ company: 'Unknown Company' }),
      ),
    ).toEqual([])
  })
})
