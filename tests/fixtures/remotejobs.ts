export function remoteJobsPage(
  items: unknown[],
  input: { hasMore: boolean; limit?: number; offset?: number } = {
    hasMore: false,
  },
) {
  return JSON.stringify({
    data: items,
    pagination: {
      has_more: input.hasMore,
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
    },
  })
}

export const REMOTEJOBS_PAGE_ONE = remoteJobsPage(
  [
    {
      id: 'rj-101',
      title: 'Senior Backend Engineer',
      url: 'https://remotejobs.org/remote-jobs/senior-backend-engineer-kumo',
      apply_url:
        'https://remotejobs.org/remote-jobs/senior-backend-engineer-kumo',
      company: { name: 'Kumo Systems' },
      category: { name: 'Programming', slug: 'programming' },
      location: 'Worldwide',
      type: 'Full-time',
      description:
        '<p>Build safe services.</p><script>alert(1)</script><img src=x>',
      posted_at: '2026-08-01T08:00:00Z',
    },
    {
      id: 'rj-102',
      title: 'Marketing Specialist',
      url: 'https://remotejobs.org/remote-jobs/marketing-specialist',
      company: { name: 'Not Engineering' },
      category: { name: 'Marketing', slug: 'marketing' },
      description: '<p>Not an engineering listing.</p>',
    },
    {
      id: 'rj-malformed',
      url: 'https://remotejobs.org/remote-jobs/malformed',
      company: { name: 'Missing title' },
      category: { name: 'Programming', slug: 'programming' },
    },
  ],
  { hasMore: true, offset: 0 },
)

export const REMOTEJOBS_PAGE_TWO = remoteJobsPage(
  [
    {
      id: 'rj-101',
      title: 'Senior Backend Engineer',
      url: 'https://remotejobs.org/remote-jobs/senior-backend-engineer-kumo',
      company: { name: 'Kumo Systems' },
      category: { name: 'Programming', slug: 'programming' },
      location: 'Worldwide',
      type: 'Full-time',
      description: '<p>Build safe services.</p>',
    },
    {
      id: 103,
      title: 'Frontend Developer',
      url: 'https://remotejobs.org/remote-jobs/frontend-developer-orbit',
      company: 'Orbit Labs',
      category: { slug: 'programming' },
      location: 'Remote',
      type: 'Contract',
      description: 'Build accessible products.',
    },
  ],
  { hasMore: false, offset: 50 },
)
