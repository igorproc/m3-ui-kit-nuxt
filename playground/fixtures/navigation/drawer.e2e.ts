import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, expectNoAxeViolations, remInPx, waitForMotion } from '../../e2e/support'

const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

/** The colour a system role resolves to on this page, as the browser computes it. */
const roleColor = (page: Page, role: string) => page.evaluate((name) => {
  const probe = document.createElement('div')
  probe.style.backgroundColor = `var(--md-sys-color-${name})`
  document.body.append(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}, role)

test.describe('Navigation drawer', () => {
  const surfaceOf = (page: Page) => page.getByTestId('drawer').locator('.ui-navigation-drawer__surface')

  async function openDrawer(page: Page, query: { dir?: 'ltr' | 'rtl', side?: 'start' | 'end' } = {}) {
    const { dir = 'ltr', side = 'start' } = query
    await page.goto(`/navigation/drawer?theme=light&dir=${dir}&side=${side}`)
    await page.locator('[data-fixture-ready]').waitFor()
    await page.getByTestId('open-drawer').click()
    await expect(surfaceOf(page)).toBeVisible()
    await waitForMotion(page)
  }

  // B5.4c (Q56-А)
  test('opens from #activator, which names the dialog it controls', async ({ page }) => {
    await page.goto('/navigation/drawer?theme=light&dir=ltr')
    await page.locator('[data-fixture-ready]').waitFor()
    const trigger = page.getByTestId('open-drawer')

    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()

    const dialogId = await trigger.getAttribute('aria-controls')
    await expect(page.locator(`[id="${dialogId}"]`)).toHaveAttribute('data-test', 'drawer')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  for (const dir of DIRECTIONS) {
    test(`open drawer has no axe violations (${dir})`, async ({ page }) => {
      await openDrawer(page, { dir })
      await expectNoAxeViolations(page)
    })
  }

  // W62-В: the drawer draws its destinations with the shared item, the pill on the whole row.
  test('the current drawer destination is a 56-high pill across the row, in its section', async ({ page }) => {
    await openDrawer(page)
    const unit = await remInPx(page)
    const dialog = page.getByRole('dialog', { name: 'Destinations' })
    const inbox = dialog.getByRole('button', { name: 'Inbox', exact: true })
    const pill = (await inbox.locator('.ui-navigation-item__indicator').boundingBox())!
    const nav = (await dialog.locator('.ui-navigation-drawer__nav').boundingBox())!

    await expect(inbox).toHaveAttribute('aria-current', 'page')
    await expect(inbox).toHaveAccessibleDescription('24 unread')
    expect(pill.height / unit).toBeCloseTo(56, 0)
    expect(pill.width).toBeCloseTo(nav.width, 0)
    await expect(dialog.getByRole('group', { name: 'Labels' }).getByRole('button', { name: 'Family' })).toBeVisible()

    await dialog.getByRole('button', { name: 'Sent' }).click()
    await expect(dialog.getByRole('button', { name: 'Sent' })).toHaveAttribute('aria-current', 'page')
  })

  test('the drawer surface is 360 wide on surface-container-low', async ({ page }) => {
    await openDrawer(page)
    const unit = await remInPx(page)
    const surface = surfaceOf(page)

    expect((await surface.boundingBox())!.width / unit).toBeCloseTo(360, 0)
    expect(await style(surface, 'background-color')).toBe(await roleColor(page, 'surface-container-low'))
  })

  // B5.4a: the list used to be cut off at the bottom of the screen.
  test('a long list scrolls inside the drawer and reaches its last destination', async ({ page }) => {
    await openDrawer(page)
    const content = surfaceOf(page).locator('.ui-navigation-drawer__content')

    expect(await style(content, 'overflow-y')).toBe('auto')
    expect(await style(content, 'overscroll-behavior-y')).toBe('contain')
    expect(await content.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)

    await content.hover()
    await page.mouse.wheel(0, 4000)
    await expect.poll(() => content.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
    await expect(page.getByTestId('destination-40')).toBeInViewport()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  // B5.4b (Q23-А): `start` is logical — the right edge in RTL, with its corners and its slide.
  for (const dir of DIRECTIONS) {
    for (const side of ['start', 'end'] as const) {
      test(`a ${side} drawer is pinned to its logical edge (${dir})`, async ({ page }) => {
        await openDrawer(page, { dir, side })
        const surface = surfaceOf(page)
        const box = (await surface.boundingBox())!
        // Pinned to the edge of the overlay layer it lives in (which, under the
        // scroll lock, stops short of the old scrollbar — an MOverlay matter).
        const layer = (await page.getByTestId('drawer').boundingBox())!
        const width = layer.x + layer.width
        const onLeft = (side === 'start') === (dir === 'ltr')

        if (onLeft) expect(box.x).toBeCloseTo(0, 0)
        else expect(box.x + box.width).toBeCloseTo(width, 0)

        const outer = await style(surface, onLeft ? 'border-top-left-radius' : 'border-top-right-radius')
        const inner = await style(surface, onLeft ? 'border-top-right-radius' : 'border-top-left-radius')
        expect(outer).toBe('0px')
        expect(Number.parseFloat(inner)).toBeGreaterThan(0)
      })
    }
  }

  // Reduced motion used to switch the slide off (`0s`): the kit shortens motion, it does not remove it.
  test('reduced motion shortens the slide instead of removing it', async ({ page }) => {
    const slideDurations = () => page.evaluate(() => {
      const panel = document.querySelector('.ui-navigation-drawer')!
      const surface = panel.querySelector('.ui-navigation-drawer__surface')!

      // Vue ends a phase by the panel's own duration, so the panel must move as long as the surface.
      return ['enter', 'leave'].flatMap((phase) => {
        const active = `ui-navigation-drawer-slide-start-${phase}-active`
        panel.classList.add(active)
        const seconds = [panel, surface].map(element => Number.parseFloat(getComputedStyle(element).transitionDuration))
        panel.classList.remove(active)
        return seconds
      })
    })

    await openDrawer(page)
    const [enterPanel, enter, leavePanel, leave] = await slideDurations()
    expect(enterPanel).toBe(enter)
    expect(leavePanel).toBe(leave)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const [reducedEnterPanel, reducedEnter, reducedLeavePanel, reducedLeave] = await slideDurations()

    expect(reducedEnter).toBeGreaterThan(0)
    expect(reducedLeave).toBeGreaterThan(0)
    expect(reducedEnterPanel).toBe(reducedEnter)
    expect(reducedLeavePanel).toBe(reducedLeave)
    expect(reducedEnter).toBeLessThan(enter!)
    expect(reducedLeave).toBeLessThanOrEqual(leave!)
  })

  test('in RTL a start drawer slides in from the right', async ({ page }) => {
    await page.goto('/navigation/drawer?theme=light&dir=rtl&side=start')
    await page.locator('[data-fixture-ready]').waitFor()

    const xs = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('[data-test="open-drawer"]')!.click()
      const samples: number[] = []
      const start = performance.now()
      while (performance.now() - start < 600) {
        const surface = document.querySelector('.ui-navigation-drawer__surface')
        if (surface) samples.push(surface.getBoundingClientRect().x)
        await new Promise(resolve => requestAnimationFrame(resolve))
      }
      return samples
    })

    const settled = xs.at(-1)!
    expect(xs.length).toBeGreaterThan(2)
    expect(xs[0]!).toBeGreaterThan(settled)
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeLessThanOrEqual(xs[i - 1]! + 0.5)
  })
})
