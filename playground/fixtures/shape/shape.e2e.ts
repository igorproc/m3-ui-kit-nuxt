import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { M3_SHAPES } from '../../../src/runtime/assets/icon/shapes'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const NAMES = Object.keys(M3_SHAPES)

const labelOf = (name: string) => {
  const words = name.replace(/([a-z\d])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

interface MorphFrame {
  at: number
  d: string | null
  transform: string
}

interface MorphRecord {
  before: string | null
  frames: MorphFrame[]
}

function recordMorph(page: Page, shape: string, trigger: string, span = 1200): Promise<MorphRecord> {
  return page.evaluate(async ({ shape, trigger, span }) => {
    const svg = document.querySelector<SVGSVGElement>(`[data-test="${shape}"]`)!
    const path = svg.querySelector('path')!
    const before = path.getAttribute('d')
    const frames: MorphFrame[] = []
    const start = performance.now()

    document.querySelector<HTMLElement>(`[data-test="${trigger}"]`)!.click()

    await new Promise<void>((done) => {
      const step = (now: number) => {
        frames.push({ at: now - start, d: path.getAttribute('d'), transform: svg.style.transform })
        if (now - start < span) requestAnimationFrame(step)
        else done()
      }
      requestAnimationFrame(step)
    })

    return { before, frames }
  }, { shape, trigger, span })
}

function settledAt(frames: MorphFrame[]): number {
  const final = frames.at(-1)!.d
  let index = frames.length - 1
  while (index > 0 && frames[index - 1]!.d === final) index -= 1
  return frames[index]!.at
}

const hasIntermediateFrame = ({ before, frames }: MorphRecord) => {
  const final = frames.at(-1)!.d
  return frames.some(frame => frame.d !== before && frame.d !== final)
}

test.describe('MShape', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'shape/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const theme of THEMES) {
    test(`stress content has no axe violations (${theme})`, async ({ page }) => {
      await openFixture(page, 'shape/stress', { theme })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`matrix and stress content do not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })

      for (const key of ['shape/matrix', 'shape/stress']) {
        await openFixture(page, key)
        await expectNoHorizontalOverflow(page)
      }
    })
  }

  test('a shape without a label is hidden from assistive technology', async ({ page }) => {
    await openFixture(page, 'shape/matrix')

    for (const name of NAMES) {
      const shape = page.getByTestId(`decorative-${name}`)
      await expect(shape, name).toHaveAttribute('aria-hidden', 'true')
      await expect(shape, name).toHaveAttribute('focusable', 'false')
      await expect(shape, name).not.toHaveAttribute('role')
      await expect(shape, name).not.toHaveAttribute('aria-label')
    }

    await expect(page.locator('.fixture-shape-matrix').getByRole('img')).toHaveCount(NAMES.length)
  })

  test('a labelled shape is an image named by its label', async ({ page }) => {
    await openFixture(page, 'shape/matrix')

    for (const name of NAMES) {
      const image = page.getByRole('img', { name: labelOf(name), exact: true })
      await expect(image, name).toHaveAttribute('data-test', `labelled-${name}`)
      await expect(image, name).not.toHaveAttribute('aria-hidden')
    }
  })

  test('long and mixed-script labels name their images in full', async ({ page }) => {
    await openFixture(page, 'shape/stress')

    await expect(page.getByRole('img', { name: 'Сохранено 保存 حفظ', exact: true })).toHaveAttribute('data-test', 'script-label')
    await expect(page.getByTestId('long-label')).toHaveAttribute('role', 'img')
  })

  test('shapes never take focus', async ({ page }) => {
    await openFixture(page, 'shape/matrix')

    await expect(page.locator('.ui-shape[tabindex]')).toHaveCount(0)

    for (let step = 0; step < 3; step++) {
      await page.keyboard.press('Tab')
      const insideShape = await page.evaluate(() => Boolean(document.activeElement?.closest('.ui-shape')))
      expect(insideShape).toBe(false)
    }
  })

  test('a morph banks in flight and comes to rest square on the canonical path', async ({ page }) => {
    await openFixture(page, 'shape/stress')

    const record = await recordMorph(page, 'motion-shape', 'motion-next')
    const final = record.frames.at(-1)!

    expect(record.before).toBe(M3_SHAPES.circle)
    expect(hasIntermediateFrame(record)).toBe(true)
    expect(record.frames.some(frame => frame.transform.startsWith('rotate('))).toBe(true)
    expect(final.d).toBe(M3_SHAPES.square)
    expect(final.transform).toBe('')
  })

  test('reduced motion shortens the morph instead of skipping it', async ({ page }) => {
    await openFixture(page, 'shape/stress')
    const full = await recordMorph(page, 'motion-shape', 'motion-next')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'shape/stress')
    const reduced = await recordMorph(page, 'motion-shape', 'motion-next')

    expect(hasIntermediateFrame(reduced)).toBe(true)
    expect(reduced.frames.every(frame => frame.transform === '')).toBe(true)
    expect(reduced.frames.at(-1)!.d).toBe(M3_SHAPES.square)
    expect(settledAt(reduced.frames)).toBeLessThan(settledAt(full.frames) / 2)
  })

  test('a burst of changes comes to rest on the last shape', async ({ page }) => {
    await openFixture(page, 'shape/stress')

    const record = await recordMorph(page, 'burst-shape', 'burst-run', 1600)
    const final = record.frames.at(-1)!

    expect(final.d).toBe(M3_SHAPES.sunny)
    expect(final.transform).toBe('')
  })

  test('every transition lands on the same canonical path', async ({ page }) => {
    await openFixture(page, 'shape/stress')

    await page.getByTestId('transitions-next').click()

    for (const transition of ['calm', 'standard', 'expressive', 'bouncy']) {
      await expect(page.getByTestId(`transition-${transition}`).locator('path'), transition).toHaveAttribute('d', M3_SHAPES.square)
    }
  })

  test('shapes keep a visible fill in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'shape/matrix')

    for (const id of ['decorative-circle', 'labelled-heart', 'role-error']) {
      const fill = await page.getByTestId(id).locator('path').evaluate(el => getComputedStyle(el).fill)
      expect(fill, id).not.toBe('none')
      expect(fill, id).not.toBe('rgba(0, 0, 0, 0)')
    }
  })
})
