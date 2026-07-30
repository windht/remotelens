import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { WWR_FEEDS } from '../../src/ingestion/adapters/wwr'

const root = fileURLToPath(new URL('../../', import.meta.url))
const config = JSON.parse(
  readFileSync(`${root}/wrangler.jsonc`, 'utf8').replace(/,\s*([}\]])/g, '$1'),
) as {
  workflows?: Array<Record<string, unknown>>
}
const serverSource = readFileSync(`${root}/src/server.ts`, 'utf8')
const routeFiles = readFileSync(`${root}/src/routeTree.gen.ts`, 'utf8')

describe('scheduled ingestion configuration', () => {
  it('binds one directly scheduled Workflow every 12 hours', () => {
    expect(config.workflows).toEqual([
      {
        binding: 'CATALOG_INGESTION',
        class_name: 'CatalogIngestionWorkflow',
        name: 'remotelens-catalog-ingestion',
        schedules: ['0 */12 * * *'],
      },
    ])
  })

  it('has no Cron handler or public ingestion route', () => {
    expect(serverSource).not.toMatch(/\bscheduled\s*\(/)
    expect(routeFiles).not.toMatch(/ingest|workflow|cron/i)
  })

  it('keeps the WWR feed allow-list closed', () => {
    expect(WWR_FEEDS).toHaveLength(4)
    expect(JSON.stringify(WWR_FEEDS)).not.toMatch(/devops|sysadmin/i)
  })
})
