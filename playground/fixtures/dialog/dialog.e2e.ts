import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const testId = (page: Page, id: string) => page.getByTestId(id)
const dialogRoot = (page: Page) => page.locator('dialog.ui-overlay')
const content = (page: Page) => page.locator('.ui-dialog__content')
const TRANSPARENT = 'rgba(0, 0, 0, 0)'

async function openDialog(page: Page, id: string) {
  await testId(page, `open-${id}`).click()
  await waitForMotion(page)
}

const frames = (page: Page) => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))

async function scalesWhileOpening(page: Page, open: () => Promise<void>) {
  const sampling = page.evaluate(() => new Promise<number[]>((resolve) => {
    const scales: number[] = []
    const start = performance.now()
    const tick = () => {
      const el = document.querySelector('.ui-dialog')
      if (el) scales.push(new DOMMatrixReadOnly(getComputedStyle(el).transform).a)
      if (performance.now() - start < 700) requestAnimationFrame(tick)
      else resolve(scales)
    }
    requestAnimationFrame(tick)
  }))
  await open()
  return sampling
}

const dividers = (page: Page) => content(page).evaluate((el) => {
  const style = getComputedStyle(el)
  return { start: style.borderTopColor, end: style.borderBottomColor }
})

test.describe('MDialog', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`an open dialog has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'dialog/matrix', { theme, dir })
        await openDialog(page, 'icon')

        await expectNoAxeViolations(page)
      })
    }
  }

  test('an alertdialog is named by its headline and described by its body, axe-clean', async ({ page }) => {
    await openFixture(page, 'dialog/matrix')
    await openDialog(page, 'alert')

    const dialog = page.getByRole('alertdialog', { name: 'Delete project?' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    await expectNoAxeViolations(page)
  })

  test('the stress cases have no axe violations', async ({ page }) => {
    await openFixture(page, 'dialog/stress')
    await openDialog(page, 'stack')

    await expectNoAxeViolations(page)
  })

  test('focus lands on the dialog and goes back to its activator', async ({ page }) => {
    await openFixture(page, 'dialog/matrix')
    await openDialog(page, 'basic')

    await expect(dialogRoot(page)).toBeFocused()

    await page.keyboard.press('Escape')
    await waitForMotion(page)
    await expect(testId(page, 'open-basic')).toBeFocused()
  })

  test('an autofocus control in the body takes the first focus', async ({ page }) => {
    await openFixture(page, 'dialog/matrix')
    await openDialog(page, 'autofocus')

    await expect(testId(page, 'autofocus-field')).toBeFocused()
  })

  test('Escape and the scrim cancel with their reasons; a persistent dialog ignores both', async ({ page }) => {
    await openFixture(page, 'dialog/matrix')

    await openDialog(page, 'basic')
    await page.keyboard.press('Escape')
    await expect(testId(page, 'result')).toHaveText('cancel:escape')
    await waitForMotion(page)

    await openDialog(page, 'basic')
    await page.mouse.click(4, 4)
    await expect(testId(page, 'result')).toHaveText('cancel:outside')
    await waitForMotion(page)

    await openDialog(page, 'persistent')
    await page.keyboard.press('Escape')
    await page.mouse.click(4, 4)
    await waitForMotion(page)
    await expect(testId(page, 'dialog-persistent')).toBeVisible()

    await testId(page, 'persistent-confirm').click()
    await expect(testId(page, 'result')).toHaveText('confirm:persistent')
  })

  test('Tab walks the actions in DOM order and stays inside the dialog', async ({ page }) => {
    await openFixture(page, 'dialog/matrix')
    await openDialog(page, 'three')

    for (const id of ['three-extra', 'three-cancel', 'three-confirm', 'three-extra']) {
      await page.keyboard.press('Tab')
      await expect(testId(page, id)).toBeFocused()
    }
  })

  test('a 360 × 350 window scrolls the body; headline and both actions stay in view', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 350 })
    await openFixture(page, 'dialog/stress')
    await openDialog(page, 'tall')

    await expect(page.locator('.ui-dialog__headline')).toBeInViewport({ ratio: 1 })
    await expect(testId(page, 'tall-cancel')).toBeInViewport({ ratio: 1 })
    await expect(testId(page, 'tall-confirm')).toBeInViewport({ ratio: 1 })
    expect(await content(page).evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
    const panelScrolls = await page.locator('.ui-overlay__panel').evaluate(el => el.scrollHeight > el.clientHeight + 1)
    expect(panelScrolls).toBe(false)
  })

  test('dividers show over and under the body only where it has more to scroll', async ({ page }) => {
    await openFixture(page, 'dialog/stress')
    await openDialog(page, 'tall')

    let colours = await dividers(page)
    expect(colours.start).toBe(TRANSPARENT)
    expect(colours.end).not.toBe(TRANSPARENT)

    await content(page).evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await frames(page)
    colours = await dividers(page)
    expect(colours.start).not.toBe(TRANSPARENT)
    expect(colours.end).toBe(TRANSPARENT)
  })

  test('a body that fits draws no divider', async ({ page }) => {
    await openFixture(page, 'dialog/matrix')
    await openDialog(page, 'basic')

    expect(await dividers(page)).toEqual({ start: TRANSPARENT, end: TRANSPARENT })
  })

  test('actions too long for a row stack with the confirmation on top, Tab still in DOM order', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'dialog/stress')
    await openDialog(page, 'stack')

    const cancel = (await testId(page, 'stack-cancel').boundingBox())!
    const confirm = (await testId(page, 'stack-confirm').boundingBox())!
    expect(confirm.y + confirm.height).toBeLessThanOrEqual(cancel.y + 1)

    await page.keyboard.press('Tab')
    await expect(testId(page, 'stack-cancel')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(testId(page, 'stack-confirm')).toBeFocused()
  })

  test('a word longer than the dialog wraps inside it', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'dialog/stress')
    await openDialog(page, 'long-word')
    const rem = await remInPx(page)

    const box = (await page.locator('.ui-dialog').boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(16 * rem - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(360 - 16 * rem + 1)
    expect(await page.locator('.ui-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  })

  test('forced colors keep the dialog edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'dialog/matrix')
    await openDialog(page, 'basic')

    const edge = await page.locator('.ui-dialog').evaluate((el) => {
      const style = getComputedStyle(el)
      return { style: style.borderTopStyle, width: Number.parseFloat(style.borderTopWidth) }
    })
    expect(edge.style).toBe('solid')
    expect(edge.width).toBeGreaterThan(0)
  })

  test('the dialog scales in, and only fades under reduced motion', async ({ page }) => {
    await openFixture(page, 'dialog/matrix')
    const full = await scalesWhileOpening(page, () => testId(page, 'open-basic').click())
    expect(Math.min(...full)).toBeLessThan(1)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'dialog/matrix')
    const reduced = await scalesWhileOpening(page, () => testId(page, 'open-basic').click())
    expect(reduced.length).toBeGreaterThan(0)
    expect(Math.min(...reduced)).toBe(1)
  })
})
