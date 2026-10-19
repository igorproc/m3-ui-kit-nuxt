import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

/** `data-test` falls through to the field's input; the component root is its ancestor. */
const root = (input: Locator) => input.locator('xpath=ancestor::div[contains(@class, "ui-file-input")][1]')

test.describe('MFileInput', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'file-input/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'file-input/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'file-input/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('the label never sits on the file names', async ({ page }) => {
    await openFixture(page, 'file-input/matrix')
    const input = page.getByTestId('many-filled')
    const label = (await root(input).locator('.ui-text-field__label').boundingBox())!
    // The input box starts under the label by design; the value is the text
    // line inside its padding.
    const valueTop = await input.evaluate((el) => {
      const box = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      const top = Number.parseFloat(style.paddingTop)
      const content = box.height - top - Number.parseFloat(style.paddingBottom)
      return box.top + top + (content - Number.parseFloat(style.lineHeight)) / 2
    })

    await expect(input).toHaveValue('report.pdf, photo.pdf')
    expect(label.y + label.height).toBeLessThanOrEqual(valueTop + 1)
  })

  test('a refused file is named, with the reason, in the support line', async ({ page }) => {
    await openFixture(page, 'file-input/matrix')
    const input = page.getByTestId('empty-filled')

    await root(input).locator('input[type="file"]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') })

    await expect(root(input).getByRole('alert')).toHaveText('notes.txt: not a PDF')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('two browse buttons are told apart by their field', async ({ page }) => {
    await openFixture(page, 'file-input/matrix')

    await expect(root(page.getByTestId('empty-filled')).getByRole('button', { name: 'Browse' }))
      .toHaveAccessibleDescription('Attachment empty filled')
    await expect(root(page.getByTestId('empty-outlined')).getByRole('button', { name: 'Browse' }))
      .toHaveAccessibleDescription('Attachment empty outlined')
  })

  test('a required field says so on the field and on the picker', async ({ page }) => {
    await openFixture(page, 'file-input/matrix')
    const input = page.getByTestId('required-filled')

    await expect(input).toHaveAttribute('aria-required', 'true')
    await expect(root(input).locator('input[type="file"]')).toHaveAttribute('required', '')
  })

  test('read-only and disabled fields keep their files and offer no action', async ({ page }) => {
    await openFixture(page, 'file-input/matrix')

    for (const id of ['readonly-filled', 'disabled-filled']) {
      const buttons = root(page.getByTestId(id)).getByRole('button')
      for (const button of await buttons.all()) await expect(button, id).toBeDisabled()
    }
  })

  test('without a browse label the button is an icon named after the field', async ({ page }) => {
    await openFixture(page, 'file-input/matrix')

    await expect(root(page.getByTestId('icon-only')).getByRole('button', { name: 'Attachment with an icon button' })).toBeVisible()
  })
})

test.describe('MFileInput · the field is the picker (M3-polish)', () => {
  for (const how of ['click', 'Enter', 'Space'] as const) {
    test(`${how} on the field opens the file chooser`, async ({ page }) => {
      await openFixture(page, 'file-input/matrix')
      const input = page.getByTestId('empty-filled')
      const chooser = page.waitForEvent('filechooser', { timeout: 3000 })

      if (how === 'click') {
        const box = (await root(input).locator('.ui-text-field__control').boundingBox())!
        await page.mouse.click(box.x + 8, box.y + box.height / 2)
      } else {
        await input.focus()
        await page.keyboard.press(how)
      }

      await chooser
    })
  }

  test('a required field with a file from its model passes the form; an empty one does not', async ({ page }) => {
    await openFixture(page, 'file-input/cases')
    const missing = (name: string) => page.locator(`input[type="file"][name="${name}"]`).evaluate(el => (el as HTMLInputElement).validity.valueMissing)

    await expect.poll(() => missing('given')).toBe(false)
    expect(await missing('empty')).toBe(true)
  })
})
