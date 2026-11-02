import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture, remInPx, waitForMotion } from '../../e2e/support'

const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

const pseudoOpacity = (locator: Locator) =>
  locator.evaluate(el => getComputedStyle(el, '::before').opacity)

/** The selection fill of a navigation pill, drawn on its `::after`. */
const fillOf = (locator: Locator) =>
  locator.evaluate((el) => {
    const fill = getComputedStyle(el, '::after')
    return { color: fill.backgroundColor, opacity: fill.opacity }
  })

/** The colour a system role resolves to on this page, as the browser computes it. */
const roleColor = (page: Page, role: string) => page.evaluate((name) => {
  const probe = document.createElement('div')
  probe.style.backgroundColor = `var(--md-sys-color-${name})`
  document.body.append(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}, role)

test.describe('Navigation rail and bar', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'navigation/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  // B5.3b (Q22-А): flat M3 containers.
  test('rail and bar are flat surface-container panels', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const surfaceContainer = await roleColor(page, 'surface-container')

    for (const id of ['rail', 'bar']) {
      const container = page.getByTestId(id)
      expect(await style(container, 'border-top-left-radius'), id).toBe('0px')
      expect(await style(container, 'box-shadow'), id).toBe('none')
      expect(await style(container, 'background-color'), id).toBe(surfaceContainer)
    }
  })

  // B5.2a: hovering the active pill used to fade it to the pressed tint.
  test('hovering the active rail pill keeps it opaque and adds the state layer on top', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const active = page.getByTestId('rail').locator('.ui-navigation-item--active')
    const pill = active.locator('.ui-navigation-item__indicator')
    const resting = await fillOf(pill)

    await active.hover()
    await waitForMotion(page)

    expect(await fillOf(pill)).toEqual(resting)
    expect(resting).toEqual({ color: await roleColor(page, 'secondary-container'), opacity: '1' })
    expect(Number(await pseudoOpacity(pill))).toBeCloseTo(0.08, 2)
  })

  // B5.3a: the active destination of the bar is a 64 × 32 pill, not a colour alone.
  test('the active bar destination carries a 64 × 32 secondary-container pill', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const unit = await remInPx(page)
    const bar = page.getByTestId('bar')
    const active = bar.locator('.ui-navigation-item--active')
    const pill = active.locator('.ui-navigation-item__indicator')
    const box = (await pill.boundingBox())!

    await expect(active).toHaveCount(1)
    await expect(active).toContainText('Outbox')
    expect(box.width / unit).toBeCloseTo(64, 0)
    expect(box.height / unit).toBeCloseTo(32, 0)
    expect(await fillOf(pill)).toEqual({ color: await roleColor(page, 'secondary-container'), opacity: '1' })
    expect((await fillOf(bar.locator('.ui-navigation-item__indicator').first())).opacity).toBe('0')
  })

  // W70-А: the selected destination draws a filled glyph, not only a colour.
  test('the active destination draws the filled glyph of its icon', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const bar = page.getByTestId('bar')

    expect(await bar.locator('.ui-navigation-item--active .ui-navigation-item__icon').innerHTML()).toContain('baseline-send')
    expect(await bar.locator('.ui-navigation-item').first().locator('.ui-navigation-item__icon').innerHTML()).toContain('outline-inbox')
  })

  test('keyboard focus rings the pill, not the whole destination', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const outbox = page.getByTestId('bar').getByRole('button', { name: 'Outbox' })

    await page.getByTestId('bar').getByRole('button', { name: 'Inbox', exact: true }).focus()
    await page.keyboard.press('Tab')

    await expect(outbox).toBeFocused()
    expect(await style(outbox, 'outline-style')).toBe('none')
    expect(await style(outbox.locator('.ui-navigation-item__indicator'), 'outline-style')).toBe('solid')
  })

  // W57-А: the horizontal item holds the icon and the label in one 40-high pill.
  test('a horizontal bar destination holds its icon and its label in the pill', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const unit = await remInPx(page)
    const active = page.getByTestId('bar-start').locator('.ui-navigation-item--active')
    const pill = (await active.locator('.ui-navigation-item__indicator').boundingBox())!
    const label = (await active.locator('.ui-navigation-item__label').boundingBox())!
    const icon = (await active.locator('.ui-navigation-item__icon').boundingBox())!

    expect(pill.height / unit).toBeCloseTo(40, 0)
    for (const part of [label, icon]) {
      expect(part.x).toBeGreaterThanOrEqual(pill.x - 0.5)
      expect(part.x + part.width).toBeLessThanOrEqual(pill.x + pill.width + 0.5)
    }
    expect(label.x).toBeGreaterThan(icon.x)
  })

  // B5.1b (Q56-А): pressing the active destination again is reported too.
  test('every activation is reported, the active destination included', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')

    await page.getByTestId('rail').getByRole('button', { name: 'Outbox' }).click()
    await page.getByTestId('rail').getByRole('button', { name: 'Outbox' }).click()
    await page.getByTestId('bar').getByRole('button', { name: 'Outbox' }).click()

    await expect(page.getByTestId('rail-selects')).toHaveText('2')
    await expect(page.getByTestId('bar-selects')).toHaveText('1')
  })

  // RTL: the expanded rail put its icon and label at physical left offsets.
  test('the expanded rail item mirrors in RTL', async ({ page }) => {
    const offsetsFromStart = async (dir: 'ltr' | 'rtl') => {
      await openFixture(page, 'navigation/matrix', { dir })
      await waitForMotion(page)
      const item = page.getByTestId('rail-expanded').locator('.ui-navigation-item').first()
      const [box, icon, label] = await Promise.all([
        item.boundingBox(),
        item.locator('.ui-navigation-item__icon').boundingBox(),
        item.locator('.ui-navigation-item__label').boundingBox(),
      ])
      const fromStart = (left: number, right: number) => (dir === 'ltr' ? left - box!.x : box!.x + box!.width - right)

      return {
        icon: fromStart(icon!.x, icon!.x + icon!.width),
        label: fromStart(label!.x, label!.x + label!.width),
      }
    }

    const ltr = await offsetsFromStart('ltr')
    const rtl = await offsetsFromStart('rtl')

    expect(ltr.label).toBeGreaterThan(ltr.icon)
    expect(rtl.icon).toBeCloseTo(ltr.icon, 0)
    expect(rtl.label).toBeCloseTo(ltr.label, 0)
  })

  // RTL: the badges were pinned with a physical `right`.
  for (const dir of DIRECTIONS) {
    for (const id of ['rail', 'bar']) {
      test(`the ${id} badge sits at the inline end of its icon (${dir})`, async ({ page }) => {
        await openFixture(page, 'navigation/matrix', { dir })
        const item = page.getByTestId(id).getByRole('button', { name: /Inbox/ })
        const icon = (await item.locator('.ui-icon').first().boundingBox())!
        const badge = (await item.locator('.ui-badge').boundingBox())!
        const iconCenter = icon.x + icon.width / 2
        const badgeCenter = badge.x + badge.width / 2

        if (dir === 'ltr') expect(badgeCenter).toBeGreaterThan(iconCenter)
        else expect(badgeCenter).toBeLessThan(iconCenter)
        // M3 BadgedBox: the badge overlaps the icon's end by 12 and rises 2 above it
        const rem = await remInPx(page)
        const overlap = dir === 'ltr' ? icon.x + icon.width - badge.x : badge.x + badge.width - icon.x
        expect(overlap / rem).toBeCloseTo(12, 0)
        expect((icon.y - badge.y) / rem).toBeCloseTo(2, 0)
        // The badge paints over the glyph, not under it
        const onTop = await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('.ui-badge')),
          { x: badge.x + badge.width / 2, y: badge.y + badge.height / 2 })
        expect(onTop).toBe(true)
      })
    }
  }

  // W56-А: a navigation landmark, not a composite widget — every destination is a Tab stop.
  for (const id of ['bar', 'rail']) {
    test(`Tab walks the ${id} destination by destination and arrows stay put`, async ({ page }) => {
      await openFixture(page, 'navigation/matrix')
      const nav = page.getByTestId(id)

      await nav.getByRole('button', { name: 'Inbox', exact: true }).focus()
      await page.keyboard.press('Tab')
      await expect(nav.getByRole('button', { name: 'Outbox' })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(nav.getByRole('button', { name: 'Favorites' })).toBeFocused()

      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowDown')
      await expect(nav.getByRole('button', { name: 'Favorites' })).toBeFocused()
    })
  }

  // A11-04: the count used to be read before the name ("3 Inbox").
  test('the badge is read after the name, not as part of it', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const inbox = page.getByTestId('bar').getByRole('button', { name: 'Inbox', exact: true })

    await expect(inbox).toHaveAccessibleName('Inbox')
    await expect(inbox).toHaveAccessibleDescription('3 unread')
  })

  // W58-А
  test('a disabled destination cannot be chosen', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const trash = page.getByTestId('rail').getByRole('button', { name: 'Trash' })

    await expect(trash).toBeDisabled()
    await trash.click({ force: true })
    await expect(trash).not.toHaveAttribute('aria-current', 'page')
  })

  // CT-08: the list used to be cut off by the rail's `overflow: hidden`.
  test('a rail with more destinations than room scrolls its list', async ({ page }) => {
    await openFixture(page, 'navigation/matrix')
    const rail = page.getByTestId('rail-long')
    const list = rail.locator('.ui-navigation-rail__list')

    expect(await style(list, 'overflow-y')).toBe('auto')
    expect(await list.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)

    await list.hover()
    await page.mouse.wheel(0, 4000)
    await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
    await expect(rail.getByRole('button', { name: 'Section 20' })).toBeInViewport()
  })

  // W63-А: a modal rail stays collapsed in place and expands over the content.
  test.describe('modal rail', () => {
    const menuOf = (page: Page) => page.getByTestId('rail-menu')

    test('opens over the content from the menu button and closes back to it on Escape', async ({ page }) => {
      await openFixture(page, 'navigation/matrix')
      const gridRail = page.getByTestId('rail-modal')
      const collapsedWidth = (await gridRail.boundingBox())!.width

      await expect(menuOf(page)).toHaveAttribute('aria-expanded', 'false')
      await menuOf(page).click()
      const dialog = page.getByRole('dialog', { name: 'Modal rail destinations' })
      await expect(dialog).toBeVisible()
      await waitForMotion(page)

      expect((await gridRail.boundingBox())!.width).toBeCloseTo(collapsedWidth, 0)
      await expect(dialog.getByRole('navigation').getByRole('button', { name: 'Favorites' })).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'true')

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(menuOf(page)).toHaveAttribute('aria-expanded', 'false')
      await expect(menuOf(page)).toBeFocused()
    })

    for (const dir of DIRECTIONS) {
      test(`the open modal rail has no axe violations (${dir})`, async ({ page }) => {
        await openFixture(page, 'navigation/matrix', { dir })
        await menuOf(page).click()
        await expect(page.getByRole('dialog', { name: 'Modal rail destinations' })).toBeVisible()
        await waitForMotion(page)

        await expectNoAxeViolations(page)
      })
    }
  })
})
