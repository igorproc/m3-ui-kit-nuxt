import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

/** The colour a system role (or a system colour) resolves to on this page. */
const colorOf = (page: Page, value: string) => page.evaluate((background) => {
  const probe = document.createElement('div')
  probe.style.backgroundColor = background
  document.body.append(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}, value)

const role = (page: Page, name: string) => colorOf(page, `var(--md-sys-color-${name})`)
const container = (page: Page, id: string) => page.getByTestId(id).locator('.ui-toolbar__container')

test.describe('MToolbar', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'toolbar/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  // B5.6a–c (moved here from navigation/matrix)
  test('the toolbar is named, says its orientation and which items are pressed', async ({ page }) => {
    await openFixture(page, 'toolbar/matrix')
    const toolbar = page.getByRole('toolbar', { name: 'Formatting', exact: true })
    const vertical = page.getByRole('toolbar', { name: 'Alignment' })

    await expect(toolbar).not.toHaveAttribute('aria-orientation')
    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical')

    const list = page.getByRole('toolbar', { name: 'Views' }).getByRole('button', { name: 'List' })
    await expect(list.locator('.ui-icon')).toHaveCount(1)
    await expect(list).toContainText('List')

    const bold = toolbar.getByRole('button', { name: 'Bold' })
    await expect(bold).toHaveAttribute('aria-pressed', 'false')
    await expect(toolbar.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'true')
    await expect(vertical.getByRole('button', { name: 'Align center' })).toHaveAttribute('aria-pressed', 'true')

    await bold.click()
    await expect(bold).toHaveAttribute('aria-pressed', 'true')
  })

  test('a docked bar is 64 high with 16 at the edges; a floating one keeps 4 between items', async ({ page }) => {
    await openFixture(page, 'toolbar/matrix')
    const rem = await remInPx(page)
    const docked = container(page, 'docked-standard')
    const floating = container(page, 'floating-standard')

    expect((await docked.boundingBox())!.height).toBeCloseTo(64 * rem, 0)
    expect(Number.parseFloat(await style(docked, 'padding-left'))).toBeCloseTo(16 * rem, 0)
    expect((await floating.boundingBox())!.height).toBeCloseTo(64 * rem, 0)
    expect(Number.parseFloat(await style(floating, 'column-gap'))).toBeCloseTo(4 * rem, 0)
  })

  // The selected look used to be the primary tonal fill.
  test('a selected item is secondary-container in the standard scheme', async ({ page }) => {
    await openFixture(page, 'toolbar/matrix')
    const italic = page.getByTestId('floating-standard').getByRole('button', { name: 'Italic' })

    await expect(italic).toHaveAttribute('aria-pressed', 'true')
    expect(await style(italic, 'background-color')).toBe(await role(page, 'secondary-container'))
    expect(await style(container(page, 'floating-standard'), 'background-color')).toBe(await role(page, 'surface-container'))
  })

  // W66-Б
  test('the vibrant scheme is a primary-container bar with surface-container selections', async ({ page }) => {
    await openFixture(page, 'toolbar/matrix')
    const bar = container(page, 'floating-vibrant')
    const italic = page.getByTestId('floating-vibrant').getByRole('button', { name: 'Italic' })
    const bold = page.getByTestId('floating-vibrant').getByRole('button', { name: 'Bold' })

    expect(await style(bar, 'background-color')).toBe(await role(page, 'primary-container'))
    expect(await style(italic, 'background-color')).toBe(await role(page, 'surface-container'))
    expect(await style(italic, 'color')).toBe(await role(page, 'on-surface'))
    expect(await style(bold, 'color')).toBe(await role(page, 'on-primary-container'))
  })

  test('the FAB sits beside the floating bar, 8 after it in the reading direction', async ({ page }) => {
    for (const dir of DIRECTIONS) {
      await openFixture(page, 'toolbar/matrix', { dir })
      const rem = await remInPx(page)
      const bar = (await container(page, 'floating-vibrant').boundingBox())!
      const fab = (await page.getByTestId('fab').boundingBox())!
      const gap = dir === 'ltr' ? fab.x - (bar.x + bar.width) : bar.x - (fab.x + fab.width)

      expect(gap, dir).toBeCloseTo(8 * rem, 0)
    }
  })

  // W67-А
  test('the items past maxVisible are reached and chosen through the "more" menu', async ({ page }) => {
    await openFixture(page, 'toolbar/matrix')
    const docked = page.getByTestId('docked-standard')
    const more = docked.getByRole('button', { name: 'More views' })

    await expect(docked.locator('.ui-toolbar__item')).toHaveCount(3)
    await expect(more).toHaveAttribute('aria-expanded', 'false')

    await more.click()
    await waitForMotion(page)
    await expect(more).toHaveAttribute('aria-expanded', 'true')
    const calendar = page.getByRole('menuitemradio', { name: 'Calendar' })
    await expect(calendar).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByRole('menuitemradio', { name: 'Timeline' })).toHaveAttribute('aria-disabled', 'true')

    await calendar.click()
    await expect(page.getByTestId('view')).toHaveText('calendar')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('a row that does not fit scrolls inside the bar and never widens the page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'toolbar/matrix')
    const narrow = container(page, 'narrow')

    expect(await style(narrow, 'overflow-x')).toBe('auto')
    expect(await narrow.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
    await expectNoHorizontalOverflow(page)
  })

  test('forced colors: a selected item stays distinct', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'toolbar/matrix')
    const italic = page.getByTestId('floating-standard').getByRole('button', { name: 'Italic' })
    const bold = page.getByTestId('floating-standard').getByRole('button', { name: 'Bold' })

    expect(await style(italic, 'background-color')).toBe(await colorOf(page, 'Highlight'))
    expect(await style(bold, 'background-color')).not.toBe(await colorOf(page, 'Highlight'))
  })
})
