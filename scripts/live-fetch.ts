import { remoteOkAdapter } from '../src/ingestion/adapters/remote-ok'
import { WWR_FEEDS, fetchWwrFeeds } from '../src/ingestion/adapters/wwr'
import { boundedError } from '../src/ingestion/normalization'

const requests: Array<{
  contentType: string | null
  status: number
  url: string
}> = []

const observedFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init)
  requests.push({
    contentType: response.headers.get('content-type'),
    status: response.status,
    url:
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
  })
  return response
}

const startedAt = new Date().toISOString()
const output: Record<string, unknown> = {
  startedAt,
  policy: {
    persistRawPayloads: false,
    configuredWwrFeeds: WWR_FEEDS.length,
  },
}

try {
  const remoteOk = await remoteOkAdapter.fetchAndParse(observedFetch)
  output.remoteOk = {
    admittedCount: remoteOk.records.length,
    fetchedCount: remoteOk.fetchedCount,
    rejectedCount: remoteOk.rejectedCount,
    responseHash: remoteOk.responseHash,
  }
} catch (error) {
  output.remoteOk = {
    error: boundedError(error),
  }
}

try {
  const wwr = await fetchWwrFeeds(observedFetch)
  output.wwr = {
    admittedCount: wwr.parsed?.records.length ?? 0,
    aggregatedDuplicateCount:
      (wwr.parsed?.fetchedCount ?? 0) - (wwr.parsed?.records.length ?? 0),
    completedFeedCount: wwr.successfulFeedCount,
    configuredFeedCount: WWR_FEEDS.length,
    errors: wwr.errors.map((error) => boundedError(error, 200)),
    fetchedCount: wwr.parsed?.fetchedCount ?? 0,
    responseHash: wwr.parsed?.responseHash ?? null,
  }
} catch (error) {
  output.wwr = {
    error: boundedError(error),
  }
}

output.requests = requests
output.finishedAt = new Date().toISOString()
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
