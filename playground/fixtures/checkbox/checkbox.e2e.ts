import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

const input = (page: import('@playwright/test').Page, id: string) => page.getByTestId(id).locator('input[type="checkbox"]')

test.describe('MCheckbox', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'checkbox/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('a mixed box reports mixed, and a click resolves it to checked', async ({ page }) => {
    await openFixture(page, 'checkbox/matrix')
    const box = input(page, 'parent')

    await expect(box).toHaveJSProperty('indeterminate', true)
    await expect(page.getByTestId('parent').locator('.ui-checkbox')).toHaveClass(/ui-checkbox--indeterminate/)

    await page.getByTestId('parent').locator('label').click()

    await expect(box).toBeChecked()
    await expect(box).toHaveJSProperty('indeterminate', false)
    await expect(page.getByTestId('parent').locator('.ui-checkbox')).not.toHaveClass(/ui-checkbox--indeterminate/)
  })

  test('the error is said in words next to a glyph, and described to assistive tech', async ({ page }) => {
    await openFixture(page, 'checkbox/matrix')
    const line = page.getByTestId('error').locator('.ui-checkbox__support')

    await expect(line).toHaveText('Accept the terms to continue')
    await expect(line.locator('.ui-choice-support__icon')).toBeVisible()
    await expect(input(page, 'error')).toHaveAttribute('aria-describedby', (await line.getAttribute('id'))!)
    await expect(input(page, 'error')).toHaveAttribute('aria-invalid', 'true')
  })

  test('the support line starts under the label text, not under the box', async ({ page }) => {
    await openFixture(page, 'checkbox/matrix')
    const label = (await page.getByTestId('helper').locator('.ui-checkbox__label').boundingBox())!
    const line = page.getByTestId('helper').locator('.ui-checkbox__support')
    const box = (await line.boundingBox())!
    // Where the text starts: the line's box begins under the checkbox, its padding does not.
    const textStart = box.x + await line.evaluate(el => Number.parseFloat(getComputedStyle(el).paddingInlineStart))

    expect(Math.abs(textStart - label.x)).toBeLessThanOrEqual(1)
    expect(box.y).toBeGreaterThanOrEqual(label.y + label.height - 1)
  })

  test('clicking the helper text does not toggle the box', async ({ page }) => {
    await openFixture(page, 'checkbox/matrix')

    await page.getByTestId('helper').locator('.ui-checkbox__support').click()

    await expect(input(page, 'helper')).not.toBeChecked()
  })

  test('a slotted label without a label prop is rendered and names the box', async ({ page }) => {
    await openFixture(page, 'checkbox/matrix')

    await expect(page.getByRole('checkbox', { name: 'I agree to the terms' })).toBeVisible()
  })

  for (const dir of DIRECTIONS) {
    test(`stress content has no axe violations (${dir})`, async ({ page }) => {
      await openFixture(page, 'checkbox/stress', { dir })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'checkbox/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a long label wraps beside a box that keeps its size', async ({ page }) => {
    await openFixture(page, 'checkbox/stress')
    const rem = await remInPx(page)

    for (const id of ['long-label', 'long-word']) {
      const control = (await page.getByTestId(id).locator('.ui-checkbox__control').boundingBox())!
      const label = (await page.getByTestId(id).locator('.ui-checkbox__label').boundingBox())!
      const row = (await page.getByTestId(id).boundingBox())!

      expect(control.width / rem, id).toBeCloseTo(18, 0)
      expect(label.height, id).toBeGreaterThan(control.height)
      expect(label.x + label.width, id).toBeLessThanOrEqual(row.x + row.width + 1)
    }
  })

  test('select all is mixed over a partial selection and resolves it both ways', async ({ page }) => {
    await openFixture(page, 'checkbox/stress')
    const all = input(page, 'select-all')
    const allLabel = page.getByTestId('select-all').locator('label')
    const rows = page.getByTestId('rows').locator('[data-test^="row-"] input')

    await expect(all).toHaveJSProperty('indeterminate', true)
    await allLabel.click()
    await expect(all).toBeChecked()
    await expect(all).toHaveJSProperty('indeterminate', false)
    for (const row of await rows.all()) await expect(row).toBeChecked()

    await allLabel.click()
    for (const row of await rows.all()) await expect(row).not.toBeChecked()

    await page.getByTestId('rows').locator('[data-test^="row-"] label').first().click()
    await expect(all).toHaveJSProperty('indeterminate', true)
    await expect(all).not.toBeChecked()
  })

  test('the check is stroked in on the enter timing, and reduced motion shortens it', async ({ page }) => {
    const drawTime = async () => {
      await openFixture(page, 'checkbox/matrix')
      const mark = page.getByTestId('checked').locator('.ui-checkbox__mark')
      const style = await mark.evaluate((el) => {
        const computed = getComputedStyle(el)
        const index = computed.transitionProperty.split(', ').indexOf('stroke-dashoffset')
        return { offset: computed.strokeDashoffset, duration: Number.parseFloat(computed.transitionDuration.split(', ')[index]!) }
      })
      expect(style.offset).toBe('0px')
      return style.duration
    }

    const full = await drawTime()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const reduced = await drawTime()

    expect(full).toBeGreaterThan(0)
    expect(reduced).toBeGreaterThan(0)
    expect(reduced).toBeLessThan(full)
  })

  test('the glyph fades on short-1 linear, apart from the stroke', async ({ page }) => {
    await openFixture(page, 'checkbox/matrix')
    const timing = await page.getByTestId('unchecked').locator('.ui-checkbox__icon').evaluate((el) => {
      const computed = getComputedStyle(el)
      const index = computed.transitionProperty.split(', ').indexOf('opacity')
      return { duration: computed.transitionDuration.split(', ')[index], easing: computed.transitionTimingFunction.split(/,\s(?![^(]*\))/)[index] }
    })

    expect(timing.duration).toBe('0.05s')
    expect(['linear', 'cubic-bezier(0, 0, 1, 1)']).toContain(timing.easing)
  })

  test('forced colours keep checked, mixed and error visible without colour', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'checkbox/matrix')
    const look = (id: string) => page.getByTestId(id).locator('.ui-checkbox__control').evaluate((el) => {
      const style = getComputedStyle(el)
      const mark = getComputedStyle(el.querySelector('.ui-checkbox__mark')!)
      return { fill: style.backgroundColor, edge: style.borderTopColor, border: style.borderTopStyle, stroke: mark.stroke }
    })

    for (const id of ['checked', 'indeterminate']) {
      const state = await look(id)
      expect(state.fill, id).toBe(state.edge)
      expect(state.fill, id).not.toBe('rgba(0, 0, 0, 0)')
      expect(state.stroke, id).not.toBe(state.fill)
    }
    expect((await look('error')).border).toBe('dashed')
    expect((await look('unchecked')).border).toBe('solid')
  })

  test('forced colours keep the mixed state visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'checkbox/matrix')
    const control = page.getByTestId('indeterminate').locator('.ui-checkbox__control')

    const [fill, edge] = await control.evaluate(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).borderTopColor])
    expect(fill).toBe(edge)
    expect(fill).not.toBe('rgba(0, 0, 0, 0)')
  })
})

test.describe('MCheckbox · touch', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('takes a 48 target on a coarse pointer', async ({ page }) => {
    await openFixture(page, 'checkbox/matrix')
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)

    const target = await page.getByTestId('unchecked').locator('.ui-checkbox__container').evaluate((el) => {
      const after = getComputedStyle(el, '::after')
      return { width: el.getBoundingClientRect().width - Number.parseFloat(after.left) - Number.parseFloat(after.right), content: after.content }
    })

    expect(target.content).not.toBe('none')
    expect(target.width / await remInPx(page)).toBeCloseTo(48, 0)
  })
})
