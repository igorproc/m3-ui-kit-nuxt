import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

test.describe('MFormRenderer', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`every field type has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'form-renderer/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'form-renderer/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'form-renderer/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a configured form warns about nothing in development', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning' && /\[m-(?:form-renderer|radio-group|number-input)\]/.test(message.text())) warnings.push(message.text())
    })

    await openFixture(page, 'form-renderer/matrix')

    expect(warnings).toEqual([])
  })

  test('the radio field is a radiogroup named by its legend', async ({ page }) => {
    await openFixture(page, 'form-renderer/matrix')

    await expect(page.getByRole('radiogroup', { name: 'Size' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'More' })).toBeVisible()
  })

  test('an empty submit focuses the summary; its links lead to the fields', async ({ page }) => {
    await openFixture(page, 'form-renderer/matrix')
    const summary = page.locator('.ui-form-renderer-summary')

    await page.getByRole('button', { name: 'Save' }).click()

    await expect(summary).toBeFocused()
    await expect(summary).toContainText('Fix these before saving')
    await expect(summary.getByRole('link')).toHaveText(['Name: Enter your name', 'Size: Choose a size'])
    await expectNoAxeViolations(page)

    await page.keyboard.press('Tab')
    await expect(summary.getByRole('link', { name: 'Name: Enter your name' })).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('radio', { name: 'Small' })).toBeFocused()

    await summary.getByRole('link', { name: 'Name: Enter your name' }).click()
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused()
  })

  test('a passing submit is busy while it runs, clears the summary and says the result', async ({ page }) => {
    await openFixture(page, 'form-renderer/matrix')
    const form = page.getByTestId('form')
    const status = form.getByRole('status').and(page.locator('.ui-form-renderer__status'))

    await expect(status).toHaveText('')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.ui-form-renderer-summary')).toBeVisible()

    await page.getByRole('textbox', { name: 'Name' }).fill('Ada')
    await page.getByText('Medium', { exact: true }).click()
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(form).toHaveAttribute('aria-busy', 'true')
    await expectNoAxeViolations(page)
    await expect(form).not.toHaveAttribute('aria-busy')
    await expect(status).toHaveText('Saved')
    await expect(page.locator('.ui-form-renderer-summary')).toHaveCount(0)
    await expect(page.getByTestId('values')).toContainText('"name":"Ada"')
  })

  test('the status region is in the server frame before anything happens', async ({ request }) => {
    const html = await (await request.get('/form-renderer/matrix')).text()

    expect(html).toMatch(/class="ui-form-renderer__status" role="status"/)
  })
})
