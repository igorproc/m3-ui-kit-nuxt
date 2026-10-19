import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const SIZES = [20, 24, 40, 48]
const FILLS = ['outline', 'filled']

const box = async (locator: Locator) => (await locator.boundingBox())!
const fontSize = (locator: Locator) => locator.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize))
const glyphWidth = (locator: Locator) => locator.locator('.iconify').evaluate(el => el.getBoundingClientRect().width)

test.describe('MIcon', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'icon/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'icon/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    for (const fixture of ['icon/matrix', 'icon/stress']) {
      test(`${fixture} does not overflow the page at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await openFixture(page, fixture)
        await expectNoHorizontalOverflow(page)
      })
    }
  }

  test('a decorative icon is hidden from assistive tech and a labelled one is a named image', async ({ page }) => {
    await openFixture(page, 'icon/matrix')

    await expect(page.getByTestId('matrix').getByRole('img')).toHaveCount(SIZES.length * FILLS.length)

    for (const size of SIZES) {
      for (const fill of FILLS) {
        const decorative = page.getByTestId(`${size}-${fill}`)
        const labelled = page.getByTestId(`${size}-${fill}-labelled`)

        await expect(decorative).toHaveAttribute('aria-hidden', 'true')
        await expect(decorative).not.toHaveAttribute('role', 'img')
        await expect(labelled).toHaveAttribute('role', 'img')
        await expect(labelled).toHaveAccessibleName('Favorite')
        expect(await labelled.evaluate(el => el.hasAttribute('aria-hidden'))).toBe(false)
      }
    }
  })

  test('role and name are already in the server-rendered HTML', async ({ request }) => {
    const html = await (await request.get('/icon/matrix')).text()
    const tag = (id: string) => html.match(new RegExp(`<span[^>]*data-test="${id}"[^>]*>`))?.[0] ?? ''

    expect(tag('24-outline-labelled')).toContain('role="img"')
    expect(tag('24-outline-labelled')).toContain('aria-label="Favorite"')
    expect(tag('24-outline')).toContain('aria-hidden="true"')
  })

  test('the wrapper is a 1em square of its owner font size', async ({ page }) => {
    await openFixture(page, 'icon/matrix')

    for (const size of SIZES) {
      for (const id of [`${size}-outline`, `${size}-filled-labelled`, `line-${size}`]) {
        const icon = page.getByTestId(id)
        const em = await fontSize(icon)
        const { width, height } = await box(icon)

        expect(width, id).toBeCloseTo(em, 0)
        expect(height, id).toBeCloseTo(em, 0)
      }
    }
  })

  test('a name that draws nothing still holds its square', async ({ page }) => {
    await openFixture(page, 'icon/stress')

    for (const id of ['empty', 'unknown', 'malformed']) {
      const icon = page.getByTestId(id)
      const em = await fontSize(icon)
      const { width, height } = await box(icon)

      expect(width, id).toBeCloseTo(em, 0)
      expect(height, id).toBeCloseTo(em, 0)
    }
  })

  test('a glyph that loads late reserves its square and does not move the text beside it', async ({ page }) => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    await page.route(url => url.pathname.startsWith('/api/_nuxt_icon/'), async (route) => {
      await gate
      await route.continue()
    })
    await page.route(url => url.hostname === 'api.iconify.design', route => route.abort())

    await openFixture(page, 'icon/stress')
    await page.getByTestId('show-late').click()

    const icon = page.getByTestId('late-icon')
    const text = page.getByTestId('late-text')
    await expect(text).toBeVisible()

    expect(await glyphWidth(icon)).toBe(0)

    const em = await fontSize(icon)
    const reserved = await box(icon)
    const before = await box(text)

    expect(reserved.width).toBeCloseTo(em, 0)
    expect(reserved.height).toBeCloseTo(em, 0)

    release()
    await expect.poll(() => glyphWidth(icon)).toBeGreaterThan(0)

    const after = await box(text)
    expect(after.x).toBeCloseTo(before.x, 0)
    expect(after.y).toBeCloseTo(before.y, 0)
  })

  test('glyphs keep the owner colour in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'icon/matrix')

    const adjust = await page.getByTestId('24-outline').locator('.iconify')
      .evaluate(el => getComputedStyle(el).getPropertyValue('forced-color-adjust'))

    expect(adjust).toBe('preserve-parent-color')
  })
})
