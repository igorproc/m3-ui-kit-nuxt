import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

test.describe('MSelectionGroup', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`reference markup has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'selection-group/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('a thousand items have no axe violations', async ({ page }) => {
    await openFixture(page, 'selection-group/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`a thousand items do not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'selection-group/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('data rows taken from the scope sit inside the element that carries groupAttrs', async ({ page }) => {
    await openFixture(page, 'selection-group/matrix')
    const group = page.getByRole('radiogroup', { name: 'Plan' })

    await expect(group.getByRole('radio')).toHaveCount(3)
    await expect(page.getByRole('radio')).toHaveCount(3)
    await expect(group.getByRole('radio', { name: 'Pro' })).toHaveAttribute('aria-checked', 'true')

    await group.getByRole('radio', { name: 'Team' }).click()
    await expect(page.getByTestId('plan')).toHaveText('team')
    await expect(group.getByRole('radio', { name: 'Team' })).toHaveAttribute('aria-checked', 'true')
    await expect(group.getByRole('radio', { name: 'Pro' })).toHaveAttribute('aria-checked', 'false')
  })

  test('the server frame already has the rows inside the wrapper, once', async ({ page, request }) => {
    const html = await (await request.get('/selection-group/matrix')).text()
    const wrapper = html.slice(html.indexOf('data-test="plans"'), html.indexOf('data-test="plan"'))

    expect(wrapper.match(/role="radio"/g)).toHaveLength(3)
    expect(html.match(/data-test="plan-pro"/g)).toHaveLength(1)
    await openFixture(page, 'selection-group/matrix')
    await expect(page.getByTestId('plan-pro')).toHaveCount(1)
  })

  test('rows the default slot leaves alone still follow it', async ({ page }) => {
    await openFixture(page, 'selection-group/matrix')
    const header = page.getByTestId('plain-header')
    const first = page.getByTestId('plain-one')

    await expect(first).toHaveCount(1)
    expect(await header.evaluate((el, other) => Boolean(el.compareDocumentPosition(other!) & Node.DOCUMENT_POSITION_FOLLOWING), await first.elementHandle())).toBe(true)
    await first.click()
    await expect(header).toHaveText('Selected: one')
  })

  test('a disabled group says so on its wrapper and on every item', async ({ page }) => {
    await openFixture(page, 'selection-group/matrix')
    const group = page.getByTestId('locked')

    await expect(group).toHaveAttribute('role', 'group')
    await expect(group).toHaveAttribute('aria-disabled', 'true')
    for (const item of await group.getByRole('checkbox').all()) await expect(item).toHaveAttribute('aria-disabled', 'true')
  })

  test('toggle buttons under a max: the third is unavailable until one is released', async ({ page }) => {
    await openFixture(page, 'selection-group/matrix')

    await page.getByTestId('topping-Cheese').click()
    await page.getByTestId('topping-Ham').click()
    await expect(page.getByTestId('topping-Olives')).toHaveAttribute('aria-disabled', 'true')
    await page.getByTestId('topping-Olives').dispatchEvent('click')
    await expect(page.getByTestId('toppings-value')).toHaveText('Cheese, Ham')

    await page.getByTestId('topping-Cheese').click()
    await expect(page.getByTestId('topping-Olives')).not.toHaveAttribute('aria-disabled')
  })

  test('a thousand items: the rows sit in the listbox, and a pick or select-all lands quickly', async ({ page }) => {
    await openFixture(page, 'selection-group/stress')
    const list = page.getByRole('listbox', { name: 'Files' })

    await expect(list.getByRole('option')).toHaveCount(1000)
    await expect(list).toHaveAttribute('aria-multiselectable', 'true')
    await expect(page.getByTestId('count')).toHaveText('3')

    const pick = await page.evaluate(async () => {
      const start = performance.now()
      document.querySelector<HTMLElement>('[data-test="item-250"]')!.click()
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
      return performance.now() - start
    })
    await expect(page.getByTestId('item-250')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('count')).toHaveText('4')

    const all = await page.evaluate(async () => {
      const start = performance.now()
      document.querySelector<HTMLElement>('[data-test="toggle-all"]')!.click()
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
      return performance.now() - start
    })
    await expect(page.getByTestId('count')).toHaveText('1000')

    expect(pick).toBeLessThan(500)
    expect(all).toBeLessThan(1500)
  })
})
