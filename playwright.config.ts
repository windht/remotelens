import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.REMOTELENS_E2E_PORT ?? 4173)
const baseURL =
  process.env.REMOTELENS_E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const externalServer = process.env.REMOTELENS_E2E_EXTERNAL === '1'
const workersIp = process.env.REMOTELENS_E2E_WORKERS_IP
const externalHostname = new URL(baseURL).hostname

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    ...(workersIp
      ? {
          launchOptions: {
            args: [
              '--no-proxy-server',
              `--host-resolver-rules=MAP ${externalHostname} ${workersIp}`,
            ],
          },
        }
      : {}),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  ...(externalServer
    ? {}
    : {
        webServer: {
          command: `pnpm preview --host 127.0.0.1 --port ${port}`,
          port,
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }),
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
})
