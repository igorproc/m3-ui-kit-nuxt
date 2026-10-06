import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const VARIANTS = ['filled', 'outlined'] as const

/** `data-test` falls through to the native textarea; the field's root is its ancestor. */
const root = (textarea: Locator) => textarea.locator('xpath=ancestor::div[contains(@class, "ui-textarea ")][1]')

/** Both shapes colour the control's border (the outline inherits it). */
const edge = (textarea: Locator) => root(textarea).locator('.ui-textarea__control')
  .evaluate(el => getComputedStyle(el).borderBottomColor)

test.describe('MTextarea', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'textarea/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'textarea/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'textarea/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('Tab reaches enabled, read-only and invalid fields and the grip, and skips disabled ones', async ({ page }) => {
    await openFixture(page, 'textarea/matrix')

    const reached: string[] = []
    for (let step = 0; step < 60; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => {
        const el = document.activeElement
        return el?.getAttribute('data-test') ?? (el?.getAttribute('role') === 'separator' ? 'grip' : '')
      })
      if (id !== 'grip' && reached.includes(id)) break
      if (id) reached.push(id)
    }

    for (const variant of VARIANTS) {
      expect(reached).toContain(`enabled-${variant}`)
      expect(reached).toContain(`readonly-${variant}`)
      expect(reached).toContain(`error-${variant}`)
      expect(reached).not.toContain(`disabled-${variant}`)
    }
    // One grip per enabled resizable field; the disabled field's grip stays out.
    expect(reached.filter(id => id === 'grip')).toHaveLength(2)
  })

  test('arrow keys on the grip change the height in rows', async ({ page }) => {
    await openFixture(page, 'textarea/matrix')
    const grip = root(page.getByTestId('resizable-filled')).getByRole('separator', { name: 'Resize notes' })
    const textarea = page.getByTestId('resizable-filled')
    const before = (await textarea.boundingBox())!.height

    await grip.focus()
    await page.keyboard.press('ArrowDown')

    await expect(grip).toHaveAttribute('aria-valuenow', '3')
    await expect.poll(async () => (await textarea.boundingBox())!.height).toBeGreaterThan(before)
  })

  test('the grip target is at least 24 high', async ({ page }) => {
    await openFixture(page, 'textarea/matrix')
    const grip = root(page.getByTestId('resizable-filled')).locator('.ui-textarea__grip')
    const [hit, reference] = await grip.evaluate((el) => {
      const probe = document.createElement('div')
      probe.style.height = '24rem'
      document.body.append(probe)
      const size = probe.getBoundingClientRect().height
      probe.remove()
      return [Number.parseFloat(getComputedStyle(el, '::before').height), size]
    })

    expect(hit).toBeGreaterThanOrEqual(reference - 0.01)
  })

  for (const variant of VARIANTS) {
    test(`focus changes the ${variant} edge, also in error and read-only`, async ({ page }) => {
      await openFixture(page, 'textarea/matrix')

      for (const state of ['enabled', 'error', 'readonly']) {
        const textarea = page.getByTestId(`${state}-${variant}`)
        const resting = await edge(textarea)
        await textarea.focus()
        await expect.poll(() => edge(textarea), `${state}-${variant}`).not.toBe(resting)
        await textarea.blur()
      }
    })
  }

  test('a read-only field shows focus in its label too', async ({ page }) => {
    await openFixture(page, 'textarea/matrix')
    const textarea = page.getByTestId('readonly-outlined')
    const label = root(textarea).locator('.ui-textarea__label')
    const resting = await label.evaluate(el => getComputedStyle(el).color)

    await textarea.focus()
    await expect.poll(() => label.evaluate(el => getComputedStyle(el).color)).not.toBe(resting)
  })

  test('the alert region exists before the error and receives it', async ({ page }) => {
    await openFixture(page, 'textarea/stress')
    const field = root(page.getByTestId('toggle-field'))
    const region = field.locator('[role="alert"]')
    const fieldHeight = (await field.boundingBox())!.height

    await expect(region).toHaveCount(1)
    await expect(region).toHaveText('')

    await page.getByTestId('toggle-error').click()

    await expect(region).toHaveText('Write at least a sentence')
    expect((await field.boundingBox())!.height).toBeCloseTo(fieldHeight, 0)
  })

  test('the counter speaks only near the limit, through a region already mounted', async ({ page }) => {
    await openFixture(page, 'textarea/stress')
    const textarea = page.getByTestId('near-limit')
    const live = root(textarea).locator('.ui-textarea__counter-live')

    await expect(live).toHaveAttribute('aria-live', 'polite')
    await textarea.fill('short')
    await expect(live).toHaveText('')

    await textarea.fill('a'.repeat(31))
    await expect(live).toHaveText('31 / 40')
  })

  test('a long label wraps above the box and a long word wraps in the message', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'textarea/stress')

    const label = root(page.getByTestId('long-label')).locator('.ui-textarea__label')
    expect(await label.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)

    for (const id of ['long-word-helper', 'long-word-error']) {
      const message = root(page.getByTestId(id)).locator('.ui-textarea__message')
      expect(await message.evaluate(el => el.scrollWidth - el.clientWidth), id).toBeLessThanOrEqual(0)
    }
  })

  test('a disabled grip takes the disabled ink', async ({ page }) => {
    await openFixture(page, 'textarea/matrix')
    const colour = (id: string) => root(page.getByTestId(id)).locator('.ui-textarea__grip')
      .evaluate(el => getComputedStyle(el).backgroundColor)

    expect(await colour('disabled-filled')).not.toBe(await colour('resizable-filled'))
  })

  test('forced colors: focus is Highlight even read-only, and error is a dashed edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'textarea/matrix')

    const dashed = await root(page.getByTestId('error-filled')).locator('.ui-textarea__control')
      .evaluate(el => getComputedStyle(el).borderBottomStyle)
    expect(dashed).toBe('dashed')

    const textarea = page.getByTestId('readonly-outlined')
    const outline = root(textarea).locator('.ui-textarea__outline')
    const resting = await outline.evaluate(el => getComputedStyle(el).borderTopColor)
    await textarea.focus()
    await expect.poll(() => outline.evaluate(el => getComputedStyle(el).borderTopColor)).not.toBe(resting)
  })
})
