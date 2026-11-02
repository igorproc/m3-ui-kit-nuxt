import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

test.describe('MRating', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'rating/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const dir of DIRECTIONS) {
    test(`the full glyph lies exactly over the empty one — no double star (${dir})`, async ({ page }) => {
      await openFixture(page, 'rating/matrix', { dir })
      const item = page.getByTestId('half').locator('.ui-rating__item').nth(2)

      const empty = (await item.locator('.ui-rating__icon--empty').boundingBox())!
      const full = (await item.locator('.ui-rating__icon--full').boundingBox())!

      expect(full.x).toBeCloseTo(empty.x, 0)
      expect(full.y).toBeCloseTo(empty.y, 0)
      expect(full.width).toBeCloseTo(empty.width, 0)
    })
  }

  test('a half value shows half of the glyph, not half of the 48 cell', async ({ page }) => {
    await openFixture(page, 'rating/matrix')
    const item = page.getByTestId('half').locator('.ui-rating__item').nth(2)

    const glyph = (await item.locator('.ui-rating__icon--empty').boundingBox())!
    const fill = (await item.locator('.ui-rating__fill').boundingBox())!

    expect(fill.x).toBeCloseTo(glyph.x, 0)
    expect(fill.width / glyph.width).toBeCloseTo(0.5, 1)
  })

  for (const dir of DIRECTIONS) {
    test(`stress content has no axe violations (${dir})`, async ({ page }) => {
      await openFixture(page, 'rating/stress', { dir })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'rating/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  for (const [id, length] of [['ten', 10], ['twenty', 20]] as const) {
    test(`${length} items keep their 48 cells in a 320 column, which scrolls instead`, async ({ page }) => {
      await openFixture(page, 'rating/stress')
      const rem = await remInPx(page)
      const column = page.getByTestId(id)
      const items = column.locator('.ui-rating__item')

      await expect(items).toHaveCount(length)
      for (const index of [0, length - 1]) {
        const cell = (await items.nth(index).boundingBox())!
        expect(cell.width / rem, `${id} cell ${index}`).toBeCloseTo(48, 0)
      }
      expect(await column.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
    })
  }

  test('the keyboard reaches the end of a long scale', async ({ page }) => {
    await openFixture(page, 'rating/stress')
    const rating = page.getByTestId('twenty').getByRole('slider')

    await rating.focus()
    await page.keyboard.press('End')
    await expect(rating).toHaveAttribute('aria-valuenow', '20')
    await expect(rating).toHaveAttribute('aria-valuemax', '20')
  })

  test('a press on the last item of a scrolled scale gives the whole scale', async ({ page }) => {
    await openFixture(page, 'rating/stress')
    const rating = page.getByTestId('ten').getByRole('slider')
    const last = rating.locator('.ui-rating__glyph').last()

    await last.scrollIntoViewIfNeeded()
    const glyph = (await last.boundingBox())!
    await page.mouse.click(glyph.x + glyph.width - 2, glyph.y + glyph.height / 2)

    await expect(rating).toHaveAttribute('aria-valuenow', '10')
  })

  test('the page still scrolls vertically over the stars on touch', async ({ page }) => {
    await openFixture(page, 'rating/matrix')

    expect(await page.getByTestId('whole').getByRole('slider').evaluate(el => getComputedStyle(el).touchAction)).toBe('pan-y')
  })

  for (const dir of DIRECTIONS) {
    test(`a press at the start of an item fills that item, measured over its glyph (${dir})`, async ({ page }) => {
      await openFixture(page, 'rating/matrix', { dir })
      const rating = page.getByRole('slider', { name: 'Half-star rating' })
      const glyph = (await rating.locator('.ui-rating__glyph').nth(3).boundingBox())!
      const x = dir === 'rtl' ? glyph.x + glyph.width - 2 : glyph.x + 2

      await page.mouse.click(x, glyph.y + glyph.height / 2)

      await expect(rating).toHaveAttribute('aria-valuenow', '3.5')
    })
  }

  test('a hover fades only what it adds; the committed items stay solid', async ({ page }) => {
    await openFixture(page, 'rating/matrix')
    const rating = page.getByRole('slider', { name: 'Delivery rating' })
    const glyph = (await rating.locator('.ui-rating__glyph').nth(3).boundingBox())!

    await page.mouse.move(glyph.x + glyph.width / 2, glyph.y + glyph.height / 2)

    const added = rating.locator('.ui-rating__preview').nth(3)
    await expect(added).toBeVisible()
    expect(await added.evaluate(el => getComputedStyle(el).opacity)).toBe('0.72')
    expect(await rating.locator('.ui-rating__fill').first().evaluate(el => getComputedStyle(el).opacity)).toBe('1')
    await expect(rating).toHaveAttribute('aria-valuenow', '3')
  })

  test('a right click changes nothing', async ({ page }) => {
    await openFixture(page, 'rating/matrix')
    const rating = page.getByRole('slider', { name: 'Delivery rating' })

    await rating.locator('.ui-rating__glyph').first().click({ button: 'right' })

    await expect(rating).toHaveAttribute('aria-valuenow', '3')
  })

  test('the value is worded by valueText', async ({ page }) => {
    await openFixture(page, 'rating/matrix')
    const rating = page.getByRole('slider', { name: 'Delivery rating' })

    await expect(rating).toHaveAttribute('aria-valuetext', '3 of 5')
    await rating.focus()
    await page.keyboard.press('ArrowRight')
    await expect(rating).toHaveAttribute('aria-valuetext', '4 of 5')
  })
})
