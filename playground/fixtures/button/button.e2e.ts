import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, waitForMotion } from '../../e2e/support'
import { traceMotion } from '../../e2e/probe'
import { drawnRadii, traceCorner } from './motion'

const VARIANTS = ['elevated', 'filled', 'tonal', 'outlined', 'text']

const activeTestId = (page: Page) => page.evaluate(() => document.activeElement?.closest('[data-test]')?.getAttribute('data-test') ?? '')
const outlineWidth = (locator: Locator) => locator.evaluate(el => Number.parseFloat(getComputedStyle(el).outlineWidth))
const width = async (locator: Locator) => (await locator.boundingBox())!.width
// A split's attributes land on its main button (`inheritAttrs: false`); the root is found through it.
const splitRoot = (page: Page, id: string) => page.locator(`.ui-split-button:has([data-test="${id}"])`)

test.describe('MButton', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'button/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'button/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'button/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  // IN-08: a loading button is inert but stays a Tab stop; only disabled leaves.
  test('Tab reaches every enabled and loading button and skips disabled ones', async ({ page }) => {
    await openFixture(page, 'button/matrix')

    // Walk one full Tab cycle: stop at the first control seen twice.
    const reached: string[] = []
    for (let step = 0; step < 80; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
      if (reached.includes(id)) break
      if (id) reached.push(id)
    }

    expect(reached.filter(id => id.startsWith('enabled-'))).toEqual(VARIANTS.map(v => `enabled-${v}`))
    expect(reached.filter(id => id.startsWith('loading-'))).toEqual(VARIANTS.map(v => `loading-${v}`))
    expect(reached.some(id => id.startsWith('disabled-') || id.startsWith('selected-disabled-'))).toBe(false)
  })

  // Q-12 (kit-wide): a disabled link has no destination, so nothing can follow
  // it, and an `<a>` without href leaves the Tab order by itself.
  test('a disabled link button has no destination and no Tab stop', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const enabled = page.getByTestId('link-enabled')
    const disabled = page.getByTestId('link-disabled')

    await expect(enabled).toHaveAttribute('href', '/button/family')
    await expect(disabled).not.toHaveAttribute('href')
    await expect(disabled).toHaveAttribute('role', 'link')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')

    await enabled.focus()
    await page.keyboard.press('Tab')
    await expect(disabled).not.toBeFocused()
  })

  test('a focused button keeps focus when it starts loading', async ({ page }) => {
    await openFixture(page, 'button/stress')
    const button = page.getByTestId('submit-once')

    await button.focus()
    await page.keyboard.press('Enter')

    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(button).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('submissions')).toHaveText('1')
  })

  test('Enter and Space activate the focused button', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const button = page.getByTestId('enabled-filled')
    const activations = page.getByTestId('activations')

    await button.focus()
    await page.keyboard.press('Enter')
    await expect(activations).toHaveText('1')
    await page.keyboard.press('Space')
    await expect(activations).toHaveText('2')
  })

  test('keyboard focus ring is at least 2px', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    await page.keyboard.press('Tab')

    const width = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.activeElement!).outlineWidth))
    expect(width).toBeGreaterThanOrEqual(2)
  })

  test('buttons keep a visible boundary in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button/matrix')

    for (const variant of VARIANTS) {
      const style = await page.getByTestId(`enabled-${variant}`).evaluate(el => getComputedStyle(el).borderStyle)
      expect(style, variant).not.toBe('none')
    }
  })

  // MO-04: the spinner replaces the prepend icon or sits over the label.
  test('starting to load does not change any button width', async ({ page }) => {
    await openFixture(page, 'button/stress')
    const ids = ['loading-label', 'loading-prepend', 'loading-compact', 'loading-comfortable', 'loading-extended', 'loading-icon']

    const before = await Promise.all(ids.map(id => width(page.getByTestId(id))))
    await page.getByTestId('toggle-loading').click()
    await expect(page.getByTestId('loading-label')).toHaveAttribute('aria-busy', 'true')
    const after = await Promise.all(ids.map(id => width(page.getByTestId(id))))

    ids.forEach((id, index) => expect(after[index], id).toBeCloseTo(before[index]!, 0))
  })

  test('density steps are 32, 40 and 56 tall', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))

    for (const [density, height] of [['compact', 32], ['default', 40], ['comfortable', 56]] as const) {
      const box = (await page.getByTestId(`density-${density}-round`).boundingBox())!
      expect(box.height / rem, density).toBeCloseTo(height, 0)
    }
  })

  // B-4: an MButton with only an icon is drawn as an icon button.
  test('an icon-only button is the icon button box and glyph', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
    const button = page.getByTestId('icon-only-default')

    const box = (await button.boundingBox())!
    const glyph = await button.locator('.ui-button__icon').evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize))

    expect(box.width / rem).toBeCloseTo(40, 0)
    expect(box.height / rem).toBeCloseTo(40, 0)
    expect(glyph / rem).toBeCloseTo(24, 0)
  })

  // S8: drawn at 32, compact still answers the pointer across 48.
  test('a compact button takes a 48 pointer target', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const button = page.getByTestId('density-compact-round')
    const hit = (offset: number) => button.evaluate((el, ratio) => {
      const box = el.getBoundingClientRect()
      const probe = document.elementFromPoint(box.left + box.width / 2, box.top - box.height * ratio)
      return probe?.closest('[data-test]') === el
    }, offset)

    // 8 of 32 above the edge is inside the target, 10 of 32 is not.
    expect(await hit(0.2)).toBe(true)
    expect(await hit(0.32)).toBe(false)
  })

  test('the square shape and a selected toggle use the step radius', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const radius = (id: string) => page.getByTestId(id).evaluate(el => getComputedStyle(el).borderTopLeftRadius)

    const square = await radius('density-default-square')
    expect(square).not.toBe(await radius('density-default-round'))
    expect(await radius('selected-filled')).toBe(square)
    // B-5: a selected toggle keeps its shape while disabled.
    expect(await radius('selected-disabled-filled')).toBe(square)
  })

  // S3 declined: pressing changes no shape, and selection does not animate one.
  test('pressing does not change the corner radius and no radius is animated', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const button = page.getByTestId('enabled-filled')
    const radius = () => button.evaluate(el => getComputedStyle(el).borderTopLeftRadius)

    const rest = await radius()
    await button.hover()
    await page.mouse.down()
    expect(await radius()).toBe(rest)
    await page.mouse.up()

    const transition = await button.evaluate(el => getComputedStyle(el).transitionProperty)
    expect(transition).not.toContain('border-radius')
  })

  // Q-1: `full = 999rem` drew a spring that stood still ~130 ms and arrived in
  // two frames, and snapped back to round in one. The round is now the step's
  // half height, so the drawn corner moves with the colour, frame by frame.
  test('the drawn corner of a toggle moves with its colour and never snaps', async ({ page }) => {
    for (const [url, id] of [['button/matrix', 'toggle-filled'], ['button/matrix', 'toggle-outlined'], ['button/family', 'icon-toggle-round-filled'], ['button/family', 'icon-toggle-square-filled']] as const) {
      await openFixture(page, url)
      const button = page.getByTestId(id)
      await button.scrollIntoViewIfNeeded()

      for (const step of ['select', 'deselect']) {
        const motion = await traceCorner(page, `[data-test="${id}"]`, () => button.click())
        const label = `${id} ${step}`

        expect(Math.abs(motion.toRem - motion.fromRem), label).toBeGreaterThan(3)
        expect(motion.lagMs, label).not.toBeNull()
        expect(motion.lagMs!, label).toBeLessThanOrEqual(34)
        expect(motion.largestStepShare, label).toBeLessThan(0.5)
        await page.mouse.move(0, 0)
      }
    }
  })

  // A selected fill is the state: forced colors flattened it and drew the
  // label's Canvas backplate over Highlight, hiding the text.
  test('a selected button keeps a readable label in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button/matrix')

    for (const id of ['selected-filled', 'selected-outlined', 'selected-text']) {
      const style = await page.getByTestId(id).evaluate((el) => {
        const computed = getComputedStyle(el)
        return { adjust: computed.forcedColorAdjust, color: computed.color, background: computed.backgroundColor }
      })
      expect(style.adjust, id).toBe('none')
      expect(style.color, id).not.toBe(style.background)
    }
  })

  // Owner's decision: a toggle reaches its selected shape on an M3 spring.
  test('a toggle morphs its shape on a spring, shortened under reduced motion', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const timing = () => page.getByTestId('toggle-filled').evaluate((el) => {
      const style = getComputedStyle(el)
      const index = style.transitionProperty.split(', ').indexOf('border-radius')
      return index < 0 ? '' : style.transitionTimingFunction.split(/,\s(?![^(]*\))/)[index]!
    })

    expect(await timing()).toContain('linear(')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page, 'button/matrix')
    await expect.poll(timing).not.toContain('linear(')
    expect(await timing()).not.toBe('')
  })

  test('Space and Enter toggle aria-pressed', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const button = page.getByTestId('toggle-filled')

    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.focus()
    await page.keyboard.press('Space')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  test('a plain button has no aria-pressed', async ({ page }) => {
    await openFixture(page, 'button/matrix')

    await expect(page.getByTestId('enabled-filled')).not.toHaveAttribute('aria-pressed')
  })

  test('a selected toggle stays distinct in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button/matrix')
    const background = (id: string) => page.getByTestId(id).evaluate(el => getComputedStyle(el).backgroundColor)

    for (const variant of VARIANTS) {
      expect(await background(`selected-${variant}`), variant).not.toBe(await background(`toggle-${variant}`))
    }
  })

  test('a loading button keeps its accessible name', async ({ page }) => {
    await openFixture(page, 'button/stress')
    await page.getByTestId('toggle-loading').click()

    await expect(page.getByTestId('loading-label')).toHaveAccessibleName('Submit')
  })

  // IN-11: the press that starts the work makes the button busy before a second lands.
  test('a double click submits once', async ({ page }) => {
    await openFixture(page, 'button/stress')

    await page.getByTestId('submit-once').dblclick()

    await expect(page.getByTestId('submissions')).toHaveText('1')
  })
})

test.describe('Button family', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`family matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'button/family', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const viewport of WIDTHS) {
    test(`family matrix does not overflow the page at ${viewport}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport, height: 800 })
      await openFixture(page, 'button/family')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('icon button, FAB and extended FAB show a focus ring of at least 2px', async ({ page }) => {
    await openFixture(page, 'button/family')

    for (const id of ['icon-enabled-filled', 'fab-enabled-filled', 'extended-enabled-filled']) {
      const control = page.getByTestId(id)
      await control.focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      expect(await outlineWidth(control), id).toBeGreaterThanOrEqual(2)
    }
  })

  test.describe('icon button', () => {
    const SIZES = {
      compact: { height: 32, narrow: 28, default: 32, wide: 40 },
      default: { height: 40, narrow: 32, default: 40, wide: 52 },
      comfortable: { height: 56, narrow: 48, default: 56, wide: 72 },
    } as const

    test('density × width boxes follow M3 XS / S / M', async ({ page }) => {
      await openFixture(page, 'button/family')
      const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))

      for (const [density, size] of Object.entries(SIZES)) {
        for (const width of ['narrow', 'default', 'wide'] as const) {
          const box = (await page.getByTestId(`icon-${density}-${width}`).boundingBox())!
          expect(box.height / rem, `${density} ${width} height`).toBeCloseTo(size.height, 0)
          expect(box.width / rem, `${density} ${width} width`).toBeCloseTo(size[width], 0)
        }
      }
    })

    // S8: every icon button answers the pointer across 48, however small it is drawn.
    for (const id of ['icon-compact-narrow', 'icon-default-narrow']) {
      test(`${id} takes a 48 pointer target`, async ({ page }) => {
        await openFixture(page, 'button/family')
        const reaches = await page.getByTestId(id).evaluate((el) => {
          const box = el.getBoundingClientRect()
          const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
          const inside = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('[data-test]') === el
          const midX = box.left + box.width / 2
          const midY = box.top + box.height / 2

          return inside(midX, midY - 23 * rem) && inside(midX - 23 * rem, midY) && !inside(midX, midY - 26 * rem)
        })

        expect(reaches).toBe(true)
      })
    }

    test('a selected round button turns square and a selected square one turns round', async ({ page }) => {
      await openFixture(page, 'button/family')
      const radius = (id: string) => page.getByTestId(id).evaluate(el => getComputedStyle(el).borderTopLeftRadius)
      const round = page.getByTestId('icon-toggle-round-filled')
      const square = page.getByTestId('icon-toggle-square-filled')

      const roundRest = await radius('icon-toggle-round-filled')
      const squareRest = await radius('icon-toggle-square-filled')
      await round.click()
      await square.click()

      // The shape gets there on a spring, so wait for it to settle.
      await expect.poll(() => radius('icon-toggle-round-filled')).toBe(squareRest)
      await expect.poll(() => radius('icon-toggle-square-filled')).toBe(roundRest)
      // B-5: the selected shape survives disabled.
      expect(await radius('icon-selected-disabled-round')).toBe(squareRest)
    })

    test('click and Space toggle aria-pressed and the slot glyph', async ({ page }) => {
      await openFixture(page, 'button/family')
      const button = page.getByTestId('icon-toggle-round-text')

      await expect(button).toHaveAttribute('aria-pressed', 'false')
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Space')
      await expect(button).toHaveAttribute('aria-pressed', 'false')
    })

    // B-3: no role → the container's content colour; a role still wins.
    test('a standard icon button takes its container colour unless given a role', async ({ page }) => {
      await openFixture(page, 'button/family')
      const color = (id: string) => page.getByTestId(id).evaluate(el => getComputedStyle(el).color)

      expect(await color('icon-tint-inherit')).toBe(await color('icon-tint-host'))
      expect(await color('icon-tint-role')).not.toBe(await color('icon-tint-host'))
    })
  })

  test.describe('FAB', () => {
    test('density steps are 40, 56 and 96', async ({ page }) => {
      await openFixture(page, 'button/family')
      const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))

      for (const [density, size] of [['compact', 40], ['default', 56], ['comfortable', 96]] as const) {
        const fab = (await page.getByTestId(`fab-density-${density}`).boundingBox())!
        const extended = (await page.getByTestId(`extended-density-${density}`).boundingBox())!
        expect(fab.width / rem, `fab ${density}`).toBeCloseTo(size, 0)
        expect(fab.height / rem, `fab ${density}`).toBeCloseTo(size, 0)
        expect(extended.height / rem, `extended ${density}`).toBeCloseTo(size, 0)
      }
    })

    // B-2: tonal is the role's container (the M3 default FAB), filled the role itself.
    test('tonal wears the role container and filled the role', async ({ page }) => {
      await openFixture(page, 'button/family')
      const resolve = (token: string) => page.evaluate((name) => {
        const probe = document.createElement('div')
        probe.style.backgroundColor = `var(${name})`
        document.body.append(probe)
        const color = getComputedStyle(probe).backgroundColor
        probe.remove()
        return color
      }, token)
      const background = (id: string) => page.getByTestId(id).evaluate(el => getComputedStyle(el).backgroundColor)

      expect(await background('fab-enabled-tonal')).toBe(await resolve('--md-sys-color-primary-container'))
      expect(await background('fab-enabled-filled')).toBe(await resolve('--md-sys-color-primary'))
    })

    test('a folded extended FAB is a square that keeps its accessible name', async ({ page }) => {
      await openFixture(page, 'button/family')
      const fab = page.getByTestId('extended-fold')

      await fab.click()
      await expect(fab).toHaveClass(/ui-extended-fab--collapsed/)
      // Within a CSS pixel: subpixel layout can land on -0.3, which rounds to -0.
      await expect.poll(async () => {
        const box = (await fab.boundingBox())!
        return Math.abs(box.width - box.height)
      }).toBeLessThan(1)
      await expect(fab).toHaveAccessibleName('Compose')
    })
  })

  // ST-02: focus is its own layer, not the pressed one.
  // EXT.B-1/B-2: the width snapped in one frame and then rocked 56 → 48 → 56;
  // unfolding, the label wrapped and the icon jumped. Now the label closes and
  // opens, and the button follows it.
  test('folding and unfolding an extended FAB moves only its width, smoothly', async ({ page }) => {
    await openFixture(page, 'button/family')
    const fab = page.getByTestId('extended-fold')
    await fab.scrollIntoViewIfNeeded()

    for (const step of ['fold', 'unfold']) {
      const trace = await traceMotion(page, {
        targets: { root: '[data-test="extended-fold"]', icon: '[data-test="extended-fold"] .ui-extended-fab__icon' },
        duration: 900,
        act: () => fab.click(),
      })
      const rem = trace.remPx
      const widths = trace.frames.map(frame => frame.rects.root!.width / rem)
      const heights = trace.frames.map(frame => frame.rects.root!.height / rem)
      const iconX = trace.frames.map(frame => frame.rects.icon!.x / rem)
      const steps = widths.slice(1).map((value, index) => value - widths[index]!)
      const total = widths.at(-1)! - widths[0]!
      const backwards = steps.filter(change => Math.abs(change) > 0.5 && Math.sign(change) !== Math.sign(total))

      expect(Math.abs(total), step).toBeGreaterThan(30)
      expect(Math.max(...steps.map(Math.abs)) / Math.abs(total), step).toBeLessThan(0.5)
      expect(backwards, step).toEqual([])
      expect(Math.max(...heights) - Math.min(...heights), step).toBeLessThan(1)
      expect(Math.max(...iconX) - Math.min(...iconX), step).toBeLessThan(1)
      await page.mouse.move(0, 0)
    }
  })

  // ST-02 + Q-2: focus is its own layer in the content colour; the container
  // itself never changes colour for a state (pressed is the ripple's alone).
  test('a focused FAB wears the focus layer over an unchanged container', async ({ page }) => {
    await openFixture(page, 'button/family')
    const fab = page.getByTestId('fab-enabled-filled')
    const look = () => fab.evaluate(el => ({
      background: getComputedStyle(el).backgroundColor,
      layer: Number.parseFloat(getComputedStyle(el, '::before').opacity),
    }))

    const rest = await look()
    await fab.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await waitForMotion(page)
    const focused = await look()

    expect(rest.layer).toBe(0)
    expect(focused.layer).toBeCloseTo(0.1, 2)
    expect(focused.background).toBe(rest.background)
  })

  test.describe('segmented, single choice', () => {
    test('is one Tab stop on the checked segment', async ({ page }) => {
      await openFixture(page, 'button/family')
      const group = page.getByTestId('segmented-single')

      await expect(group).toHaveAttribute('role', 'radiogroup')
      await expect(group).toHaveAccessibleName('Period')

      await page.getByTestId('segmented-multiple').getByRole('button').first().focus()
      await page.keyboard.press('Shift+Tab')

      await expect(group.getByRole('radio', { name: 'Week' })).toBeFocused()
      await expect(group.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
    })

    test('arrows move the selection past disabled segments; Home and End jump', async ({ page }) => {
      await openFixture(page, 'button/family')
      const group = page.getByTestId('segmented-single')
      const radio = (name: string) => group.getByRole('radio', { name })

      await radio('Week').focus()
      await page.keyboard.press('ArrowRight')
      await expect(radio('Year')).toBeFocused()
      await expect(radio('Year')).toHaveAttribute('aria-checked', 'true')

      await page.keyboard.press('Home')
      await expect(radio('Day')).toHaveAttribute('aria-checked', 'true')

      await page.keyboard.press('End')
      await expect(radio('Year')).toHaveAttribute('aria-checked', 'true')

      await page.keyboard.press('ArrowLeft')
      await expect(radio('Week')).toHaveAttribute('aria-checked', 'true')
    })

    test('in RTL the left arrow moves forward', async ({ page }) => {
      await openFixture(page, 'button/family', { dir: 'rtl' })
      const group = page.getByTestId('segmented-single')

      await group.getByRole('radio', { name: 'Day' }).click()
      await page.keyboard.press('ArrowLeft')

      await expect(group.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
    })

    test('a selected disabled segment does not wear the selected colour', async ({ page }) => {
      await openFixture(page, 'button/family')
      const background = (locator: Locator) => locator.evaluate(el => getComputedStyle(el).backgroundColor)

      const enabled = await background(page.getByTestId('segmented-single').getByRole('radio', { name: 'Week' }))
      const disabled = await background(page.getByTestId('segmented-disabled').getByRole('radio', { name: 'Week' }))

      expect(disabled).not.toBe(enabled)
    })

    test('the focus ring of a segment is drawn inside the clipped pill', async ({ page }) => {
      await openFixture(page, 'button/family')
      const segment = page.getByTestId('segmented-single').getByRole('radio', { name: 'Week' })

      await segment.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowLeft')

      expect(await outlineWidth(segment)).toBeGreaterThanOrEqual(2)
      expect(await segment.evaluate(el => Number.parseFloat(getComputedStyle(el).outlineOffset))).toBeLessThan(0)
    })
  })

  test('a segment is at least 58 wide', async ({ page }) => {
    await openFixture(page, 'button/family')
    const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
    const segment = page.getByTestId('segmented-icons').getByRole('radio', { name: 'Grid' })

    expect((await segment.boundingBox())!.width / rem).toBeGreaterThanOrEqual(57.5)
  })

  // Q-2: the focus state is a layer in the content colour, not a swapped background.
  test('a focused segment carries a focus layer', async ({ page }) => {
    await openFixture(page, 'button/family')
    const segment = page.getByTestId('segmented-multiple').getByRole('button', { name: 'Unread' })
    const layer = () => segment.evaluate(el => Number.parseFloat(getComputedStyle(el, '::before').opacity))

    expect(await layer()).toBe(0)
    await segment.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect.poll(layer).toBeGreaterThan(0)
  })

  // Q-3: the check used to widen its segment by 26 and push the neighbours in
  // one frame. Segments are equal and keep the check's room.
  test('choosing a segment moves nothing outside it', async ({ page }) => {
    await openFixture(page, 'button/family')

    for (const [id, names] of [['segmented-single', ['Day', 'Year']], ['segmented-multiple', ['Unread', 'Starred']]] as const) {
      const group = page.getByTestId(id)
      const boxes = () => group.locator('.ui-segmented-button__segment').evaluateAll(nodes => nodes.map((node) => {
        const box = node.getBoundingClientRect()
        return [Math.round(box.x), Math.round(box.width)]
      }))
      const groupWidth = async () => Math.round((await group.boundingBox())!.width)

      const before = await boxes()
      const width = await groupWidth()
      for (const name of names) {
        await group.getByRole(id === 'segmented-single' ? 'radio' : 'button', { name }).click()
        await waitForMotion(page)
        expect(await boxes(), `${id} ${name}`).toEqual(before)
        expect(await groupWidth(), `${id} ${name}`).toBe(width)
      }
      expect(new Set(before.map(([, w]) => w)).size, id).toBe(1)
    }
  })

  // A narrow group wraps a label between words, never inside one.
  test('a long word in a segment is not broken across lines', async ({ page }) => {
    await openFixture(page, 'button/stress')
    const lines = await page.getByTestId('segmented-long').getByRole('radio', { name: 'Supercalifragilisticexpialidocious' })
      .locator('.ui-segmented-button__label')
      .evaluate((label) => {
        const range = document.createRange()
        range.selectNodeContents(label)
        return new Set(Array.from(range.getClientRects(), rect => Math.round(rect.top))).size
      })

    expect(lines).toBe(1)
  })

  test('segmented multiple choice toggles aria-pressed with Space', async ({ page }) => {
    await openFixture(page, 'button/family')
    const group = page.getByTestId('segmented-multiple')
    const unread = group.getByRole('button', { name: 'Unread' })

    await expect(group).toHaveAttribute('role', 'group')
    await expect(unread).toHaveAttribute('aria-pressed', 'false')

    await unread.focus()
    await page.keyboard.press('Space')

    await expect(unread).toHaveAttribute('aria-pressed', 'true')
  })

  test('selected segments keep their fill in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button/family')
    const group = page.getByTestId('segmented-single')
    const background = (name: string) => group.getByRole('radio', { name }).evaluate(el => getComputedStyle(el).backgroundColor)

    expect(await background('Week')).not.toBe(await background('Day'))
  })

  test.describe('split', () => {
    test('the trailing button is a named menu button', async ({ page }) => {
      await openFixture(page, 'button/family')
      const dropdown = splitRoot(page, 'split-filled').getByRole('button', { name: 'More save options' })

      await expect(dropdown).toHaveAttribute('aria-haspopup', 'menu')
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false')

      await dropdown.click()

      await expect(dropdown).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByRole('menuitem', { name: 'Save as draft' })).toBeFocused()
    })

    test('picking an item reports it, closes the menu and returns focus', async ({ page }) => {
      await openFixture(page, 'button/family')
      const dropdown = splitRoot(page, 'split-filled').getByRole('button', { name: 'More save options' })

      await dropdown.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      await expect(page.getByTestId('last-event')).toHaveText('select:publish')
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false')
      await expect(dropdown).toBeFocused()
    })

    test('Escape closes the menu and returns focus', async ({ page }) => {
      await openFixture(page, 'button/family')
      const dropdown = splitRoot(page, 'split-filled').getByRole('button', { name: 'More save options' })

      await dropdown.click()
      await page.keyboard.press('Escape')

      await expect(dropdown).toHaveAttribute('aria-expanded', 'false')
      await expect(dropdown).toBeFocused()
    })

    test('the focus ring of either half is not clipped', async ({ page }) => {
      await openFixture(page, 'button/family')
      const split = splitRoot(page, 'split-filled')
      const wrapper = split.locator('.ui-split-button__wrapper')

      expect(await wrapper.evaluate(el => getComputedStyle(el).overflow)).toBe('visible')

      await split.getByRole('button', { name: 'Save', exact: true }).focus()
      await page.keyboard.press('Tab')
      const trailing = split.getByRole('button', { name: 'More save options' })
      await expect(trailing).toBeFocused()
      expect(await outlineWidth(trailing)).toBeGreaterThanOrEqual(2)
    })

    test('the buttons are a 2 gap apart and meet with small static corners', async ({ page }) => {
      await openFixture(page, 'button/family')
      const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
      const split = splitRoot(page, 'split-outlined')
      const action = split.locator('.ui-split-button__action')
      const trailing = split.locator('.ui-split-button__trailing')
      const inner = () => trailing.evaluate(el => getComputedStyle(el).borderTopLeftRadius)

      const gap = (await trailing.boundingBox())!.x - ((await action.boundingBox())!.x + (await action.boundingBox())!.width)
      expect(Math.abs(gap) / rem).toBeCloseTo(2, 0)

      const rest = await inner()
      await trailing.hover()
      await page.mouse.down()
      expect(await inner()).toBe(rest)
      await page.mouse.up()
      await page.keyboard.press('Escape')
    })

    test('the chevron points up while the menu is open', async ({ page }) => {
      await openFixture(page, 'button/family')
      const trailing = splitRoot(page, 'split-filled').getByRole('button', { name: 'More save options' })
      const glyph = () => trailing.locator('.ui-icon').innerHTML()

      const closed = await glyph()
      await trailing.click()
      await expect.poll(glyph).not.toBe(closed)
    })

    test('density steps are 32, 40 and 56 tall with a 48 / 48 / 56 trailing button', async ({ page }) => {
      await openFixture(page, 'button/family')
      const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))

      for (const [density, height, width] of [['compact', 32, 48], ['default', 40, 48], ['comfortable', 56, 56]] as const) {
        const box = (await splitRoot(page, `split-density-${density}`).locator('.ui-split-button__trailing').boundingBox())!
        expect(box.height / rem, density).toBeCloseTo(height, 0)
        expect(box.width / rem, density).toBeCloseTo(width, 0)
      }
    })

    test('without a menu the trailing button is a plain action', async ({ page }) => {
      await openFixture(page, 'button/family')
      const trailing = splitRoot(page, 'split-action').getByRole('button', { name: 'Edit before sending' })

      await expect(trailing).not.toHaveAttribute('aria-haspopup')
      await trailing.click()
      await expect(page.getByTestId('last-event')).toHaveText('trailing')
    })

    test('a loading split holds both buttons', async ({ page }) => {
      await openFixture(page, 'button/family')
      const split = splitRoot(page, 'split-loading')

      await expect(split.getByRole('button', { name: 'Save', exact: true })).toHaveAttribute('aria-busy', 'true')
      await expect(split.getByRole('button', { name: 'More save options' })).toHaveAttribute('aria-disabled', 'true')
    })

    // В-6: loading holds the trailing button the way it holds the main one — a
    // native disabled used to throw its focus to <body>.
    test('a split that starts loading keeps focus on either half', async ({ page }) => {
      await openFixture(page, 'button/dynamic')
      const split = splitRoot(page, 'split')
      const toggleLoading = () => page.evaluate(() => (document.querySelector('[data-test="toggle-loading"]') as HTMLButtonElement).click())

      for (const name of ['Save', 'More save options']) {
        const half = split.getByRole('button', { name, exact: true })
        await half.focus()
        await toggleLoading()
        await expect(half).toHaveAttribute('aria-disabled', 'true')
        await expect(half).toBeFocused()
        await toggleLoading()
        await expect(half).toBeFocused()
      }
    })

    // Q-1: next to a 4 corner, a 999rem end scaled the whole corner set down to
    // nothing; the ends are now the step's half height.
    test('the halves meet with drawn 4 corners and round outer ends', async ({ page }) => {
      await openFixture(page, 'button/family')

      for (const [density, half] of [['compact', 16], ['default', 20], ['comfortable', 28]] as const) {
        const split = splitRoot(page, `split-density-${density}`)
        const action = await drawnRadii(split.locator('.ui-split-button__action'))
        const trailing = await drawnRadii(split.locator('.ui-split-button__trailing'))

        expect(action.tr, density).toBeCloseTo(4, 0)
        expect(action.br, density).toBeCloseTo(4, 0)
        expect(action.tl, density).toBeCloseTo(half, 0)
        expect(trailing.tl, density).toBeCloseTo(4, 0)
        expect(trailing.tr, density).toBeCloseTo(half, 0)
      }
    })

    test('attributes given to the split land on its main button', async ({ page }) => {
      await openFixture(page, 'button/family')

      await expect(page.getByTestId('split-filled')).toHaveClass(/ui-split-button__action/)
    })
  })
})
