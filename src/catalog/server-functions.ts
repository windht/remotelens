import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { websiteJob, websiteJobs, websiteMeta } from './catalog-db'
import type { JobSearch } from '../lib/job-search'

type RuntimeBindings = Omit<Cloudflare.Env, 'APP_ENV'> & {
  APP_ENV?: string
}

const runtime = env as unknown as RuntimeBindings

export const loadWebsiteJobs = createServerFn({ method: 'GET' })
  .validator((input: JobSearch) => input)
  .handler(({ data }) =>
    websiteJobs(runtime.DB, data, runtime.APP_ENV === 'production'),
  )

export const loadWebsiteJob = createServerFn({ method: 'GET' })
  .validator((input: { identifier: string }) => input)
  .handler(({ data }) =>
    websiteJob(runtime.DB, data.identifier, runtime.APP_ENV === 'production'),
  )

export const loadWebsiteMeta = createServerFn({ method: 'GET' }).handler(() =>
  websiteMeta(runtime.DB, runtime.APP_ENV === 'production'),
)
