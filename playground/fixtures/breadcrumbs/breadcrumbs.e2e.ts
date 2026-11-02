import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture } from '../../e2e/support'

const list = (root: Locator) => root.locator('.ui-breadcrumbs__list')

/** Whether the current crumb lies inside its list's visible box. */
const currentIsVisible = (root: Locator) => list(root).evaluate((scroller) => {
  const current = scroller.querySelector('.ui-breadcrumbs__item--current')!.getBoundingClientRect()
  const box = scroller.getBoundingClientRect()
  return current.left >= box.left - 1 && current.right <= box.right + 1
})

test.describe('MBreadcrumbs', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'breadcrumbs/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  // B5.8b: a long scrolling trail used to open at its root, the current page out of view.
  for (const dir of DIRECTIONS) {
    test(`a scrolling trail opens on the current crumb (${dir})`, async ({ page }) => {
      await openFixture(page, 'breadcrumbs/matrix', { dir })
      const scroll = page.getByTestId('scroll')

      expect(await list(scroll).evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
      expect(Math.abs(await list(scroll).evaluate(el => el.scrollLeft))).toBeGreaterThan(0)
      expect(await currentIsVisible(scroll)).toBe(true)
    })
  }

  // TH-05: the current crumb used to differ from the links by a shade only.
  for (const forced of [false, true]) {
    test(`the current crumb is set in a heavier weight${forced ? ' in forced colors' : ''}`, async ({ page }) => {
      if (forced) await page.emulateMedia({ forcedColors: 'active' })
      await openFixture(page, 'breadcrumbs/matrix')
      const wrap = page.getByTestId('wrap')
      const weight = (locator: Locator) => locator.evaluate(el => Number(getComputedStyle(el).fontWeight))

      expect(await weight(wrap.locator('[aria-current="page"]'))).toBeGreaterThan(await weight(wrap.getByRole('link', { name: 'Home' })))
    })
  }

  // TH-04: forced colors turned links, the current crumb and a disabled one alike.
  test('in forced colors a link is underlined and a disabled crumb is GrayText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'breadcrumbs/matrix')
    const trail = page.getByTestId('wrap-long')
    const style = (locator: Locator, property: string) => locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)
    const grayText = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.style.color = 'GrayText'
      document.body.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })

    expect(await style(trail.getByRole('link', { name: 'Home' }), 'text-decoration-line')).toContain('underline')
    expect(await style(trail.locator('[aria-current="page"]'), 'text-decoration-line')).not.toContain('underline')
    expect(await style(trail.locator('[aria-disabled="true"]'), 'color')).toBe(grayText)
  })

  // CT-04: an unbroken name pushed the wrapping trail past its box.
  test('a wrapping trail breaks an unbroken crumb instead of overflowing', async ({ page }) => {
    await openFixture(page, 'breadcrumbs/matrix')
    const trail = page.getByTestId('wrap-long')
    const box = (await trail.boundingBox())!

    expect(await list(trail).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    for (const crumb of await trail.locator('.ui-breadcrumbs__item').all()) {
      const crumbBox = (await crumb.boundingBox())!
      expect(crumbBox.x + crumbBox.width).toBeLessThanOrEqual(box.x + box.width + 0.5)
    }
  })

  // IN-05: the scrolling list clipped the focus ring of its crumbs.
  for (const dir of DIRECTIONS) {
    test(`a scrolling trail keeps the whole focus ring of its first crumb in view (${dir})`, async ({ page }) => {
      await openFixture(page, 'breadcrumbs/matrix', { dir })
      const scroll = page.getByTestId('scroll')
      const first = scroll.getByRole('link', { name: 'Home' })
      await first.focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(first).toBeFocused()
      await list(scroll).evaluate((el) => {
        el.scrollLeft = 0
      })

      const fits = await first.evaluate((el) => {
        const scroller = el.closest('.ui-breadcrumbs__list')!
        const style = getComputedStyle(el)
        const ring = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset)
        const crumb = el.getBoundingClientRect()
        const port = scroller.getBoundingClientRect()
        return ring > 0
          && crumb.top - ring >= port.top - 0.5 && crumb.bottom + ring <= port.bottom + 0.5
          && crumb.left - ring >= port.left - 0.5 && crumb.right + ring <= port.right + 0.5
      })
      expect(fits).toBe(true)
    })
  }

  // CT-11: a scrolling trail gave no hint that it goes on past its edge.
  for (const dir of DIRECTIONS) {
    test(`a scrolling trail fades the edge it can still scroll towards (${dir})`, async ({ page }) => {
      await openFixture(page, 'breadcrumbs/matrix', { dir })
      const scroller = list(page.getByTestId('scroll'))
      test.skip(!(await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))), 'no scroll-driven animations')

      const maskAt = (where: 'start' | 'end') => scroller.evaluate(async (el, scrollTo) => {
        const max = el.scrollWidth - el.clientWidth
        const rtl = getComputedStyle(el).direction === 'rtl'
        const target = scrollTo === 'start' ? 0 : max
        el.scrollLeft = rtl ? -target : target
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const style = getComputedStyle(el)
        return { image: style.maskImage, position: style.maskPosition }
      }, where)

      const atStart = await maskAt('start')
      const atEnd = await maskAt('end')

      expect(atStart.image).not.toBe('none')
      expect(atStart.position).not.toBe(atEnd.position)
    })
  }

  test('a wrapping trail does not scroll the page to its current crumb', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 200 })
    await openFixture(page, 'breadcrumbs/matrix')

    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
})

test.describe('MBreadcrumbs server HTML', () => {
  test.use({ javaScriptEnabled: false })

  // Q25 + modern-web: the position comes from CSS during layout, with no script.
  test('the scrolling trail shows the current crumb before any script runs', async ({ page }) => {
    await page.goto('/breadcrumbs/matrix?theme=light&dir=ltr')
    const scroll = page.getByTestId('scroll')

    expect(await list(scroll).evaluate(el => el.scrollLeft)).toBeGreaterThan(0)
    expect(await currentIsVisible(scroll)).toBe(true)
  })
})

/** Whether a point `dx`/`dy` rem from the centre of `target` lands on it (see `button/targets.e2e.ts`). */
const reaches = (target: Locator, dx: number, dy: number) => target.evaluate((el, [x, y]) => {
  el.scrollIntoView({ block: 'center', inline: 'center' })
  const box = el.getBoundingClientRect()
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  const hit = document.elementFromPoint(box.left + box.width / 2 + x! * rem, box.top + box.height / 2 + y! * rem)
  return hit === el || el.contains(hit)
}, [dx, dy])

// S8 (RS-12): a crumb is drawn 32 tall; on a coarse pointer it answers across 48
// in the block axis, also inside the scrolling list that would clip it.
test.describe('MBreadcrumbs · 48 pointer target on touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 1920, height: 1080 } })

  for (const id of ['wrap', 'scroll']) {
    test(`a ${id} crumb answers 8 past its 32 edge in the block axis`, async ({ page }) => {
      await openFixture(page, 'breadcrumbs/matrix')
      const link = page.getByTestId(id).getByRole('link', { name: 'Catalog' })

      expect(await reaches(link, 0, -15.5)).toBe(true)
      expect(await reaches(link, 0, -23)).toBe(true)
      // Below lies the next row, whose target meets this one 8 past the edge;
      // hit testing gives that seam to either side within a pixel at fractional
      // offsets (a prod build lands on them), so the probe keeps 2 away from it.
      expect(await reaches(link, 0, 22)).toBe(true)
      expect(await reaches(link, 0, -26)).toBe(false)
    })
  }

  test('the scrolling list keeps its target room inside the trail, over no neighbour', async ({ page }) => {
    await openFixture(page, 'breadcrumbs/matrix')
    const trail = page.getByTestId('scroll')
    const outer = (await trail.boundingBox())!
    const scroller = (await list(trail).boundingBox())!

    expect(scroller.y).toBeGreaterThanOrEqual(outer.y - 0.5)
    expect(scroller.y + scroller.height).toBeLessThanOrEqual(outer.y + outer.height + 0.5)
  })
})
