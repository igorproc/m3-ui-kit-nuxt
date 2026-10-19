import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const box = async (locator: Locator) => (await locator.boundingBox())!
const style = (locator: Locator, property: string, pseudo?: string) =>
  locator.evaluate((el, [name, part]) => getComputedStyle(el, part).getPropertyValue(name!), [property, pseudo] as const)

/**
 * `data-test` is a fallthrough attribute, so it lands on `<table>` with the
 * other ARIA and data attributes; the frame around it holds the footer, the
 * scroll viewport and the status region.
 */
const frame = (page: Page, id: string) => page.locator('.ui-table-container').filter({ has: page.getByTestId(id) })

/** Row and header heights per density step, in rem. */
const HEIGHTS = { compact: [40, 44], default: [52, 56], comfortable: [64, 68] } as const

test.describe('MTable', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'table/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'table/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`matrix and stress do not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await openFixture(page, 'table/matrix')
      await expectNoHorizontalOverflow(page)
      await openFixture(page, 'table/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('rows and the header take their density step', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const unit = await remInPx(page)
    // A collapsed border is shared by two rows, and a row whose content fills
    // the step (the 40 checkbox in a compact row) grows by its share of it, so
    // a row stands at its step plus at most the device-pixel divider.
    const hairline = 1 / unit
    const expectStep = async (row: Locator, step: number, label: string) => {
      const height = (await box(row)).height / unit
      expect(height, label).toBeGreaterThanOrEqual(step - 0.5)
      expect(height, label).toBeLessThanOrEqual(step + hairline + 0.5)
    }

    for (const [density, [row, header]] of Object.entries(HEIGHTS)) {
      const table = page.getByTestId(`density-${density}`)
      await expectStep(table.locator('tbody tr').first(), row, `${density} row`)
      await expectStep(table.locator('thead tr'), header, `${density} header`)
    }
  })

  test('a selected row stays selected under the pointer', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const rows = page.getByTestId('main').locator('tbody tr')
    const selected = rows.nth(1)
    const plain = rows.nth(0)

    await expect(selected).toHaveAttribute('aria-selected', 'true')
    const selectedTone = await style(selected, 'background-color')

    await selected.locator('td').nth(2).hover()
    await waitForMotion(page)
    expect(await style(selected, 'background-color')).toBe(selectedTone)
    expect(Number(await style(selected.locator('td').nth(2), 'opacity', '::before'))).toBeCloseTo(0.08, 2)

    await plain.locator('td').nth(2).hover()
    await waitForMotion(page)
    expect(await style(plain, 'background-color')).not.toBe(selectedTone)
    expect(Number(await style(plain.locator('td').nth(2), 'opacity', '::before'))).toBeCloseTo(0.08, 2)
  })

  // Q-6 (M3-polish): rows that do nothing on click answer no hover.
  test('rows of a table without selection or row-click show no hover layer', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const cell = page.getByTestId('state-partial').locator('tbody tr').first().locator('td').first()

    await cell.hover()
    await waitForMotion(page)
    expect(Number(await style(cell, 'opacity', '::before'))).toBe(0)
  })

  // T-1 (M3-polish): the refresh indicator sat on the header row when a caption stood above it.
  test('the refresh indicator stays below the header, with or without a caption', async ({ page }) => {
    await openFixture(page, 'table/matrix')

    for (const id of ['state-refreshing', 'state-refreshing-caption']) {
      const table = frame(page, id)
      const head = await box(table.locator('thead'))
      const indicator = await box(table.locator('.ui-table-container__busy'))
      expect(indicator.y, id).toBeGreaterThanOrEqual(head.y + head.height)
    }
  })

  // T-2 (M3-polish): previous / next chevrons point the reading direction.
  test('the footer chevrons turn around in RTL', async ({ page }) => {
    for (const [dir, scale] of [['ltr', 'none'], ['rtl', '-1 1']] as const) {
      await openFixture(page, 'table/matrix', { dir })
      const icons = frame(page, 'main').locator('.ui-table__page-icon')

      await expect(icons).toHaveCount(2)
      expect(await style(icons.first(), 'scale'), dir).toBe(scale)
    }
  })

  test('select-all completes the page from a partial selection', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const table = page.getByTestId('main')
    const selectAll = table.getByRole('checkbox', { name: 'Select all orders on this page' })

    await expect(selectAll).not.toBeChecked()

    // The native input is transparent under the drawn box; a click reaches it the way the label's does.
    await selectAll.evaluate(input => (input as HTMLInputElement).click())
    await expect(table.locator('tbody tr[aria-selected="true"]')).toHaveCount(5)
    await expect(selectAll).toBeChecked()
  })

  test('the selection outlives the page: only the page is rendered and select-all is per page', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const table = page.getByTestId('main')
    const next = frame(page, 'main').getByRole('button', { name: 'Next page' })
    const previous = frame(page, 'main').getByRole('button', { name: 'Previous page' })

    await table.getByRole('checkbox', { name: 'Desk lamp' }).evaluate(input => (input as HTMLInputElement).click())
    await expect(page.getByTestId('selected')).toHaveText('Office chair, Monitor arm, Desk lamp')

    await next.click()
    await expect(table.locator('tbody tr')).toHaveCount(2)
    await expect(table.locator('tbody tr[aria-selected="true"]')).toHaveCount(0)
    await expect(page.getByTestId('selected')).toHaveText('Office chair, Monitor arm, Desk lamp')

    await table.getByRole('checkbox', { name: 'Select all orders on this page' }).evaluate(input => (input as HTMLInputElement).click())
    await expect(page.getByTestId('selected')).toHaveText('Office chair, Monitor arm, Desk lamp, Pen, Stapler')

    await previous.click()
    await expect(table.locator('tbody tr[aria-selected="true"]')).toHaveCount(3)
  })

  test('each row checkbox is named by its row', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    await expect(page.getByTestId('main').getByRole('checkbox', { name: 'Desk lamp' })).toHaveCount(1)
  })

  test('sorting cycles and announces itself; every sortable column keeps room for the icon', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const table = page.getByTestId('main')
    const header = table.getByRole('columnheader', { name: 'Amount' })
    const icon = header.locator('.ui-table__sort-icon')
    const iconWidth = (await box(icon)).width

    // The unsorted column already holds the icon's box, only hidden.
    expect(iconWidth).toBeGreaterThan(0)
    expect(await style(icon, 'visibility')).toBe('hidden')

    await header.getByRole('button').click()
    await expect(header).toHaveAttribute('aria-sort', 'ascending')
    await expect(table.locator('tbody tr').first()).toContainText('Pen')
    expect(await style(icon, 'visibility')).toBe('visible')
    expect((await box(icon)).width).toBeCloseTo(iconWidth, 1)

    await header.getByRole('button').click()
    await expect(header).toHaveAttribute('aria-sort', 'descending')
    await expect(frame(page, 'main').getByRole('status')).toContainText('sorted by amount desc')

    await header.getByRole('button').click()
    await expect(header).toHaveAttribute('aria-sort', 'none')
  })

  test('a sort button shows its focus ring inside the header', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const button = page.getByTestId('main').getByRole('columnheader', { name: 'Product' }).getByRole('button')

    await button.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    expect(await style(button, 'outline-style')).toBe('solid')
    expect(Number.parseFloat(await style(button, 'outline-offset'))).toBeLessThan(0)
  })

  test('the footer pages, resizes and tells where it is', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const footer = frame(page, 'main')
    const range = page.getByTestId('range')

    await expect(range).toHaveText('1–5 of 7')
    await footer.getByRole('button', { name: 'Next page' }).click()
    await expect(range).toHaveText('6–7 of 7')
    await expect(footer.getByRole('button', { name: 'Next page' })).toBeDisabled()

    await footer.getByLabel('Rows per page').selectOption('10')
    await expect(range).toHaveText('1–7 of 7')
  })

  test('a row click reports the row, a checkbox click does not', async ({ page }) => {
    await openFixture(page, 'table/matrix')
    const row = page.getByTestId('main').locator('tbody tr').nth(2)

    await row.locator('td').nth(3).click()
    await expect(page.getByTestId('clicked')).toContainText('Cable')

    await page.getByTestId('main').locator('tbody tr').nth(0).getByRole('checkbox').evaluate(input => (input as HTMLInputElement).click())
    await expect(page.getByTestId('main').locator('tbody tr').nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('clicked')).toContainText('Cable')
  })

  test('data states stand in for the rows and mark the table busy', async ({ page }) => {
    await openFixture(page, 'table/matrix')

    await expect(page.getByTestId('state-loading')).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByTestId('state-loading').locator('.ui-loading')).toHaveAttribute('aria-hidden', 'true')
    await expect(page.getByTestId('state-refreshing').locator('tbody tr')).toHaveCount(3)
    await expect(frame(page, 'state-refreshing').locator('.ui-table-container__busy .ui-loading')).toHaveAttribute('aria-hidden', 'true')
    await expect(page.getByTestId('state-empty')).toContainText('No products yet')
    await expect(frame(page, 'state-error').getByRole('status')).toHaveText('Could not load products')
    await expect(page.getByTestId('state-partial').locator('tbody tr')).toHaveCount(3)

    await page.getByTestId('retry').click()
    await expect(page.getByTestId('retry')).toContainText('Retry (1)')
  })

  test('a wide table is a named region the keyboard can scroll', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 })
    await openFixture(page, 'table/stress')
    const region = page.getByRole('region', { name: 'Quarterly report' })

    await expect(region).toHaveAttribute('tabindex', '0')
    for (let step = 0; step < 10 && !(await region.evaluate(el => el === document.activeElement)); step++) {
      await page.keyboard.press('Tab')
    }
    await expect(region).toBeFocused()
    // T-3 (M3-polish): the ring is drawn on the frame, outside the edge-fade mask.
    expect(await style(frame(page, 'wide'), 'outline-style')).toBe('solid')
    expect(await style(region, 'outline-style')).toBe('none')

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => region.evaluate(el => Math.abs(el.scrollLeft))).toBeGreaterThan(0)
  })

  test('a table that fits adds no tab stop', async ({ page }) => {
    await openFixture(page, 'table/stress')
    const viewport = frame(page, 'long').locator('.ui-table-container__viewport')

    await expect(viewport).toHaveCount(1)
    await expect(viewport).not.toHaveAttribute('tabindex', /.*/)
  })

  test('long unbroken values wrap inside a narrow column', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 })
    await openFixture(page, 'table/stress')
    const viewport = frame(page, 'long').locator('.ui-table-container__viewport')

    expect(await viewport.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
  })

  test('figures sit at the end of their column in either direction', async ({ page }) => {
    for (const dir of DIRECTIONS) {
      await openFixture(page, 'table/matrix', { dir })
      const cell = page.getByTestId('main').locator('tbody tr').first().locator('td').nth(3)

      expect(await style(cell, 'text-align'), dir).toBe('end')
      expect(await style(cell, 'font-variant-numeric'), dir).toBe('tabular-nums')
    }
  })

  test('forced colors: a selected row keeps an edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'table/matrix')
    const selected = page.getByTestId('main').locator('tbody tr[aria-selected="true"]').first()

    expect(await style(selected, 'outline-style')).toBe('solid')
  })
})
