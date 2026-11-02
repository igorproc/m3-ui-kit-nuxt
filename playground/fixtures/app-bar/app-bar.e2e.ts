import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

/** A system token as the browser resolves it on this page (`--md-sys-…`). */
const sysValue = (page: Page, property: 'color' | 'font-size', token: string) => page.evaluate(([prop, name]) => {
  const probe = document.createElement('div')
  probe.style.setProperty(prop!, `var(${name})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(prop!)
  probe.remove()
  return value
}, [property, token])

const box = async (locator: Locator) => (await locator.boundingBox())!

test.describe('MAppBar', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'app-bar/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  // Step 1: the M3 type scale per size.
  for (const [type, title, subtitle] of [
    ['small', 'title-large', 'label-medium'],
    ['medium', 'headline-medium', 'label-large'],
    ['large', 'display-small', 'title-medium'],
  ] as const) {
    test(`a ${type} bar sets its headline in ${title} and its subtitle in ${subtitle}`, async ({ page }) => {
      await openFixture(page, 'app-bar/matrix')
      const bar = page.getByTestId(`${type}-subtitle`)

      expect(await style(bar.locator('.ui-app-bar__title'), 'font-size'))
        .toBe(await sysValue(page, 'font-size', `--md-sys-typescale-${title}-size`))
      expect(await style(bar.locator('.ui-app-bar__subtitle'), 'font-size'))
        .toBe(await sysValue(page, 'font-size', `--md-sys-typescale-${subtitle}-size`))
    })
  }

  for (const dir of DIRECTIONS) {
    test(`a lone headline starts 16 from the edge; a leading button pushes it to 52 (${dir})`, async ({ page }) => {
      await openFixture(page, 'app-bar/matrix', { dir })
      const rem = await remInPx(page)
      const fromStart = async (bar: Locator) => {
        const outer = await box(bar)
        const title = await box(bar.locator('.ui-app-bar__title'))
        return (dir === 'ltr' ? title.x - outer.x : outer.x + outer.width - (title.x + title.width)) / rem
      }

      expect(await fromStart(page.getByTestId('small'))).toBeCloseTo(16, 0)
      expect(await fromStart(page.getByTestId('with-nav'))).toBeCloseTo(52, 0)
    })
  }

  test('trailing actions take the variant tone, the leading button stays on-surface', async ({ page }) => {
    await openFixture(page, 'app-bar/matrix')

    expect(await style(page.getByTestId('action-button'), 'color')).toBe(await sysValue(page, 'color', '--md-sys-color-on-surface-variant'))
    expect(await style(page.getByTestId('nav-button'), 'color')).toBe(await sysValue(page, 'color', '--md-sys-color-on-surface'))
  })

  // CT-02: a flexible headline wraps to two lines instead of losing its end.
  test('a long medium headline wraps to two lines and widens nothing', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'app-bar/matrix')
    const title = page.getByTestId('long').locator('.ui-app-bar__title')
    const lineHeight = Number.parseFloat(await style(title, 'line-height'))

    expect((await box(title)).height).toBeCloseTo(lineHeight * 2, 0)
    await expectNoHorizontalOverflow(page)
  })

  // CT-02: a small bar cuts a long headline with an ellipsis and shows the full text on hover.
  test('a cut one-line headline shows its full text in a tooltip; one that fits shows none', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'app-bar/matrix')
    const cut = page.getByTestId('long-small').locator('.ui-app-bar__text')

    expect(await style(cut, 'text-overflow')).toBe('ellipsis')
    expect(await cut.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
    await expectNoHorizontalOverflow(page)

    await cut.hover()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('A headline long enough')

    // Away first: the shown tooltip sits over the bar below and is hoverable itself
    await page.mouse.move(0, 0)
    await expect(tooltip).toBeHidden()

    await page.getByTestId('short-small').locator('.ui-app-bar__text').hover()
    await page.waitForTimeout(300)
    await expect(page.getByRole('tooltip')).toBeHidden()
  })

  test('the tooltip of a headline is not in the server HTML and names nothing', async ({ page }) => {
    const markup = await (await page.request.get('/app-bar/matrix?theme=light&dir=ltr')).text()

    expect(markup).not.toContain('role="tooltip"')

    await openFixture(page, 'app-bar/matrix')
    const heading = page.getByTestId('long-small').locator('.ui-app-bar__title')
    expect(await heading.getAttribute('aria-describedby')).toBeNull()
  })

  // W65-В: the fold follows the scroll in CSS where the browser has scroll timelines.
  test('a collapsing large bar folds into the small height as the page scrolls, and back', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'app-bar/matrix')
    const rem = await remInPx(page)
    const bar = page.getByTestId('collapse')
    const copy = bar.locator('.ui-app-bar__collapsed')
    const headline = bar.locator('.ui-app-bar__headline')

    expect((await box(bar)).height).toBeCloseTo(120 * rem, 0)
    expect(Number(await style(copy, 'opacity'))).toBe(0)

    await page.evaluate(() => window.scrollTo(0, 600))
    await expect.poll(async () => (await box(bar)).height / rem).toBeCloseTo(64, 0)
    expect(Number(await style(copy, 'opacity'))).toBe(1)
    expect(Number(await style(headline, 'opacity'))).toBe(0)
    expect((await box(copy)).y).toBeGreaterThanOrEqual((await box(bar)).y)

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect.poll(async () => (await box(bar)).height / rem).toBeCloseTo(120, 0)
  })

  // Where the browser has scroll timelines the fold is CSS: it needs no script
  // to catch up, so a page that starts scrolled is folded in its first frame.
  test('folds without the script fallback where scroll timelines exist', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'app-bar/matrix')
    const rem = await remInPx(page)
    const bar = page.getByTestId('collapse')

    await page.evaluate(() => window.scrollTo(0, 600))
    await expect.poll(async () => (await box(bar)).height / rem).toBeCloseTo(64, 0)
    await expect(bar).not.toHaveClass(/ui-app-bar--collapsed/)
  })

  for (const [type, height] of [['medium', 112], ['large', 120]] as const) {
    test(`a ${type} bar is exactly ${height} high at rest`, async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 800 })
      await openFixture(page, 'app-bar/matrix')
      const rem = await remInPx(page)

      expect((await box(page.getByTestId(type))).height / rem).toBeCloseTo(height, 0)
    })
  }

  test('a sticky bar outside m-layout grows by the window cutouts, a scrolling one does not', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    const session = await page.context().newCDPSession(page)
    await session.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, right: 0, bottom: 0, left: 24 } })
    await openFixture(page, 'app-bar/matrix')
    const rem = await remInPx(page)
    const px = (locator: Locator, property: string) => style(locator, property).then(Number.parseFloat)
    const sticky = page.getByTestId('collapse')

    expect(await px(sticky, 'padding-top')).toBeCloseTo(47, 0)
    expect(await px(sticky, 'padding-left')).toBeCloseTo(4 * rem + 24, 0)
    expect(await px(sticky, 'padding-right')).toBeCloseTo(4 * rem, 0)
    expect((await box(sticky)).height).toBeCloseTo(120 * rem + 47, 0)
    expect(await px(page.getByTestId('medium'), 'padding-top')).toBe(0)
  })

  test('the bar is a header element and the folded copy stays out of the accessibility tree', async ({ page }) => {
    await openFixture(page, 'app-bar/matrix')
    const bar = page.getByTestId('collapse')

    expect(await bar.evaluate(el => el.tagName)).toBe('HEADER')
    await expect(page.getByRole('heading', { level: 1, name: 'Folding headline' })).toHaveCount(1)
    await expect(bar.locator('.ui-app-bar__collapsed')).toHaveAttribute('aria-hidden', 'true')
  })
})

test.describe('MAppBar server HTML', () => {
  test.use({ javaScriptEnabled: false })

  // A composed title reports its subtitle after the bar rendered; `:has()` gives
  // the bar its taller height before any script runs.
  test('a composed title with a subtitle gets the subtitle height in the first frame', async ({ page }) => {
    await page.goto('/app-bar/matrix?theme=light&dir=ltr')

    const composed = await page.getByTestId('composed-subtitle').evaluate(el => el.getBoundingClientRect().height)
    const readyMade = await page.getByTestId('small-subtitle').evaluate(el => el.getBoundingClientRect().height)

    expect(composed).toBeCloseTo(readyMade, 0)
  })
})
