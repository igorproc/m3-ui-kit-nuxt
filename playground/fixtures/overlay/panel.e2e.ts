import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expectNoAxeViolations, openFixture, waitForMotion } from '../../e2e/support'

const testId = (page: Page, id: string) => page.getByTestId(id)
const scrimAlpha = (page: Page) => page.locator('.ui-overlay__scrim').evaluate((el) => {
  const probe = document.createElement('canvas').getContext('2d')!
  probe.fillStyle = getComputedStyle(el).backgroundColor
  probe.fillRect(0, 0, 1, 1)
  return probe.getImageData(0, 0, 1, 1).data[3]! / 255
})

async function openBare(page: Page) {
  await testId(page, 'open-bare').click()
  await waitForMotion(page)
}

test.describe('MOverlay panel', () => {
  test('bare content taller than a 360 × 350 window starts in view and scrolls to its end', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 350 })
    await openFixture(page, 'overlay/stress')
    await openBare(page)

    const first = (await testId(page, 'bare-first').boundingBox())!
    expect(first.y).toBeGreaterThanOrEqual(0)

    const card = (await testId(page, 'bare-card').boundingBox())!
    await page.mouse.move(card.x + card.width / 2, 175)
    for (let turn = 0; turn < 20; turn++) await page.mouse.wheel(0, 400)
    await expect(testId(page, 'bare-last')).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0)
  })

  test('keyboard focus reaches the end of tall bare content', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 350 })
    await openFixture(page, 'overlay/stress')
    await openBare(page)

    await page.keyboard.press('Tab')
    await expect(testId(page, 'bare-last')).toBeFocused()
    await expect(testId(page, 'bare-last')).toBeInViewport({ ratio: 1 })
  })

  test('an open bare overlay has no axe violations', async ({ page }) => {
    await openFixture(page, 'overlay/stress')
    await openBare(page)

    await expectNoAxeViolations(page)
  })

  test('the scrim dims 32 %, and 50 % when more contrast is asked for', async ({ page }) => {
    await openFixture(page, 'overlay/stress')
    await openBare(page)
    expect(await scrimAlpha(page)).toBeCloseTo(0.32, 1)

    await page.keyboard.press('Escape')
    await waitForMotion(page)
    await page.emulateMedia({ contrast: 'more' })
    await openBare(page)
    expect(await scrimAlpha(page)).toBeCloseTo(0.5, 1)
  })
})
