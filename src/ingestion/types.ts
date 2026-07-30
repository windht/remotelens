export const PROVIDERS = ['remote_ok', 'wwr'] as const
export type Provider = (typeof PROVIDERS)[number]

export type SourceLabel = {
  kind: 'filterable' | 'provenance'
  normalized: string
  sourceValue: string
}

export type NormalizedSourceRecord = {
  attribution: 'Remote OK' | 'We Work Remotely'
  company: string
  descriptionHtml: string
  descriptionText: string
  labels: SourceLabel[]
  listingUrl: string
  payloadHash: string
  provider: Provider
  publishedAt?: number
  rawTitle: string
  sourceKey: string
  title: string
}

export type ParseResult = {
  fetchedCount: number
  records: NormalizedSourceRecord[]
  rejectedCount: number
  responseHash: string
}

export type ProviderRunStatus =
  'successful' | 'partial' | 'failed' | 'suspended'

export type ProviderRunSummary = {
  admittedCount: number
  completedFeedCount?: number
  configuredFeedCount?: number
  errorCode?: string
  errorMessage?: string
  fetchedCount: number
  insertedCount: number
  provider: Provider
  rejectedCount: number
  responseHash?: string
  status: ProviderRunStatus
  unchangedCount: number
  updatedCount: number
}

export interface SourceAdapter {
  readonly provider: Provider
  fetchAndParse(fetcher: typeof fetch): Promise<ParseResult>
}
