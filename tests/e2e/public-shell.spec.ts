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
    expect(response?.headers()['cache-control']).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
    )
    expect(response?.headers()['x-remotelens-render-mode']).toBe('isr')
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
      'Remote jobs, cleanly indexed.',
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

  test('applies explicit ISR policies to every indexable page class', async ({
    request,
  }) => {
    const dynamicRoutes = [
      '/',
      '/jobs',
      '/jobs?role_family=backend&sort=recently_discovered',
      '/jobs/senior-backend-engineer-kumo-01JRLKUM0F6T',
    ]
    for (const route of dynamicRoutes) {
      const response = await request.get(route)
      expect(response.status(), `${route} should load`).toBe(200)
      expect(response.headers()['cache-control']).toBe(
        'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      )
      expect(response.headers()['cdn-cache-control']).toBe(
        'public, max-age=300, stale-while-revalidate=3600',
      )
      expect(response.headers()['x-remotelens-render-mode']).toBe('isr')
      const html = await response.text()
      expect(html).toContain('main-content')
      if (route.includes('/jobs/senior-backend-engineer')) {
        expect(html).toContain('Senior Backend Engineer')
        expect(html).toContain('Kumo Systems')
        expect(html).toContain(
          'Build and operate dependable product infrastructure',
        )
        expect(html).toContain('https://jsgurujobs.com/jobs/551')
      }
    }

    for (const route of ['/about', '/api', '/privacy', '/skills/install']) {
      const response = await request.get(route)
      expect(response.status(), `${route} should load`).toBe(200)
      expect(response.headers()['cache-control']).toBe(
        'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      )
      expect(response.headers()['cdn-cache-control']).toBe(
        'public, max-age=86400, stale-while-revalidate=604800',
      )
      expect(response.headers()['x-remotelens-render-mode']).toBe('isr')
      expect(await response.text()).toContain('main-content')
    }

    const missingJob = await request.get('/jobs/not-a-real-job')
    expect(missingJob.status()).toBe(404)
    expect(missingJob.headers()['cache-control']).toBe('no-store')
    expect(missingJob.headers()['x-remotelens-render-mode']).toBe('ssr')
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

  test('publishes search identity, hierarchy, and favicon assets', async ({
    page,
    request,
  }) => {
    const assets = [
      ['/favicon.ico', 'image/'],
      ['/favicon.svg', 'image/svg+xml'],
      ['/favicon-16x16.png', 'image/png'],
      ['/favicon-32x32.png', 'image/png'],
      ['/apple-touch-icon.png', 'image/png'],
      ['/icon-192.png', 'image/png'],
      ['/icon-512.png', 'image/png'],
      ['/icon-maskable-512.png', 'image/png'],
      ['/site.webmanifest', 'application/manifest+json'],
    ] as const
    for (const [path, contentType] of assets) {
      const response = await request.get(path)
      expect(response.status(), `${path} should load`).toBe(200)
      expect(response.headers()['content-type']).toContain(contentType)
    }

    const manifestText = await (await request.get('/site.webmanifest')).text()
    const manifest = JSON.parse(manifestText) as unknown
    expect(manifest).toMatchObject({
      name: 'RemoteLens',
      icons: [
        { src: '/icon-192.png', sizes: '192x192' },
        { src: '/icon-512.png', sizes: '512x512' },
        { src: '/icon-maskable-512.png', purpose: 'maskable' },
      ],
    })

    await page.goto('/')
    await expect(page.locator('head link[rel="icon"]')).toHaveCount(4)
    await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/site.webmanifest',
    )
    await expect(
      page.locator('head meta[property="og:site_name"]'),
    ).toHaveAttribute('content', 'RemoteLens')
    const homeStructuredData = await page
      .locator('head script[type="application/ld+json"]')
      .allTextContents()
    expect(
      homeStructuredData
        .map((value) => JSON.parse(value) as { '@graph'?: unknown[] })
        .some((value) => Array.isArray(value['@graph'])),
    ).toBe(true)

    for (const route of [
      '/jobs',
      '/skills/install',
      '/api',
      '/about',
      '/privacy',
    ]) {
      await page.goto(route)
      const canonical = page.locator('head link[rel="canonical"]')
      await expect(canonical).toHaveCount(1)
      await expect(canonical).toHaveAttribute(
        'href',
        `https://remotelens.co${route}`,
      )
      await expect(page.locator('head meta[name="description"]')).toHaveCount(1)
      const structuredData = await page
        .locator('head script[type="application/ld+json"]')
        .allTextContents()
      expect(
        structuredData
          .map((value) => JSON.parse(value) as { '@type'?: string })
          .some((value) => value['@type'] === 'BreadcrumbList'),
      ).toBe(true)
    }
  })

  test('shows exact empty and malformed-filter states', async ({ page }) => {
    await page.goto('/jobs?company=Unknown%20Company')
    await expect(page.getByText(/0 jobs found/)).toBeVisible()
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
    ).toHaveCount(3)
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
    await expect(
      page.getByText('https://remotelens.co/api/v1', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Start with a CV or local profile.' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: 'Prepare applications; you submit.',
      }),
    ).toBeVisible()
    await page.goto('/api')
    await expect(
      page.getByText('GET /api/v1/jobs?country=CN&source=wwr&tag=javascript', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByText('ISO alpha-2 eligibility, for example CN', {
        exact: true,
      }),
    ).toBeVisible()
  })

  test('uses Radix selects in the bounded responsive Index filter panel', async ({
    page,
  }) => {
    await page.goto('/jobs')
    await expect(page.locator('.index-toolbar')).toHaveCSS('position', 'static')
    await expect(page.locator('.index-filter-form')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    )
    await expect(page.locator('.filter-row .filter-label')).toHaveText([
      'Employment',
      'Seniority',
      'Sort',
    ])
    await page.getByText('More exact filters', { exact: true }).click()
    await expect(page.locator('.index-more-grid .filter-label')).toHaveText([
      'Country',
      'Role',
      'Scope',
      'Source',
    ])
    await expect(
      page.getByText('Hide extra filters', { exact: true }),
    ).toBeVisible()
    const country = page.getByLabel('Country eligibility')
    await country.click()
    await page.getByRole('option', { name: 'China (CN)' }).click()
    await expect(country).toContainText('China (CN)')
    await page.getByRole('button', { name: 'Apply' }).click()
    expect(new URL(page.url()).searchParams.get('country')).toBe('CN')
  })

  test('keeps expanded extra filters aligned and multi-row', async ({
    page,
  }, testInfo) => {
    await page.goto('/jobs')
    await page.getByText('More exact filters', { exact: true }).click()
    await expect(
      page.getByText('Hide extra filters', { exact: true }),
    ).toBeVisible()
    await expect(page.locator('.index-more-grid')).toHaveCSS(
      'align-items',
      'center',
    )
    await expect(page.locator('.index-more-grid .filter-label')).toHaveText([
      'Country',
      'Role',
      'Scope',
      'Source',
    ])
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath('jobs-filters-expanded.png'),
    })
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
        route === '/jobs' ||
        (testInfo.project.name === 'mobile-chromium' &&
          ['/', '/sources', '/api'].includes(route))
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
    await page.getByText('More exact filters', { exact: true }).click()
    for (const provider of ['remotejobs', 'remotive', 'jobicy']) {
      await expect(
        page.locator(`select[name="source"] option[value="${provider}"]`),
      ).toHaveCount(1)
    }
    await page.locator('select[name="country"]').selectOption('CN')
    await page
      .locator('select[name="employment_type"]')
      .selectOption('full_time')
    await page.getByLabel('Exact filterable tag').fill('rust')
    await page
      .locator('select[name="source"]')
      .selectOption('jsguru', { force: true })
    await Promise.all([
      page.waitForURL(/\/jobs\?/),
      page.getByLabel('Exact filterable tag').press('Enter'),
    ])

    const submittedUrl = new URL(page.url())
    expect(submittedUrl.searchParams.get('country')).toBe('CN')
    expect(submittedUrl.searchParams.get('employment_type')).toBe('full_time')
    expect(submittedUrl.searchParams.get('tag')).toBe('rust')
    expect(JSON.parse(submittedUrl.searchParams.get('source') ?? '[]')).toEqual(
      ['jsguru'],
    )
    await expect(page.getByText(/1 job found/)).toBeVisible()
    await expect(page.getByText('Kumo Systems')).toBeVisible()
    await expect(page.getByText('via JS Guru Jobs')).toBeVisible()
    await page.reload()
    await expect(page.locator('select[name="country"]')).toHaveValue('CN')
    await expect(page.locator('select[name="source"]')).toHaveValue('jsguru')
    await expect(page.getByLabel('Exact filterable tag')).toHaveValue('rust')
    await expect(page.locator('input[name="q"]')).toHaveCount(0)
  })
})
