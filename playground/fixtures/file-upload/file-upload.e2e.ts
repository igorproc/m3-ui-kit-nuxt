import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

/** `data-test` lands on the group root. */
const group = (page: import('@playwright/test').Page, id: string) => page.locator(`[data-test="${id}"]`)

test.describe('MFileUpload', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'file-upload/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'file-upload/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'file-upload/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('the control is a named group with its limits as the description', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')

    await expect(page.getByRole('group', { name: 'Attachments', exact: true })).toHaveAccessibleDescription('PDF or PNG, up to 1 KB')
  })

  test('the picker is one, and hidden: the dropzone button opens it', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'enabled')

    await expect(zone.locator('input[type="file"]')).toHaveCount(1)
    await expect(zone.locator('.ui-file-input')).toBeHidden()

    const chooser = page.waitForEvent('filechooser')
    await zone.getByRole('button', { name: 'Choose files' }).click()
    await (await chooser).setFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') })

    await expect(zone.getByRole('listitem')).toHaveCount(3)
  })

  test('a refused file is explained right under the dropzone', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'enabled')

    await zone.locator('input[type="file"]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') })

    await expect(zone.getByRole('alert')).toHaveText('notes.txt: type not allowed')
  })

  test('auto-start runs the files that were already there, and says why one failed', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'auto')

    await expect(zone.getByRole('listitem').filter({ hasText: 'hang-scan' })).toContainText('Uploading')
    await expect(zone.getByRole('listitem').filter({ hasText: 'fail-scan' })).toContainText('network error')
    await expect(zone.getByRole('listitem').filter({ hasText: 'done.pdf' })).toContainText('Uploaded')
  })

  test('a long name shortens its stem and keeps the extension', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const row = group(page, 'enabled').getByRole('listitem').filter({ hasText: 'a_very_long' })

    const [stem, extension] = await Promise.all([
      row.locator('.ui-file-upload__item-stem').evaluate(el => el.scrollWidth > el.clientWidth),
      row.locator('.ui-file-upload__item-extension').isVisible(),
    ])
    expect(stem).toBe(true)
    expect(extension).toBe(true)
  })

  test('removing a row hands focus to the next one, then to the dropzone', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'enabled')

    await zone.getByRole('button', { name: 'Remove contract.pdf' }).focus()
    await page.keyboard.press('Enter')
    // The next row's first live action.
    await expect(zone.getByRole('button', { name: /^Start a_very_long/ })).toBeFocused()

    await zone.getByRole('button', { name: /^Remove a_very_long/ }).focus()
    await page.keyboard.press('Enter')
    await expect(zone.getByRole('button', { name: 'Choose files' })).toBeFocused()
  })

  test('emptying the model from outside empties the queue', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')

    await page.getByTestId('reset').click()

    await expect(group(page, 'enabled').getByRole('listitem')).toHaveCount(0)
    await expect(group(page, 'enabled')).toContainText('Nothing chosen yet')
  })

  test('a disabled control disables every row action too', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')

    for (const button of await group(page, 'disabled').getByRole('button').all()) {
      await expect(button).toBeDisabled()
    }
  })

  test('a long queue scrolls inside itself and brings a focused row into view', async ({ page }) => {
    await openFixture(page, 'file-upload/stress')
    const list = group(page, 'many').getByRole('list')

    const [visible, total] = await list.evaluate(el => [el.clientHeight, el.scrollHeight])
    expect(visible / await remInPx(page)).toBeLessThanOrEqual(320 + 1)
    expect(total).toBeGreaterThan(visible)

    const last = group(page, 'many').getByRole('button', { name: /^Remove scan_099/ })
    await last.focus()
    const [button, view] = await Promise.all([last.boundingBox(), list.boundingBox()])
    expect(button!.y).toBeGreaterThanOrEqual(view!.y)
    expect(button!.y + button!.height).toBeLessThanOrEqual(view!.y + view!.height)
  })

  test('a disabled control is announced as a disabled group', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')

    await expect(group(page, 'disabled')).toHaveAttribute('aria-disabled', 'true')
    await expect(group(page, 'enabled')).not.toHaveAttribute('aria-disabled')
  })

  test('without messages the control says nothing in English', async ({ page }) => {
    await openFixture(page, 'file-upload/stress')

    await expect(group(page, 'silent')).not.toContainText(/files|Drop|Choose|selected/i)
  })

  test('forced colors: a dragging zone keeps a visible edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'enabled').locator('.ui-file-upload__dropzone')

    await zone.evaluate(el => el.classList.add('ui-file-upload__dropzone--accepting'))
    expect(await zone.evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
  })
})
