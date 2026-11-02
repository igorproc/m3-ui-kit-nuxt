import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const thumb = (page: Page, id: string, index = 0) => page.getByTestId(id).getByRole('slider').nth(index)

/** Presses the track at `share` (0–1) of its width, measured from its left edge. */
async function pressTrack(page: Page, id: string, share: number) {
  const box = (await page.getByTestId(id).locator('.ui-slider-track').boundingBox())!
  await page.mouse.click(box.x + box.width * share, box.y + box.height / 2)
}

test.describe('MSlider', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'slider/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('formatValue words the label above the thumb and the value text', async ({ page }) => {
    await openFixture(page, 'slider/matrix')

    await expect(thumb(page, 'formatted')).toHaveAttribute('aria-valuetext', '$350')
    await expect(page.getByTestId('formatted').locator('.ui-slider-thumb__value')).toHaveText('$350')
  })

  test('a horizontal slider leaves vertical panning to the page; the thumb holds still', async ({ page }) => {
    await openFixture(page, 'slider/matrix')
    const root = page.getByTestId('single')

    expect(await root.locator('.ui-slider__container').evaluate(el => getComputedStyle(el).touchAction)).toBe('pan-y')
    expect(await root.locator('.ui-slider-track').evaluate(el => getComputedStyle(el).touchAction)).toBe('pan-y')
    expect(await thumb(page, 'single').evaluate(el => getComputedStyle(el).touchAction)).toBe('none')
  })

  test('a vertical slider leaves horizontal panning to the page', async ({ page }) => {
    await openFixture(page, 'slider/matrix')

    expect(await page.getByTestId('vertical').locator('.ui-slider-track').evaluate(el => getComputedStyle(el).touchAction)).toBe('pan-x')
  })

  test('a press on the track jumps from the left edge in LTR', async ({ page }) => {
    await openFixture(page, 'slider/matrix')

    await pressTrack(page, 'single', 0.25)

    await expect(thumb(page, 'single')).toHaveAttribute('aria-valuenow', /^2[3-7]$/)
  })

  test('RTL mirrors the track: a press near the left edge is a high value, the thumb is drawn there', async ({ page }) => {
    await openFixture(page, 'slider/matrix', { dir: 'rtl' })

    await pressTrack(page, 'single', 0.25)

    await expect(thumb(page, 'single')).toHaveAttribute('aria-valuenow', /^7[3-7]$/)
    const track = (await page.getByTestId('single').locator('.ui-slider-track').boundingBox())!
    const knob = (await page.getByTestId('single').locator('.ui-slider-thumb__handle').boundingBox())!
    const share = (knob.x + knob.width / 2 - track.x) / track.width
    expect(share).toBeGreaterThan(0.2)
    expect(share).toBeLessThan(0.3)
  })

  test('RTL swaps the horizontal arrows', async ({ page }) => {
    await openFixture(page, 'slider/matrix', { dir: 'rtl' })
    const control = thumb(page, 'single')

    await control.focus()
    await page.keyboard.press('ArrowLeft')

    await expect(control).toHaveAttribute('aria-valuenow', '41')
  })

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`both copies of the inset icon stand at the track start (${dir})`, async ({ page }) => {
      await openFixture(page, 'slider/matrix', { dir })
      const root = page.getByTestId('comfortable')

      const active = (await root.locator('.ui-slider-track__icon--active').boundingBox())!
      const inactive = (await root.locator('.ui-slider-track__icon--inactive').boundingBox())!

      expect(inactive.x).toBeCloseTo(active.x, 0)
    })
  }

  test('the value shows while stepping with the keyboard and goes on Escape', async ({ page }) => {
    await openFixture(page, 'slider/matrix')
    const control = thumb(page, 'discrete')
    const root = page.getByTestId('discrete').locator('.ui-slider-thumb')

    await control.focus()
    await expect(root).not.toHaveClass(/ui-slider-thumb--value/)

    await page.keyboard.press('ArrowRight')
    await expect(root).toHaveClass(/ui-slider-thumb--value/)

    await page.keyboard.press('Escape')
    await expect(root).not.toHaveClass(/ui-slider-thumb--value/)
  })

  test('hover changes only the cursor: no value, no layer', async ({ page }) => {
    await openFixture(page, 'slider/matrix')
    const root = page.getByTestId('discrete').locator('.ui-slider-thumb')

    await root.hover()

    await expect(root).not.toHaveClass(/ui-slider-thumb--value/)
  })

  for (const dir of DIRECTIONS) {
    test(`stress content has no axe violations (${dir})`, async ({ page }) => {
      await openFixture(page, 'slider/stress', { dir })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'slider/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a million on a 0.01 step words its value and steps by a cent', async ({ page }) => {
    await openFixture(page, 'slider/stress')
    const control = thumb(page, 'huge')

    await expect(control).toHaveAttribute('aria-valuemax', '1000000')
    await expect(control).toHaveAttribute('aria-valuetext', /625\s000,00\s₽/)

    await control.focus()
    await page.keyboard.press('ArrowRight')
    await expect(control).toHaveAttribute('aria-valuenow', '625000.01')
    await expect(page.getByTestId('huge').locator('.ui-slider-thumb__value')).toHaveText(/625\s000,01\s₽/)
    await page.keyboard.press('End')
    await expect(control).toHaveAttribute('aria-valuenow', '1000000')
  })

  test('the value capsule grows with a long formatted value instead of clipping it', async ({ page }) => {
    await openFixture(page, 'slider/stress')
    const control = thumb(page, 'huge')

    await control.focus()
    await page.keyboard.press('End')
    const capsule = page.getByTestId('huge').locator('.ui-slider-thumb__value')
    await expect(capsule).toBeVisible()

    expect(await capsule.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  })

  test('while a thumb is dragged the track and the handle follow it without easing', async ({ page }) => {
    await openFixture(page, 'slider/stress')
    const root = page.getByTestId('many-ticks')
    const handle = (await root.locator('.ui-slider-thumb').boundingBox())!

    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
    await page.mouse.down()
    await page.mouse.move(handle.x + handle.width / 2 + 20, handle.y + handle.height / 2)

    await expect(root.locator('.ui-slider-track')).toHaveClass(/ui-slider-track--dragging/)
    const durations = await root.evaluate(el => ['.ui-slider-track__tick', '.ui-slider-track__segment', '.ui-slider-thumb__handle']
      .map(selector => getComputedStyle(el.querySelector(selector)!).transitionDuration))
    await page.mouse.up()

    expect(durations).toEqual(['0s', '0s', '0s'])
    await expect(root.locator('.ui-slider-track')).not.toHaveClass(/ui-slider-track--dragging/)
    expect(await root.locator('.ui-slider-track__tick').first().evaluate(el => getComputedStyle(el).transitionDuration)).not.toBe('0s')
  })

  test('a range given an origin warns in development', async ({ page }) => {
    test.skip(Boolean(process.env.CI || process.env.E2E_PROD), 'dev-only warning; a production build compiles it out')
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('[m-slider]')) warnings.push(message.text())
    })

    await openFixture(page, 'slider/matrix')
    expect(warnings.filter(text => text.includes('origin'))).toEqual([])

    await openFixture(page, 'slider/stress')
    await expect.poll(() => warnings.filter(text => text.includes('origin')).length).toBeGreaterThan(0)
  })

  test('a range given an origin still fills between its thumbs', async ({ page }) => {
    await openFixture(page, 'slider/stress')

    const track = (await page.getByTestId('range-origin').locator('.ui-slider-track').boundingBox())!
    const fill = (await page.getByTestId('range-origin').locator('.ui-slider-track__segment--active').boundingBox())!
    expect((fill.x - track.x) / track.width).toBeCloseTo(0.3, 1)
  })

  test('the range fill runs between the thumbs in RTL too', async ({ page }) => {
    await openFixture(page, 'slider/matrix', { dir: 'rtl' })
    const track = (await page.getByTestId('range').locator('.ui-slider-track').boundingBox())!
    const fill = (await page.getByTestId('range').locator('.ui-slider-track__segment--active').boundingBox())!

    // [20, 80] from the right edge: the fill spans 20%–80% of the width either
    // way, less the gap cut around each handle.
    expect((fill.x - track.x) / track.width).toBeCloseTo(0.2, 1)
    expect(fill.width / track.width).toBeGreaterThan(0.5)
    expect(fill.width / track.width).toBeLessThan(0.6)
  })
})

test.describe('MSlider · touch', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('a tap on the track jumps the thumb when the finger lifts', async ({ page }) => {
    await openFixture(page, 'slider/matrix')
    const box = (await page.getByTestId('single').locator('.ui-slider-track').boundingBox())!

    await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height / 2)

    await expect(thumb(page, 'single')).toHaveAttribute('aria-valuenow', /^7[3-7]$/)
  })
})
