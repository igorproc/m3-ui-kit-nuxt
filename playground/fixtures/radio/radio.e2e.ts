import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

test.describe('MRadio', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'radio/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('the focus ring is a circle round the 40 layer, not a square', async ({ page }) => {
    await openFixture(page, 'radio/matrix')
    await page.getByRole('radio', { name: 'Standard' }).focus()
    // A keyboard move makes the focus `:focus-visible` for sure.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')

    const ring = await page.getByTestId('group').locator('.ui-radio').first().locator('.ui-radio__container').evaluate((el) => {
      const style = getComputedStyle(el)
      return { outline: style.outlineStyle, radius: Number.parseFloat(style.borderTopLeftRadius), size: el.getBoundingClientRect().width }
    })

    expect(ring.outline).toBe('solid')
    expect(ring.radius).toBeGreaterThanOrEqual(ring.size / 2)
    expect(ring.size / await remInPx(page)).toBeCloseTo(40, 0)
  })

  test('arrows move the selection within the group and skip the disabled radio', async ({ page }) => {
    await openFixture(page, 'radio/matrix')
    await page.getByRole('radio', { name: 'Standard' }).focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'Express' })).toBeChecked()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'Standard' })).toBeChecked()
  })

  test('the group is named by the consumer, described by its line and reports the error once', async ({ page }) => {
    await openFixture(page, 'radio/matrix')
    const invalid = page.getByRole('radiogroup', { name: 'Plan' })

    await expect(page.getByRole('radiogroup', { name: 'Delivery' })).toHaveAttribute('aria-describedby', /.+/)
    await expect(invalid).toHaveAttribute('aria-invalid', 'true')
    // `data-test` lands on the radiogroup, as every non-class attribute does; the line is its sibling.
    const group = page.locator('.ui-radio-group').filter({ has: invalid })
    await expect(group.locator('.ui-choice-support')).toHaveCount(1)
    await expect(group.locator('.ui-choice-support')).toHaveText('Choose a plan')
    await expect(invalid.locator('.ui-radio--error')).toHaveCount(2)
  })

  for (const dir of DIRECTIONS) {
    test(`stress content has no axe violations (${dir})`, async ({ page }) => {
      await openFixture(page, 'radio/stress', { dir })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'radio/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  for (const dir of DIRECTIONS) {
    test(`a long label wraps after the control, on the inline-start side (${dir})`, async ({ page }) => {
      await openFixture(page, 'radio/stress', { dir })
      const rem = await remInPx(page)
      const radio = page.getByTestId('long-group').locator('.ui-radio').first()
      const container = (await radio.locator('.ui-radio__container').boundingBox())!
      const label = (await radio.locator('.ui-radio__label').boundingBox())!

      expect(container.width / rem).toBeCloseTo(40, 0)
      expect(label.height).toBeGreaterThan(container.height)
      if (dir === 'ltr') expect(container.x).toBeLessThan(label.x)
      else expect(container.x).toBeGreaterThan(label.x)
    })
  }

  test('a radio whose value changes after mount gives the group its new value', async ({ page }) => {
    await openFixture(page, 'radio/stress')
    const changing = page.getByRole('radio', { name: 'Changing' })

    await page.getByTestId('change-value').click()
    await expect(changing).toHaveAttribute('value', 'b2')
    await page.getByText('Changing', { exact: true }).click()
    await expect(page.getByTestId('tier')).toHaveText('b2')

    await page.getByTestId('change-value').click()
    await expect(changing).toBeChecked()
    await expect(page.getByTestId('tier')).toHaveText('b')
  })

  test('a group without a name warns in development, a named one does not', async ({ page }) => {
    test.skip(Boolean(process.env.CI || process.env.E2E_PROD), 'dev-only warning; a production build compiles it out')
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('[m-radio-group]')) warnings.push(message.text())
    })

    await openFixture(page, 'radio/matrix')
    expect(warnings).toEqual([])

    await openFixture(page, 'radio/stress')
    await expect.poll(() => warnings.length).toBeGreaterThan(0)
    expect(warnings[0]).toContain('has no name')
  })
})

test.describe('MRadio · touch', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('takes a 48 target on a coarse pointer', async ({ page }) => {
    await openFixture(page, 'radio/matrix')

    const width = await page.getByTestId('standalone').locator('.ui-radio__container').evaluate((el) => {
      const after = getComputedStyle(el, '::after')
      return el.getBoundingClientRect().width - Number.parseFloat(after.left) - Number.parseFloat(after.right)
    })

    expect(width / await remInPx(page)).toBeCloseTo(48, 0)
  })
})
