import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

const css = (locator: Locator, property: string, pseudo?: string) =>
  locator.evaluate((el, [name, part]) => getComputedStyle(el, part).getPropertyValue(name!), [property, pseudo] as const)

const px = async (locator: Locator, property: string) => Number.parseFloat(await css(locator, property))

const box = async (locator: Locator) => (await locator.boundingBox())!

const resolved = (page: Page, property: 'color' | 'background-color', value: string) => page.evaluate(([name, color]) => {
  const probe = document.createElement('span')
  probe.style.setProperty(name!, color!)
  document.body.append(probe)
  const result = getComputedStyle(probe).getPropertyValue(name!)
  probe.remove()
  return result
}, [property, value])

const emulateCutouts = async (page: Page, insets: { top?: number, right?: number, bottom?: number, left?: number }) => {
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, right: 0, bottom: 0, left: 0, ...insets } })
}

test.describe('Navigation · stress', () => {
  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'navigation/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'navigation/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('six destinations in a 360 bar keep every label inside its destination, two lines at most', async ({ page }) => {
    await openFixture(page, 'navigation/stress')
    const bar = page.getByTestId('bar-stress')
    const lineHeight = await px(bar.locator('.ui-navigation-item__label').first(), 'line-height')
    const barBox = await box(bar)

    for (const item of await bar.locator('.ui-navigation-item').all()) {
      const label = item.locator('.ui-navigation-item__label')
      const [itemBox, labelBox] = [await box(item), await box(label)]

      expect(labelBox.height).toBeLessThanOrEqual(2 * lineHeight + 0.5)
      expect(labelBox.x).toBeGreaterThanOrEqual(itemBox.x - 0.5)
      expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(itemBox.x + itemBox.width + 0.5)
      expect(itemBox.y + itemBox.height).toBeLessThanOrEqual(barBox.y + barBox.height + 0.5)
    }
  })

  test('a bar with more destinations than M3 sets warns in dev, one within the range does not', async ({ page }) => {
    test.skip(Boolean(process.env.CI || process.env.E2E_PROD), 'dev-only warning; a production build compiles it out')
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })
    await openFixture(page, 'navigation/stress')

    expect(warnings.some(text => text.includes('[m-navigation-bar] 6 destinations'))).toBe(true)
    expect(warnings.some(text => text.includes('[m-navigation-bar] 3 destinations'))).toBe(false)
  })

  test('a rail outside m-layout is as tall as its container', async ({ page }) => {
    await openFixture(page, 'navigation/stress')
    const rem = await remInPx(page)

    expect((await box(page.getByTestId('rail-toggle'))).height / rem).toBeCloseTo(480, 0)
  })
})

test.describe('Navigation · forced colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
  })

  for (const id of ['bar', 'rail']) {
    test(`the active ${id} pill is Highlight under a HighlightText icon`, async ({ page }) => {
      await openFixture(page, 'navigation/matrix')
      const active = page.getByTestId(id).locator('.ui-navigation-item--active')

      expect(await css(active.locator('.ui-navigation-item__indicator'), 'background-color', '::after')).toBe(await resolved(page, 'background-color', 'Highlight'))
      expect(await css(active.locator('.ui-navigation-item__icon'), 'color')).toBe(await resolved(page, 'color', 'HighlightText'))
    })
  }

  test('a disabled destination is GrayText and both containers keep an edge', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')

    expect(await css(page.getByTestId('rail').getByRole('button', { name: 'Trash' }), 'color')).toBe(await resolved(page, 'color', 'GrayText'))
    for (const id of ['bar', 'rail']) {
      expect(await css(page.getByTestId(id), 'outline-style'), id).toBe('solid')
    }
  })
})

test.describe('Navigation · reduced motion', () => {
  const durationOf = async (locator: Locator, pseudo?: string) => Number.parseFloat(await css(locator, 'transition-duration', pseudo))

  test('the rail widens and the pill grows on shortened, not dropped, transitions', async ({ page }) => {
    await openFixture(page, 'navigation/stress')
    const rail = page.getByTestId('rail-toggle')
    const pill = rail.locator('.ui-navigation-item__indicator').first()
    const full = [await durationOf(rail), await durationOf(pill, '::after')]

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const reduced = [await durationOf(rail), await durationOf(pill, '::after')]

    for (const [index, value] of reduced.entries()) {
      expect(value).toBeGreaterThan(0)
      expect(value).toBeLessThan(full[index]!)
    }
  })

  test('the rail still reaches its expanded width', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'navigation/stress')
    const rem = await remInPx(page)
    const rail = page.getByTestId('rail-toggle')

    await page.getByTestId('rail-toggle-menu').click()
    await expect.poll(async () => (await box(rail)).width / rem).toBeCloseTo(256, 0)
  })
})

test.describe('Navigation · expanded rail focus ring', () => {
  test('the first and the last destination keep the whole ring inside the scrolling list', async ({ page }) => {
    await openFixture(page, 'navigation/stress')
    const rail = page.getByTestId('rail-stress-expanded')
    const list = rail.locator('.ui-navigation-rail__list')
    const first = rail.getByRole('button', { name: 'Inbox' })

    await first.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(first).toBeFocused()

    const pill = first.locator('.ui-navigation-item__indicator')
    expect(await css(pill, 'outline-style')).toBe('solid')
    const reach = await px(pill, 'outline-width') + await px(pill, 'outline-offset')
    const clip = await box(list)
    const top = await box(pill)
    const bottom = await box(rail.locator('.ui-navigation-item__indicator').last())

    expect(top.y - clip.y).toBeGreaterThanOrEqual(reach - 0.5)
    expect(clip.y + clip.height - (bottom.y + bottom.height)).toBeGreaterThanOrEqual(reach - 0.5)
    expect(top.x - clip.x).toBeGreaterThanOrEqual(reach - 0.5)
  })
})

test.describe('Navigation · safe area', () => {
  test('a bar outside m-layout clears the bottom and side cutouts itself', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await openFixture(page, 'navigation/matrix')
    const bar = page.getByTestId('bar')
    const centered = page.getByTestId('bar-start')
    const height = (await box(bar)).height
    const margin = await px(centered, 'padding-left')

    await emulateCutouts(page, { bottom: 21, left: 47, right: 30 })
    await openFixture(page, 'navigation/matrix')

    expect(await px(bar, 'padding-bottom')).toBeCloseTo(21, 0)
    expect(await px(bar, 'padding-left')).toBeCloseTo(47, 0)
    expect(await px(bar, 'padding-right')).toBeCloseTo(30, 0)
    expect((await box(bar)).height).toBeCloseTo(height + 21, 0)
    expect(await px(centered, 'padding-left')).toBeCloseTo(margin + 47, 0)
    expect(await px(centered, 'padding-right')).toBeCloseTo(margin + 30, 0)
  })
})
