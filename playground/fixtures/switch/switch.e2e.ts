import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

/** Where the thumb's centre sits along the track: 0 at the left edge, 1 at the right. */
async function thumbAlong(page: Page, id: string) {
  const root = page.getByTestId(id)
  const track = (await root.locator('.ui-switch__track').boundingBox())!
  const thumb = (await root.locator('.ui-switch__thumb').boundingBox())!

  return (thumb.x + thumb.width / 2 - track.x) / track.width
}

test.describe('MSwitch', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'switch/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('the thumb sits at the inline end when on, at the inline start when off (ltr)', async ({ page }) => {
    await openFixture(page, 'switch/matrix')
    await waitForMotion(page)

    expect(await thumbAlong(page, 'on')).toBeGreaterThan(0.5)
    expect(await thumbAlong(page, 'off')).toBeLessThan(0.5)
  })

  test('mirrors in RTL: on is on the left, off on the right, both inside the track', async ({ page }) => {
    await openFixture(page, 'switch/matrix', { dir: 'rtl' })
    await waitForMotion(page)

    const on = await thumbAlong(page, 'on')
    const off = await thumbAlong(page, 'off')

    expect(on).toBeLessThan(0.5)
    expect(on).toBeGreaterThan(0)
    expect(off).toBeGreaterThan(0.5)
    expect(off).toBeLessThan(1)
  })

  test('an invalid switch takes the error role on its edge and says why', async ({ page }) => {
    await openFixture(page, 'switch/matrix')
    const root = page.getByTestId('error')
    const [edge, error] = await root.evaluate((el) => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--md-sys-color-error)'
      el.append(probe)
      const value = [getComputedStyle(el.querySelector('.ui-switch__track')!).borderTopColor, getComputedStyle(probe).color]
      probe.remove()
      return value
    })

    expect(edge).toBe(error)
    await expect(root.locator('.ui-switch__support')).toHaveText('Turn this on to continue')
    await expect(page.getByRole('switch', { name: 'Setting, error', exact: true })).toHaveAttribute('aria-invalid', 'true')
  })

  for (const dir of DIRECTIONS) {
    test(`stress content has no axe violations (${dir})`, async ({ page }) => {
      await openFixture(page, 'switch/stress', { dir })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'switch/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a long label wraps beside a track that keeps its 52 × 32', async ({ page }) => {
    await openFixture(page, 'switch/stress')
    const rem = await remInPx(page)

    for (const id of ['long-label', 'long-word']) {
      const track = (await page.getByTestId(id).locator('.ui-switch__track').boundingBox())!
      const label = (await page.getByTestId(id).locator('.ui-switch__label').boundingBox())!

      expect(track.width / rem, id).toBeCloseTo(52, 0)
      expect(track.height / rem, id).toBeCloseTo(32, 0)
      expect(label.height, id).toBeGreaterThan(track.height)
    }
  })

  for (const id of ['off', 'on']) {
    test(`a pressed thumb is a 28 circle (${id})`, async ({ page }) => {
      await openFixture(page, 'switch/matrix')
      await waitForMotion(page)
      const rem = await remInPx(page)
      const root = page.getByTestId(id)

      await root.locator('.ui-switch__track').hover()
      await page.mouse.down()
      const thumb = (await root.locator('.ui-switch__thumb').boundingBox())!
      await page.mouse.up()

      expect(thumb.width / rem).toBeCloseTo(28, 0)
      expect(thumb.height / rem).toBeCloseTo(28, 0)
    })
  }

  test('icons: a glyph sits in a 24 thumb only where the axis shows one', async ({ page }) => {
    await openFixture(page, 'switch/matrix')
    await waitForMotion(page)
    const rem = await remInPx(page)
    const thumb = async (id: string) => (await page.getByTestId(id).locator('.ui-switch__thumb').boundingBox())!.width / rem
    const glyphs = (id: string) => page.getByTestId(id).locator('.ui-switch__icon')

    for (const [id, size, count] of [
      ['icons-none-off', 16, 0],
      ['icons-none-on', 24, 0],
      ['icons-selected-off', 16, 0],
      ['icons-selected-on', 24, 1],
      ['icons-both-off', 24, 1],
      ['icons-both-on', 24, 1],
      ['icons-both-disabled-off', 24, 1],
    ] as const) {
      expect(await thumb(id), id).toBeCloseTo(size, 0)
      await expect(glyphs(id), id).toHaveCount(count)
    }

    const glyph = await glyphs('icons-both-on').evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize))
    expect(glyph / rem).toBeCloseTo(16, 0)
  })

  test('Space toggles the focused switch', async ({ page }) => {
    await openFixture(page, 'switch/matrix')
    const control = page.getByRole('switch', { name: 'Setting, off', exact: true })

    await control.focus()
    await page.keyboard.press('Space')

    await expect(control).toBeChecked()
  })
})
