import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const testId = (page: Page, id: string) => page.getByTestId(id)
const shown = (page: Page) => page.locator('.ui-tooltip__content:visible')

async function descriptionOf(trigger: Locator) {
  const id = await trigger.getAttribute('aria-describedby')
  expect(id).toBeTruthy()
  return trigger.page().locator(`[id="${id}"]`)
}

async function hover(page: Page, id: string) {
  await testId(page, id).hover()
  await waitForMotion(page)
}

async function scalesWhileShowing(page: Page, show: () => Promise<void>) {
  const sampling = page.evaluate(() => new Promise<number[]>((resolve) => {
    const scales: number[] = []
    const start = performance.now()
    const tick = () => {
      const el = Array.from(document.querySelectorAll<HTMLElement>('.ui-tooltip__content')).find(node => node.style.display !== 'none')
      if (el) scales.push(new DOMMatrixReadOnly(getComputedStyle(el).transform).a)
      if (performance.now() - start < 500) requestAnimationFrame(tick)
      else resolve(scales)
    }
    requestAnimationFrame(tick)
  }))
  await show()
  return sampling
}

test.describe('MTooltip', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`a shown tooltip has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'tooltip/matrix', { theme, dir })
        await hover(page, 'rich-bottom')

        await expect(shown(page)).toHaveCount(1)
        await expectNoAxeViolations(page)
      })
    }
  }

  test('a long rich tooltip has no axe violations', async ({ page }) => {
    await openFixture(page, 'tooltip/stress')
    await hover(page, 'long-text')

    await expect(shown(page)).toHaveCount(1)
    await expectNoAxeViolations(page)
  })

  test('every trigger is described before it is ever shown, bound or linked by the tooltip', async ({ page }) => {
    await openFixture(page, 'tooltip/matrix')

    for (const id of ['plain-top', 'rich-end', 'auto-link']) {
      const description = await descriptionOf(testId(page, id))
      await expect(description).toHaveAttribute('role', 'tooltip')
      await expect(description).toBeHidden()
    }
    await expect(testId(page, 'plain-top')).toHaveAccessibleDescription('Moves the message out of the inbox (top)')
  })

  test('an empty tooltip describes nothing and never shows', async ({ page }) => {
    await openFixture(page, 'tooltip/stress')

    for (const id of ['empty-bound', 'empty-auto']) {
      await expect(testId(page, id)).not.toHaveAttribute('aria-describedby')
      await hover(page, id)
      await expect(shown(page)).toHaveCount(0)
    }
  })

  test('Tab shows it, Escape hides it and focus stays; a click does not show it', async ({ page }) => {
    await openFixture(page, 'tooltip/matrix')
    const trigger = testId(page, 'plain-bottom')

    await trigger.click()
    await page.mouse.move(0, 0)
    await waitForMotion(page)
    await expect(shown(page)).toHaveCount(0)

    await testId(page, 'plain-top').focus()
    await page.keyboard.press('Tab')
    await expect(trigger).toBeFocused()
    await expect(shown(page)).toHaveText('Moves the message out of the inbox (bottom)')

    await page.keyboard.press('Escape')
    await expect(shown(page)).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('the pointer can move from the trigger onto the tooltip; one tooltip shows at a time', async ({ page }) => {
    await openFixture(page, 'tooltip/matrix')
    await hover(page, 'plain-bottom')

    const surface = (await shown(page).boundingBox())!
    await page.mouse.move(surface.x + surface.width / 2, surface.y + surface.height / 2, { steps: 4 })
    await page.waitForTimeout(250)
    await expect(shown(page)).toHaveCount(1)

    await hover(page, 'plain-top')
    await expect(shown(page)).toHaveCount(1)
    await expect(shown(page)).toHaveText('Moves the message out of the inbox (top)')
  })

  test('a disabled tooltip never shows; a controlled one follows its model', async ({ page }) => {
    await openFixture(page, 'tooltip/matrix')
    await hover(page, 'disabled')
    await expect(shown(page)).toHaveCount(0)

    await testId(page, 'toggle-controlled').click()
    await waitForMotion(page)
    await expect(shown(page)).toHaveText('Opened from outside')
  })

  for (const dir of DIRECTIONS) {
    test(`placement keeps a 4 gap and start / end follow the direction (${dir})`, async ({ page }) => {
      await openFixture(page, 'tooltip/matrix', { dir })
      const rem = await remInPx(page)

      await hover(page, 'plain-bottom')
      let trigger = (await testId(page, 'plain-bottom').boundingBox())!
      let surface = (await shown(page).boundingBox())!
      expect((surface.y - (trigger.y + trigger.height)) / rem).toBeCloseTo(4, 0)

      await hover(page, 'plain-start')
      trigger = (await testId(page, 'plain-start').boundingBox())!
      surface = (await shown(page).boundingBox())!
      if (dir === 'ltr') expect((trigger.x - (surface.x + surface.width)) / rem).toBeCloseTo(4, 0)
      else expect((surface.x - (trigger.x + trigger.width)) / rem).toBeCloseTo(4, 0)
    })
  }

  test('a tooltip inside an open dialog shows above it', async ({ page }) => {
    await openFixture(page, 'tooltip/stress')
    await testId(page, 'open-dialog').click()
    await waitForMotion(page)

    await page.keyboard.press('Tab')
    await expect(testId(page, 'in-dialog')).toBeFocused()
    await waitForMotion(page)

    await expect(shown(page)).toHaveText('Shown above the modal dialog')
    const hit = await shown(page).evaluate((el) => {
      const box = el.getBoundingClientRect()
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return el === top || el.contains(top)
    })
    expect(hit).toBe(true)
  })

  test('a tooltip in a corner stays inside the window', async ({ page }) => {
    await openFixture(page, 'tooltip/stress')

    for (const corner of ['top-start', 'bottom-end']) {
      await hover(page, `corner-${corner}`)
      const box = (await shown(page).boundingBox())!
      const viewport = page.viewportSize()!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    }
  })

  test('forced colors draw the tooltip edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'tooltip/matrix')
    await hover(page, 'plain-bottom')

    expect(await shown(page).evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
  })

  test('the tooltip scales in, and only fades under reduced motion', async ({ page }) => {
    await openFixture(page, 'tooltip/matrix')
    const full = await scalesWhileShowing(page, () => testId(page, 'plain-bottom').hover())
    expect(Math.min(...full)).toBeLessThan(1)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'tooltip/matrix')
    const reduced = await scalesWhileShowing(page, () => testId(page, 'plain-bottom').hover())
    expect(reduced.length).toBeGreaterThan(0)
    expect(Math.min(...reduced)).toBe(1)
  })
})

test.describe('MTooltip on touch', () => {
  test.use({ hasTouch: true })

  async function press(page: Page, id: string, holdMs: number) {
    const box = (await testId(page, id).boundingBox())!
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await page.waitForTimeout(holdMs)
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }

  test('a long press shows the tooltip for a moment', async ({ page }) => {
    await openFixture(page, 'tooltip/matrix')

    await press(page, 'plain-bottom', 700)
    await expect(shown(page)).toHaveText('Moves the message out of the inbox (bottom)')

    await page.waitForTimeout(1700)
    await expect(shown(page)).toHaveCount(0)
  })

  test('a short tap does not show it', async ({ page }) => {
    await openFixture(page, 'tooltip/matrix')

    await press(page, 'plain-bottom', 50)
    await page.waitForTimeout(700)

    await expect(shown(page)).toHaveCount(0)
  })
})

test.describe('MTooltip server HTML', () => {
  test.use({ javaScriptEnabled: false })

  test('names no description id before the surface exists', async ({ page }) => {
    await page.goto('/tooltip/matrix?theme=light&dir=ltr')

    await expect(testId(page, 'plain-top')).toBeAttached()
    await expect(page.locator('.fixture-tooltip [aria-describedby]')).toHaveCount(0)
  })
})
