import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { openFixture, waitForMotion } from '../../e2e/support'

/** The computed colour of a CSS colour expression, resolved next to `near` (inside its theme). */
const resolveColor = (near: Locator, value: string) => near.evaluate((el, color) => {
  const probe = document.createElement('span')
  probe.style.color = color
  el.parentElement!.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}, value)

test.describe('Button family · sweep regressions', () => {
  // B8.1: the role-less fallback (`--current`) also caught a selected text toggle, which
  // then had no colour of its own; selected, a standard icon button wears its role.
  test('a selected standard icon toggle without a role wears primary, unselected it inherits', async ({ page }) => {
    await openFixture(page, 'button/family')
    const button = page.getByTestId('icon-toggle-round-text')
    const color = () => button.evaluate(el => getComputedStyle(el).color)
    const inherited = await button.evaluate(el => getComputedStyle(el.parentElement!).color)

    expect(await color()).toBe(inherited)

    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await waitForMotion(page)

    expect(await color()).toBe(await resolveColor(button, 'var(--md-sys-color-primary)'))
  })

  // N.4: an ancestor with `overflow-wrap: anywhere` (a table cell, a timeline item) shrank
  // each 1fr column to one glyph, so labels broke mid-word instead of the row scrolling.
  test('segment labels never break mid-word under an ancestor that breaks anywhere', async ({ page }) => {
    await openFixture(page, 'button/stress')
    const group = page.getByTestId('segmented-anywhere')
    const broken = await group.locator('.ui-segmented-button__label').evaluateAll(labels => labels.filter((label) => {
      const range = document.createRange()
      range.selectNodeContents(label)
      const lines = new Set(Array.from(range.getClientRects(), rect => Math.round(rect.top))).size
      return lines > label.textContent!.trim().split(/\s+/).length
    }).length)

    expect(broken).toBe(0)
    expect(await group.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
  })
})
