import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

/** Samples the expressive shape's path and angle on every frame for `ms`. */
async function sampleShape(page: import('@playwright/test').Page, selector: string, ms: number) {
  return page.evaluate(async ({ selector, ms }) => {
    const svg = document.querySelector(selector) as SVGSVGElement
    const samples: Array<{ head: string, angle: number }> = []
    const end = performance.now() + ms
    await new Promise<void>((resolve) => {
      const frame = () => {
        const angle = /rotate\((-?[\d.]+)deg\)/.exec(svg.style.transform)?.[1]
        samples.push({ head: svg.querySelector('path')!.getAttribute('d')!.slice(0, 48), angle: angle === undefined ? 0 : Number(angle) })
        if (performance.now() < end) requestAnimationFrame(frame)
        else resolve()
      }
      requestAnimationFrame(frame)
    })
    return samples
  }, { selector, ms })
}

test.describe('MLoading', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'loading/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const width of WIDTHS) {
    test(`stress does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'loading/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  // SHP.B-1: under reduced motion the shapes used to change in a single frame.
  test('under reduced motion the expressive shapes still morph over several frames', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'loading/matrix')
    const samples = await sampleShape(page, '[data-test="expressive-large"] svg.ui-shape', 3200)

    const runs: number[] = []
    let run = 0
    for (let index = 1; index < samples.length; index++) {
      if (samples[index]!.head !== samples[index - 1]!.head) run++
      else if (run) {
        runs.push(run)
        run = 0
      }
    }
    expect(runs.length).toBeGreaterThan(0)
    expect(Math.min(...runs)).toBeGreaterThan(3)
    expect(samples.every(sample => sample.angle === 0)).toBe(true)
  })

  // Q-5: the swing follows the speed's size, so the shape never turns back past square.
  test('the expressive shape swings one way and comes to rest square', async ({ page }) => {
    await openFixture(page, 'loading/matrix')
    const samples = await sampleShape(page, '[data-test="expressive-large"] svg.ui-shape', 2400)

    expect(Math.min(...samples.map(sample => sample.angle))).toBeGreaterThanOrEqual(0)
    expect(Math.max(...samples.map(sample => sample.angle))).toBeGreaterThan(10)
  })

  // LY-03: inline in a line of text the indicator sits on the capitals' middle.
  test('an inline indicator is centred on the line of text', async ({ page }) => {
    await openFixture(page, 'loading/matrix')
    const rem = await remInPx(page)
    const offset = await page.getByTestId('inline-circular').evaluate((node) => {
      const box = node.getBoundingClientRect()
      const range = document.createRange()
      range.selectNodeContents(node.parentElement!.firstChild!)
      const text = range.getBoundingClientRect()
      return (box.top + box.bottom) / 2 - (text.top + text.bottom) / 2
    })

    expect(Math.abs(offset / rem)).toBeLessThan(1.5)
  })

  test('the arc and the shape keep a system colour in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'loading/matrix')

    expect(await page.locator('[data-test="circular-large"] .ui-loading__circle').first().evaluate(el => getComputedStyle(el).forcedColorAdjust)).toBe('none')
    expect(await page.locator('[data-test="expressive-large"] .ui-loading__expressive').evaluate(el => getComputedStyle(el).forcedColorAdjust)).toBe('none')
  })
})
