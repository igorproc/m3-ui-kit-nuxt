import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const URL = '/tabs/matrix?theme=light&dir=ltr'

test.describe('MTabs', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'tabs/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  // N.1a: a preset non-first tab stayed unselected and the first tab wrote
  // itself back into the model.
  test('a preset non-first tab is selected and the model is left alone', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    const preset = page.getByTestId('preset')

    await expect(preset.getByRole('tab', { selected: true })).toHaveText('Two')
    await expect(page.getByTestId('preset-model')).toHaveText('two')
    await expect(page.getByTestId('preset-panel')).toHaveText('Panel two')
    await expect(page.getByTestId('slotted').getByRole('tab', { selected: true })).toHaveText('Three')
  })

  test('a tab named in the URL stays selected and the URL is kept', async ({ page }) => {
    await page.goto(`${URL}&tab=three`)
    await page.locator('[data-fixture-ready]').waitFor()

    await expect(page.getByTestId('route').getByRole('tab', { selected: true })).toHaveText('Three')
    await expect(page).toHaveURL(/tab=three/)
  })

  // N.1b (Q50-А): with no tab in the URL, the auto-selected first tab is written back.
  test('without a tab in the URL the first tab is written into it', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')

    await expect(page).toHaveURL(/tab=one/)
    await expect(page.getByTestId('route').getByRole('tab', { selected: true })).toHaveText('One')
  })

  test('the selected tab controls a rendered panel, and a tab without panels controls none', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')

    for (const group of ['preset', 'route']) {
      const tab = page.getByTestId(group).getByRole('tab', { selected: true })
      const panelId = await tab.getAttribute('aria-controls')
      const panel = page.locator(`[id="${panelId}"]`)

      await expect(panel).toHaveRole('tabpanel')
      await expect(panel).toHaveAttribute('aria-labelledby', (await tab.getAttribute('id'))!)
      await expect(panel).toHaveAttribute('tabindex', '0')
    }
    await expect(page.getByTestId('bare').getByRole('tab').first()).not.toHaveAttribute('aria-controls')
  })

  test('the tablist is named', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')

    await expect(page.getByRole('tablist', { name: 'Preset non-first tab' })).toBeVisible()
    await expect(page.getByRole('tablist', { name: 'Tabs without panels' })).toBeVisible()
  })

  // B5.9a: the next tab lies to the left in RTL.
  for (const dir of DIRECTIONS) {
    test(`the arrow toward the reading end selects the next tab (${dir})`, async ({ page }) => {
      await openFixture(page, 'tabs/matrix', { dir })
      const preset = page.getByTestId('preset')

      await preset.getByRole('tab', { selected: true }).focus()
      await page.keyboard.press(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')

      const three = preset.getByRole('tab', { name: 'Three' })
      await expect(three).toHaveAttribute('aria-selected', 'true')
      await expect(three).toBeFocused()
    })
  }
})

const box = async (locator: Locator) => (await locator.boundingBox())!

/** Where the row's anchored indicator sits, or the selected tab's own one without anchor positioning. */
async function indicatorBox(group: Locator) {
  return group.locator('.ui-tabs__list').evaluate((list) => {
    const row = getComputedStyle(list, '::before')
    if (row.content !== 'none' && row.position === 'absolute') {
      const origin = list.getBoundingClientRect()
      return { x: origin.left + Number.parseFloat(row.left) - list.scrollLeft, width: Number.parseFloat(row.width), height: Number.parseFloat(row.height) }
    }
    const tab = list.querySelector('.ui-tabs__tab--active')!
    const own = tab.classList.contains('ui-tabs__tab--secondary') ? tab : tab.querySelector('.ui-tabs__tab-content')!
    const rect = own.getBoundingClientRect()
    return { x: rect.left, width: rect.width, height: Number.parseFloat(getComputedStyle(own, '::after').height) }
  })
}

test.describe('MTabs axes', () => {
  // The tab with an icon over its label was 48 tall: the indicator ran over the label.
  test('an icon over a label makes a 64 tab whose indicator stays under the label', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    const unit = await remInPx(page)
    const tab = page.getByTestId('stacked').getByRole('tab', { name: 'Inbox' })
    const label = await box(tab.locator('.ui-tabs__tab-label'))
    const tabBox = await box(tab)

    expect(tabBox.height / unit).toBeCloseTo(64, 0)
    expect(label.y + label.height).toBeLessThanOrEqual(tabBox.y + tabBox.height - 3 * unit)
  })

  for (const dir of DIRECTIONS) {
    test(`the primary indicator spans the content, the secondary one the tab (${dir})`, async ({ page }) => {
      await openFixture(page, 'tabs/matrix', { dir })
      await waitForMotion(page)

      const primary = page.getByTestId('stacked')
      const content = await box(primary.getByRole('tab', { selected: true }).locator('.ui-tabs__tab-content'))
      const primaryIndicator = await indicatorBox(primary)
      expect(primaryIndicator.width).toBeCloseTo(content.width, 0)
      expect(primaryIndicator.x).toBeCloseTo(content.x, 0)

      const secondary = page.getByTestId('secondary')
      const tab = await box(secondary.getByRole('tab', { selected: true }))
      const indicator = await indicatorBox(secondary)
      expect(indicator.width).toBeCloseTo(tab.width, 0)
      expect(indicator.x).toBeCloseTo(tab.x, 0)
      expect(indicator.height).toBeLessThan(primaryIndicator.height)
    })
  }

  // The indicator grew out of the middle of the new tab; it travels to it now.
  test('the indicator slides to the newly selected tab', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    await waitForMotion(page)
    const group = page.getByTestId('stacked')
    const from = (await indicatorBox(group)).x

    const xs = await group.locator('.ui-tabs__list').evaluate(async (list) => {
      (list.querySelectorAll('.ui-tabs__tab')[2] as HTMLElement).click()
      const samples: number[] = []
      const start = performance.now()
      while (performance.now() - start < 600) {
        samples.push(Number.parseFloat(getComputedStyle(list, '::before').left))
        await new Promise(resolve => requestAnimationFrame(resolve))
      }
      return samples
    })
    const to = (await indicatorBox(group)).x
    const anchored = await group.locator('.ui-tabs__list').evaluate(list => getComputedStyle(list, '::before').position === 'absolute')

    test.skip(!anchored, 'this browser has no anchor positioning: each tab draws its own indicator')
    expect(to).toBeGreaterThan(from)
    expect(xs.some(x => x > xs[0]! + 1 && x < xs.at(-1)! - 1)).toBe(true)
  })

  test('a secondary tab puts its icon beside the label and keeps the base height', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    const unit = await remInPx(page)
    const tab = page.getByTestId('secondary').getByRole('tab', { name: 'Sent' })
    const [icon, label] = [await box(tab.locator('.ui-tabs__tab-icon')), await box(tab.locator('.ui-tabs__tab-label'))]

    expect((await box(tab)).height / unit).toBeCloseTo(48, 0)
    expect(icon.y + icon.height).toBeGreaterThan(label.y)
    expect(icon.x + icon.width).toBeLessThanOrEqual(label.x + 0.5)
  })

  test('a badge describes its tab and stays out of its name', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    const inbox = page.getByTestId('stacked').getByRole('tab', { name: 'Inbox', exact: true })

    await expect(inbox).toHaveAccessibleName('Inbox')
    await expect(inbox).toHaveAccessibleDescription('3 unread')
  })

  // W54-А: the row scrolls instead of pushing the card wider.
  test('a fixed row too wide for its card scrolls inside it', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'tabs/matrix')
    const list = page.getByTestId('fixed-narrow').locator('.ui-tabs__list')
    const card = await box(page.getByTestId('fixed-narrow'))

    expect(await list.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
    expect((await box(list)).width).toBeLessThanOrEqual(card.width + 0.5)
    await expectNoHorizontalOverflow(page)
  })

  test('a scrollable row starts with the preset tab in view', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    const group = page.getByTestId('scrollable')
    const list = await box(group.locator('.ui-tabs__list'))
    const tab = await box(group.getByRole('tab', { selected: true }))

    expect(tab.x).toBeGreaterThanOrEqual(list.x - 0.5)
    expect(tab.x + tab.width).toBeLessThanOrEqual(list.x + list.width + 0.5)
  })

  // W55-А: tabs that lead to pages are a navigation.
  test('tabs with routes are a named navigation of links, the current page marked', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    const nav = page.getByRole('navigation', { name: 'Tabs that lead to pages' })

    await expect(nav).toBeVisible()
    await expect(nav.getByRole('tablist')).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Tabs' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Pagination' })).not.toHaveAttribute('aria-current')
  })
})

const resolved = (page: Page, property: 'color' | 'background-color', value: string) => page.evaluate(([name, color]) => {
  const probe = document.createElement('span')
  probe.style.setProperty(name!, color!)
  document.body.append(probe)
  const result = getComputedStyle(probe).getPropertyValue(name!)
  probe.remove()
  return result
}, [property, value])

const rowIndicator = (group: Locator, property: string) =>
  group.locator('.ui-tabs__list').evaluate((list, name) => getComputedStyle(list, '::before').getPropertyValue(name), property)

test.describe('MTabs states and media', () => {
  test('the selected tab draws the filled glyph of its icon, the others the outline one', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    const group = page.getByTestId('stacked')

    expect(await group.getByRole('tab', { name: 'Inbox' }).locator('.ui-tabs__tab-icon').innerHTML()).toContain('baseline-inbox')
    expect(await group.getByRole('tab', { name: 'Sent' }).locator('.ui-tabs__tab-icon').innerHTML()).toContain('outline-send')
  })

  test('the indicator of a one-letter tab is 24 wide at least', async ({ page }) => {
    await openFixture(page, 'tabs/matrix')
    await waitForMotion(page)

    expect((await indicatorBox(page.getByTestId('short'))).width / await remInPx(page)).toBeGreaterThanOrEqual(24 - 0.5)
  })

  test('the row rule stays one device pixel at least on a narrow window', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'tabs/matrix')
    const width = await page.getByTestId('stacked').locator('.ui-tabs__list').evaluate(list => getComputedStyle(list).borderBottomWidth)

    expect(Number.parseFloat(width)).toBeGreaterThanOrEqual(1)
  })

  for (const dir of DIRECTIONS) {
    test(`a badge takes the top-end corner of its icon, as M3 BadgedBox (${dir})`, async ({ page }) => {
      await openFixture(page, 'tabs/matrix', { dir })
      const rem = await remInPx(page)
      const group = page.getByTestId('stacked')

      for (const [name, overlap, rise] of [['Inbox', 12, 2], ['Drafts', 6, 0]] as const) {
        const tab = group.getByRole('tab', { name })
        const icon = await box(tab.locator('.ui-tabs__tab-icon'))
        const badge = await box(tab.locator('.ui-badge'))
        const measured = dir === 'ltr' ? icon.x + icon.width - badge.x : badge.x + badge.width - icon.x

        expect(measured / rem, name).toBeCloseTo(overlap, 0)
        expect((icon.y - badge.y) / rem, name).toBeCloseTo(rise, 0)
      }
    })
  }

  test('forced colors: the indicator is Highlight and a disabled tab GrayText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'tabs/matrix')
    const group = page.getByTestId('stacked')

    expect(await rowIndicator(group, 'background-color')).toBe(await resolved(page, 'background-color', 'Highlight'))
    expect(await group.getByRole('tab', { name: 'Spam' }).evaluate(el => getComputedStyle(el).color)).toBe(await resolved(page, 'color', 'GrayText'))
  })

  test('reduced motion shortens the indicator slide instead of dropping it', async ({ page }) => {
    const slide = async () => Number.parseFloat(await rowIndicator(page.getByTestId('stacked'), 'transition-duration'))

    await openFixture(page, 'tabs/matrix')
    const full = await slide()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const reduced = await slide()

    expect(reduced).toBeGreaterThan(0)
    expect(reduced).toBeLessThan(full)
  })
})

test.describe('MTabs server HTML', () => {
  test.use({ javaScriptEnabled: false })

  // N.1a / B5.5c: the first paint is the server's, before any script runs.
  test('the preset tabs are selected and named before hydration', async ({ page }) => {
    await page.goto(`${URL}&tab=three`)

    await expect(page.getByTestId('preset').getByRole('tab', { selected: true })).toHaveText('Two')
    await expect(page.getByTestId('slotted').getByRole('tab', { selected: true })).toHaveText('Three')
    await expect(page.getByTestId('route').getByRole('tab', { selected: true })).toHaveText('Three')
    await expect(page.getByTestId('preset-panel')).toHaveText('Panel two')
    await expect(page.getByTestId('preset').getByRole('tab', { selected: true })).toHaveCount(1)
  })
})
