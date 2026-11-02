import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const testId = (page: Page, id: string) => page.getByTestId(id)
const handle = (page: Page) => page.locator('.ui-sheet__drag-handle')
const sheet = (page: Page) => page.locator('.ui-sheet')

async function openSheet(page: Page, id: string) {
  await testId(page, `open-${id}`).click()
  await waitForMotion(page)
}

interface DragPlan {
  rem: number
  steps: number
  stepDelay: number
  hold: number
}

async function dragDown(page: Page, from: { x: number, y: number }, { rem, steps, stepDelay, hold }: DragPlan) {
  const distance = rem * await remInPx(page)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= steps; step++) {
    await page.mouse.move(from.x, from.y + distance * step / steps)
    if (stepDelay) await page.waitForTimeout(stepDelay)
  }
  if (hold) await page.waitForTimeout(hold)
  await page.mouse.up()
  await waitForMotion(page)
}

async function centreOf(page: Page, selector: string) {
  const box = (await page.locator(selector).first().boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function translationsWhileOpening(page: Page, open: () => Promise<void>) {
  const sampling = page.evaluate(() => new Promise<number[]>((resolve) => {
    const shifts: number[] = []
    const start = performance.now()
    const tick = () => {
      const el = document.querySelector('.ui-sheet')
      if (el) shifts.push(new DOMMatrixReadOnly(getComputedStyle(el).transform).f)
      if (performance.now() - start < 800) requestAnimationFrame(tick)
      else resolve(shifts)
    }
    requestAnimationFrame(tick)
  }))
  await open()
  return sampling
}

test.describe('MSheet', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`an open sheet has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'sheet/matrix', { theme, dir })
        await openSheet(page, 'labelled')

        await expectNoAxeViolations(page)
      })
    }
  }

  test('the stress sheet has no axe violations', async ({ page }) => {
    await openFixture(page, 'sheet/stress')
    await openSheet(page, 'long-word')

    await expectNoAxeViolations(page)
  })

  test('a sheet is named by aria-label or by the heading it points at', async ({ page }) => {
    await openFixture(page, 'sheet/matrix')
    await openSheet(page, 'labelled')

    await expect(page.getByRole('dialog', { name: 'Named by its heading' })).toBeVisible()
  })

  test('focus lands on the sheet and goes back to its activator', async ({ page }) => {
    await openFixture(page, 'sheet/matrix')
    await openSheet(page, 'basic')

    await expect(page.locator('dialog.ui-overlay')).toBeFocused()

    await page.keyboard.press('Escape')
    await waitForMotion(page)
    await expect(testId(page, 'result')).toHaveText('cancel:escape')
    await expect(testId(page, 'open-basic')).toBeFocused()
  })

  test('the scrim cancels; a persistent sheet has no handle and ignores Escape and the scrim', async ({ page }) => {
    await openFixture(page, 'sheet/matrix')
    await openSheet(page, 'basic')
    await page.mouse.click(4, 4)
    await expect(testId(page, 'result')).toHaveText('cancel:outside')
    await waitForMotion(page)

    await openSheet(page, 'persistent')
    await expect(handle(page)).toHaveCount(0)
    await page.keyboard.press('Escape')
    await page.mouse.click(4, 4)
    await waitForMotion(page)
    await expect(testId(page, 'sheet-persistent')).toBeVisible()
  })

  test('the handle is a decorative 48 target with a 32 × 4 pill, only where the swipe is', async ({ page }) => {
    await openFixture(page, 'sheet/matrix')
    await openSheet(page, 'basic')
    const rem = await remInPx(page)

    await expect(handle(page)).toHaveAttribute('aria-hidden', 'true')
    const zone = (await handle(page).boundingBox())!
    expect(zone.width / rem).toBeCloseTo(48, 0)
    expect(zone.height / rem).toBeCloseTo(48, 0)
    const pill = await handle(page).evaluate((el) => {
      const style = getComputedStyle(el, '::before')
      return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height) }
    })
    expect(pill.width / rem).toBeCloseTo(32, 0)
    expect(pill.height / rem).toBeCloseTo(4, 0)

    await page.keyboard.press('Escape')
    await waitForMotion(page)
    await openSheet(page, 'no-swipe')
    await expect(handle(page)).toHaveCount(0)
  })

  test.describe('swipe', () => {
    test('a slow pull shorter than 56 snaps back', async ({ page }) => {
      await openFixture(page, 'sheet/matrix')
      await openSheet(page, 'basic')

      await dragDown(page, await centreOf(page, '.ui-sheet__drag-handle'), { rem: 40, steps: 10, stepDelay: 40, hold: 250 })

      await expect(testId(page, 'sheet-basic')).toBeVisible()
      await expect(testId(page, 'result')).toHaveText('')
    })

    test('a slow pull past 56 closes as a swipe', async ({ page }) => {
      await openFixture(page, 'sheet/matrix')
      await openSheet(page, 'basic')

      await dragDown(page, await centreOf(page, '.ui-sheet__drag-handle'), { rem: 72, steps: 12, stepDelay: 40, hold: 250 })

      await expect(testId(page, 'result')).toHaveText('cancel:swipe')
    })

    test('a quick flick closes however short it is', async ({ page }) => {
      await openFixture(page, 'sheet/matrix')
      await openSheet(page, 'basic')

      await dragDown(page, await centreOf(page, '.ui-sheet__drag-handle'), { rem: 30, steps: 3, stepDelay: 0, hold: 0 })

      await expect(testId(page, 'result')).toHaveText('cancel:swipe')
    })

    test('a pull that starts in the body scrolls it and never closes the sheet', async ({ page }) => {
      await page.setViewportSize({ width: 412, height: 360 })
      await openFixture(page, 'sheet/stress')
      await openSheet(page, 'tall')

      await dragDown(page, await centreOf(page, '[data-test="tall-row"]'), { rem: 120, steps: 4, stepDelay: 0, hold: 0 })

      await expect(testId(page, 'sheet-tall')).toBeVisible()
      await expect(testId(page, 'result')).toHaveText('')
    })
  })

  test('a 412 × 360 window keeps the handle in view and scrolls to the last row', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 360 })
    await openFixture(page, 'sheet/stress')
    await openSheet(page, 'tall')
    const rem = await remInPx(page)

    const box = (await sheet(page).boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(72 * rem - 1)
    await expect(handle(page)).toBeInViewport({ ratio: 1 })

    await page.locator('.ui-sheet__content').evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await expect(testId(page, 'tall-row').last()).toBeInViewport({ ratio: 1 })
    await expect(handle(page)).toBeInViewport({ ratio: 1 })
  })

  test('a long word wraps inside the sheet', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'sheet/stress')
    await openSheet(page, 'long-word')

    expect(await sheet(page).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  })

  test('forced colors keep the sheet edge and the handle pill', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'sheet/matrix')
    await openSheet(page, 'basic')

    expect(await sheet(page).evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
    const pill = await handle(page).evaluate(el => getComputedStyle(el, '::before').backgroundColor)
    expect(pill).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('the sheet slides in, and only fades under reduced motion', async ({ page }) => {
    await openFixture(page, 'sheet/matrix')
    const full = await translationsWhileOpening(page, () => testId(page, 'open-basic').click())
    expect(Math.max(...full)).toBeGreaterThan(0)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'sheet/matrix')
    const reduced = await translationsWhileOpening(page, () => testId(page, 'open-basic').click())
    expect(reduced.length).toBeGreaterThan(0)
    expect(Math.max(...reduced)).toBe(0)
  })
})
