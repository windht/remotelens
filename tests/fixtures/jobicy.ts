export function jobicyPayload(jobs: unknown[]) {
  return JSON.stringify({
    apiVersion: '2.2.15',
    jobs,
    jobCount: jobs.length,
  })
}

export const JOBICY_FIXTURE = jobicyPayload([
  {
    id: 150101,
    url: 'https://jobicy.com/jobs/150101-senior-software-engineer-kumo',
    jobTitle: 'Senior Software Engineer',
    companyName: 'Kumo Systems LLC',
    jobIndustry: ['Software Engineering', 'Web Development'],
    jobType: ['Full-Time'],
    jobGeo: 'Worldwide',
    jobLevel: 'Senior',
    jobExcerpt: 'Short excerpt.',
    jobDescription:
      '<p>Build safe services.</p><script>alert(1)</script><img src=x>',
    pubDate: '2026-08-01T08:00:00Z',
  },
  {
    id: 150102,
    url: 'https://jobicy.com/jobs/150102-frontend-orbit',
    jobTitle: 'Frontend Developer',
    companyName: 'Orbit Labs',
    jobIndustry: 'Software Engineering',
    jobType: 'Contract',
    jobGeo: 'Europe',
    jobLevel: 'Mid',
    jobExcerpt: '<p>Build interfaces.</p>',
  },
  {
    id: 150101,
    url: 'https://jobicy.com/jobs/150101-senior-software-engineer-kumo',
    jobTitle: 'Senior Software Engineer',
    companyName: 'Kumo Systems LLC',
    jobIndustry: ['Software Engineering'],
    jobType: ['Full-Time'],
    jobGeo: 'Worldwide',
    jobLevel: 'Senior',
    jobDescription: '<p>Build safe services.</p>',
  },
  {
    id: 150103,
    jobTitle: 'Missing URL',
    companyName: 'Malformed Co',
  },
])
