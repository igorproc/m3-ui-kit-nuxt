import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { THEMES, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const testId = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)

test.describe('MAlert and MBanner', () => {
  for (const theme of THEMES) {
    test(`stress has no axe violations (${theme})`, async ({ page }) => {
      await openFixture(page, 'feedback/blocks', { theme })
      await expectNoAxeViolations(page)
    })
  }

  test('a long unbroken token wraps inside the alert and the banner at 360', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'feedback/blocks')

    await expectNoHorizontalOverflow(page)
    for (const id of ['alert-long', 'banner-plain', 'banner-tonal']) {
      const fits = await testId(page, id).evaluate(el => el.scrollWidth <= el.clientWidth)
      expect(fits, id).toBe(true)
    }
  })

  test('the blocks keep their edges in forced colours', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'feedback/blocks')

    const style = (id: string, side: 'Top' | 'Bottom') =>
      testId(page, id).evaluate((el, side) => getComputedStyle(el)[`border${side}Style`], side)
    expect(await style('alert-tonal', 'Top')).toBe('solid')
    expect(await style('banner-plain', 'Bottom')).toBe('solid')
    expect(await style('banner-tonal', 'Top')).toBe('solid')
  })

  test('the close controls are named after what they dismiss', async ({ page }) => {
    await openFixture(page, 'feedback/blocks')

    await expect(page.getByRole('button', { name: 'Dismiss: Upload failed' })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Dismiss: Sync is off' })).toHaveCount(1)
  })

  for (const [block, title] of [['alert', 'Upload failed'], ['banner', 'Sync is off']] as const) {
    test(`Tab goes on from where the dismissed ${block} stood`, async ({ page }) => {
      await openFixture(page, 'feedback/blocks')
      const close = page.getByRole('button', { name: `Dismiss: ${title}` })

      await close.focus()
      await page.keyboard.press('Enter')
      await expect(close).toHaveCount(0)
      await expect(testId(page, `after-${block}`)).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(testId(page, `next-after-${block}`)).toBeFocused()
    })
  }
})
