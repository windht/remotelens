import { describe, expect, it } from 'vitest'
import { REMOTE_OK_FIXTURE } from '../fixtures/remote-ok'
import { wwrFeed } from '../fixtures/wwr'
import {
  isRemoteOkDeveloperJob,
  parseRemoteOkPayload,
} from '../../src/ingestion/adapters/remote-ok'
import {
  WWR_FEEDS,
  parseWwrFeeds,
  splitWwrTitle,
} from '../../src/ingestion/adapters/wwr'

describe('Remote OK adapter', () => {
  it('requires both a positive title marker and a qualifying provider tag', () => {
    expect(
      isRemoteOkDeveloperJob('Senior Software Engineer', ['JavaScript']),
    ).toBe(true)
    expect(isRemoteOkDeveloperJob('Systems Engineer', ['Engineer', 'Go'])).toBe(
      false,
    )
    expect(
      isRemoteOkDeveloperJob('Developer Marketing Lead', ['Developer']),
    ).toBe(false)
    expect(isRemoteOkDeveloperJob('Senior Software Engineer', ['Remote'])).toBe(
      false,
    )
  })

  it('ignores description text for admission and emits sanitized attribution', async () => {
    const result = await parseRemoteOkPayload(REMOTE_OK_FIXTURE)

    expect(result.fetchedCount).toBe(4)
    expect(result.rejectedCount).toBe(4)
    expect(result.records).toHaveLength(1)
    const record = result.records[0]
    expect(record).toMatchObject({
      attribution: 'Remote OK',
      company: 'Kumo Systems',
      provider: 'remote_ok',
      sourceKey: '101',
      title: 'Senior Backend Engineer',
    })
    expect(record?.descriptionHtml).toContain('Build safe services')
    expect(record?.descriptionHtml).not.toMatch(/script|onclick|javascript:/i)
    expect(record?.labels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'filterable',
          normalized: 'rust',
        }),
        expect.objectContaining({
          kind: 'provenance',
          normalized: 'async-team',
        }),
      ]),
    )
  })
})

describe('WWR adapter', () => {
  it('configures exactly the four approved programming feeds', () => {
    expect(WWR_FEEDS).toHaveLength(4)
    expect(WWR_FEEDS.map((feed) => feed.url)).toEqual([
      'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    ])
    expect(JSON.stringify(WWR_FEEDS)).not.toMatch(/devops|sysadmin/i)
  })

  it('collapses shared GUIDs while retaining every observed category', async () => {
    const shared = {
      description: '<p>Build APIs.</p><img src=x onerror=bad()>',
      guid: 'wwr-shared-1',
      link: 'https://weworkremotely.com/remote-jobs/kumo-senior-backend',
      pubDate: 'Mon, 27 Jul 2026 10:00:00 GMT',
      title: 'Kumo Systems: Senior Backend Engineer',
    }
    const result = await parseWwrFeeds([
      {
        category: WWR_FEEDS[1].category,
        payload: wwrFeed(WWR_FEEDS[1].category, [shared]),
        url: WWR_FEEDS[1].url,
      },
      {
        category: WWR_FEEDS[3].category,
        payload: wwrFeed(WWR_FEEDS[3].category, [shared]),
        url: WWR_FEEDS[3].url,
      },
    ])

    expect(result.fetchedCount).toBe(2)
    expect(result.records).toHaveLength(1)
    expect(result.records[0]).toMatchObject({
      company: 'Kumo Systems',
      provider: 'wwr',
      rawTitle: shared.title,
      sourceKey: shared.guid,
      title: 'Senior Backend Engineer',
    })
    expect(result.records[0]?.labels.map((label) => label.sourceValue)).toEqual(
      expect.arrayContaining([
        'Remote Back-End Programming Jobs',
        'Remote Programming Jobs',
      ]),
    )
    expect(result.records[0]?.descriptionHtml).not.toMatch(/onerror|<img/i)
  })

  it('splits Company: Role only when both sides are non-empty', () => {
    expect(splitWwrTitle('Kumo: Backend Developer')).toEqual({
      company: 'Kumo',
      title: 'Backend Developer',
    })
    expect(splitWwrTitle('No separator title')).toEqual({
      company: 'Unknown company',
      title: 'No separator title',
    })
    expect(splitWwrTitle(': Missing company').company).toBe('Unknown company')
  })

  it('falls back to the listing URL when a feed omits guid', async () => {
    const payload = wwrFeed('Remote Programming Jobs', [
      {
        description: '<p>Build products.</p>',
        guid: '',
        link: 'https://weworkremotely.com/remote-jobs/orbit-developer',
        title: 'Orbit: Software Developer',
      },
    ]).replace('<guid isPermaLink="false"></guid>', '')
    const result = await parseWwrFeeds([
      {
        category: WWR_FEEDS[3].category,
        payload,
        url: WWR_FEEDS[3].url,
      },
    ])

    expect(result.records[0]?.sourceKey).toBe(
      'https://weworkremotely.com/remote-jobs/orbit-developer',
    )
  })
})
