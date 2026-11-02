import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expectNoAxeViolations, openFixture, remInPx } from '../../e2e/support'

const testId = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)

type RingPart = 'value' | 'track' | 'none'

async function ringPartAt(page: Page, id: string, degrees: number): Promise<RingPart> {
  return testId(page, id).evaluate((svg, degrees) => {
    const box = svg.getBoundingClientRect()
    const radius = box.width * 18 / 48
    const angle = degrees * Math.PI / 180
    const hit = document.elementFromPoint(box.x + box.width / 2 + radius * Math.sin(angle), box.y + box.height / 2 - radius * Math.cos(angle))
    if (hit?.classList.contains('ui-progress__svg-value')) return 'value'
    if (hit?.classList.contains('ui-progress__svg-track')) return 'track'
    return 'none'
  }, degrees)
}

test.describe('MProgress', () => {
  test('the wavy bar is 10 high with a 40 wavelength, 20 while indeterminate', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')
    const rem = await remInPx(page)
    const height = (await testId(page, 'wavy-40').boundingBox())!.height
    const [determinate, indeterminate] = await Promise.all(['wavy-40', 'wavy-indeterminate'].map(id =>
      testId(page, id).locator('.ui-progress__wave').evaluate(el => Number.parseFloat(getComputedStyle(el).maskSize))))

    expect(height / rem).toBeCloseTo(10, 0)
    expect(determinate! / rem).toBeCloseTo(40, 0)
    expect(indeterminate! / rem).toBeCloseTo(20, 0)
  })

  test('a determinate wave ends its flat track in a stop indicator', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')
    const rem = await remInPx(page)
    const track = testId(page, 'wavy-40').locator('.ui-progress__track')

    expect(await track.evaluate(el => getComputedStyle(el, '::after').content)).toBe('""')
    expect((await track.boundingBox())!.height / rem).toBeCloseTo(4, 0)
  })

  test('the bar is rounded by the full corner token', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')

    const [radius, full] = await testId(page, 'linear-40').evaluate((el) => {
      const probe = document.createElement('div')
      probe.style.borderRadius = 'var(--sys-shape-corner-full)'
      document.body.append(probe)
      const expected = getComputedStyle(probe).borderTopLeftRadius
      probe.remove()
      return [getComputedStyle(el).borderTopLeftRadius, expected]
    })
    expect(radius).toBe(full)
  })

  test('the root contains layout and style only, so the wave is not clipped', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')

    for (const id of ['linear-labelled', 'circular-labelled']) {
      const root = page.locator('.ui-progress').filter({ has: testId(page, id) })
      expect(await root.evaluate(el => getComputedStyle(el).contain), id).toBe('layout style')
    }
  })

  test('a ring at 60% starts at 12 o\'clock and runs clockwise', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await openFixture(page, 'feedback/matrix')

    expect(await ringPartAt(page, 'circular-comfortable', 1)).toBe('value')
    expect(await ringPartAt(page, 'circular-comfortable', 90)).toBe('value')
    expect(await ringPartAt(page, 'circular-comfortable', 180)).toBe('value')
    expect(await ringPartAt(page, 'circular-comfortable', 270)).toBe('track')
  })

  test('a ring leaves a visible gap between its value and its track', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await openFixture(page, 'feedback/matrix')
    const capAndHalfGap = (4 / 2 + 4 / 2) / 18 * 180 / Math.PI

    expect(await ringPartAt(page, 'circular-comfortable', 216 + capAndHalfGap)).toBe('none')
    expect(await ringPartAt(page, 'circular-comfortable', 360 - capAndHalfGap)).toBe('none')
  })

  test('a caption names its progressbar from outside the role', async ({ page }) => {
    await openFixture(page, 'feedback/matrix')

    await expect(page.getByRole('progressbar', { name: 'Uploading 3 of 10 files' })).toHaveCount(1)
    await expect(page.getByRole('progressbar', { name: 'Syncing photos' })).toHaveCount(1)
    expect(await page.getByText('Uploading 3 of 10 files').evaluate(el => Boolean(el.closest('[role="progressbar"]')))).toBe(false)
  })

  test('the labelled matrix has no axe violations', async ({ page }) => {
    await openFixture(page, 'feedback/matrix', { dir: 'rtl' })
    await expectNoAxeViolations(page)
  })

  test('track and bar keep system colours in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'feedback/matrix')

    expect(await testId(page, 'linear-40').locator('.ui-progress__track').evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
    expect(await testId(page, 'wavy-40').locator('.ui-progress__wave').evaluate(el => getComputedStyle(el).forcedColorAdjust)).toBe('none')
  })
})
