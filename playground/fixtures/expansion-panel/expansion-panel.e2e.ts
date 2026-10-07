import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, waitForMotion } from '../../e2e/support'

// `data-test` on a panel lands on its header button (EN-04), so tests address
// panels through their buttons and climb to the root or across to the region.
const header = (page: Page, id: string) => page.getByTestId(id)
const rootOf = (button: Locator) => button.locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " ui-expansion-panel ")][1]')
const regionOf = async (page: Page, button: Locator) => page.locator(`[id="${await button.getAttribute('aria-controls')}"]`)
const rem = (page: Page) => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
const px = (locator: Locator, property: string) => locator.evaluate((el, name) => Number.parseFloat(getComputedStyle(el).getPropertyValue(name)), property)

test.describe('MExpansionPanel', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'expansion-panel/matrix', { theme, dir })
        await waitForMotion(page)
        await expectNoAxeViolations(page)
      })
    }
  }

  // A11-11: focusable fields inside collapsed content used to trip `aria-hidden-focus`.
  test('stress content, with a form in a collapsed panel, has no axe violations', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')
    await waitForMotion(page)
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`a long unbroken title wraps instead of overflowing at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'expansion-panel/stress')
      const button = header(page, 'panel-long-word')

      await button.click()
      await waitForMotion(page)
      await expectNoHorizontalOverflow(page)

      const chevron = (await button.locator('.ui-expansion-panel__trailing').boundingBox())!
      const box = (await button.boundingBox())!
      expect(chevron.x + chevron.width).toBeLessThanOrEqual(box.x + box.width)
      expect(chevron.x).toBeGreaterThanOrEqual(box.x)
    })
  }

  test('Tab skips the fields of a collapsed panel', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')

    await header(page, 'panel-form').focus()
    await page.keyboard.press('Tab')

    await expect(header(page, 'panel-after-form')).toBeFocused()
    await expect(await regionOf(page, header(page, 'panel-form'))).toHaveAttribute('inert', '')
  })

  test('Enter and Space open and close the panel; its fields join the Tab order', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')
    const button = header(page, 'panel-form')

    await button.focus()
    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('field-name')).toBeFocused()

    await button.focus()
    await page.keyboard.press('Space')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  test('closing a panel with focus inside moves focus to its header', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')

    await page.getByTestId('close-from-inside').click()

    await expect(header(page, 'panel-close-from-inside')).toHaveAttribute('aria-expanded', 'false')
    await expect(header(page, 'panel-close-from-inside')).toBeFocused()
  })

  test('the heading level wraps the header button in a heading', async ({ page }) => {
    await openFixture(page, 'expansion-panel/matrix')

    const heading = page.getByRole('heading', { level: 3, name: 'Delivery options' })
    await expect(heading.getByRole('button', { name: /Delivery options/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Title, collapsed/ })).toHaveCount(0)
  })

  test('attributes other than class and style reach the header button', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')

    await expect(header(page, 'panel-aria-label')).toHaveJSProperty('tagName', 'BUTTON')
    await expect(header(page, 'panel-aria-label')).toHaveAccessibleName('Untitled section')
  })

  test('an exclusive group closes the open panel when another opens', async ({ page }) => {
    await openFixture(page, 'expansion-panel/matrix')

    await expect(header(page, 'exclusive-b')).toHaveAttribute('aria-expanded', 'true')
    await header(page, 'exclusive-c').click()

    await expect(header(page, 'exclusive-b')).toHaveAttribute('aria-expanded', 'false')
    await expect(header(page, 'exclusive-c')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('exclusive-model')).toHaveText('c')
  })

  test('a multiple group keeps several panels open', async ({ page }) => {
    await openFixture(page, 'expansion-panel/matrix')

    await header(page, 'multiple-c').click()

    await expect(header(page, 'multiple-a')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('multiple-model')).toHaveText('a,c')
  })

  test('in a mandatory group the open panel is aria-disabled and stays open', async ({ page }) => {
    await openFixture(page, 'expansion-panel/matrix')
    const open = header(page, 'mandatory-a')

    await expect(open).toHaveAttribute('aria-disabled', 'true')
    // A pointer can still press an aria-disabled button; Playwright would wait for it to enable.
    await open.click({ force: true })
    await expect(open).toHaveAttribute('aria-expanded', 'true')

    // Locked, not disabled: no hover or pressed layer, a default cursor, the usual text colour.
    const layer = () => open.evaluate(el => getComputedStyle(el, '::before').opacity)
    await open.hover({ force: true })
    expect(await open.evaluate(el => getComputedStyle(el).cursor)).toBe('default')
    await waitForMotion(page)
    expect(await layer()).toBe('0')
    expect(await open.evaluate(el => getComputedStyle(el).color))
      .toBe(await header(page, 'mandatory-b').evaluate(el => getComputedStyle(el).color))

    await header(page, 'mandatory-b').click()
    await expect(open).not.toHaveAttribute('aria-disabled')
    await expect(header(page, 'mandatory-b')).toHaveAttribute('aria-disabled', 'true')
  })

  test('switching multiple keeps the open panels; going exclusive keeps the first', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')
    const model = page.getByTestId('twenty-model')

    await expect(model).toHaveText('p1,p3')
    await page.getByTestId('toggle-multiple').uncheck()

    await expect(model).toHaveText('p1')
    await expect(header(page, 'twenty-1')).toHaveAttribute('aria-expanded', 'true')
    await expect(header(page, 'twenty-3')).toHaveAttribute('aria-expanded', 'false')

    await page.getByTestId('toggle-multiple').check()
    await header(page, 'twenty-5').click()
    await expect(model).toHaveText('p1,p5')
  })

  test('a panel whose value changes keeps working in its group', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')

    await page.getByTestId('rename-second').click()
    await header(page, 'twenty-2').click()

    await expect(header(page, 'twenty-2')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('twenty-model')).toHaveText('p1,p3,p2-renamed')
  })

  test('the focus ring is drawn inside the header, whole', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')
    const button = header(page, 'panel-form')

    await header(page, 'panel-long-word').focus()
    await page.keyboard.press('Tab')
    await expect(button).toBeFocused()

    const width = await px(button, 'outline-width')
    expect(width).toBeGreaterThan(0)
    expect(await px(button, 'outline-offset')).toBeCloseTo(-width, 0)
    expect(await rootOf(button).evaluate(el => getComputedStyle(el).overflow)).toBe('clip')
  })

  test('hover tints the header with a state layer, not a new background', async ({ page }) => {
    await openFixture(page, 'expansion-panel/stress')
    const button = header(page, 'panel-after-form')
    const layer = () => button.evaluate(el => getComputedStyle(el, '::before').opacity)

    expect(await layer()).toBe('0')
    await button.hover()
    await expect.poll(layer).toBe('0.08')
    expect(await button.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  })

  test('a group is segmented: 2 apart, rounded 12 at its ends and 4 inside', async ({ page }) => {
    await openFixture(page, 'expansion-panel/matrix')
    const size = await rem(page)
    const first = rootOf(header(page, 'exclusive-a'))
    const middle = rootOf(header(page, 'exclusive-b'))
    const last = rootOf(header(page, 'exclusive-c'))
    await page.mouse.move(0, 0)
    await waitForMotion(page)

    expect(await px(first, 'border-top-left-radius') / size).toBeCloseTo(12, 0)
    expect(await px(first, 'border-bottom-left-radius') / size).toBeCloseTo(4, 0)
    expect(await px(middle, 'border-top-right-radius') / size).toBeCloseTo(4, 0)
    expect(await px(last, 'border-bottom-right-radius') / size).toBeCloseTo(12, 0)

    const a = (await first.boundingBox())!
    const b = (await middle.boundingBox())!
    expect((b.y - (a.y + a.height)) / size).toBeCloseTo(2, 0)

    const standalone = rootOf(header(page, 'panel-heading'))
    expect(await px(standalone, 'border-bottom-left-radius') / size).toBeCloseTo(12, 0)
  })

  test('reduced motion shortens the height animation rather than removing it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'expansion-panel/stress')
    const region = await regionOf(page, header(page, 'panel-form'))

    const duration = await region.evaluate(el => getComputedStyle(el).transitionDuration)
    expect(duration).toBe('0.1s')
  })

  test('forced colors keep an open panel\'s edge and grey out a disabled one', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'expansion-panel/matrix')

    const open = rootOf(header(page, 'panel-title-expanded'))
    expect(await open.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none')

    const disabled = header(page, 'panel-title-collapsed-disabled')
    await expect(disabled).toBeDisabled()
    const gray = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.style.color = 'GrayText'
      document.body.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })
    expect(await disabled.locator('.ui-expansion-panel__title').evaluate(el => getComputedStyle(el).color)).toBe(gray)
  })
})
