import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, openFixture, remInPx } from '../../e2e/support'

const OFFSETS = {
  small: { inline: 6, block: 0 },
  large: { inline: 12, block: -2 },
} as const

type Size = keyof typeof OFFSETS

async function expectAtCorner(page: Page, anchor: Locator, size: Size, dir: typeof DIRECTIONS[number], label: string) {
  const rem = await remInPx(page)
  const icon = (await anchor.boundingBox())!
  const mark = (await anchor.locator('.ui-badge').boundingBox())!
  const start = dir === 'ltr' ? mark.x - icon.x : (icon.x + icon.width) - (mark.x + mark.width)

  expect(Math.abs(start - (icon.width - OFFSETS[size].inline * rem)), `${label}: start`).toBeLessThanOrEqual(1)
  expect(Math.abs(mark.y - (icon.y + OFFSETS[size].block * rem)), `${label}: top`).toBeLessThanOrEqual(1)
}

const CONTENTS = [['dot', 'small'], ['one', 'large'], ['two', 'large'], ['three', 'large'], ['over', 'large'], ['text', 'large']] as const

test.describe('MBadge', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'badge/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const dir of DIRECTIONS) {
    test(`a badge takes the top-end corner of an icon and of an icon button's glyph (${dir})`, async ({ page }) => {
      await openFixture(page, 'badge/matrix', { dir })

      for (const [id, size] of CONTENTS) {
        await expectAtCorner(page, page.getByTestId(`icon-${id}`), size, dir, `icon ${id}`)
        await expectAtCorner(page, page.getByTestId(`button-${id}`).locator('.fixture-badge__anchor'), size, dir, `button ${id}`)
      }
    })

    for (const host of ['bar', 'rail'] as const) {
      test(`a badge takes the top-end corner of a ${host} item's icon (${dir})`, async ({ page }) => {
        await openFixture(page, 'badge/matrix', { dir })

        for (const [name, size] of [['Inbox', 'large'], ['Outbox', 'small'], ['Favorites', 'large']] as const) {
          const icon = page.getByTestId(host).getByRole('button', { name: new RegExp(name) }).locator('.ui-navigation-item__icon')
          await expectAtCorner(page, icon, size, dir, `${host} ${name}`)
        }
      })
    }
  }

  test('an empty value draws nothing at all', async ({ page }) => {
    await openFixture(page, 'badge/matrix')

    await expect(page.getByTestId('icon-empty').locator('.ui-badge')).toHaveCount(0)
    await expect(page.getByTestId('button-empty').locator('.ui-badge')).toHaveCount(0)
  })

  test('a value over max and a long text keep the badge short', async ({ page }) => {
    await openFixture(page, 'badge/matrix')

    await expect(page.getByTestId('icon-over').locator('.ui-badge')).toHaveText('99+')
    const label = page.getByTestId('icon-text').locator('.ui-badge__label')
    expect(await label.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
  })

  test('the large badge and the dot stay visible in forced colours', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'badge/matrix')

    expect(await page.getByTestId('icon-one').locator('.ui-badge').evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
    expect(await page.getByTestId('icon-dot').locator('.ui-badge').evaluate(el => getComputedStyle(el).forcedColorAdjust)).toBe('none')
  })
})
