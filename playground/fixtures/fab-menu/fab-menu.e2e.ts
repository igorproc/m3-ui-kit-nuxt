import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'
import { traceMotion } from '../../e2e/probe'
import { traceCorner } from '../button/motion'

const fab = (menu: Locator) => menu.locator('.ui-fab-menu__activator')
const actions = (page: Page) => page.locator('.ui-fab-menu__drawer .ui-fab-menu__item')

/** Engines without CSS anchor positioning take the JS path; Chromium is told it has none. */
async function withoutAnchorPositioning(page: Page) {
  await page.addInitScript(() => {
    const native = CSS.supports.bind(CSS)
    CSS.supports = ((...args: [string, string?]) => {
      if (/anchor|position-try/.test(args.join(' '))) return false
      return args.length > 1 ? native(args[0], args[1]!) : native(args[0])
    }) as typeof CSS.supports
  })
}

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

  // FM.B-1/B-2: the JS path placed the column by the closed FAB (40 too high
  // over a 96 FAB, overlapping a 40 one) and measured the drawer before it had
  // its width (23rem past the FAB's edge).
  test('without anchor positioning the column ends 8 above the open FAB, edges aligned', async ({ page }) => {
    await withoutAnchorPositioning(page)
    await openFixture(page, 'fab-menu/matrix')
    const rem = await remInPx(page)

    for (const id of ['menu-density-compact', 'menu-density-default', 'menu-density-comfortable']) {
      const button = fab(page.getByTestId(id))
      await button.scrollIntoViewIfNeeded()
      await button.click()
      await expect(actions(page)).toHaveCount(3)
      await waitForMotion(page)

      const fabBox = (await button.boundingBox())!
      const actionBox = (await actions(page).last().boundingBox())!
      expect((fabBox.y - (actionBox.y + actionBox.height)) / rem, id).toBeCloseTo(8, 0)
      expect(Math.abs(fabBox.x + fabBox.width - (actionBox.x + actionBox.width)) / rem, id).toBeLessThanOrEqual(1)

      await page.keyboard.press('Escape')
      await expect(actions(page)).toHaveCount(0)
    }
  })

  // FM.B-3, Q-4: closing used to fade the whole drawer on the entrance curve;
  // the actions now leave farthest-first, downwards, as they came.
  test('closing sends the actions down farthest-first before the drawer goes', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-primary-end'))
    await button.click()
    await expect(actions(page)).toHaveCount(3)
    await waitForMotion(page)

    const trace = await traceMotion(page, {
      targets: { far: '.ui-fab-menu__entry:first-child', near: '.ui-fab-menu__entry:last-child' },
      styles: ['opacity'],
      duration: 700,
      act: () => page.keyboard.press('Escape'),
    })
    const firstFade = (name: 'far' | 'near') => trace.frames.find(frame => frame.t >= 0 && Number(frame.styles[name]?.opacity ?? 1) < 0.95)?.t ?? Infinity
    const far = trace.frames.filter(frame => frame.rects.far)
    const lowest = Math.max(...far.map(frame => frame.rects.far!.y))

    expect(firstFade('far')).toBeLessThan(firstFade('near'))
    expect(lowest).toBeGreaterThan(far[0]!.rects.far!.y)
    await expect(actions(page)).toHaveCount(0)
  })

  // MO-03: a reversal mid-way continues from where the actions and the glyphs are.
  test('a quick open-close-open never jumps an action or a glyph', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-primary-end'))

    const trace = await traceMotion(page, {
      targets: {
        action: '[data-test="menu-primary-end"] .ui-fab-menu__entry:last-child',
        open: '[data-test="menu-primary-end"] .ui-fab-menu__icon--open',
        close: '[data-test="menu-primary-end"] .ui-fab-menu__icon--close',
      },
      styles: ['opacity'],
      duration: 900,
      act: async () => {
        await button.click()
        await page.waitForTimeout(120)
        await button.click()
        await page.waitForTimeout(120)
        await button.click()
      },
    })

    for (const name of ['action', 'open', 'close']) {
      const series = trace.frames.map(frame => Number(frame.styles[name]?.opacity ?? Number.NaN)).filter(value => !Number.isNaN(value))
      const largest = Math.max(0, ...series.slice(1).map((value, index) => Math.abs(value - series[index]!)))
      expect(largest, name).toBeLessThan(0.5)
    }
    await expect(page.locator('[data-test="menu-primary-end"] .ui-fab-menu__icon')).toHaveCount(2)
  })

  test('the FAB rounds into its circle frame by frame', async ({ page }) => {
    await openFixture(page, 'fab-menu/matrix')
    const button = fab(page.getByTestId('menu-density-default'))
    await button.scrollIntoViewIfNeeded()

    const motion = await traceCorner(page, '[data-test="menu-density-default"] .ui-fab-menu__activator', () => button.click())
    expect(motion.toRem - motion.fromRem).toBeGreaterThan(10)
    expect(motion.lagMs!).toBeLessThanOrEqual(34)
    expect(motion.largestStepShare).toBeLessThan(0.5)
  })

  test('actions keep a visible boundary in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'fab-menu/matrix')

    await fab(page.getByTestId('menu-primary-end')).click()
    await expect(actions(page)).toHaveCount(3)

    expect(await actions(page).first().evaluate(el => getComputedStyle(el).borderStyle)).not.toBe('none')
  })
})
