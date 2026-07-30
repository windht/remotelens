export const REMOTE_OK_FIXTURE = JSON.stringify([
  {
    legal: 'Remote OK terms metadata',
    last_updated: 1_785_000_000,
  },
  {
    id: 101,
    position: 'Senior Backend Engineer',
    company: 'Kumo Systems LLC',
    description:
      '<p>Build safe services.</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="bad()">bad</a>',
    date: '2026-07-28T08:00:00Z',
    tags: ['Backend', 'Rust', 'Async Team'],
    url: 'https://remoteok.com/remote-jobs/101',
  },
  {
    id: 102,
    position: 'Systems Engineer',
    company: 'Ambiguous Co',
    description: '<p>We need a software developer.</p>',
    tags: ['Engineer', 'Go'],
    url: 'https://remoteok.com/remote-jobs/102',
  },
  {
    id: 103,
    position: 'Developer Marketing Lead',
    company: 'Not Engineering',
    description: '<p>Developer platform marketing.</p>',
    tags: ['Developer', 'JavaScript'],
    url: 'https://remoteok.com/remote-jobs/103',
  },
  {
    id: 104,
    position: 'Senior Software Engineer',
    company: 'No Dev Tag',
    description: '<p>Developer developer developer.</p>',
    tags: ['Remote', 'Async'],
    url: 'https://remoteok.com/remote-jobs/104',
  },
  {
    id: 105,
    company: 'Malformed',
    tags: ['Developer'],
  },
])
