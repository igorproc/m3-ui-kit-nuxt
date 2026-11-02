import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture } from '../../e2e/support'

const testId = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)

test.describe('Feedback', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'feedback/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  // B8.8c: the bar filled from the left in RTL.
  for (const dir of DIRECTIONS) {
    test(`a determinate bar fills from the start edge (${dir})`, async ({ page }) => {
      await openFixture(page, 'feedback/matrix', { dir })
      const root = (await testId(page, 'linear-40').boundingBox())!
      const fill = (await testId(page, 'linear-40').locator('.ui-progress__primary-bar .ui-progress__bar-inner').boundingBox())!

      expect(fill.width / root.width).toBeCloseTo(0.4, 1)
      if (dir === 'ltr') expect(Math.abs(fill.x - root.x)).toBeLessThanOrEqual(1)
      else expect(Math.abs((fill.x + fill.width) - (root.x + root.width))).toBeLessThanOrEqual(1)
    })
  }

  // N.6: the wave was a fixed 1000-unit path scaled by the value.
  test('the wavy bar spans the width and shows its share by clipping', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')
    const root = (await testId(page, 'wavy-40').boundingBox())!
    const wave = testId(page, 'wavy-40').locator('.ui-progress__wave')

    const box = (await wave.boundingBox())!
    expect(Math.abs(box.width - root.width)).toBeLessThanOrEqual(1)
    expect(await wave.evaluate(el => getComputedStyle(el).clipPath)).toContain('60%')
    expect(await wave.evaluate(el => getComputedStyle(el).transform)).toBe('none')
  })

  // M3 2024: a determinate track starts a gap after the bar and ends in a stop indicator.
  test('a started bar leaves a gap before its track and ends it in a stop indicator', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')
    const track = testId(page, 'linear-40').locator('.ui-progress__track')

    expect(await track.evaluate(el => getComputedStyle(el).clipPath)).not.toBe('none')
    expect(await track.evaluate(el => getComputedStyle(el, '::after').content)).toBe('""')
  })

  // B8.8b: reduced motion slows the loop, never stops it.
  test('reduced motion slows the indeterminate loop instead of stopping it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'feedback/matrix')

    const [normal, reduced] = await Promise.all([
      testId(page, 'linear-indeterminate').locator('.ui-progress__primary-bar').evaluate(el => getComputedStyle(el).animationDuration),
      testId(page, 'wavy-indeterminate').locator('.ui-progress__wave').evaluate(el => getComputedStyle(el).animationDuration),
    ])
    expect(normal).toBe('8s')
    expect(reduced).toBe('4s')
  })

  // N.2: the wavy ring's path differed between server and client.
  test('the wavy ring hydrates without a mismatch', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (/hydration/i.test(message.text())) warnings.push(message.text())
    })
    await openFixture(page, 'feedback/matrix')

    expect(warnings).toEqual([])
  })

  // W48-А: the anchor mixin puts the badge on the icon's top-end corner.
  for (const dir of DIRECTIONS) {
    test(`a badge sits on the top-end corner of its icon (${dir})`, async ({ page }) => {
      await openFixture(page, 'feedback/matrix', { dir })
      const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))

      for (const [id, inline, block] of [['anchor-small', 6, 0], ['anchor-large', 12, -2]] as const) {
        const icon = (await testId(page, id).boundingBox())!
        const mark = (await testId(page, id).locator('.ui-badge').boundingBox())!
        expect(Math.abs(mark.y - (icon.y + block * rem)), id).toBeLessThanOrEqual(1)
        const start = dir === 'ltr' ? mark.x - icon.x : (icon.x + icon.width) - (mark.x + mark.width)
        expect(Math.abs(start - (icon.width - inline * rem)), id).toBeLessThanOrEqual(1)
      }
    })
  }

  // W49-А: a long text is cut to four characters with an ellipsis.
  test('a long badge text is cut with an ellipsis', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')
    const label = testId(page, 'badge-long').locator('.ui-badge__label')

    expect(await label.evaluate(el => getComputedStyle(el).textOverflow)).toBe('ellipsis')
    expect(await label.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
  })

  // B8.7b: no value, no slot, no dot — nothing.
  test('an empty badge renders nothing', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')

    await expect(testId(page, 'badge-empty')).toHaveCount(0)
  })

  // B8.7c: forced colours repainted the fill as Canvas and the badge vanished.
  test('a large badge keeps an edge in forced colours', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'feedback/matrix')

    const border = await testId(page, 'badge-large').evaluate(el => getComputedStyle(el).borderTopStyle)
    expect(border).toBe('solid')
  })

  // Q41-В: in stacked layout the close control ends the actions row.
  test('a stacked banner puts its close control after its actions', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')
    const banner = testId(page, 'banner-stacked')
    const action = (await testId(page, 'banner-action').boundingBox())!
    const close = (await banner.locator('.ui-banner__close').boundingBox())!

    expect(Math.abs((close.y + close.height / 2) - (action.y + action.height / 2))).toBeLessThanOrEqual(2)
    expect(close.x).toBeGreaterThan(action.x)

    await testId(page, 'banner-action').focus()
    await page.keyboard.press('Tab')
    await expect(banner.locator('.ui-banner__close')).toBeFocused()
  })
})
