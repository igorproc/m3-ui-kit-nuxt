import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const VARIANTS = ['plain', 'filled', 'elevated', 'outlined']
const SHAPE_SCALE = ['none', 'extra-small', 'small', 'medium', 'large', 'extra-large']

const computed = (locator: Locator, property: string) => locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)
const pixels = async (locator: Locator, property: string) => Number.parseFloat(await computed(locator, property))

test.describe('MSurface', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'surface/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const theme of THEMES) {
    test(`stress content has no axe violations (${theme})`, async ({ page }) => {
      await openFixture(page, 'surface/stress', { theme })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`matrix and stress content do not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })

      for (const key of ['surface/matrix', 'surface/stress']) {
        await openFixture(page, key)
        await expectNoHorizontalOverflow(page)
      }
    })
  }

  test('an unbroken word wraps inside the surface instead of spilling out', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'surface/stress')

    for (const id of ['long-word', 'long-word-narrow']) {
      const spill = await page.getByTestId(id).evaluate(el => el.scrollWidth - el.clientWidth)
      expect(spill, id).toBeLessThanOrEqual(0)
    }
  })

  test('renders no role, tabindex or state class on any preset', async ({ page }) => {
    await openFixture(page, 'surface/matrix')

    await expect(page.locator('.ui-surface[role], .ui-surface[tabindex]')).toHaveCount(0)

    for (const variant of VARIANTS) {
      const classes = await page.getByTestId(`medium-${variant}`).evaluate(el => [...el.classList].filter(name => name.startsWith('ui-surface')))
      expect(classes, variant).toEqual(['ui-surface', `ui-surface--${variant}`, 'ui-surface--shape-medium'])
    }
  })

  test('surfaces never take focus: Tab goes straight to the control inside them', async ({ page }) => {
    await openFixture(page, 'surface/stress')

    await page.keyboard.press('Tab')

    await expect(page.getByTestId('nested-action')).toBeFocused()
  })

  test('renders the requested element for every tag', async ({ page }) => {
    await openFixture(page, 'surface/matrix')

    for (const tag of ['div', 'section', 'article', 'aside']) {
      const name = await page.getByTestId(`tag-${tag}-filled`).evaluate(el => el.tagName.toLowerCase())
      expect(name).toBe(tag)
    }
  })

  test('only the elevated preset casts a shadow', async ({ page }) => {
    await openFixture(page, 'surface/matrix')

    for (const variant of VARIANTS) {
      const shadow = await computed(page.getByTestId(`medium-${variant}`), 'box-shadow')
      if (variant === 'elevated') expect(shadow, variant).not.toBe('none')
      else expect(shadow, variant).toBe('none')
    }
  })

  test('only the outlined preset draws an edge', async ({ page }) => {
    await openFixture(page, 'surface/matrix')

    for (const variant of VARIANTS) {
      const edge = await pixels(page.getByTestId(`medium-${variant}`), 'border-top-width')
      if (variant === 'outlined') expect(edge, variant).toBeGreaterThan(0)
      else expect(edge, variant).toBe(0)
    }
  })

  test('filled and elevated take their own tone; plain and outlined share the base one', async ({ page }) => {
    await openFixture(page, 'surface/matrix')
    const background = (variant: string) => computed(page.getByTestId(`medium-${variant}`), 'background-color')

    expect(await background('plain')).toBe(await background('outlined'))
    expect(await background('filled')).not.toBe(await background('plain'))
    expect(await background('elevated')).not.toBe(await background('plain'))
  })

  test('corner radius grows along the shape scale', async ({ page }) => {
    await openFixture(page, 'surface/matrix')

    const radii = await Promise.all(SHAPE_SCALE.map(shape => pixels(page.getByTestId(`${shape}-filled`), 'border-top-left-radius')))

    expect(radii[0]).toBe(0)
    radii.slice(1).forEach((radius, index) => expect(radius, SHAPE_SCALE[index + 1]).toBeGreaterThan(radii[index]!))
  })

  test('extra-large-top rounds only the top corners', async ({ page }) => {
    await openFixture(page, 'surface/matrix')
    const surface = page.getByTestId('extra-large-top-filled')

    expect(await pixels(surface, 'border-top-left-radius')).toBeGreaterThan(0)
    expect(await pixels(surface, 'border-top-right-radius')).toBeGreaterThan(0)
    expect(await pixels(surface, 'border-bottom-left-radius')).toBe(0)
    expect(await pixels(surface, 'border-bottom-right-radius')).toBe(0)
  })

  test('an empty surface adds no size of its own', async ({ page }) => {
    await openFixture(page, 'surface/stress')

    for (const variant of ['plain', 'filled', 'elevated']) {
      const height = (await page.getByTestId(`empty-${variant}`).boundingBox())!.height
      expect(height, variant).toBe(0)
    }
  })

  test('filled, elevated and outlined keep a visible boundary in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'surface/matrix')

    for (const variant of ['filled', 'elevated', 'outlined']) {
      const surface = page.getByTestId(`medium-${variant}`)
      expect(await computed(surface, 'border-top-style'), variant).toBe('solid')
      expect(await pixels(surface, 'border-top-width'), variant).toBeGreaterThan(0)
    }
  })
})
