import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture, remInPx } from '../../e2e/support'

const focusedName = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName)

test.describe('MPagination', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'pagination/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  // B5.7a (Q24-А): Next used to turn natively disabled on the last page and
  // throw the keyboard user's focus to <body>.
  test('Next keeps focus when it reaches the last page', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('basic')
    const next = pager.getByRole('button', { name: 'Next page' })

    await next.focus()
    for (let step = 0; step < 4; step++) await page.keyboard.press('Enter')

    await expect(page.getByTestId('basic-page')).toHaveText('5')
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('basic-page')).toHaveText('5')
    await page.keyboard.press('Tab')
    expect(await focusedName(page)).toBe('Last page')
  })

  test('the controls at the first page stay in the Tab order', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('basic')

    await pager.getByRole('button', { name: 'First page' }).focus()
    await expect(pager.getByRole('button', { name: 'First page' })).toHaveAttribute('aria-disabled', 'true')
    await page.keyboard.press('Tab')
    expect(await focusedName(page)).toBe('Previous page')
    await page.keyboard.press('Tab')
    expect(await focusedName(page)).toBe('Page 1, current page')
  })

  test('Next keeps focus while the pager is disabled for a page request', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const next = page.getByTestId('loading').getByRole('button', { name: 'Next page' })

    await next.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('loading-state')).toHaveText('true')
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()

    await expect(page.getByTestId('loading-state')).toHaveText('false')
    await expect(next).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('loading-page')).toHaveText('3')
  })

  // Page buttons of a disabled pager used to be natively disabled: the pressed
  // page dropped focus to <body> for the whole request.
  test('a page button keeps focus while the pager is disabled for a page request', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('loading')

    await pager.getByRole('button', { name: 'Page 3', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('loading-state')).toHaveText('true')

    const pressed = pager.getByRole('button', { name: 'Page 3, current page' })
    await expect(pressed).toHaveAttribute('aria-disabled', 'true')
    await expect(pressed).toBeFocused()

    await expect(page.getByTestId('loading-state')).toHaveText('false')
    await expect(pressed).toBeFocused()
  })

  // B9.2a: the table footer set `loading` on every page request and dropped focus each time.
  test('the table footer keeps focus on Next across a page request', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const next = page.getByTestId('table').getByRole('button', { name: 'Next page' })

    await next.focus()
    await page.keyboard.press('Enter')
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()

    await expect(page.getByTestId('table-range')).toHaveText('3–4 of 6')
    await expect(next).not.toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()
  })

  // Q27-А: the chevrons point along the reading direction.
  for (const dir of DIRECTIONS) {
    test(`the control chevrons follow the reading direction (${dir})`, async ({ page }) => {
      await openFixture(page, 'pagination/matrix', { dir })
      const glyph = page.getByTestId('basic').getByRole('button', { name: 'Next page' }).locator('.ui-icon')

      expect(await glyph.evaluate(element => getComputedStyle(element).scale)).toBe(dir === 'rtl' ? '-1 1' : 'none')
    })
  }

  // Measured once the web font is in: a fallback face has other figure widths.
  const rowWidth = (pager: Locator) => pager.locator('.ui-pagination__list').evaluate(async (el) => {
    await document.fonts.ready
    return el.getBoundingClientRect().width
  })

  // CT-07, MO-04: proportional figures made the row dance as the window slid.
  test('page numbers use tabular figures', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const number = page.getByTestId('archive').getByRole('button', { name: 'Page 1110, current page' })

    expect(await number.evaluate(el => getComputedStyle(el).fontVariantNumeric)).toBe('tabular-nums')
  })

  test('the row keeps its width as the window slides over four-digit pages', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('archive')
    const before = await rowWidth(pager)

    await pager.getByRole('button', { name: 'Next page' }).click()
    await expect(pager.getByRole('button', { name: 'Page 1111, current page' })).toBeVisible()

    expect(await rowWidth(pager)).toBeCloseTo(before, 1)
  })

  // The current page is set in a heavier weight; the row must not move when it changes.
  test('the row keeps its width as the current page moves', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('tail')
    const before = await rowWidth(pager)
    const widths = () => pager.locator('.ui-pagination__page').evaluateAll(async (buttons) => {
      await document.fonts.ready
      return buttons.map(button => button.getBoundingClientRect().width)
    })
    const pageWidths = await widths()

    await pager.getByRole('button', { name: 'Page 999', exact: true }).click()
    await expect(pager.getByRole('button', { name: 'Page 999, current page' })).toBeVisible()

    expect(await rowWidth(pager)).toBeCloseTo(before, 1)
    expect(await widths()).toEqual(pageWidths)
  })

  // TH-05 / TH-04: the current page reads by weight too, not by its fill alone.
  for (const forced of [false, true]) {
    test(`the current page is set in a heavier weight${forced ? ' in forced colors' : ''}`, async ({ page }) => {
      if (forced) await page.emulateMedia({ forcedColors: 'active' })
      await openFixture(page, 'pagination/matrix')
      const pager = page.getByTestId('basic')
      const weight = (name: string) => pager.getByRole('button', { name, exact: true }).evaluate((button) => {
        const text = button.querySelector('.ui-pagination__number') ?? button.querySelector('.ui-button__label')!
        return Number(getComputedStyle(text).fontWeight)
      })

      expect(await weight('Page 1, current page')).toBeGreaterThan(await weight('Page 2'))
    })
  }

  // The pressed page becomes the current one and keeps the keyboard focus while the window slides.
  test('a page pressed from the keyboard keeps focus while the window slides', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('archive')

    for (const target of [1111, 1112, 1111]) {
      await pager.getByRole('button', { name: `Page ${target}`, exact: true }).focus()
      await page.keyboard.press('Enter')

      const current = pager.getByRole('button', { name: `Page ${target}, current page` })
      await expect(current).toBeVisible()
      await expect(current).toBeFocused()
    }
  })

  test('page buttons are named by pageLabel and the current one is marked', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('basic')

    await expect(page.getByRole('navigation', { name: 'Pages' }).first()).toBeVisible()
    await expect(pager.getByRole('button', { name: 'Page 1, current page' })).toHaveAttribute('aria-current', 'page')
    await expect(pager.getByRole('button', { name: 'Page 2', exact: true })).toBeVisible()
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

// S8: a page button is drawn 40; on a coarse pointer it answers across 48 on the
// block axis only (decisions.md, «Мишень 48»), and the row spreads to a pitch of 48.
test.describe('MPagination · 48 pointer target on touch', () => {
  // At 1920 one rem is one CSS pixel, so the margins below are not lost to rounding.
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 1920, height: 1080 } })

  test('a page button answers 4 past its 40 edge on the block axis only', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const button = page.getByTestId('basic').getByRole('button', { name: 'Page 2', exact: true })

    expect(await reaches(button, 0, -23)).toBe(true)
    expect(await reaches(button, 0, 23)).toBe(true)
    expect(await reaches(button, 0, -26)).toBe(false)
    expect(await reaches(button, -23, 0)).toBe(false)
  })

  test('neighbouring pages sit 48 apart and neither takes the gap between them', async ({ page }) => {
    await openFixture(page, 'pagination/matrix')
    const pager = page.getByTestId('basic')
    const second = pager.getByRole('button', { name: 'Page 2', exact: true })
    const third = pager.getByRole('button', { name: 'Page 3', exact: true })
    const rem = await remInPx(page)
    const [a, b] = [(await second.boundingBox())!, (await third.boundingBox())!]

    expect(Math.abs(b.x - a.x) / rem).toBeCloseTo(48, 0)
    expect(await reaches(second, 22, 0)).toBe(false)
    expect(await reaches(third, -22, 0)).toBe(false)
  })
})
