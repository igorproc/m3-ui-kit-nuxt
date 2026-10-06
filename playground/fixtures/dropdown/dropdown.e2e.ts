import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

/**
 * MMenu draws its surface as role="menu", so the listbox sits inside a menu
 * that owns no menuitems. That is MMenu's to fix; pinning it exactly keeps
 * every other violation of the open panel visible, and the day MMenu hosts a
 * listbox properly this expectation fails and should become `[]`.
 */
const KNOWN_MENU_VIOLATION = ['aria-required-children: .ui-menu__surface']

async function openPanelViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .exclude('nuxt-devtools-frame')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations.flatMap(v => v.nodes.map(node => `${v.id}: ${node.target.join(' ')}`))
}

/** `data-test` falls through to the combobox input. */
const combobox = (page: Page, id: string) => page.getByTestId(id)
const listbox = (page: Page) => page.getByRole('listbox')
const activeOption = (page: Page, id: string) => combobox(page, id).evaluate((el) => {
  const target = el.getAttribute('aria-activedescendant')
  return target ? document.getElementById(target)?.textContent?.trim() ?? null : null
})
const outline = (locator: Locator) => locator.evaluate((el) => {
  const style = getComputedStyle(el)
  return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), color: style.outlineColor }
})

async function openWithKeyboard(page: Page, id: string) {
  await combobox(page, id).focus()
  await page.keyboard.press('ArrowDown')
  await expect(combobox(page, id)).toHaveAttribute('aria-expanded', 'true')
}

test.describe('MDropdown', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'dropdown/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const [fixture, id] of [['matrix', 'selected-filled'], ['stress', 'loading'], ['stress', 'empty']] as const) {
    for (const theme of THEMES) {
      test(`an open ${id} panel has no axe violations of its own (${theme})`, async ({ page }) => {
        await openFixture(page, `dropdown/${fixture}`, { theme })
        await openWithKeyboard(page, id)
        expect(await openPanelViolations(page)).toEqual(KNOWN_MENU_VIOLATION)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'dropdown/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'dropdown/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a panel of long rows scrolls only vertically', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'dropdown/stress')
    await openWithKeyboard(page, 'long')

    const overflow = await listbox(page).evaluate(el => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expectNoHorizontalOverflow(page)
  })

  test('Tab reaches enabled, read-only and invalid fields and skips disabled ones', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')

    const reached: string[] = []
    for (let step = 0; step < 80; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
      if (id === 'after') break
      if (id && !reached.includes(id)) reached.push(id)
    }

    for (const variant of ['filled', 'outlined']) {
      expect(reached).toContain(`enabled-${variant}`)
      expect(reached).toContain(`readonly-${variant}`)
      expect(reached).toContain(`error-${variant}`)
      expect(reached).not.toContain(`disabled-${variant}`)
    }
  })

  test('the combobox is named, wired to its listbox, and says when it opens', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const field = combobox(page, 'enabled-filled')

    await expect(field).toHaveRole('combobox')
    await expect(field).toHaveAccessibleName('enabled filled')
    await expect(field).toHaveAttribute('aria-expanded', 'false')

    await openWithKeyboard(page, 'enabled-filled')
    await expect(listbox(page)).toHaveAttribute('id', (await field.getAttribute('aria-controls'))!)
    await expect(listbox(page)).toHaveAccessibleName('enabled filled')
    expect(await activeOption(page, 'enabled-filled')).toBe('Apple')
  })

  test('keyboard model: type-ahead, Home/End, Enter commits, Escape keeps focus', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const field = combobox(page, 'enabled-filled')
    await field.focus()

    await page.keyboard.press('c')
    await expect(field).toHaveAttribute('aria-expanded', 'true')
    await expect.poll(() => activeOption(page, 'enabled-filled')).toBe('Cherry')

    await page.keyboard.press('End')
    await expect.poll(() => activeOption(page, 'enabled-filled')).toBe('Elderberry')
    await page.keyboard.press('Home')
    await expect.poll(() => activeOption(page, 'enabled-filled')).toBe('Apple')

    await page.keyboard.press('Enter')
    await expect(field).toHaveAttribute('aria-expanded', 'false')
    await expect(field).toHaveValue('Apple')
    await expect(field).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Escape')
    await expect(field).toHaveAttribute('aria-expanded', 'false')
    await expect(field).toHaveValue('Apple')
    await expect(field).toBeFocused()
  })

  test('Tab out of an open panel closes it and moves on', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await openWithKeyboard(page, 'enabled-filled')

    await page.keyboard.press('Tab')
    await expect(combobox(page, 'enabled-filled')).toHaveAttribute('aria-expanded', 'false')
    await expect(combobox(page, 'enabled-filled')).not.toBeFocused()
    await expect(listbox(page)).toHaveCount(0)
  })

  test('an error does not change the field height and is not colour alone', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const root = (id: string) => combobox(page, id).locator(`xpath=ancestor::div[contains(concat(' ', @class, ' '), ' ui-dropdown ')][1]`)

    for (const variant of ['filled', 'outlined']) {
      const enabled = (await root(`enabled-${variant}`).boundingBox())!
      const invalid = (await root(`error-${variant}`).boundingBox())!
      expect(invalid.height, variant).toBeCloseTo(enabled.height, 0)
      await expect(combobox(page, `error-${variant}`)).toHaveAttribute('aria-invalid', 'true')
      await expect(root(`flagged-${variant}`).locator('.ui-text-field__support-icon')).toBeVisible()
    }
  })

  test('read-only takes focus but does not open', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await combobox(page, 'readonly-filled').focus()
    await page.keyboard.press('ArrowDown')

    await expect(combobox(page, 'readonly-filled')).toHaveAttribute('aria-expanded', 'false')
  })

  test('the keyboard cursor is a focus ring; a hovered row is not', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await openWithKeyboard(page, 'enabled-filled')

    const first = page.getByRole('option', { name: 'Apple' })
    const ring = await outline(first)
    expect(ring.style).toBe('solid')
    expect(ring.width).toBeGreaterThanOrEqual(2)

    await page.getByRole('option', { name: 'Cherry' }).hover()
    await expect(page.getByRole('option', { name: 'Cherry' })).toHaveClass(/ui-dropdown__option--active/)
    expect((await outline(page.getByRole('option', { name: 'Cherry' }))).style).toBe('none')
  })

  test('a selected row under the keyboard differs from a selected row at rest', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await openWithKeyboard(page, 'selected-filled')

    const banana = page.getByRole('option', { name: 'Banana' })
    await expect(banana).toHaveAttribute('aria-selected', 'true')
    const active = await banana.evaluate(el => getComputedStyle(el).backgroundColor)

    await page.keyboard.press('ArrowDown')
    const resting = await banana.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(active).not.toBe(resting)
  })

  test('forced colors: the keyboard cursor is a Highlight ring', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'dropdown/matrix')
    await openWithKeyboard(page, 'enabled-filled')

    const ring = await outline(page.getByRole('option', { name: 'Apple' }))
    expect(ring.style).toBe('solid')
    expect(ring.width).toBeGreaterThanOrEqual(2)
  })

  test('chips: ArrowLeft walks in, the chip is named, Backspace removes it', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const field = combobox(page, 'multiple-filled')
    await field.focus()

    await page.keyboard.press('ArrowLeft')
    const chipId = await field.getAttribute('aria-activedescendant')
    await expect(page.locator(`#${chipId}`)).toContainText('Cherry')
    expect((await outline(page.locator(`#${chipId}`))).style).toBe('solid')

    await page.keyboard.press('Backspace')
    await expect(page.locator('.ui-dropdown__chip')).toContainText(['Apple'])
  })

  test('an empty panel is announced through a region that existed before', async ({ page }) => {
    await openFixture(page, 'dropdown/stress')
    const region = page.locator('.ui-dropdown__status').nth(3)

    await expect(region).toHaveText('')
    await openWithKeyboard(page, 'empty')
    await expect(region).toHaveText('No options')
  })

  test('a thousand rows open on the current value and reach both ends', async ({ page }) => {
    await openFixture(page, 'dropdown/stress')
    await openWithKeyboard(page, 'huge')

    await expect.poll(() => activeOption(page, 'huge')).toBe('Option 500')
    await expect(page.getByRole('option', { name: 'Option 500', exact: true })).toBeInViewport()

    await page.keyboard.press('End')
    await expect.poll(() => activeOption(page, 'huge')).toBe('Option 1000')
    await expect(page.getByRole('option', { name: 'Option 1000', exact: true })).toBeInViewport()
  })
})
