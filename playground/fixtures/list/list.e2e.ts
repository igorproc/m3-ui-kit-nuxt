import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, waitForMotion } from '../../e2e/support'

const rem = (page: Page) => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
const box = async (locator: Locator) => (await locator.boundingBox())!
const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

const INTERACTIVE = ['button', 'emulated', 'link'] as const

test.describe('MList', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'list/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'list/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'list/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a list is announced as a list of its rows', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const list = page.getByTestId('list-content')

    await expect(list).toHaveRole('list')
    await expect(list.getByRole('listitem')).toHaveCount(12)
  })

  test('a selected row says so through its element', async ({ page }) => {
    await openFixture(page, 'list/matrix')

    await expect(page.getByTestId('button-selected')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('button-rest')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('emulated-selected')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('link-selected')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('link-rest')).not.toHaveAttribute('aria-current', /.*/)
  })

  test('Tab reaches every enabled interactive row and skips disabled ones', async ({ page }) => {
    await openFixture(page, 'list/matrix')

    const reached: string[] = []
    for (let step = 0; step < 120; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
      if (id === 'after') break
      if (id && !reached.includes(id)) reached.push(id)
    }

    for (const element of INTERACTIVE) {
      expect(reached).toContain(`${element}-rest`)
      expect(reached).toContain(`${element}-selected`)
      expect(reached).not.toContain(`${element}-disabled`)
      expect(reached).not.toContain(`${element}-selected-disabled`)
    }
    expect(reached.filter(id => id.startsWith('static-'))).toEqual([])
  })

  test('a disabled link has no href, takes no focus and goes nowhere', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const link = page.getByTestId('link-disabled')
    const before = page.url()

    await expect(link).not.toHaveAttribute('href', /.*/)
    await expect(link).toHaveAttribute('aria-disabled', 'true')
    await link.focus()
    await expect(link).not.toBeFocused()
    await link.dispatchEvent('click')
    expect(page.url()).toBe(before)
  })

  test('rows meet edge to edge, with 12 between leading and text', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const unit = await rem(page)
    const first = page.getByTestId('density-default-1')
    const second = page.getByTestId('density-default-2')

    expect((await box(first)).height / unit).toBeCloseTo(56, 0)
    expect((await box(second)).y).toBeCloseTo((await box(first)).y + (await box(first)).height, 0)

    const leading = await box(first.locator('.ui-list-item__leading'))
    const body = await box(first.locator('.ui-list-item__body'))
    expect((body.x - (leading.x + leading.width)) / unit).toBeCloseTo(12, 0)
  })

  test('the selected corner is static: hover and press keep the shape', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const rest = page.getByTestId('button-rest')
    const selected = page.getByTestId('button-selected')
    const corner = async (locator: Locator) => Number.parseFloat(await style(locator, 'border-top-left-radius'))

    const resting = await corner(rest)
    expect(await corner(selected)).toBeGreaterThan(resting)

    await rest.hover()
    await page.mouse.down()
    expect(await corner(rest)).toBe(resting)
    await page.mouse.up()
  })

  test('disabled dims each part, not the row as a whole', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const row = page.getByTestId('button-selected-disabled')

    expect(await style(row, 'opacity')).toBe('1')
    expect(await style(row, 'background-color')).not.toBe('rgba(0, 0, 0, 0)')
    expect(await style(row.locator('.ui-list-item__headline'), 'color')).not.toBe(await style(page.getByTestId('button-rest').locator('.ui-list-item__headline'), 'color'))
  })

  test('forced colors: a selected row keeps a Highlight edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'list/matrix')
    const row = page.getByTestId('button-selected')

    expect(await style(row, 'outline-style')).toBe('solid')
    expect(Number.parseFloat(await style(row, 'outline-width'))).toBeGreaterThanOrEqual(1)
  })

  test('in RTL the leading media sits on the right', async ({ page }) => {
    await openFixture(page, 'list/matrix', { dir: 'rtl' })
    const row = page.getByTestId('density-default-1')

    const leading = await box(row.locator('.ui-list-item__leading'))
    const body = await box(row.locator('.ui-list-item__body'))
    expect(leading.x).toBeGreaterThan(body.x)
  })

  for (const dir of DIRECTIONS) {
    test(`an inset subheader starts where row text starts (${dir})`, async ({ page }) => {
      await openFixture(page, 'list/matrix', { dir })
      const body = await box(page.getByTestId('sections-row').locator('.ui-list-item__body'))
      const label = await box(page.getByTestId('sections-inset').locator('h3'))

      if (dir === 'ltr') expect(label.x).toBeCloseTo(body.x, 0)
      else expect(label.x + label.width).toBeCloseTo(body.x + body.width, 0)
    })
  }

  test('an explicit line count clamps; auto wraps', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const headline = (id: string) => page.getByTestId(id).locator('.ui-list-item__headline')
    const lineHeight = Number.parseFloat(await style(headline('clamped-1'), 'line-height'))

    expect((await box(headline('clamped-1'))).height).toBeCloseTo(lineHeight, 0)
    expect((await box(headline('clamped-auto'))).height).toBeGreaterThan(lineHeight * 1.5)
    await expect(headline('clamped-1')).toHaveAttribute('title', /^Clamped to 1/)
  })

  test('an empty items array renders the #empty slot as the only item', async ({ page }) => {
    await openFixture(page, 'list/stress')
    const list = page.getByTestId('list-empty')

    await expect(list.getByRole('listitem')).toHaveText(['Nothing here yet'])
  })

  test('a sticky subheader is filled with the surface its list declares', async ({ page }) => {
    await openFixture(page, 'list/stress')

    for (const role of ['surface', 'surface-container-low', 'surface-container']) {
      const fill = await style(page.getByTestId(`sticky-${role}-A`), 'background-color')
      expect(fill, role).toBe(await style(page.getByTestId(`sticky-${role}`), 'background-color'))
    }
  })

  test('Tab never parks a row under a sticky subheader', async ({ page }) => {
    await openFixture(page, 'list/stress')
    await page.getByTestId('row-surface-B6').focus()

    for (let step = 0; step < 11; step++) {
      await page.keyboard.press('Shift+Tab')
      await waitForMotion(page)
      const uncovered = await page.evaluate(() => {
        const row = document.activeElement as HTMLElement
        let sibling = row.closest('li')?.previousElementSibling
        while (sibling && !sibling.classList.contains('ui-list-subheader')) sibling = sibling.previousElementSibling
        return row.getBoundingClientRect().top - sibling!.getBoundingClientRect().bottom
      })
      expect(uncovered).toBeGreaterThanOrEqual(-1)
    }
  })
  // L-2 (M3-polish): the row used to size every avatar to 40 and round it
  // full, and to stretch the avatar's image to 56 inside it.
  test('an avatar in the leading slot keeps its own density and shape', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const unit = await rem(page)
    const sizes = { compact: 24, default: 40, comfortable: 56 }

    for (const [density, size] of Object.entries(sizes)) {
      const avatar = page.getByTestId(`avatar-media-${density}`).locator('.ui-avatar')
      const image = avatar.locator('.ui-avatar__image')
      expect((await box(avatar)).width / unit, density).toBeCloseTo(size, 0)
      expect((await box(image)).width / unit, density).toBeCloseTo(size, 0)
      expect(Number.parseFloat(await style(avatar, 'border-top-left-radius')) / unit, density).toBeCloseTo(16, 0)
    }

    // Bare media keeps the row's 56 image anatomy.
    const bare = page.getByTestId('content-1-image').locator('img')
    expect((await box(bare)).width / unit).toBeCloseTo(56, 0)
  })

  // L-1 (M3-polish): selection changes the tone and, statically, the corner — never the geometry.
  test('choosing a row moves nothing and changes no height', async ({ page }) => {
    await openFixture(page, 'list/matrix')
    const rows = ['a', 'b', 'c'].map(id => page.getByTestId(`pick-${id}`))
    await rows[0]!.scrollIntoViewIfNeeded()
    const before = await Promise.all(rows.map(box))

    await rows[1]!.click()
    await waitForMotion(page)
    const after = await Promise.all(rows.map(box))

    expect(after.map(rect => [rect.y, rect.height])).toEqual(before.map(rect => [rect.y, rect.height]))
    await expect(rows[1]!).toHaveAttribute('aria-pressed', 'true')
    await expect(rows[0]!).toHaveAttribute('aria-pressed', 'false')
  })
})
