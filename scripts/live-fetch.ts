import {
  fetchJsguruPages,
  JSGURU_PAGES,
} from '../src/ingestion/adapters/jsguru'
import { jobicyAdapter } from '../src/ingestion/adapters/jobicy'
import {
  fetchRemoteJobs,
  REMOTEJOBS_MAX_PAGES,
} from '../src/ingestion/adapters/remotejobs'
import { remoteOkAdapter } from '../src/ingestion/adapters/remote-ok'
import { remotiveAdapter } from '../src/ingestion/adapters/remotive'
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
    configuredJsguruPages: JSGURU_PAGES.length,
    configuredRemoteJobsMaxPages: REMOTEJOBS_MAX_PAGES,
    persistRawPayloads: false,
    configuredWwrFeeds: WWR_FEEDS.length,
  },
}

try {
  const jsguru = await fetchJsguruPages(observedFetch)
  output.jsguru = {
    admittedCount: jsguru.parsed?.records.length ?? 0,
    aggregatedDuplicateCount:
      (jsguru.parsed?.fetchedCount ?? 0) -
      (jsguru.parsed?.records.length ?? 0) -
      (jsguru.parsed?.rejectedCount ?? 0),
    completedPageCount: jsguru.successfulPageCount,
    configuredPageCount: JSGURU_PAGES.length,
    errors: jsguru.errors.map((error) => boundedError(error, 200)),
    fetchedCount: jsguru.parsed?.fetchedCount ?? 0,
    rejectedCount: jsguru.parsed?.rejectedCount ?? 0,
    responseHash: jsguru.parsed?.responseHash ?? null,
  }
} catch (error) {
  output.jsguru = {
    error: boundedError(error),
  }
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

try {
  const remoteJobs = await fetchRemoteJobs(observedFetch)
  output.remotejobs = {
    admittedCount: remoteJobs.parsed?.records.length ?? 0,
    completedPageCount: remoteJobs.successfulPageCount,
    errors: remoteJobs.errors.map((error) => boundedError(error, 200)),
    fetchedCount: remoteJobs.parsed?.fetchedCount ?? 0,
    hasMore: remoteJobs.hasMore,
    rejectedCount: remoteJobs.parsed?.rejectedCount ?? 0,
    responseHash: remoteJobs.parsed?.responseHash ?? null,
  }
} catch (error) {
  output.remotejobs = {
    error: boundedError(error),
  }
}

try {
  const remotive = await remotiveAdapter.fetchAndParse(observedFetch)
  output.remotive = {
    admittedCount: remotive.records.length,
    fetchedCount: remotive.fetchedCount,
    rejectedCount: remotive.rejectedCount,
    responseHash: remotive.responseHash,
  }
} catch (error) {
  output.remotive = {
    error: boundedError(error),
  }
}

try {
  const jobicy = await jobicyAdapter.fetchAndParse(observedFetch)
  output.jobicy = {
    admittedCount: jobicy.records.length,
    fetchedCount: jobicy.fetchedCount,
    rejectedCount: jobicy.rejectedCount,
    responseHash: jobicy.responseHash,
  }
} catch (error) {
  output.jobicy = {
    error: boundedError(error),
  }
}

output.requests = requests
output.finishedAt = new Date().toISOString()
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
