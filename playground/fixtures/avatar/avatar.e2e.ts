import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const rem = (page: Page) => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
const box = async (locator: Locator) => (await locator.boundingBox())!
const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

/** Box edge per density step, in rem. */
const SIZES = { compact: 24, default: 40, comfortable: 56 } as const

test.describe('MAvatar', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'avatar/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'avatar/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'avatar/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('each density reserves its box, whatever the content', async ({ page }) => {
    await openFixture(page, 'avatar/matrix')
    const unit = await rem(page)

    for (const [density, size] of Object.entries(SIZES)) {
      for (const content of ['image', 'initials', 'icon', 'broken']) {
        const avatar = await box(page.getByTestId(`outlined-${density}-${content}`))
        expect(avatar.width / unit, `${density} ${content}`).toBeCloseTo(size, 0)
        expect(avatar.height / unit, `${density} ${content}`).toBeCloseTo(size, 0)
      }
    }
  })

  test('an image that fails, even before hydration, falls back to initials', async ({ page }) => {
    await openFixture(page, 'avatar/matrix')
    const broken = page.getByTestId('tonal-default-broken')

    await expect(broken.locator('img')).toHaveCount(0)
    await expect(broken.locator('.ui-avatar__initials')).toHaveText('BI')
    await expect(broken).toHaveRole('img')
    await expect(broken).toHaveAccessibleName('Broken Image')
  })

  test('alt keeps naming the avatar after its image fails', async ({ page }) => {
    await openFixture(page, 'avatar/matrix')

    await expect(page.getByTestId('broken-alt')).toHaveAccessibleName('Portrait of Grace Hopper')
    await expect(page.getByTestId('image-alt').getByRole('img')).toHaveAccessibleName('Portrait of Grace Hopper')
    await expect(page.getByTestId('decorative')).not.toHaveAttribute('role', /.*/)
  })

  test('outlined draws its edge with a border', async ({ page }) => {
    await openFixture(page, 'avatar/matrix')
    const outlined = page.getByTestId('outlined-default-initials')

    expect(await style(outlined, 'border-top-style')).toBe('solid')
    expect(Number.parseFloat(await style(outlined, 'border-top-width'))).toBeGreaterThanOrEqual(1)
    expect(await style(outlined, 'box-shadow')).toBe('none')
  })

  test('forced colors: every variant keeps a visible edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'avatar/matrix')

    for (const variant of ['tonal', 'filled', 'outlined']) {
      const avatar = page.getByTestId(`${variant}-default-initials`)
      expect(await style(avatar, 'border-top-style'), variant).toBe('solid')
      expect(Number.parseFloat(await style(avatar, 'border-top-width')), variant).toBeGreaterThanOrEqual(1)
    }
  })

  test('avatars keep their box in a column too narrow for them', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'avatar/stress')
    const unit = await rem(page)
    const avatars = page.getByTestId('narrow').locator('.ui-avatar')

    // Avatars never shrink: a flex row that runs out of room overflows instead.
    expect((await box(avatars.nth(0))).width / unit).toBeCloseTo(SIZES.compact, 0)
    expect((await box(avatars.nth(2))).width / unit).toBeCloseTo(SIZES.comfortable, 0)
  })
})
