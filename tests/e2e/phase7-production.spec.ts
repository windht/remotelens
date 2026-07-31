import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const production = process.env.REMOTELENS_PHASE7_PRODUCTION === '1'

test.describe('Phase 7 production acceptance', () => {
  test.skip(!production, 'Run only against the deployed production catalog.')

  test('renders bounded landing and Index SSR, then appends cursor pages', async ({
    page,
  }, testInfo) => {
    const landingResponse = await page.goto('/')
    expect(landingResponse?.status()).toBe(200)
    const landingHtml = await landingResponse?.text()
    expect(
      landingHtml?.match(/<article[^>]*class="[^"]*job-row/g),
    ).toHaveLength(10)
    await expect(
      page.getByRole('heading', {
        name: 'See which remote jobs actually fit.',
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Browse the Index' }),
    ).toBeVisible()
    await expect(page.locator('.source-logo').first()).toBeVisible()
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath('phase7-landing.png'),
    })

    const apiRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/jobs?')) {
        apiRequests.push(request.url())
      }
    })
    const indexResponse = await page.goto(
      '/jobs?role_family=engineering&sort=recently_discovered&source=%5B%5D&status=active',
    )
    expect(indexResponse?.status()).toBe(200)
    const indexHtml = await indexResponse?.text()
    expect(indexHtml?.match(/<article[^>]*class="[^"]*job-row/g)).toHaveLength(
      10,
    )
    await expect(page.locator('.index-toolbar')).toHaveCSS('position', 'sticky')
    await expect(page.locator('article.job-row')).toHaveCount(10)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect
      .poll(() => page.locator('article.job-row').count(), { timeout: 15_000 })
      .toBeGreaterThan(10)

    const hrefs = await page
      .locator('article.job-row a[href^="/jobs/"]')
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLAnchorElement).pathname),
      )
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(
      apiRequests.some(
        (url) => new URL(url).searchParams.get('limit') === '10',
      ),
    ).toBe(true)
    expect(
      apiRequests.some((url) =>
        Boolean(new URL(url).searchParams.get('cursor')),
      ),
    ).toBe(true)

    if (testInfo.project.name === 'mobile-chromium') {
      const toolbar = await page.locator('.index-toolbar').boundingBox()
      expect(toolbar?.height).toBeLessThan(160)
    }
    const serious = (
      await new AxeBuilder({ page }).analyze()
    ).violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    )
    expect(serious).toEqual([])
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath('phase7-index.png'),
    })
  })

  test('exposes the focused navigation, redirects, API, and Skill copy', async ({
    page,
  }, testInfo) => {
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
    await expect(navigation).toContainText('Agent Skill')
    await expect(navigation).toContainText('API')
    await expect(navigation).not.toContainText('Sources')
    await expect(navigation).not.toContainText('Methodology')

    await page.goto('/sources')
    await expect(page).toHaveURL(/\/#sources$/)
    await expect(page.getByText('DevOps/Sysadmin is outside V1')).toHaveCount(0)
    await page.goto('/methodology')
    await expect(page).toHaveURL(/\/#methodology$/)
    await page.goto('/api')
    await expect(page.locator('#freshness')).toHaveCount(0)
    await expect(page.locator('a[href="#freshness"]')).toHaveCount(0)
    await page.goto('/skills/install')
    await expect(
      page.getByText('npx skills add windht/remotelens', {
        exact: true,
      }),
    ).toBeVisible()
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath('phase7-skill.png'),
    })
  })
})
