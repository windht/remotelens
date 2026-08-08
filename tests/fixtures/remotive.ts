export function remotiveFeed(
  items: Array<{
    category?: string | string[]
    contentEncoded?: string
    description?: string
    guid?: string
    link: string
    pubDate?: string
    title: string
  }>,
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Remotive Software Development</title>
    ${items
      .map(
        (item) => `<item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      ${item.guid === undefined ? '' : `<guid>${item.guid}</guid>`}
      ${item.description === undefined ? '' : `<description><![CDATA[${item.description}]]></description>`}
      ${item.contentEncoded === undefined ? '' : `<content:encoded><![CDATA[${item.contentEncoded}]]></content:encoded>`}
      ${item.pubDate === undefined ? '' : `<pubDate>${item.pubDate}</pubDate>`}
      ${item.category === undefined ? '' : Array.isArray(item.category) ? item.category.map((category) => `<category>${category}</category>`).join('') : `<category>${item.category}</category>`}
    </item>`,
      )
      .join('\n')}
  </channel>
</rss>`
}

export const REMOTIVE_FIXTURE = remotiveFeed([
  {
    category: ['software-development', 'javascript'],
    contentEncoded:
      '<p>Build products.</p><script>alert(1)</script><a href="javascript:bad()">bad</a>',
    guid: 'remotive-101',
    link: 'https://remotive.com/remote-jobs/software-dev/backend-engineer-kumo',
    pubDate: 'Sat, 01 Aug 2026 08:00:00 GMT',
    title: 'Kumo Systems: Senior Backend Engineer',
  },
  {
    category: 'software-development',
    description: '<p>Frontend work.</p>',
    link: 'https://remotive.com/remote-jobs/software-dev/frontend-orbit',
    title: 'Frontend Developer at Orbit Labs',
  },
])
