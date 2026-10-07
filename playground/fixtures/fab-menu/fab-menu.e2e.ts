import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, waitForMotion } from '../../e2e/support'

const fab = (menu: Locator) => menu.locator('.ui-fab-menu__activator')
const actions = (page: Page) => page.locator('.ui-fab-menu__drawer .ui-fab-menu__item')

test.describe('MFabMenu', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`open menu has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'fab-menu/matrix', { theme, dir })
        await fab(page.getByTestId('menu-primary-end')).click()
        await expect(actions(page)).toHaveCount(3)
        // Mid-reveal the actions are still fading in, which axe reads as low contrast.
        await waitForMotion(page)
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const width of WIDTHS) {
    test(`open stress menu does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'fab-menu/stress')
      await fab(page.getByTestId('menu-long')).click()
      await expect(actions(page)).toHaveCount(2)
      await waitForMotion(page)
      await expectNoHorizontalOverflow(page)
    })
  }

  test('the FAB is a named disclosure button', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-primary-end'))

    await expect(button).toHaveAccessibleName('Create, primary end')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(button).toHaveAttribute('aria-controls', /.+/)
  })

  // A11-09: the FAB precedes its actions, so Tab (or ArrowDown) reaches the top one.
  test('Tab and ArrowDown move from the FAB to the top action', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-primary-end'))

    await button.click()
    await page.keyboard.press('Tab')
    await expect(actions(page).first()).toBeFocused()

    await button.focus()
    await page.keyboard.press('ArrowDown')
    await expect(actions(page).first()).toBeFocused()
  })

  test('Escape closes the menu and returns focus to the FAB', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-primary-end'))

    await button.click()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Escape')

    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).toBeFocused()
  })

  test('choosing an action reports it, closes the menu and returns focus', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-primary-end'))

    await button.click()
    await actions(page).nth(1).click()

    await expect(page.getByTestId('last-select')).toHaveText('email')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).toBeFocused()
  })

  test('a click outside closes the menu', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-primary-end'))

    await button.click()
    await page.locator('h1').click()

    await expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  test('v-model:open reports the state', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')

    await fab(page.getByTestId('menu-controlled')).click()
    await expect(page.getByTestId('controlled-open')).toHaveText('true')
    await expect(page.locator('.ui-fab-menu__drawer .ui-fab-menu__item[disabled]')).toHaveCount(1)
  })

  test('a disabled or empty menu does not open', async ({ page }) => {
    await openFixture(page, 'fab-menu/stress')
    const empty = fab(page.getByTestId('menu-empty'))

    await empty.click()
    await expect(empty).toHaveAttribute('aria-expanded', 'false')

    await openFixture(page, 'fab-menu/matrix')
    await expect(fab(page.getByTestId('menu-disabled'))).toBeDisabled()
  })

  // B-4 (owner): the FAB morphs into a 56 round close button of the role.
  test('the open FAB settles as a 56 circle of the role colour', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
    const button = fab(page.getByTestId('menu-density-comfortable'))
    const role = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.style.backgroundColor = 'var(--md-sys-color-primary)'
      document.body.append(probe)
      const color = getComputedStyle(probe).backgroundColor
      probe.remove()
      return color
    })

    expect((await button.boundingBox())!.width / rem).toBeCloseTo(96, 0)
    await button.click()
    // Off the FAB, so its colour is the resting one, not the hover layer.
    await page.mouse.move(0, 0)

    await expect.poll(async () => Math.round((await button.boundingBox())!.width / rem)).toBe(56)
    await expect.poll(() => button.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(role)
    const box = (await button.boundingBox())!
    const radius = await button.evaluate(el => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius))
    expect(radius).toBeGreaterThanOrEqual(box.height / 2 - 1)
  })

  test('the actions line up with the FAB edge on the aligned side', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')

    for (const [id, side] of [['menu-primary-end', 'right'], ['menu-primary-start', 'left']] as const) {
      const button = fab(page.getByTestId(id))
      await button.click()
      await expect(actions(page)).toHaveCount(3)
      await waitForMotion(page)

      const fabBox = (await button.boundingBox())!
      const actionBox = (await actions(page).last().boundingBox())!
      const edge = side === 'right'
        ? [fabBox.x + fabBox.width, actionBox.x + actionBox.width]
        : [fabBox.x, actionBox.x]
      expect(Math.abs(edge[0]! - edge[1]!), id).toBeLessThanOrEqual(2)
      expect(actionBox.y + actionBox.height, id).toBeLessThanOrEqual(fabBox.y)

      await page.keyboard.press('Escape')
      await expect(actions(page)).toHaveCount(0)
    }
  })

  test('in RTL an end-aligned menu lines up with the FAB\'s left edge', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix', { dir: 'rtl' })
    const button = fab(page.getByTestId('menu-primary-end'))

    await button.click()
    await expect(actions(page)).toHaveCount(3)
    await waitForMotion(page)

    const fabBox = (await button.boundingBox())!
    const actionBox = (await actions(page).last().boundingBox())!
    expect(Math.abs(fabBox.x - actionBox.x)).toBeLessThanOrEqual(2)
  })

  test('a tall menu stays in the viewport and scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 420 })
    await openFixture(page, 'fab-menu/stress')
    const button = fab(page.getByTestId('menu-many'))

    await button.scrollIntoViewIfNeeded()
    await button.click()
    await expect(actions(page)).toHaveCount(8)

    const drawer = page.locator('.ui-fab-menu__drawer')
    const box = (await drawer.boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(await drawer.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
  })

  test('actions keep a visible boundary in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'fab-menu/matrix')

    await fab(page.getByTestId('menu-primary-end')).click()
    await expect(actions(page)).toHaveCount(3)

    expect(await actions(page).first().evaluate(el => getComputedStyle(el).borderStyle)).not.toBe('none')
  })
})
