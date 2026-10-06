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

/** WCAG 2.2 A/AA rules only; every violation is listed with its offending selectors. */
export async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    // Dev-server-only overlay, not part of the kit.
    .exclude('nuxt-devtools-frame')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(violations.map(v => `${v.id}: ${v.nodes.map(node => node.target.join(' ')).join(' | ')}`)).toEqual([])
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}
