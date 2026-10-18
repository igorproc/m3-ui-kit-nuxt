import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export const THEMES = ['light', 'dark'] as const
export const DIRECTIONS = ['ltr', 'rtl'] as const
export const WIDTHS = [360, 768, 1366] as const

export type FixtureTheme = typeof THEMES[number]
export type FixtureDirection = typeof DIRECTIONS[number]

interface OpenOptions {
  theme?: FixtureTheme
  dir?: FixtureDirection
}

/** Opens `playground/fixtures/<key>.vue` and waits until the fixture has hydrated. */
export async function openFixture(page: Page, key: string, { theme = 'light', dir = 'ltr' }: OpenOptions = {}) {
  await page.goto(`/${key}?theme=${theme}&dir=${dir}`)
  await page.locator('[data-fixture-ready]').waitFor()
}

/**
 * WCAG 2.2 A/AA rules only; every violation is listed with its offending selectors.
 *
 * Text inside a disabled kit component (its root carries a `--disabled` modifier) is exempt from
 * `color-contrast`: WCAG 1.4.3 excludes inactive components, but axe only knows it for text
 * inside a `disabled` / `aria-disabled` element, not for a field's helper line at 38%.
 */
export async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    // Dev-server-only overlay, not part of the kit.
    .exclude('nuxt-devtools-frame')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  const reported: string[] = []
  for (const violation of violations) {
    const nodes = violation.id === 'color-contrast'
      ? await withoutInactive(page, violation.nodes)
      : violation.nodes
    if (nodes.length) reported.push(`${violation.id}: ${nodes.map(node => node.target.join(' ')).join(' | ')}`)
  }

  expect(reported).toEqual([])
}

async function withoutInactive<T extends { target: unknown[] }>(page: Page, nodes: T[]) {
  const inactive = await page.evaluate(selectors => selectors.map(selector =>
    Boolean(document.querySelector(selector)?.closest('[class*="--disabled"]'))), nodes.map(node => node.target.join(' ')))

  return nodes.filter((_, index) => !inactive[index])
}

/**
 * Waits until every finite, time-driven CSS transition and animation has finished. Spinners loop
 * forever, and a scroll-driven animation (the table's edge fade) runs for the page's whole life.
 */
export async function waitForMotion(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every(animation =>
    animation.playState !== 'running'
    || animation.effect?.getTiming().iterations === Infinity
    || !(animation.timeline instanceof DocumentTimeline)))
}

/**
 * CSS pixels in one `rem`. The kit's root font-size scales with the viewport and `1rem` is one
 * design pixel, so a size from the spec is checked as `box.height / await remInPx(page)`.
 */
export async function remInPx(page: Page) {
  return page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}
