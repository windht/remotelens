export const SITE_ORIGIN = 'https://remotelens.co'
export const SITE_NAME = 'RemoteLens'

export function absoluteUrl(path: string) {
  return new URL(path, SITE_ORIGIN).href
}

export function pageMeta({
  description,
  path,
  title,
}: {
  description: string
  path: string
  title: string
}) {
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: absoluteUrl(path) },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ]
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function jsonLdScript(data: object) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(data),
  }
}

export const siteIdentityJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: SITE_NAME,
      alternateName: 'RemoteLens Jobs',
      description:
        'A public index of remote developer jobs with structured filters and source evidence.',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/icon-512.png`,
        width: 512,
        height: 512,
      },
      sameAs: ['https://github.com/windht/remotelens'],
    },
  ],
}
