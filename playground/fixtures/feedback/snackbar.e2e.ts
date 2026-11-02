import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const testId = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)
const surface = (page: Page) => page.locator('.ui-snackbar__surface')

test.describe('MSnackbar', () => {
  test('an open snackbar has no axe violations', async ({ page }) => {
    await openFixture(page, 'feedback/snackbar')
    await testId(page, 'open-message').click()
    await waitForMotion(page)

    await expectNoAxeViolations(page)
  })
})

test.describe('MSnackbar at 360', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 })
  })

  test('sits 16 above the navigation bar', async ({ page }) => {
    await openFixture(page, 'feedback/snackbar')
    await testId(page, 'open-message').click()
    await waitForMotion(page)
    const rem = await remInPx(page)

    const bar = (await testId(page, 'bar').boundingBox())!
    const plate = (await surface(page).boundingBox())!
    expect((bar.y - (plate.y + plate.height)) / rem).toBeCloseTo(16, 0)
  })

  test('a long URL wraps inside the plate instead of widening it', async ({ page }) => {
    await openFixture(page, 'feedback/snackbar')
    await testId(page, 'open-url').click()
    await waitForMotion(page)
    const rem = await remInPx(page)

    const plate = (await surface(page).boundingBox())!
    expect(plate.width / rem).toBeLessThanOrEqual(600.5)
    expect(plate.x).toBeGreaterThanOrEqual(0)
    expect(plate.x + plate.width).toBeLessThanOrEqual(360)
    expect(await page.locator('.ui-snackbar__label').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps an edge in forced colours', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'feedback/snackbar')
    await testId(page, 'open-message').click()
    await waitForMotion(page)

    expect(await surface(page).evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
  })

  test('an empty message shows nothing', async ({ page }) => {
    await openFixture(page, 'feedback/snackbar')
    await testId(page, 'open-empty').click()
    await waitForMotion(page)

    await expect(page.locator('.ui-snackbar')).toHaveCount(0)
  })

  test('an empty message warns once in development', async ({ page }) => {
    test.skip(Boolean(process.env.CI || process.env.E2E_PROD), 'dev-only warning; a production build compiles it out')
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.text().includes('[m-snackbar] has no message')) warnings.push(message.text())
    })
    await openFixture(page, 'feedback/snackbar')
    await testId(page, 'open-empty').click()

    await expect.poll(() => warnings.length).toBe(1)
  })
})
