import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'
import type { FixtureDirection, FixtureTheme } from '../../e2e/support'

const MODES = ['eager', 'on-idle', 'on-view', 'on-interaction']

const outlineWidth = (locator: Locator) => locator.evaluate(el => Number.parseFloat(getComputedStyle(el).outlineWidth))
const height = async (locator: Locator) => (await locator.boundingBox())!.height
const settle = (page: Page) => page.waitForFunction(() => document.getAnimations().length === 0)

async function tabTo(page: Page, id: string) {
  for (let step = 0; step < 20; step++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.getAttribute('data-test')) === id) return
  }

  throw new Error(`Tab never reached ${id}`)
}

async function openSettledMatrix(page: Page, options: { theme?: FixtureTheme, dir?: FixtureDirection } = {}) {
  await page.setViewportSize({ width: 1280, height: 1600 })
  await openFixture(page, 'lazy/matrix', options)

  for (const mode of MODES) {
    await expect(page.getByTestId(`active-${mode}`)).toHaveClass(/ui-lazy--active/)
    await expect(page.getByTestId(`pending-${mode}`).locator('.ui-lazy__fallback')).toBeVisible()
    await expect(page.getByTestId(`error-${mode}`)).toHaveClass(/ui-lazy--error/)
    await expect(page.getByTestId(`error-slot-${mode}`)).toHaveClass(/ui-lazy--error/)
  }

  await settle(page)
}

async function openSettledStress(page: Page) {
  await openFixture(page, 'lazy/stress')
  await expect(page.getByTestId('long-error')).toHaveClass(/ui-lazy--error/)
  await settle(page)
}

test.describe('MLazy', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openSettledMatrix(page, { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openSettledStress(page)
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openSettledStress(page)
      await expectNoHorizontalOverflow(page)
    })
  }

  test('only a pending boundary is busy, and the fallback waits for its delay', async ({ page }) => {
    await openSettledMatrix(page)

    for (const mode of MODES) {
      await expect(page.getByTestId(`pending-${mode}`)).toHaveAttribute('aria-busy', 'true')
      await expect(page.getByTestId(`pending-no-fallback-${mode}`)).toHaveAttribute('aria-busy', 'true')
      await expect(page.getByTestId(`active-${mode}`)).not.toHaveAttribute('aria-busy')
      await expect(page.getByTestId(`pending-${mode}`)).toContainText('Loading preview…')
      await expect(page.getByTestId(`pending-no-fallback-${mode}`)).toContainText('Load preview')
    }
  })

  test('a failure without an #error slot is announced and offers a named retry', async ({ page }) => {
    await openSettledMatrix(page)

    for (const mode of MODES) {
      const boundary = page.getByTestId(`error-${mode}`)
      await expect(boundary.getByRole('alert')).toHaveText('Preview failed to load')
      await expect(boundary.getByRole('button', { name: 'Try again' })).toBeVisible()

      const custom = page.getByTestId(`error-slot-${mode}`)
      await expect(custom).toContainText('Preview unavailable')
      await expect(custom.getByRole('alert')).toHaveCount(0)
    }
  })

  test('Tab reaches the on-interaction boundary by name and activates it without losing focus', async ({ page }) => {
    await openFixture(page, 'lazy/matrix')
    const boundary = page.getByTestId('idle-on-interaction')

    await expect(boundary).toHaveAttribute('role', 'button')
    await expect(boundary).toHaveAttribute('tabindex', '0')
    await expect(boundary).toHaveAccessibleName('Load preview')

    await tabTo(page, 'idle-on-interaction')

    await expect(boundary).toHaveClass(/ui-lazy--active/)
    await expect(boundary).toContainText('Preview loaded')
    await expect(boundary).toBeFocused()
    await expect(boundary).not.toHaveAttribute('role')
    expect(await outlineWidth(boundary)).toBeGreaterThanOrEqual(2)
  })

  test('Enter and Space activate a boundary that does not activate on focus', async ({ page }) => {
    await openFixture(page, 'lazy/matrix')
    const boundary = page.getByTestId('idle-click-on-interaction')

    await tabTo(page, 'idle-click-on-interaction')
    await expect(boundary).toHaveClass(/ui-lazy--idle/)

    await page.keyboard.press('Enter')

    await expect(boundary).toHaveClass(/ui-lazy--active/)
    await expect(boundary).toBeFocused()
  })

  test('a placeholder with its own control adds no tab stop, and focus survives its removal', async ({ page }) => {
    await openFixture(page, 'lazy/matrix')
    const boundary = page.getByTestId('idle-own-control-on-interaction')

    await expect(boundary).not.toHaveAttribute('role')
    await expect(boundary).not.toHaveAttribute('tabindex')

    await boundary.getByRole('button', { name: 'Load preview' }).focus()

    await expect(boundary).toHaveClass(/ui-lazy--active/)
    expect(await boundary.evaluate(el => el.contains(document.activeElement))).toBe(true)
  })

  test('the activator keeps a visible focus ring in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'lazy/matrix')

    await tabTo(page, 'idle-on-interaction')

    const style = await page.getByTestId('idle-on-interaction').evaluate(el => getComputedStyle(el).outlineStyle)
    expect(style).not.toBe('none')
  })

  test('with once=false, focused content keeps focus and input while out of view', async ({ page }) => {
    await openFixture(page, 'lazy/stress')
    const boundary = page.getByTestId('keep-focus')
    const field = page.getByTestId('keep-focus-field')

    await field.fill('typed draft')
    await expect(field).toBeFocused()

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.getByTestId('feed-100')).toHaveClass(/ui-lazy--active/)

    await expect(boundary).toHaveClass(/ui-lazy--active/)
    await expect(field).toBeFocused()
    await expect(field).toHaveValue('typed draft')

    await page.getByTestId('outside').focus()

    await expect(boundary).toHaveClass(/ui-lazy--idle/)
    await expect(field).toHaveCount(0)
  })

  test('activation does not change the reserved height, not even for a frame', async ({ page }) => {
    await openFixture(page, 'lazy/stress')
    const boundary = page.getByTestId('reserved')
    const before = await height(boundary)

    const frames = await boundary.evaluate(async (element) => {
      const target = element as HTMLElement
      const seen: number[] = []
      const end = performance.now() + 600

      target.click()
      while (performance.now() < end) {
        seen.push(element.getBoundingClientRect().height)
        await new Promise<number>(resolve => requestAnimationFrame(resolve))
      }

      return seen
    })

    await expect(boundary).toHaveClass(/ui-lazy--active/)
    await expect(boundary).toContainText('Chart loaded')
    for (const frame of frames) expect(frame).toBeCloseTo(before, 0)
  })

  test('retry after a failure loads the content and keeps focus inside the boundary', async ({ page }) => {
    await openFixture(page, 'lazy/stress')
    const boundary = page.getByTestId('flaky')

    await boundary.click()
    await expect(boundary).toHaveClass(/ui-lazy--error/)
    await expect(boundary.getByRole('alert')).toContainText('The comments could not be loaded')

    await boundary.getByRole('button', { name: 'Try again' }).click()

    await expect(boundary).toContainText('Comments loaded')
    await expect(boundary.getByRole('alert')).toHaveText('')
    expect(await boundary.evaluate(el => el.contains(document.activeElement))).toBe(true)
  })

  test('a feed of on-view boundaries shares one IntersectionObserver', async ({ page }) => {
    await page.addInitScript(() => {
      const Native = window.IntersectionObserver
      const margins: string[] = []
      Reflect.set(window, '__lazyObserverMargins', margins)

      window.IntersectionObserver = class extends Native {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          super(callback, options)
          margins.push(options?.rootMargin ?? '')
        }
      }
    })
    await openFixture(page, 'lazy/stress')

    await page.getByTestId('feed-1').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('feed-1')).toHaveClass(/ui-lazy--active/)
    await page.getByTestId('feed-60').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('feed-60')).toHaveClass(/ui-lazy--active/)

    const margins = await page.evaluate(() => Reflect.get(window, '__lazyObserverMargins') as string[])
    expect(margins.filter(margin => margin === '200px 0px')).toHaveLength(1)
  })
})
