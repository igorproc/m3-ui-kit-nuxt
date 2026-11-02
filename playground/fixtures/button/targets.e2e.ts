import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { openFixture } from '../../e2e/support'

/**
 * Whether a point `dx`/`dy` rem from the centre of `target` lands on it. The pointer
 * target is an invisible pseudo-element, so `elementFromPoint` returns the control; the
 * control is scrolled to the middle first, as `elementFromPoint` sees only the viewport.
 */
const reaches = (target: Locator, dx: number, dy: number) => target.evaluate((el, [x, y]) => {
  el.scrollIntoView({ block: 'center', inline: 'center' })
  const box = el.getBoundingClientRect()
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  const hit = document.elementFromPoint(box.left + box.width / 2 + x! * rem, box.top + box.height / 2 + y! * rem)
  return hit === el || el.contains(hit)
}, [dx, dy])

// S8: a control drawn under 48 takes a 48 target on a coarse pointer only (modern-web,
// accessibility §Touch targets); a mouse keeps the drawn box, so neighbours keep their clicks.
test.describe('Button family · 48 pointer target on touch', () => {
  // At 1920 one rem is one CSS pixel, so the 2–4 rem margins below are not lost to hit-test rounding.
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 1920, height: 1080 } })

  test('a compact button reaches 8 past its 32 edge, not 10', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const button = page.getByTestId('density-compact-round')

    expect(await reaches(button, 0, -16 - 7.5)).toBe(true)
    expect(await reaches(button, 0, -16 - 10)).toBe(false)
  })

  for (const id of ['icon-compact-narrow', 'icon-default-narrow']) {
    test(`${id} answers across 48 on both axes`, async ({ page }) => {
      await openFixture(page, 'button/family')
      const button = page.getByTestId(id)

      expect(await reaches(button, 0, -23)).toBe(true)
      expect(await reaches(button, -23, 0)).toBe(true)
      expect(await reaches(button, 0, -26)).toBe(false)
    })
  }

  // B8.2a: `overflow: hidden` on the FAB roots clipped the target away.
  test('a compact FAB (40) answers across 48 on both axes', async ({ page }) => {
    await openFixture(page, 'button/family')
    const fab = page.getByTestId('fab-density-compact')

    expect(await reaches(fab, 0, -22)).toBe(true)
    expect(await reaches(fab, -22, 0)).toBe(true)
    expect(await reaches(fab, 0, -26)).toBe(false)
  })

  test('a compact extended FAB (40 tall) answers 4 past its edges', async ({ page }) => {
    await openFixture(page, 'button/family')
    const fab = page.getByTestId('extended-density-compact')

    expect(await reaches(fab, 0, -22)).toBe(true)
    expect(await reaches(fab, 0, 22)).toBe(true)
    expect(await reaches(fab, 0, -26)).toBe(false)
  })

  // Q40-Б: neighbours sit 2 apart, so the target of an icon-only group button grows only
  // along the block axis and never takes a press meant for the next button.
  test('an icon-only button in a group grows to 48 in the block axis only', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')
    const [first, second] = await page.getByTestId('group-icons').locator('.ui-button-group__item').all()

    expect(await reaches(first!, 0, -22)).toBe(true)
    expect(await reaches(first!, 0, 22)).toBe(true)
    expect(await reaches(first!, 0, -26)).toBe(false)
    expect(await reaches(first!, 21, 0)).toBe(false)
    expect(await reaches(second!, -21, 0)).toBe(false)
    expect(await first!.evaluate(el => getComputedStyle(el, '::after').insetInlineStart)).toBe('0px')
  })
})

test.describe('Button family · fine pointer', () => {
  test('a compact button and an icon button answer only inside their drawn box', async ({ page }) => {
    await openFixture(page, 'button/family')

    expect(await reaches(page.getByTestId('icon-compact-narrow'), 0, -18)).toBe(false)
    expect(await reaches(page.getByTestId('fab-density-compact'), 0, -22)).toBe(false)
  })
})
