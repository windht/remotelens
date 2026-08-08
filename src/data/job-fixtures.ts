export type SourceKey =
  'jsguru' | 'remote_ok' | 'wwr' | 'remotejobs' | 'remotive' | 'jobicy'
export type ProvenanceOrigin = 'source-stated' | 'parsed' | 'normalized'

export type JobSourceFixture = {
  categories: string[]
  checkedAt: string
  key: SourceKey
  label: string
  listingUrl: string
  marker: number
}

export type JobFixture = {
  company: string
  companyDomain: string | null
  descriptionHtml: string
  eligibleCountries: string[]
  eligibleRegions?: string[]
  employmentType:
    | 'contract'
    | 'full_time'
    | 'part_time'
    | 'temporary'
    | 'internship'
    | 'freelance'
    | null
  excludedCountries: string[]
  excludedRegions?: string[]
  firstSeenAt: string
  id: string
  locationSummary: string
  provenance: Array<{
    field: string
    marker: number
    origin: ProvenanceOrigin
    value: string
  }>
  publishedAt: string | null
  remoteScope:
    'countries' | 'region' | 'timezone' | 'worldwide' | 'hybrid' | 'unspecified'
  salary: {
    currency: string
    max: number
    min: number
    period: 'hour' | 'month' | 'year'
  } | null
  seniority:
    | 'entry'
    | 'junior'
    | 'mid'
    | 'senior'
    | 'staff'
    | 'principal'
    | 'lead'
    | 'manager'
    | null
  slug: string
  sources: JobSourceFixture[]
  status: 'active' | 'closed' | 'stale'
  tags: Array<{
    filterable: boolean
    normalized: string
    sourceValue: string
  }>
  title: string
  timezoneRequirements?: string[]
  travelRequired: 'no' | 'unknown' | 'yes'
  visaSponsorship: 'no' | 'unknown' | 'yes'
}

const roleDescription = `
  <p>Build and operate dependable product infrastructure for a distributed team.
  You will own services from design through production, review changes with
  peers, and document the trade-offs behind important decisions.</p>
  <h2>The role</h2>
  <p>Work with product and engineering partners to turn clearly scoped customer
  needs into maintainable systems. The team values small releases, direct
  communication, and boring technology used well.</p>
  <h2>What you will do</h2>
  <ul>
    <li>Design, implement, and review production services.</li>
    <li>Improve observability, reliability, and incident follow-up.</li>
    <li>Write clear technical notes for decisions and hand-offs.</li>
  </ul>
  <h2>What they are looking for</h2>
  <ul>
    <li>Experience delivering software in a collaborative environment.</li>
    <li>Comfort reasoning about trade-offs and incomplete information.</li>
    <li>Clear written communication across time zones.</li>
  </ul>
`

export const JOB_FIXTURES: JobFixture[] = [
  {
    id: '01JRLKUM0F6TQ7N29J4AX1ZP8R',
    slug: 'senior-backend-engineer-kumo-01JRLKUM0F6T',
    title: 'Senior Backend Engineer',
    company: 'Kumo Systems',
    companyDomain: 'kumo.example',
    employmentType: 'full_time',
    seniority: 'senior',
    remoteScope: 'worldwide',
    locationSummary: 'Worldwide, except the United States',
    eligibleCountries: [],
    excludedCountries: ['US'],
    salary: { min: 160_000, max: 210_000, currency: 'USD', period: 'year' },
    visaSponsorship: 'unknown',
    travelRequired: 'no',
    publishedAt: '2026-07-28T08:00:00.000Z',
    firstSeenAt: '2026-07-28T08:12:00.000Z',
    status: 'active',
    tags: [
      { sourceValue: 'Backend', normalized: 'backend', filterable: true },
      { sourceValue: 'Rust', normalized: 'rust', filterable: true },
      {
        sourceValue: 'Distributed Systems',
        normalized: 'distributed-systems',
        filterable: true,
      },
      {
        sourceValue: 'Async team',
        normalized: 'async-team',
        filterable: false,
      },
    ],
    sources: [
      {
        key: 'jsguru',
        label: 'JS Guru Jobs',
        marker: 1,
        listingUrl: 'https://jsgurujobs.com/jobs/551',
        checkedAt: '2026-08-01T00:00:00.000Z',
        categories: ['Rust', 'TypeScript', 'Remote'],
      },
      {
        key: 'wwr',
        label: 'We Work Remotely',
        marker: 2,
        listingUrl: 'https://weworkremotely.com/',
        checkedAt: '2026-07-30T14:48:00.000Z',
        categories: ['Remote Back-End Programming Jobs'],
      },
      {
        key: 'remote_ok',
        label: 'Remote OK',
        marker: 3,
        listingUrl: 'https://remoteok.com/',
        checkedAt: '2026-07-30T14:43:00.000Z',
        categories: ['backend', 'rust', 'engineer'],
      },
    ],
    provenance: [
      {
        field: 'title',
        value: 'Senior Backend Engineer',
        origin: 'source-stated',
        marker: 2,
      },
      {
        field: 'remote eligibility',
        value: 'Worldwide, except the United States',
        origin: 'parsed',
        marker: 2,
      },
      {
        field: 'salary',
        value: 'USD 160,000–210,000 per year',
        origin: 'source-stated',
        marker: 3,
      },
      {
        field: 'role family',
        value: 'engineering',
        origin: 'normalized',
        marker: 2,
      },
    ],
    descriptionHtml: roleDescription,
  },
  {
    id: '01JRLNORTH9J8S5M6X7D3C2B1A',
    slug: 'staff-frontend-engineer-northstar-01JRLNORTH9J',
    title: 'Staff Frontend Engineer',
    company: 'Northstar Labs',
    companyDomain: 'northstar.example',
    employmentType: 'full_time',
    seniority: 'staff',
    remoteScope: 'countries',
    locationSummary: 'Japan, Singapore, Australia, and New Zealand',
    eligibleCountries: ['JP', 'SG', 'AU', 'NZ'],
    excludedCountries: [],
    salary: null,
    visaSponsorship: 'no',
    travelRequired: 'unknown',
    publishedAt: '2026-07-27T06:30:00.000Z',
    firstSeenAt: '2026-07-27T06:45:00.000Z',
    status: 'active',
    tags: [
      { sourceValue: 'Front-End', normalized: 'front-end', filterable: true },
      { sourceValue: 'React', normalized: 'react', filterable: true },
      {
        sourceValue: 'Design systems',
        normalized: 'design-systems',
        filterable: true,
      },
    ],
    sources: [
      {
        key: 'wwr',
        label: 'We Work Remotely',
        marker: 1,
        listingUrl: 'https://weworkremotely.com/',
        checkedAt: '2026-07-30T14:48:00.000Z',
        categories: ['Remote Front-End Programming Jobs'],
      },
    ],
    provenance: [
      {
        field: 'title',
        value: 'Staff Frontend Engineer',
        origin: 'source-stated',
        marker: 1,
      },
      {
        field: 'eligible countries',
        value: 'JP, SG, AU, NZ',
        origin: 'parsed',
        marker: 1,
      },
    ],
    descriptionHtml: roleDescription,
  },
  {
    id: '01JRLCLOUD4D5E6F7G8H9J0K1L',
    slug: 'systems-engineer-cloudlattice-01JRLCLOUD4D',
    title: 'Systems Engineer',
    company: 'Cloud Lattice',
    companyDomain: 'cloudlattice.example',
    employmentType: 'full_time',
    seniority: 'mid',
    remoteScope: 'region',
    locationSummary: 'Europe',
    eligibleCountries: ['DE', 'FR', 'NL', 'PT', 'ES', 'GB'],
    excludedCountries: [],
    salary: { min: 95_000, max: 125_000, currency: 'EUR', period: 'year' },
    visaSponsorship: 'unknown',
    travelRequired: 'yes',
    publishedAt: '2026-07-26T11:00:00.000Z',
    firstSeenAt: '2026-07-26T11:19:00.000Z',
    status: 'active',
    tags: [
      { sourceValue: 'Go', normalized: 'go', filterable: true },
      { sourceValue: 'Kubernetes', normalized: 'kubernetes', filterable: true },
      { sourceValue: 'Engineer', normalized: 'engineer', filterable: false },
    ],
    sources: [
      {
        key: 'remote_ok',
        label: 'Remote OK',
        marker: 1,
        listingUrl: 'https://remoteok.com/',
        checkedAt: '2026-07-30T14:43:00.000Z',
        categories: ['go', 'kubernetes', 'engineer'],
      },
    ],
    provenance: [
      {
        field: 'title',
        value: 'Systems Engineer',
        origin: 'source-stated',
        marker: 1,
      },
      {
        field: 'region',
        value: 'Europe',
        origin: 'normalized',
        marker: 1,
      },
    ],
    descriptionHtml: roleDescription,
  },
  {
    id: '01JRLATLAS8N7M6L5K4J3H2G1F',
    slug: 'lead-api-engineer-atlas-01JRLATLAS8N',
    title: 'Lead API Engineer',
    company: 'Atlas Cartography',
    companyDomain: 'atlas.example',
    employmentType: 'contract',
    seniority: 'lead',
    remoteScope: 'timezone',
    locationSummary: 'At least four hours overlap with Europe/London',
    eligibleCountries: [],
    excludedCountries: [],
    salary: { min: 110_000, max: 135_000, currency: 'GBP', period: 'year' },
    visaSponsorship: 'unknown',
    travelRequired: 'no',
    publishedAt: '2026-07-24T09:15:00.000Z',
    firstSeenAt: '2026-07-24T09:41:00.000Z',
    status: 'stale',
    tags: [
      { sourceValue: 'API', normalized: 'api', filterable: true },
      { sourceValue: 'TypeScript', normalized: 'typescript', filterable: true },
    ],
    sources: [
      {
        key: 'wwr',
        label: 'We Work Remotely',
        marker: 1,
        listingUrl: 'https://weworkremotely.com/',
        checkedAt: '2026-07-30T14:48:00.000Z',
        categories: ['Remote Full-Stack Programming Jobs'],
      },
    ],
    provenance: [
      {
        field: 'timezone',
        value: 'Europe/London',
        origin: 'normalized',
        marker: 1,
      },
    ],
    descriptionHtml: roleDescription,
  },
  {
    id: '01JRLORBIT1A2B3C4D5E6F7G8H',
    slug: 'senior-product-engineer-orbit-01JRLORBIT1A',
    title: 'Senior Product Engineer',
    company: 'Orbit Works',
    companyDomain: 'orbit.example',
    employmentType: 'full_time',
    seniority: 'senior',
    remoteScope: 'worldwide',
    locationSummary: 'Worldwide',
    eligibleCountries: [],
    excludedCountries: [],
    salary: null,
    visaSponsorship: 'unknown',
    travelRequired: 'unknown',
    publishedAt: '2026-07-18T13:00:00.000Z',
    firstSeenAt: '2026-07-18T13:26:00.000Z',
    status: 'closed',
    tags: [
      { sourceValue: 'Full-Stack', normalized: 'full-stack', filterable: true },
      { sourceValue: 'JavaScript', normalized: 'javascript', filterable: true },
    ],
    sources: [
      {
        key: 'remote_ok',
        label: 'Remote OK',
        marker: 1,
        listingUrl: 'https://remoteok.com/',
        checkedAt: '2026-07-29T02:43:00.000Z',
        categories: ['javascript', 'full-stack'],
      },
    ],
    provenance: [
      {
        field: 'status',
        value: 'closed',
        origin: 'normalized',
        marker: 1,
      },
    ],
    descriptionHtml: roleDescription,
  },
]

export const FEATURED_JOBS = JOB_FIXTURES.slice(0, 3)
