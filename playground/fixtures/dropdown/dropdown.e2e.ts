import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

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
/** Opacity of a row's state layer — the virtual focus draws it, not a swapped background. */
const layer = (locator: Locator) => locator.evaluate(el => Number.parseFloat(getComputedStyle(el, '::before').opacity))
const outline = (locator: Locator) => locator.evaluate((el) => {
  const style = getComputedStyle(el)
  return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), color: style.outlineColor }
})

async function openWithKeyboard(page: Page, id: string) {
  await combobox(page, id).focus()
  await page.keyboard.press('ArrowDown')
  await expect(combobox(page, id)).toHaveAttribute('aria-expanded', 'true')
  // The panel opens with a scale: anything measured mid-motion is off.
  await waitForMotion(page)
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

  test('an error takes the one support line a helper takes and is not colour alone', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const root = (id: string) => combobox(page, id).locator(`xpath=ancestor::div[contains(concat(' ', @class, ' '), ' ui-dropdown ')][1]`)

    for (const variant of ['filled', 'outlined']) {
      const helper = (await root(`helper-${variant}`).boundingBox())!
      const invalid = (await root(`error-${variant}`).boundingBox())!
      expect(invalid.height, variant).toBeCloseTo(helper.height, 0)
      await expect(root(`enabled-${variant}`).locator('.ui-text-field__support'), variant).toHaveCount(0)
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
    await expect(page.getByRole('option', { name: 'Cherry' })).toHaveClass(/ui-dropdown-panel__option--active/)
    expect((await outline(page.getByRole('option', { name: 'Cherry' }))).style).toBe('none')
  })

  test('a selected row under the keyboard differs from a selected row at rest', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await openWithKeyboard(page, 'selected-filled')

    const banana = page.getByRole('option', { name: 'Banana' })
    await expect(banana).toHaveAttribute('aria-selected', 'true')
    const active = await layer(banana)

    await page.keyboard.press('ArrowDown')
    await waitForMotion(page)
    const resting = await layer(banana)
    expect(active).not.toBe(resting)
  })

  test('the arrow takes the field roles: error in an invalid field, receded when disabled', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const ink = (id: string, part: string) => combobox(page, id).evaluate((el, selector) =>
      getComputedStyle(el.closest('.ui-text-field')!.querySelector(selector)!).color, part)

    expect(await ink('error-filled', '.ui-dropdown__arrow')).toBe(await ink('error-filled', '.ui-text-field__support'))
    expect(await ink('disabled-filled', '.ui-dropdown__arrow')).not.toBe(await ink('enabled-filled', '.ui-dropdown__arrow'))
  })

  test('row text starts where the value starts in the field', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await openWithKeyboard(page, 'selected-filled')

    const value = await combobox(page, 'selected-filled').evaluate(el => el.getBoundingClientRect().left)
    for (const name of ['Apple', 'Banana']) {
      const title = await page.getByRole('option', { name }).locator('.ui-dropdown-panel__title')
        .evaluate(el => el.getBoundingClientRect().left)
      // Within the field's 1rem edge: the panel hangs from the outer edge.
      expect(Math.abs(title - value), name).toBeLessThanOrEqual(2)
    }
  })

  test('a row under the pointer is lighter than a row under the keyboard', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await openWithKeyboard(page, 'enabled-filled')
    const apple = page.getByRole('option', { name: 'Apple' })
    await waitForMotion(page)
    const keyboard = await layer(apple)

    await page.getByRole('option', { name: 'Cherry' }).hover()
    await apple.hover()
    await expect(apple).toHaveClass(/ui-dropdown-panel__option--active/)
    await waitForMotion(page)
    const pointer = await layer(apple)

    // The row's own state layer: hover 8 % under the pointer, focus 10 % under the keyboard.
    expect(pointer).toBeCloseTo(0.08, 2)
    expect(keyboard).toBeCloseTo(0.1, 2)
  })

  test('a long panel stops halfway through a row, so the list visibly goes on', async ({ page }) => {
    await openFixture(page, 'dropdown/stress')
    await openWithKeyboard(page, 'huge')

    const [visible, row, padding] = await listbox(page).evaluate((el) => {
      const option = el.querySelector('[role="option"]')!
      return [el.clientHeight, option.getBoundingClientRect().height, Number.parseFloat(getComputedStyle(el).paddingTop)]
    })
    const rows = (visible - 2 * padding) / row

    expect(rows - Math.floor(rows)).toBeCloseTo(0.5, 1)
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

test.describe('MDropdown · layout and keys that used to slip (M3-polish)', () => {
  const rootOf = (page: Page, id: string) => page.locator(`.ui-dropdown:has([data-test="${id}"])`)
  const pick = (page: Page, name: string) => page.getByRole('option', { name, exact: true }).click()

  test('choosing in multiple does not widen the field: in a table and in a flex row', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const rem = await remInPx(page)
    const cell = rootOf(page, 'multiple-filled')
    const before = (await cell.boundingBox())!.width
    await combobox(page, 'multiple-filled').click()
    for (const name of ['Banana', 'Blueberry', 'Elderberry']) await pick(page, name)
    expect(Math.abs((await cell.boundingBox())!.width - before) / rem).toBeLessThan(1)

    await openFixture(page, 'dropdown/cases')
    const sized = rootOf(page, 'in-flex-auto')
    const sizedBefore = (await sized.boundingBox())!.width
    await combobox(page, 'in-flex-auto').click()
    for (const name of ['Banana', 'Blueberry', 'Cherry', 'Elderberry']) await pick(page, name)
    expect(Math.abs((await sized.boundingBox())!.width - sizedBefore) / rem).toBeLessThan(1)
  })

  test('the first chip moves nothing: an empty multiple field is as tall as one with chips', async ({ page }) => {
    await openFixture(page, 'dropdown/cases')
    const height = (id: string) => rootOf(page, id).locator('.ui-text-field__control').evaluate(el => el.getBoundingClientRect().height)

    for (const variant of ['filled', 'outlined']) {
      expect(await height(`compact-empty-${variant}`), variant).toBeCloseTo(await height(`compact-chips-${variant}`), 1)
    }
  })

  test('a chip arrives in an empty multiple field and leaves with the last one', async ({ page }) => {
    await openFixture(page, 'dropdown/cases')
    const chipsOf = (id: string) => rootOf(page, id).locator('.ui-chip')

    await combobox(page, 'compact-empty-filled').click()
    await pick(page, 'Apple')
    await expect(chipsOf('compact-empty-filled')).toHaveCount(1)
    await page.keyboard.press('Escape')

    for (let left = 3; left > 0; left--) await chipsOf('compact-chips-filled').first().click()
    await expect(chipsOf('compact-chips-filled')).toHaveCount(0)
  })

  test('ticking a row does not rewrap it: every row of a multiple panel keeps the place of the check', async ({ page }) => {
    await openFixture(page, 'dropdown/cases')
    await combobox(page, 'multi-edge').click()
    await waitForMotion(page)
    const heights = () => page.getByRole('option').evaluateAll(rows => rows.map(row => row.getBoundingClientRect().height))

    const before = await heights()
    // The tall panel runs past the viewport; a click is all a row needs.
    for (const option of await page.getByRole('option').all()) await option.dispatchEvent('click')
    await expect(page.getByRole('option', { selected: true })).toHaveCount(before.length)
    expect(await heights()).toEqual(before)
  })

  test('the pointer activates a half-visible row without scrolling the list under it', async ({ page }) => {
    await openFixture(page, 'dropdown/cases')
    await combobox(page, 'bottom').scrollIntoViewIfNeeded()
    await combobox(page, 'bottom').focus()
    await page.keyboard.press('ArrowDown')
    await waitForMotion(page)

    const cut = await listbox(page).evaluate((list) => {
      const box = list.getBoundingClientRect()
      const row = [...list.querySelectorAll('[role="option"]')].find((option) => {
        const rect = option.getBoundingClientRect()
        return rect.top < box.bottom - 4 && rect.bottom > box.bottom + 4
      })!
      const rect = row.getBoundingClientRect()
      return { name: row.textContent!.trim(), x: rect.x + rect.width / 2, y: (rect.top + box.bottom) / 2, scrollTop: list.scrollTop }
    })
    await page.mouse.move(cut.x, cut.y)
    await page.mouse.move(cut.x + 4, cut.y)

    await expect.poll(() => activeOption(page, 'bottom')).toBe(cut.name)
    expect(await listbox(page).evaluate(list => list.scrollTop)).toBe(cut.scrollTop)
  })

  for (const key of ['Enter', 'Space']) {
    test(`${key} on the clear control clears and leaves focus in the field`, async ({ page }) => {
      await openFixture(page, 'dropdown/matrix')
      const field = combobox(page, 'selected-filled')
      await field.focus()
      await page.keyboard.press('Tab')
      await expect(rootOf(page, 'selected-filled').locator('.ui-dropdown__clear')).toBeFocused()

      await page.keyboard.press(key)
      await expect(field).toHaveValue('')
      await expect(field).toHaveAttribute('aria-expanded', 'false')
      await expect(field).toBeFocused()
    })
  }

  test('chips are reached with the arrows, not with Tab, and the arrow points at them in RTL', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix', { dir: 'rtl' })
    const field = combobox(page, 'multiple-filled')
    await field.focus()

    await page.keyboard.press('ArrowRight')
    await expect(page.locator(`#${await field.getAttribute('aria-activedescendant')}`)).toContainText('Cherry')
    await page.keyboard.press('ArrowLeft')
    await expect(field).not.toHaveAttribute('aria-activedescendant', /chip/)

    await expect(rootOf(page, 'multiple-filled').locator('.ui-chip').first()).toHaveAttribute('tabindex', '-1')
  })

  test('a click on the support line under the box does not open the panel', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    await rootOf(page, 'helper-filled').locator('.ui-text-field__support').click()

    await expect(combobox(page, 'helper-filled')).toHaveAttribute('aria-expanded', 'false')
  })

  test('a select takes no text, from the keyboard or an IME, and is not read-only', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const field = combobox(page, 'selected-filled')
    await expect(field).not.toHaveAttribute('readonly')
    await expect(field).toHaveAttribute('inputmode', 'none')

    await field.focus()
    await page.keyboard.insertText('zz')
    await expect(field).toHaveValue('Banana')

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.imeSetComposition', { text: 'に', selectionStart: 1, selectionEnd: 1 })
    await cdp.send('Input.insertText', { text: 'に' })
    await expect(field).toHaveValue('Banana')
  })

  test('read-only: the clear control is off, the chips read in full and offer no removal', async ({ page }) => {
    await openFixture(page, 'dropdown/cases')
    const chips = rootOf(page, 'readonly-multiple').locator('.ui-chip')

    await expect(chips).toHaveCount(2)
    await expect(rootOf(page, 'readonly-multiple').locator('.ui-chip__trailing')).toHaveCount(0)
    await expect(chips.first()).not.toHaveClass(/ui-chip--disabled/)
    await chips.first().click()
    await expect(chips).toHaveCount(2)
    await expect(rootOf(page, 'readonly-clearable').locator('.ui-dropdown__clear')).toBeDisabled()
  })
})

test.describe('MDropdown · a press anywhere on the box', () => {
  const points = { centre: 0.5, start: 0.04, end: 0.96 } as const

  for (const id of ['density-compact', 'density-default', 'enabled-outlined']) {
    for (const [where, at] of Object.entries(points)) {
      test(`${id}: a click at the ${where} of the box opens once and focuses the field`, async ({ page }) => {
        await openFixture(page, 'dropdown/matrix')
        const control = page.locator(`.ui-dropdown:has([data-test="${id}"]) .ui-text-field__control`)
        await control.scrollIntoViewIfNeeded()
        const box = (await control.boundingBox())!
        await page.mouse.click(box.x + box.width * at, box.y + box.height / 2)

        await expect(combobox(page, id)).toHaveAttribute('aria-expanded', 'true')
        await expect(combobox(page, id)).toBeFocused()
      })
    }
  }

  test('a click on the field frame between the box and its support line opens too', async ({ page }) => {
    await openFixture(page, 'dropdown/matrix')
    const root = page.locator('.ui-dropdown:has([data-test="density-compact"])')
    // The centre of the whole field, support line included — where a click
    // aimed at the field "as a whole" lands.
    await root.click()

    await expect(combobox(page, 'density-compact')).toHaveAttribute('aria-expanded', 'true')
    await expect(combobox(page, 'density-compact')).toBeFocused()
  })
})
