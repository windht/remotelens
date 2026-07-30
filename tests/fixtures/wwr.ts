export function wwrFeed(
  category: string,
  items: Array<{
    category?: string
    description: string
    guid: string
    link: string
    pubDate?: string
    title: string
  }>,
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${category}</title>
    ${items
      .map(
        (item) => `<item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="false">${item.guid}</guid>
      <description><![CDATA[${item.description}]]></description>
      ${item.pubDate ? `<pubDate>${item.pubDate}</pubDate>` : ''}
      ${item.category ? `<category>${item.category}</category>` : ''}
    </item>`,
      )
      .join('\n')}
  </channel>
</rss>`
}
