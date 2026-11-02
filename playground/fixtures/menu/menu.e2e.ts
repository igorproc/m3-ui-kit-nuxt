import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const testId = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)
const trigger = (page: Page) => testId(page, 'trigger')
const activeTestId = (page: Page) => page.evaluate(() => document.activeElement?.closest('[data-test]')?.getAttribute('data-test') ?? '')
const staticMenu = (page: Page, variant: string, content: string) => testId(page, `menu-${variant}-${content}`)

/** The computed value of a CSS colour, resolved by the page itself. */
const resolved = (page: Page, colour: string) => page.evaluate((value) => {
  const probe = document.createElement('div')
  probe.style.color = value
  document.body.append(probe)
  const rgb = getComputedStyle(probe).color
  probe.remove()
  return rgb
}, colour)

const style = (locator: Locator, property: string, pseudo?: string) =>
  locator.evaluate((el, [name, before]) => getComputedStyle(el, before).getPropertyValue(name), [property, pseudo ?? null] as const)

async function openByKey(page: Page, key: string) {
  await openFixture(page, 'menu/matrix')
  await trigger(page).focus()
  await page.keyboard.press(key)
  await waitForMotion(page)
}

test.describe('MMenu', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'menu/matrix', { theme, dir })
        await trigger(page).click()
        await waitForMotion(page)

        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'menu/stress')
    await testId(page, 'long-trigger').click()
    await waitForMotion(page)

    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'menu/stress')
      await testId(page, 'long-trigger').click()
      await waitForMotion(page)

      await expectNoHorizontalOverflow(page)
    })
  }

  // Ш1-д6: the enter hook runs on the first render, so a menu mounted open is shown.
  test('a menu mounted open is in the top layer and visible', async ({ page }) => {
    await openFixture(page, 'menu/matrix')
    await waitForMotion(page)

    for (const variant of ['elevated', 'tonal']) {
      for (const content of ['items', 'groups', 'single']) {
        const menu = staticMenu(page, variant, content)
        expect(await menu.evaluate(el => el.matches(':popover-open')), `${variant} ${content}`).toBe(true)
        await expect(menu.locator('.ui-menu__surface')).toBeVisible()
      }
    }
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('')
  })

  test.describe('activator (A11-06)', () => {
    test('announces a closed menu popup', async ({ page }) => {
      await openFixture(page, 'menu/matrix')

      await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'menu')
      await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger(page)).not.toHaveAttribute('aria-controls')
    })

    for (const [key, first] of [['Enter', 'item-copy'], ['Space', 'item-copy'], ['ArrowDown', 'item-copy'], ['ArrowUp', 'item-delete']] as const) {
      test(`${key} opens the menu with focus on ${first}`, async ({ page }) => {
        await openByKey(page, key)

        expect(await activeTestId(page)).toBe(first)
        await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true')
        const id = await trigger(page).getAttribute('aria-controls')
        await expect(page.locator(`[id="${id}"]`)).toHaveAttribute('role', 'menu')
        await expect(page.locator(`[id="${id}"]`)).toHaveAttribute('aria-labelledby', (await trigger(page).getAttribute('id'))!)
      })
    }
  })

  test.describe('keyboard (APG)', () => {
    test('arrows wrap and walk a disabled item; Home and End jump', async ({ page }) => {
      await openByKey(page, 'ArrowDown')

      await page.keyboard.press('ArrowDown')
      expect(await activeTestId(page)).toBe('item-cut')
      await expect(testId(page, 'item-cut')).toHaveAttribute('aria-disabled', 'true')
      await page.keyboard.press('End')
      expect(await activeTestId(page)).toBe('item-delete')
      await page.keyboard.press('ArrowDown')
      expect(await activeTestId(page)).toBe('item-copy')
      await page.keyboard.press('ArrowUp')
      expect(await activeTestId(page)).toBe('item-delete')
      await page.keyboard.press('Home')
      expect(await activeTestId(page)).toBe('item-copy')
    })

    test('a letter jumps to the next item that starts with it', async ({ page }) => {
      await openByKey(page, 'ArrowDown')

      await page.keyboard.press('d')
      expect(await activeTestId(page)).toBe('item-duplicate')
      await page.keyboard.press('d')
      expect(await activeTestId(page)).toBe('item-delete')
    })

    test('Escape closes the menu and gives focus back to the trigger', async ({ page }) => {
      await openByKey(page, 'Enter')

      await page.keyboard.press('Escape')

      await expect(page.locator('[data-test="actions-menu"]')).toHaveCount(0)
      await expect(trigger(page)).toBeFocused()
      await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')
    })

    test('Tab closes the menu and moves on from the trigger', async ({ page }) => {
      await openByKey(page, 'Enter')

      await page.keyboard.press('Tab')

      await expect(page.locator('[data-test="actions-menu"]')).toHaveCount(0)
      await expect(testId(page, 'after')).toBeFocused()
    })

    test('Shift+Tab closes the menu onto the trigger', async ({ page }) => {
      await openByKey(page, 'Enter')

      await page.keyboard.press('Shift+Tab')

      await expect(page.locator('[data-test="actions-menu"]')).toHaveCount(0)
      await expect(trigger(page)).toBeFocused()
    })

    test('Enter picks an item, closes the menu and returns focus', async ({ page }) => {
      await openByKey(page, 'Enter')

      await page.keyboard.press('End')
      await page.keyboard.press('Enter')

      await expect(testId(page, 'picked')).toHaveText('delete')
      await expect(trigger(page)).toBeFocused()
    })

    test('a disabled item does nothing on a click', async ({ page }) => {
      await openByKey(page, 'Enter')

      await testId(page, 'item-cut').click({ force: true })

      await expect(testId(page, 'picked')).toHaveText('')
      await expect(page.locator('[data-test="actions-menu"]')).toHaveCount(1)
    })
  })

  // Q4-1 / Q5-1: Expressive — the menu is its groups, standard or vibrant.
  test.describe('expressive anatomy', () => {
    test('a menu without groups is one group: 16 corner, surface-container-low, 2 / 4 inset', async ({ page }) => {
      await openFixture(page, 'menu/matrix')
      await waitForMotion(page)
      const rem = await remInPx(page)
      const surface = staticMenu(page, 'elevated', 'items').locator('.ui-menu__surface')
      const row = staticMenu(page, 'elevated', 'items').locator('[data-test="rest"]')

      expect(await style(surface, 'background-color')).toBe(await resolved(page, 'var(--md-sys-color-surface-container-low)'))
      expect(Number.parseFloat(await style(surface, 'border-top-left-radius')) / rem).toBeCloseTo(16, 0)

      const [surfaceBox, rowBox] = [(await surface.boundingBox())!, (await row.boundingBox())!]
      expect((rowBox.x - surfaceBox.x) / rem).toBeCloseTo(4, 0)
      expect((rowBox.y - surfaceBox.y) / rem).toBeCloseTo(2, 0)
    })

    test('vibrant is tertiary-container, its selected item tertiary', async ({ page }) => {
      await openFixture(page, 'menu/matrix')
      await waitForMotion(page)
      const menu = staticMenu(page, 'tonal', 'items')

      expect(await style(menu.locator('.ui-menu__surface'), 'background-color')).toBe(await resolved(page, 'var(--md-sys-color-tertiary-container)'))
      expect(await style(menu.locator('[data-test="selected"]'), 'background-color')).toBe(await resolved(page, 'var(--md-sys-color-tertiary)'))
    })

    test('groups stand 2 apart, 16 at the menu ends and 8 between', async ({ page }) => {
      await openFixture(page, 'menu/matrix')
      await waitForMotion(page)
      const rem = await remInPx(page)
      const menu = staticMenu(page, 'elevated', 'groups')
      const radius = (id: string, corner: string) => style(menu.locator(`[data-test="${id}"]`), `border-${corner}-radius`).then(value => Number.parseFloat(value) / rem)

      expect(await style(menu.locator('.ui-menu__surface'), 'background-color')).toBe('rgba(0, 0, 0, 0)')
      expect(await style(menu.locator('[data-test="group-first"]'), 'background-color')).toBe(await resolved(page, 'var(--md-sys-color-surface-container-low)'))
      expect(await radius('group-first', 'top-left')).toBeCloseTo(16, 0)
      expect(await radius('group-first', 'bottom-left')).toBeCloseTo(8, 0)
      expect(await radius('group-middle', 'top-left')).toBeCloseTo(8, 0)
      expect(await radius('group-last', 'bottom-right')).toBeCloseTo(16, 0)

      const [first, middle] = [(await menu.locator('[data-test="group-first"]').boundingBox())!, (await menu.locator('[data-test="group-middle"]').boundingBox())!]
      expect((middle.y - (first.y + first.height)) / rem).toBeCloseTo(2, 0)
    })

    test('the row: 44 tall, body-large label, label-small shortcut, 20 icon 8 from the text', async ({ page }) => {
      await openFixture(page, 'menu/matrix')
      await waitForMotion(page)
      const rem = await remInPx(page)
      const row = staticMenu(page, 'elevated', 'items').locator('[data-test="rest"]')

      expect((await row.boundingBox())!.height / rem).toBeCloseTo(44, 0)
      expect(Number.parseFloat(await style(row.locator('.ui-menu__item-text'), 'font-size')) / rem).toBeCloseTo(16, 0)
      expect(Number.parseFloat(await style(row.locator('.ui-menu__item-shortcut'), 'font-size')) / rem).toBeCloseTo(11, 0)
      expect(Number.parseFloat(await style(row, 'column-gap')) / rem).toBeCloseTo(8, 0)
      expect((await row.locator('.ui-menu__item-leading .ui-icon').boundingBox())!.width / rem).toBeCloseTo(20, 0)
    })

    test('a selected item fills tertiary-container in the medium shape', async ({ page }) => {
      await openFixture(page, 'menu/matrix')
      await waitForMotion(page)
      const rem = await remInPx(page)
      const selected = staticMenu(page, 'elevated', 'items').locator('[data-test="selected"]')

      expect(await style(selected, 'background-color')).toBe(await resolved(page, 'var(--md-sys-color-tertiary-container)'))
      expect(Number.parseFloat(await style(selected, 'border-top-left-radius')) / rem).toBeCloseTo(12, 0)
      await expect(selected.locator('.ui-menu__item-leading .ui-icon')).toBeVisible()
    })

    test('hover lays the content colour over the row instead of swapping its fill', async ({ page }) => {
      await openFixture(page, 'menu/matrix')
      await waitForMotion(page)
      const row = staticMenu(page, 'elevated', 'items').locator('[data-test="rest"]')

      await row.hover()
      await waitForMotion(page)

      expect(await style(row, 'background-color')).toBe('rgba(0, 0, 0, 0)')
      expect(Number.parseFloat(await style(row, 'opacity', '::before'))).toBeCloseTo(0.08, 2)
      expect(await style(row, 'background-color', '::before')).toBe(await style(row, 'color'))
    })
  })

  test('forced colors: a selected item is Highlight, a disabled one GrayText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'menu/matrix')
    await waitForMotion(page)
    const menu = staticMenu(page, 'elevated', 'items')

    expect(await style(menu.locator('[data-test="selected"]'), 'background-color')).toBe(await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.style.backgroundColor = 'Highlight'
      document.body.append(probe)
      const value = getComputedStyle(probe).backgroundColor
      probe.remove()
      return value
    }))
    expect(await style(menu.locator('[data-test="disabled"]'), 'color')).toBe(await resolved(page, 'GrayText'))
    expect(await style(menu.locator('.ui-menu__surface'), 'border-top-style')).toBe('solid')
  })

  test('reduced motion: the menu fades in without the scale', async ({ page }) => {
    const enteringTransform = () => page.evaluate(() => {
      const menu = document.querySelector('[data-test="menu-elevated-items"]')!
      menu.classList.add('ui-menu-anim-enter-from')
      const value = getComputedStyle(menu.querySelector('.ui-menu__surface')!).transform
      menu.classList.remove('ui-menu-anim-enter-from')
      return value
    })

    await openFixture(page, 'menu/matrix')
    await waitForMotion(page)
    expect(await enteringTransform()).not.toBe('none')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await enteringTransform()).toBe('none')
  })

  // Q26-А: start / end follow the writing direction.
  for (const dir of DIRECTIONS) {
    test(`a bottom-start menu lines up with the trigger's start edge (${dir})`, async ({ page }) => {
      await openFixture(page, 'menu/matrix', { dir })
      await trigger(page).click()
      await waitForMotion(page)

      const triggerBox = (await trigger(page).boundingBox())!
      const surfaceBox = (await page.locator('[data-test="actions-menu"] .ui-menu__surface').boundingBox())!
      if (dir === 'ltr') expect(Math.abs(surfaceBox.x - triggerBox.x)).toBeLessThanOrEqual(1)
      else expect(Math.abs((surfaceBox.x + surfaceBox.width) - (triggerBox.x + triggerBox.width))).toBeLessThanOrEqual(1)
      expect(surfaceBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 1)
    })
  }

  // Ш2-origin: the menu grows out of the side it took after flipping, not the one it asked for.
  test('a menu flipped above its trigger grows from its bottom edge', async ({ page }) => {
    await openFixture(page, 'menu/stress')
    const corner = testId(page, 'corner-trigger')
    await corner.click()
    await waitForMotion(page)

    const wrapper = page.locator('.ui-menu').filter({ has: page.getByRole('menuitem', { name: 'Archive' }) })
    const [triggerBox, menuBox] = [(await corner.boundingBox())!, (await wrapper.boundingBox())!]
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(triggerBox.y + 1)
    expect(await wrapper.evaluate(el => el.style.getPropertyValue('--ui-menu-origin'))).toMatch(/^bottom /)
  })

  test('a long word wraps inside the 280 limit and keeps the shortcut in view', async ({ page }) => {
    await openFixture(page, 'menu/stress')
    await testId(page, 'long-trigger').click()
    await waitForMotion(page)
    const rem = await remInPx(page)
    const item = testId(page, 'long-item')
    const surface = page.locator('.ui-menu__surface').filter({ has: item })

    const [surfaceBox, shortcutBox] = [(await surface.boundingBox())!, (await item.locator('.ui-menu__item-shortcut').boundingBox())!]
    expect(surfaceBox.width / rem).toBeLessThanOrEqual(280.5)
    expect(shortcutBox.x + shortcutBox.width).toBeLessThanOrEqual(surfaceBox.x + surfaceBox.width)
  })

  test('a menu opens above an open modal dialog and Escape closes only the menu', async ({ page }) => {
    await openFixture(page, 'menu/stress')
    await testId(page, 'open-dialog').click()
    await waitForMotion(page)

    await testId(page, 'dialog-trigger').focus()
    await page.keyboard.press('Enter')
    await waitForMotion(page)
    expect(await activeTestId(page)).toBe('dialog-pdf')
    await expect(testId(page, 'dialog-pdf')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(testId(page, 'dialog-trigger')).toBeFocused()
    await expect(page.locator('.ui-dialog')).toBeVisible()
  })

  test('forty items: End reaches the last one', async ({ page }) => {
    await openFixture(page, 'menu/stress')
    await testId(page, 'many-trigger').focus()
    await page.keyboard.press('Enter')
    await waitForMotion(page)

    await page.keyboard.press('End')

    expect(await activeTestId(page)).toBe('many-40')
  })
})
