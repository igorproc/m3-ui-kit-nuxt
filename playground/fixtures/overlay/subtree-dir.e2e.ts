import { expect, test } from '@playwright/test'
import { openFixture, waitForMotion } from '../../e2e/support'

// The menu is teleported out of the `dir="rtl"` subtree of an LTR page: it takes
// the trigger's direction back, and its start aligns with the trigger's start —
// the right edge here, not the page's left.
test('a menu opened from an RTL subtree reads and aligns right-to-left', async ({ page }) => {
  await openFixture(page, 'overlay/subtree-dir', { dir: 'ltr' })
  const trigger = page.getByTestId('menu-trigger')

  await trigger.click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  await waitForMotion(page)

  expect(await menu.evaluate(el => getComputedStyle(el).direction)).toBe('rtl')

  const anchor = (await trigger.boundingBox())!
  const surface = (await menu.boundingBox())!
  expect(surface.x + surface.width).toBeCloseTo(anchor.x + anchor.width, 0)
})
