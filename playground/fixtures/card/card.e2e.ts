import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, waitForMotion } from '../../e2e/support'

const VARIANTS = ['elevated', 'filled', 'outlined'] as const

const rootRem = (page: Page) => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
const style = (locator: Locator, property: string, pseudo?: string) =>
  locator.evaluate((el, [name, part]) => getComputedStyle(el, part).getPropertyValue(name!), [property, pseudo] as const)

/** Resolves a CSS colour (a role variable or a system colour) the way the page computes it. */
const resolveColor = (page: Page, value: string) => page.evaluate((color) => {
  const probe = document.createElement('div')
  probe.style.color = color
  document.body.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}, value)

/** Presses Tab until the element with this `data-test` holds focus. */
async function tabTo(page: Page, id: string) {
  for (let step = 0; step < 60; step++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
    if (focused === id) return
  }
  throw new Error(`Tab never reached ${id}`)
}

test.describe('MCard', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'card/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'card/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'card/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  // A11-01: the article is named by its title.
  test('a static card is an article named by its heading', async ({ page }) => {
    await openFixture(page, 'card/matrix')

    await expect(page.getByRole('article', { name: 'Static elevated', exact: true })).toBeVisible()
    await expect(page.getByTestId('static-elevated').getByRole('heading', { level: 3 })).toHaveText('Static elevated')
  })

  // ST-01, TH-08: no layer, no hover elevation, no transition on a static card.
  test('a static card does not react to the pointer', async ({ page }) => {
    await openFixture(page, 'card/matrix')

    for (const variant of VARIANTS) {
      const card = page.getByTestId(`static-${variant}`)
      const shadow = await style(card, 'box-shadow')
      const background = await style(card, 'background-color')

      expect(await style(card, 'transition-duration'), variant).toBe('0s')
      expect(await style(card, 'content', '::before'), variant).toBe('none')

      await card.hover()
      expect(await style(card, 'box-shadow'), variant).toBe(shadow)
      expect(await style(card, 'background-color'), variant).toBe(background)
    }
  })

  test('Tab reaches every enabled link card and skips static and disabled ones', async ({ page }) => {
    await openFixture(page, 'card/matrix')

    // Walk one full Tab cycle: stop at the first card seen twice.
    const reached: string[] = []
    for (let step = 0; step < 120; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
      if (reached.includes(id)) break
      if (id) reached.push(id)
    }

    expect(reached).toEqual(VARIANTS.flatMap(v => [`link-${v}`, `link-media-${v}`]))
  })

  test('Enter on a focused link card follows it', async ({ page }) => {
    await openFixture(page, 'card/matrix')

    await tabTo(page, 'link-elevated')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/card\/stress/)
  })

  test('a link card is named by its title, not by all of its content', async ({ page }) => {
    await openFixture(page, 'card/matrix')

    for (const variant of VARIANTS) {
      await expect(page.getByTestId(`link-${variant}`), variant).toHaveAccessibleName(`Link ${variant}`)
      await expect(page.getByTestId(`link-media-${variant}`), variant).toHaveAccessibleName(`Link ${variant} with media`)
    }
  })

  test('a disabled link card has no destination and stays a link to assistive tech', async ({ page }) => {
    await openFixture(page, 'card/matrix')

    for (const variant of VARIANTS) {
      const card = page.getByTestId(`link-disabled-${variant}`)
      await expect(card, variant).not.toHaveAttribute('href')
      await expect(card, variant).not.toHaveAttribute('tabindex')
      await expect(card, variant).toHaveAttribute('role', 'link')
      await expect(card, variant).toHaveAttribute('aria-disabled', 'true')
      await expect(card, variant).toHaveAccessibleName(`Link ${variant}, disabled`)
    }
  })

  test('the focus ring is drawn on the card itself', async ({ page }) => {
    await openFixture(page, 'card/matrix')
    const card = page.getByTestId('link-elevated')

    await tabTo(page, 'link-elevated')
    await waitForMotion(page)

    expect(Number.parseFloat(await style(card, 'outline-width'))).toBeGreaterThanOrEqual(2)
    expect(await style(card, 'outline-color')).toBe(await resolveColor(page, 'var(--md-sys-color-secondary)'))
    expect(Number.parseFloat(await style(card, 'opacity', '::before'))).toBeCloseTo(0.1, 2)
  })

  test('a focused outlined link card draws its border in on-surface', async ({ page }) => {
    await openFixture(page, 'card/matrix')
    const card = page.getByTestId('link-outlined')
    const rest = await style(card, 'border-top-color')

    await tabTo(page, 'link-outlined')

    expect(rest).toBe(await resolveColor(page, 'var(--md-sys-color-outline-variant)'))
    expect(await style(card, 'border-top-color')).toBe(await resolveColor(page, 'var(--md-sys-color-on-surface)'))
  })

  test('hover raises a link card one level and lays an 8% layer', async ({ page }) => {
    await openFixture(page, 'card/matrix')

    for (const variant of VARIANTS) {
      const card = page.getByTestId(`link-${variant}`)
      const rest = await style(card, 'box-shadow')

      await card.hover()
      await waitForMotion(page)

      expect(await style(card, 'box-shadow'), variant).not.toBe(rest)
      expect(Number.parseFloat(await style(card, 'opacity', '::before')), variant).toBeCloseTo(0.08, 2)
      await page.mouse.move(0, 0)
    }
  })

  test('pressing a link card lays a 12% layer and keeps its shape', async ({ page }) => {
    await openFixture(page, 'card/matrix')
    const card = page.getByTestId('link-filled')
    const radius = await style(card, 'border-top-left-radius')
    const width = (await card.boundingBox())!.width

    await card.hover()
    await page.mouse.down()
    await waitForMotion(page)

    expect(Number.parseFloat(await style(card, 'opacity', '::before'))).toBeCloseTo(0.12, 2)
    expect(await style(card, 'border-top-left-radius')).toBe(radius)
    expect((await card.boundingBox())!.width).toBeCloseTo(width, 0)
    await page.mouse.up()
  })

  test('the focus ring turns Highlight in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'card/matrix')

    await tabTo(page, 'link-elevated')
    expect(await style(page.getByTestId('link-elevated'), 'outline-color')).toBe(await resolveColor(page, 'Highlight'))
  })

  test('cards keep a visible boundary in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'card/matrix')

    for (const variant of VARIANTS) {
      const card = page.getByTestId(`static-${variant}`)
      expect(await style(card, 'border-top-style'), variant).toBe('solid')
      expect(await style(card, 'border-top-color'), variant).not.toBe('rgba(0, 0, 0, 0)')
    }
  })

  // CT-09: the box is reserved before the image arrives and tinted while it is missing.
  test('the media box keeps its aspect ratio and placeholder tone', async ({ page }) => {
    await openFixture(page, 'card/stress')
    const media = page.getByTestId('broken-media').locator('.ui-card__media')

    const box = (await media.boundingBox())!
    expect(box.width / box.height).toBeCloseTo(16 / 9, 1)
    expect(await style(media, 'background-color')).toBe(await resolveColor(page, 'var(--md-sys-color-surface-container-highest)'))
  })

  // IN-05: the media clips its corners at rest and lets a focus ring through.
  test('a focus ring inside the media is not clipped', async ({ page }) => {
    await openFixture(page, 'card/stress')
    const media = page.getByTestId('media-link').locator('.ui-card__media')
    const rem = await rootRem(page)

    expect(Number.parseFloat(await style(media, 'overflow-clip-margin'))).toBe(0)
    await tabTo(page, 'media-link-anchor')
    // The kit's ring: 3 wide at an offset of 2.
    expect(Number.parseFloat(await style(media, 'overflow-clip-margin')) / rem).toBeCloseTo(5, 0)
  })

  // CT-04: an unbroken string wraps inside the card instead of widening its column.
  test('an unbroken word wraps inside the card', async ({ page }) => {
    await openFixture(page, 'card/stress')
    const card = page.getByTestId('long-word')
    const neighbour = page.getByTestId('broken-media')

    expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    expect((await card.boundingBox())!.width).toBeCloseTo((await neighbour.boundingBox())!.width, 0)
  })

  // CT-07: a lone subhead renders, and an empty body leaves no gap.
  test('a subhead renders alone and an empty body leaves no gap', async ({ page }) => {
    await openFixture(page, 'card/stress')
    const rem = await rootRem(page)

    await expect(page.getByTestId('subhead-only').locator('.ui-card__subtitle')).toHaveText('Only a subhead, no title')

    const empty = page.getByTestId('empty-body')
    await expect(empty.locator('.ui-card__content')).toHaveCount(0)
    const header = (await empty.locator('.ui-card__header').boundingBox())!
    const actions = (await empty.locator('.ui-card__actions').boundingBox())!
    // The card gap (12) plus the actions' own margin (8), nothing more.
    expect((actions.y - (header.y + header.height)) / rem).toBeCloseTo(20, 0)
  })

  // RS-01: actions wrap onto a second row inside a narrow card.
  test('five actions wrap inside a 280 card', async ({ page }) => {
    await openFixture(page, 'card/stress')
    const card = page.getByTestId('five-actions')
    const cardBox = (await card.boundingBox())!
    const buttons = card.locator('.ui-card__actions button')

    for (let index = 0; index < await buttons.count(); index++) {
      const box = (await buttons.nth(index).boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(cardBox.x)
      expect(box.x + box.width).toBeLessThanOrEqual(cardBox.x + cardBox.width)
    }
    const first = (await buttons.first().boundingBox())!
    const last = (await buttons.last().boundingBox())!
    expect(last.y).toBeGreaterThan(first.y)
  })

  // The dev server reports it; CI serves a production build, where dev
  // warnings are compiled out.
  test('a link card with actions still renders them and warns in dev', async ({ page }) => {
    test.skip(Boolean(process.env.CI), 'dev-only warning; CI runs a production build')

    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })
    await openFixture(page, 'card/stress')

    await page.getByTestId('toggle-invalid').check()
    const card = page.getByTestId('link-with-actions')
    await expect(card.locator('.ui-card__actions').getByRole('button', { name: 'Share' })).toBeVisible()
    await expect.poll(() => warnings.some(text => text.includes('[m-card]') && text.includes('interactive content'))).toBe(true)
  })
})
