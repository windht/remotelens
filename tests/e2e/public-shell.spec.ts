import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const criticalRoutes = [
  '/',
  '/jobs',
  '/jobs/senior-backend-engineer-kumo-01JRLKUM0F6T',
  '/sources',
  '/methodology',
  '/api',
  '/skills/install',
]

test.describe('public shell', () => {
  test('server-renders navigation and nested routes with security headers', async ({
    page,
    request,
  }) => {
    for (const route of criticalRoutes) {
      const response = await request.get(route)
      expect(response.ok(), `${route} should load`).toBe(true)
      const html = await response.text()
      expect(html).toContain('RemoteLens')
      expect(html).toContain('main-content')
    }

    const response = await page.goto('/')
    expect(response?.headers()['x-content-type-options']).toBe('nosniff')
    expect(response?.headers()['x-frame-options']).toBe('DENY')
    expect(response?.headers()['cache-control']).toBe('no-store')
    expect(response?.headers()['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    )
    expect((await request.head('/')).status()).toBe(200)
    expect((await request.fetch('/', { method: 'OPTIONS' })).status()).toBe(204)
    const mutation = await request.post('/', { data: { ignored: true } })
    expect(mutation.status()).toBe(405)
    await expect(mutation.json()).resolves.toMatchObject({
      error: { code: 'method_not_allowed' },
    })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'See which remote jobs actually fit',
    )
    await expect(page.getByText('No ads', { exact: true })).toBeVisible()
    await expect(page.getByText('No login', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Browse the Index' }).click()
    await expect(page).toHaveURL(/\/jobs/)
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Index', exact: true }),
    ).toBeVisible()
  })

  test('home actions preserve the public and local-CV boundary', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(
      page.getByText('CV stays local', { exact: true }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Install the Agent Skill' }).click()
    await expect(page).toHaveURL(/\/skills\/install/)
    await expect(
      page.getByRole('heading', { name: /Keep your CV local/ }),
    ).toBeVisible()
    await page.goto('/')
    await page.getByRole('link', { name: 'API documentation' }).click()
    await expect(page).toHaveURL(/\/api/)
    await expect(page.getByText('Live contract')).toBeVisible()
  })

  test('shows exact empty and malformed-filter states', async ({ page }) => {
    await page.goto('/jobs?company=Unknown%20Company')
    await expect(page.getByRole('heading', { name: '0 jobs' })).toBeVisible()
    await expect(page.getByText('No exact matches')).toBeVisible()
    await expect(
      page.getByLabel('Active filters').getByText('Company: Unknown Company'),
    ).toBeVisible()

    await page.goto('/jobs?country=JAPAN')
    await expect(page.getByRole('alert')).toContainText(
      'invalid_filter: country',
    )
    await expect(page.getByLabel('Country eligibility')).toContainText(
      'Any eligible country',
    )

    await page.goto('/jobs?source=unknown')
    await expect(page.getByRole('alert')).toContainText(
      'invalid_filter: source',
    )
  })

  test('keeps provenance, source labels, and non-filterable labels explicit', async ({
    page,
  }) => {
    await page.goto('/jobs/senior-backend-engineer-kumo-01JRLKUM0F6T')
    await expect(
      page.getByRole('heading', { name: 'Senior Backend Engineer' }),
    ).toBeVisible()
    await expect(page.getByText('Source conflict retained')).toBeVisible()
    await expect(
      page.getByText('source-stated', { exact: true }).first(),
    ).toBeVisible()
    await expect(page.getByText('normalized', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Async team' })).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'View attributed source' }),
    ).toHaveCount(2)
  })

  test('focuses navigation and keeps old editorial URLs safe', async ({
    page,
  }) => {
    await page.goto('/')
    if ((page.viewportSize()?.width ?? 1440) < 768) {
      await page.getByText('Menu', { exact: true }).click()
    }
    const navigation = page.getByRole('navigation', {
      name:
        (page.viewportSize()?.width ?? 1440) < 768
          ? 'Mobile navigation'
          : 'Primary navigation',
    })
    await expect(navigation).toContainText('Index')
    await expect(navigation).not.toContainText('Sources')
    await expect(navigation).not.toContainText('Methodology')
    await page.goto('/sources')
    await expect(page).toHaveURL(/\/#sources$/)
    await page.goto('/methodology')
    await expect(page).toHaveURL(/\/#methodology$/)
    await page.goto('/api')
    await expect(page.locator('#freshness')).toHaveCount(0)
    await page.goto('/skills/install')
    await expect(
      page.getByRole('heading', { name: 'Install from GitHub.' }),
    ).toBeVisible()
    await expect(
      page.getByText('npx skills add windht/remotelens', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByText('Repository package')).toBeVisible()
  })

  test('uses Radix selects in the sticky horizontal Index filters', async ({
    page,
  }) => {
    await page.goto('/jobs')
    await expect(page.locator('.index-toolbar')).toHaveCSS('position', 'sticky')
    const country = page.getByLabel('Country eligibility')
    await country.click()
    await page.getByRole('option', { name: 'Japan (JP)' }).click()
    await expect(country).toContainText('Japan (JP)')
    await page.getByRole('button', { name: 'Apply' }).click()
    expect(new URL(page.url()).searchParams.get('country')).toBe('JP')
  })

  test('has no serious or critical axe violations on critical routes', async ({
    page,
  }) => {
    for (const route of criticalRoutes) {
      await page.goto(route)
      const results = await new AxeBuilder({ page }).analyze()
      const serious = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      )
      expect(serious, `${route}: ${JSON.stringify(serious)}`).toEqual([])
    }
  })

  test('supports skip navigation and has no horizontal overflow', async ({
    page,
  }, testInfo) => {
    await page.goto('/jobs')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()

    for (const route of criticalRoutes) {
      await page.goto(route)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(overflow, `${route} should not overflow`).toBe(false)
      if (
        testInfo.project.name === 'mobile-chromium' &&
        ['/', '/jobs', '/sources', '/api'].includes(route)
      ) {
        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath(
            `${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`,
          ),
        })
      }
    }
  })
})

test.describe('no-JavaScript structured filters', () => {
  test.use({ javaScriptEnabled: false })

  test('submits and reloads exact GET filters', async ({ page }) => {
    await page.goto('/jobs')
    await page.locator('select[name="country"]').selectOption('JP')
    await page
      .locator('select[name="employment_type"]')
      .selectOption('full_time')
    await page.getByText('More exact filters', { exact: true }).click()
    await page.getByLabel('Exact filterable tag').fill('react')
    await page
      .locator('select[name="source"]')
      .selectOption('wwr', { force: true })
    await Promise.all([
      page.waitForURL(/\/jobs\?/),
      page.getByLabel('Exact filterable tag').press('Enter'),
    ])

    const submittedUrl = new URL(page.url())
    expect(submittedUrl.searchParams.get('country')).toBe('JP')
    expect(submittedUrl.searchParams.get('employment_type')).toBe('full_time')
    expect(submittedUrl.searchParams.get('tag')).toBe('react')
    expect(JSON.parse(submittedUrl.searchParams.get('source') ?? '[]')).toEqual(
      ['wwr'],
    )
    await expect(page.getByRole('heading', { name: '1 job' })).toBeVisible()
    await expect(page.getByText('Northstar Labs')).toBeVisible()
    await page.reload()
    await expect(page.locator('select[name="country"]')).toHaveValue('JP')
    await expect(page.locator('select[name="source"]')).toHaveValue('wwr')
    await expect(page.getByLabel('Exact filterable tag')).toHaveValue('react')
    await expect(page.locator('input[name="q"]')).toHaveCount(0)
  })
})
