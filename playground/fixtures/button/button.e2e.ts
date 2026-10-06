import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const VARIANTS = ['elevated', 'filled', 'tonal', 'outlined', 'text']

const activeTestId = (page: Page) => page.evaluate(() => document.activeElement?.closest('[data-test]')?.getAttribute('data-test') ?? '')
const outlineWidth = (locator: Locator) => locator.evaluate(el => Number.parseFloat(getComputedStyle(el).outlineWidth))
const width = async (locator: Locator) => (await locator.boundingBox())!.width

test.describe('MButton', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'button/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'button/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'button/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('Tab reaches every enabled button and skips disabled and loading ones', async ({ page }) => {
    await openFixture(page, 'button/matrix')

    // Walk one full Tab cycle: stop at the first control seen twice.
    const reached: string[] = []
    for (let step = 0; step < 40; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
      if (reached.includes(id)) break
      if (id) reached.push(id)
    }

    expect(reached.filter(id => id.startsWith('enabled-'))).toEqual(VARIANTS.map(v => `enabled-${v}`))
    expect(reached.some(id => id.startsWith('disabled-') || id.startsWith('loading-'))).toBe(false)
  })

  test('Enter and Space activate the focused button', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const button = page.getByTestId('enabled-filled')
    const activations = page.getByTestId('activations')

    await button.focus()
    await page.keyboard.press('Enter')
    await expect(activations).toHaveText('1')
    await page.keyboard.press('Space')
    await expect(activations).toHaveText('2')
  })

  test('keyboard focus ring is at least 2px', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    await page.keyboard.press('Tab')

    const width = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.activeElement!).outlineWidth))
    expect(width).toBeGreaterThanOrEqual(2)
  })

  test('buttons keep a visible boundary in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button/matrix')

    for (const variant of VARIANTS) {
      const style = await page.getByTestId(`enabled-${variant}`).evaluate(el => getComputedStyle(el).borderStyle)
      expect(style, variant).not.toBe('none')
    }
  })

  // MO-04: the spinner replaces the prepend icon or sits over the label.
  test('starting to load does not change any button width', async ({ page }) => {
    await openFixture(page, 'button/stress')
    const ids = ['loading-label', 'loading-prepend', 'loading-extended', 'loading-icon']

    const before = await Promise.all(ids.map(id => width(page.getByTestId(id))))
    await page.getByTestId('toggle-loading').click()
    await expect(page.getByTestId('loading-label')).toHaveAttribute('aria-busy', 'true')
    const after = await Promise.all(ids.map(id => width(page.getByTestId(id))))

    ids.forEach((id, index) => expect(after[index], id).toBeCloseTo(before[index]!, 0))
  })

  test('a loading button keeps its accessible name', async ({ page }) => {
    await openFixture(page, 'button/stress')
    await page.getByTestId('toggle-loading').click()

    await expect(page.getByTestId('loading-label')).toHaveAccessibleName('Submit')
  })

  // IN-11: the press that starts the work makes the button busy before a second lands.
  test('a double click submits once', async ({ page }) => {
    await openFixture(page, 'button/stress')

    await page.getByTestId('submit-once').dblclick()

    await expect(page.getByTestId('submissions')).toHaveText('1')
  })
})

test.describe('Button family', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`family matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'button/family', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const viewport of WIDTHS) {
    test(`family matrix does not overflow the page at ${viewport}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport, height: 800 })
      await openFixture(page, 'button/family')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('icon button, FAB and extended FAB show a focus ring of at least 2px', async ({ page }) => {
    await openFixture(page, 'button/family')

    for (const id of ['icon-enabled-filled', 'fab-enabled-filled', 'extended-enabled-filled']) {
      const control = page.getByTestId(id)
      await control.focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      expect(await outlineWidth(control), id).toBeGreaterThanOrEqual(2)
    }
  })

  // ST-02: focus is its own layer, not the pressed one.
  test('a focused FAB does not look pressed', async ({ page }) => {
    await openFixture(page, 'button/family')
    const fab = page.getByTestId('fab-enabled-filled')
    const background = () => fab.evaluate(el => getComputedStyle(el).backgroundColor)

    await fab.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    const focused = await background()

    await page.keyboard.down('Space')
    const pressed = await background()
    await page.keyboard.up('Space')

    expect(pressed).not.toBe(focused)
  })

  test.describe('segmented, single choice', () => {
    test('is one Tab stop on the checked segment', async ({ page }) => {
      await openFixture(page, 'button/family')
      const group = page.getByTestId('segmented-single')

      await expect(group).toHaveAttribute('role', 'radiogroup')
      await expect(group).toHaveAccessibleName('Period')

      await page.getByTestId('segmented-multiple').getByRole('button').first().focus()
      await page.keyboard.press('Shift+Tab')

      await expect(group.getByRole('radio', { name: 'Week' })).toBeFocused()
      await expect(group.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
    })

    test('arrows move the selection past disabled segments; Home and End jump', async ({ page }) => {
      await openFixture(page, 'button/family')
      const group = page.getByTestId('segmented-single')
      const radio = (name: string) => group.getByRole('radio', { name })

      await radio('Week').focus()
      await page.keyboard.press('ArrowRight')
      await expect(radio('Year')).toBeFocused()
      await expect(radio('Year')).toHaveAttribute('aria-checked', 'true')

      await page.keyboard.press('Home')
      await expect(radio('Day')).toHaveAttribute('aria-checked', 'true')

      await page.keyboard.press('End')
      await expect(radio('Year')).toHaveAttribute('aria-checked', 'true')

      await page.keyboard.press('ArrowLeft')
      await expect(radio('Week')).toHaveAttribute('aria-checked', 'true')
    })

    test('in RTL the left arrow moves forward', async ({ page }) => {
      await openFixture(page, 'button/family', { dir: 'rtl' })
      const group = page.getByTestId('segmented-single')

      await group.getByRole('radio', { name: 'Day' }).click()
      await page.keyboard.press('ArrowLeft')

      await expect(group.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
    })

    test('a selected disabled segment does not wear the selected colour', async ({ page }) => {
      await openFixture(page, 'button/family')
      const background = (locator: Locator) => locator.evaluate(el => getComputedStyle(el).backgroundColor)

      const enabled = await background(page.getByTestId('segmented-single').getByRole('radio', { name: 'Week' }))
      const disabled = await background(page.getByTestId('segmented-disabled').getByRole('radio', { name: 'Week' }))

      expect(disabled).not.toBe(enabled)
    })

    test('the focus ring of a segment is drawn inside the clipped pill', async ({ page }) => {
      await openFixture(page, 'button/family')
      const segment = page.getByTestId('segmented-single').getByRole('radio', { name: 'Week' })

      await segment.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowLeft')

      expect(await outlineWidth(segment)).toBeGreaterThanOrEqual(2)
      expect(await segment.evaluate(el => Number.parseFloat(getComputedStyle(el).outlineOffset))).toBeLessThan(0)
    })
  })

  test('segmented multiple choice toggles aria-pressed with Space', async ({ page }) => {
    await openFixture(page, 'button/family')
    const group = page.getByTestId('segmented-multiple')
    const unread = group.getByRole('button', { name: 'Unread' })

    await expect(group).toHaveAttribute('role', 'group')
    await expect(unread).toHaveAttribute('aria-pressed', 'false')

    await unread.focus()
    await page.keyboard.press('Space')

    await expect(unread).toHaveAttribute('aria-pressed', 'true')
  })

  test('selected segments keep their fill in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button/family')
    const group = page.getByTestId('segmented-single')
    const background = (name: string) => group.getByRole('radio', { name }).evaluate(el => getComputedStyle(el).backgroundColor)

    expect(await background('Week')).not.toBe(await background('Day'))
  })

  test.describe('split', () => {
    test('the dropdown is a named menu button', async ({ page }) => {
      await openFixture(page, 'button/family')
      const dropdown = page.getByTestId('split-filled').getByRole('button', { name: 'More save options' })

      await expect(dropdown).toHaveAttribute('aria-haspopup', 'menu')
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false')

      await dropdown.click()

      await expect(dropdown).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByRole('menuitem', { name: 'Save as draft' })).toBeFocused()
    })

    test('picking an item reports it, closes the menu and returns focus', async ({ page }) => {
      await openFixture(page, 'button/family')
      const dropdown = page.getByTestId('split-filled').getByRole('button', { name: 'More save options' })

      await dropdown.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      await expect(page.getByTestId('last-event')).toHaveText('select:publish')
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false')
      await expect(dropdown).toBeFocused()
    })

    test('Escape closes the menu and returns focus', async ({ page }) => {
      await openFixture(page, 'button/family')
      const dropdown = page.getByTestId('split-filled').getByRole('button', { name: 'More save options' })

      await dropdown.click()
      await page.keyboard.press('Escape')

      await expect(dropdown).toHaveAttribute('aria-expanded', 'false')
      await expect(dropdown).toBeFocused()
    })

    test('the focus ring of either half is not clipped', async ({ page }) => {
      await openFixture(page, 'button/family')
      const split = page.getByTestId('split-filled')
      const wrapper = split.locator('.ui-split-button__wrapper')

      expect(await wrapper.evaluate(el => getComputedStyle(el).overflow)).toBe('visible')

      await split.getByRole('button', { name: 'Save', exact: true }).focus()
      await page.keyboard.press('Tab')
      expect(await activeTestId(page)).toBe('split-filled')
      expect(await outlineWidth(split.getByRole('button', { name: 'More save options' }))).toBeGreaterThanOrEqual(2)
    })
  })
})
