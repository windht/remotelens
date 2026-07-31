import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const liveSlug = 'senior-backend-engineer-kumo-01JRLKUM0F6T'

function describeLive(title: string, callback: () => void) {
  if (process.env.REMOTELENS_E2E_EXTERNAL === '1') {
    test.describe(title, callback)
  } else {
    test.describe.skip(title, callback)
  }
}

describeLive('live D1 catalog', () => {
  test('server-renders canonical jobs, metadata, provenance, and SEO', async ({
    page,
    request,
  }) => {
    const home = await request.get('/')
    expect(home.ok()).toBe(true)
    const homeHtml = await home.text()
    expect(homeHtml).toContain('Live catalog')
    expect(homeHtml).toContain('Senior Backend Engineer')

    const meta = await request.get('/api/v1/meta')
    expect(meta.ok()).toBe(true)
    await expect(meta.json()).resolves.toMatchObject({
      data: {
        cache_epoch: 'epoch:live-proof',
        providers: [
          { enabled: true, key: 'remote_ok', status: 'healthy' },
          { enabled: true, key: 'wwr', status: 'healthy' },
        ],
        total_active_jobs: 1,
      },
    })

    await page.goto(`/jobs/${liveSlug}`)
    await expect(
      page.getByRole('heading', { name: 'Senior Backend Engineer' }),
    ).toBeVisible()
    await expect(page.getByText('Source conflict retained')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'View attributed source' }),
    ).toHaveCount(2)
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      'href',
      `/jobs/${liveSlug}`,
    )
  })

  test('keeps live source freshness accessible and free of serious axe issues', async ({
    page,
  }) => {
    await page.goto('/sources')
    await expect(page.getByText(/healthy/).first()).toBeVisible()
    await expect(page.getByText(/Last successful check:/).first()).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([])
  })
})

describeLive('live D1 catalog without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('submits exact filters against D1', async ({ page }) => {
    await page.goto('/jobs')
    await page.locator('select[name="role_family"]').selectOption('engineering')
    await page
      .locator('select[name="employment_type"]')
      .selectOption('full_time')
    await page.getByText('More exact filters', { exact: true }).click()
    await page.getByLabel('Exact filterable tag').fill('rust')
    await page
      .locator('select[name="source"]')
      .selectOption('wwr', { force: true })
    await Promise.all([
      page.waitForURL((url) => url.searchParams.get('tag') === 'rust'),
      page.getByLabel('Exact filterable tag').press('Enter'),
    ])

    expect(new URL(page.url()).searchParams.get('role_family')).toBe(
      'engineering',
    )
    expect(
      JSON.parse(new URL(page.url()).searchParams.get('source') ?? '[]'),
    ).toEqual(['wwr'])
    await expect(page.getByText(/1 job found/)).toBeVisible()
    await expect(page.getByText('Senior Backend Engineer')).toBeVisible()

    await page.goto('/jobs?company=Unknown%20Live%20Company')
    await expect(page.getByText(/0 jobs found/)).toBeVisible()
    await expect(page.getByText('No exact matches')).toBeVisible()
  })
})
