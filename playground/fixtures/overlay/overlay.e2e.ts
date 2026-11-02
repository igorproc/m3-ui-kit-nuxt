import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const testId = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)
const viewportHeight = (page: Page) => page.evaluate(() => window.innerHeight)

test.describe('Overlays', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`an open menu has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'overlay/matrix', { theme, dir })
        await testId(page, 'menu-trigger').click()
        await waitForMotion(page)

        await expectNoAxeViolations(page)
      })
    }
  }

  // B4.4a: the dialog had no height limit and clipped its own overflow.
  test('a tall dialog keeps its margin and scrolls its body', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    await testId(page, 'open-tall-dialog').click()
    await waitForMotion(page)
    const rem = await remInPx(page)

    const box = (await page.locator('.ui-dialog').boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(16 * rem - 1)
    expect(box.y + box.height).toBeLessThanOrEqual(await viewportHeight(page) - 16 * rem + 1)

    const content = page.locator('.ui-dialog__content')
    expect(await content.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
    await expect(page.locator('.ui-dialog__actions')).toBeInViewport()
  })

  // Q17-А: the actions slot answers, and the answer reaches the caller.
  test('the dialog confirms through its actions slot', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    await testId(page, 'open-tall-dialog').click()
    await waitForMotion(page)

    await testId(page, 'dialog-confirm').click()

    await expect(testId(page, 'dialog-result')).toHaveText('confirm:accepted')
  })

  test('Escape on the dialog is a cancel', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    await testId(page, 'open-tall-dialog').click()
    await waitForMotion(page)

    await page.keyboard.press('Escape')

    await expect(testId(page, 'dialog-result')).toHaveText('cancel:escape')
  })

  // B4.4b: the sheet grew past the top of the window.
  test('a tall sheet leaves room above it and scrolls its body', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    await testId(page, 'open-tall-sheet').click()
    await waitForMotion(page)
    const rem = await remInPx(page)

    const box = (await page.locator('.ui-sheet').boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(72 * rem - 1)
    const content = page.locator('.ui-sheet__content')
    expect(await content.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
  })

  // Q15-А: Tab leaves the menu for the element after its trigger.
  test('Tab closes the menu and moves on from its trigger', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    await testId(page, 'menu-trigger').click()
    await waitForMotion(page)
    await expect(testId(page, 'menu-copy')).toBeFocused()

    await page.keyboard.press('Tab')

    await expect(page.locator('.ui-menu__surface')).toHaveCount(0)
    await expect(testId(page, 'after-menu')).toBeFocused()
  })

  test('Escape closes the menu and gives focus back to its trigger', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    await testId(page, 'menu-trigger').focus()
    await page.keyboard.press('Enter')
    await waitForMotion(page)

    await page.keyboard.press('ArrowDown')
    await expect(testId(page, 'menu-cut')).toBeFocused()
    await expect(testId(page, 'menu-cut')).toHaveAttribute('aria-disabled', 'true')
    await page.keyboard.press('Escape')

    await expect(testId(page, 'menu-trigger')).toBeFocused()
  })

  // Q26-А: start / end follow the writing direction.
  for (const dir of DIRECTIONS) {
    test(`a bottom-start menu lines up with the trigger's start edge (${dir})`, async ({ page }) => {
      await openFixture(page, 'overlay/matrix', { dir })
      await testId(page, 'menu-trigger').click()
      await waitForMotion(page)

      // Slotted into the button's label, the menu still attaches to the button itself.
      const trigger = (await testId(page, 'menu-trigger').boundingBox())!
      const surface = (await page.locator('.ui-menu__surface').boundingBox())!
      if (dir === 'ltr') expect(Math.abs(surface.x - trigger.x)).toBeLessThanOrEqual(1)
      else expect(Math.abs((surface.x + surface.width) - (trigger.x + trigger.width))).toBeLessThanOrEqual(1)
      expect(surface.y).toBeGreaterThanOrEqual(trigger.y + trigger.height - 1)
    })
  }

  // Q19-В, B4.7b: described before it shows; keyboard focus shows it, a click does not.
  test('the tooltip describes its trigger and shows on keyboard focus only', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    const trigger = testId(page, 'tooltip-trigger')
    const id = await trigger.getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    await expect(page.locator(`[id="${id}"]`)).toHaveText('Archive the message')

    await trigger.click()
    await page.mouse.move(0, 0)
    await page.waitForTimeout(200)
    await expect(page.locator('.ui-tooltip__content')).toBeHidden()

    await testId(page, 'menu-trigger').focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(trigger).toBeFocused()
    await expect(page.locator('.ui-tooltip__content')).toBeVisible()
  })

  // B4.9a / B4.9b: inverse colours; the message goes through a persistent region.
  test('the snackbar is drawn inverse and announced through a live region', async ({ page }) => {
    await openFixture(page, 'overlay/matrix')
    await testId(page, 'open-snackbar').click()
    await waitForMotion(page)

    const colours = await page.locator('.ui-snackbar__surface').evaluate((el) => {
      const probe = document.createElement('div')
      probe.style.background = 'var(--md-sys-color-inverse-surface)'
      document.body.append(probe)
      const expected = getComputedStyle(probe).backgroundColor
      probe.remove()
      return { actual: getComputedStyle(el).backgroundColor, expected }
    })
    expect(colours.actual).toBe(colours.expected)
    await expect(page.locator('.ui-live-region [role="status"]').filter({ hasText: 'Message archived' })).toHaveCount(1)
  })
})
