import { defineConfig, devices } from '@playwright/test'

const port = 3200
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './playground/fixtures',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  // The local dev server compiles each page on first hit; parallel cold loads time out.
  workers: process.env.CI ? undefined : 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    testIdAttribute: 'data-test',
  },
  projects: [
    // 1366 like the fixtures' WIDTHS, not Desktop Chrome's 1280: in the 1201–1280 band the 3rem
    // focus ring renders 1px (an accepted edge of the vw root scale), so ring checks there test
    // the edge instead of the design.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
  ],
  webServer: {
    // CI serves a production build; locally the dev server keeps HMR.
    command: process.env.CI
      ? `npx nuxi build playground && npx nuxi preview playground --port ${port}`
      : `npx nuxi dev playground --port ${port} --host 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
