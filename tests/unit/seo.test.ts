import { describe, expect, it } from 'vitest'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMeta,
  siteIdentityJsonLd,
} from '../../src/lib/seo'

describe('SEO metadata', () => {
  it('builds canonical production URLs', () => {
    expect(absoluteUrl('/jobs')).toBe('https://remotelens.co/jobs')
    expect(absoluteUrl('/skills/install')).toBe(
      'https://remotelens.co/skills/install',
    )
  })

  it('keeps page metadata descriptive and aligned across search and sharing', () => {
    const meta = pageMeta({
      title: 'Remote Developer Jobs — RemoteLens',
      description: 'Attributed jobs with structured filters.',
      path: '/jobs',
    })

    expect(meta).toContainEqual({
      name: 'description',
      content: 'Attributed jobs with structured filters.',
    })
    expect(meta).toContainEqual({
      property: 'og:url',
      content: 'https://remotelens.co/jobs',
    })
    expect(meta).toContainEqual({
      name: 'twitter:title',
      content: 'Remote Developer Jobs — RemoteLens',
    })
  })

  it('publishes site identity and breadcrumb structured data', () => {
    expect(siteIdentityJsonLd['@graph'][0]).toMatchObject({
      '@type': 'WebSite',
      name: 'RemoteLens',
      url: 'https://remotelens.co/',
    })
    expect(siteIdentityJsonLd['@graph'][1]).toMatchObject({
      '@type': 'Organization',
      logo: { url: 'https://remotelens.co/icon-512.png' },
    })

    const breadcrumb = breadcrumbJsonLd([
      { name: 'RemoteLens', path: '/' },
      { name: 'Remote Developer Jobs', path: '/jobs' },
    ])
    expect(breadcrumb.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'RemoteLens',
        item: 'https://remotelens.co/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Remote Developer Jobs',
        item: 'https://remotelens.co/jobs',
      },
    ])
    expect(JSON.parse(jsonLdScript(breadcrumb).children)).toEqual(breadcrumb)
  })
})
