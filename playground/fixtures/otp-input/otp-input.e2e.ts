import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const field = (page: Page, id: string) => page.getByTestId(id)
const input = (page: Page, id: string) => field(page, id).locator('input')
const cells = (page: Page, id: string) => field(page, id).locator('.ui-otp-input__field')
const activeIndex = (page: Page, id: string) => cells(page, id).evaluateAll(list => list.findIndex(cell => cell.classList.contains('ui-otp-input__field--active')))
// Real pointer clicks: in a browser the transparent input above the grid takes them.
async function clickCell(page: Page, id: string, index: number) {
  await cells(page, id).nth(index).scrollIntoViewIfNeeded()
  const box = (await cells(page, id).nth(index).boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}
const expectActive = (page: Page, id: string, index: number) => expect.poll(() => activeIndex(page, id)).toBe(index)
const borderColor = (locator: Locator) => locator.evaluate(el => getComputedStyle(el).borderTopColor)

test.describe('MOtpInput', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'otp-input/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'otp-input/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'otp-input/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('cells shrink inside a narrow container instead of leaving it', async ({ page }) => {
    await openFixture(page, 'otp-input/stress')
    const box = (await field(page, 'narrow').boundingBox())!
    const last = (await cells(page, 'narrow').last().boundingBox())!

    expect(last.x + last.width).toBeLessThanOrEqual(box.x + box.width + 0.5)
  })

  test('asks the platform for a one-time code and the matching keypad', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await expect(input(page, 'empty')).toHaveAttribute('autocomplete', 'one-time-code')
    await expect(input(page, 'empty')).toHaveAttribute('inputmode', 'numeric')
    await expect(input(page, 'empty')).toHaveAttribute('maxlength', '6')
    await expect(input(page, 'alphanumeric')).toHaveAttribute('inputmode', 'text')
    await expect(input(page, 'empty')).toHaveAccessibleName('Code, empty')
    await expect(input(page, 'label-hidden')).toHaveAccessibleName('Code, label-hidden')
  })

  test('typing fills the cells and the active cell follows', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await input(page, 'empty').focus()
    await expectActive(page, 'empty', 0)

    await page.keyboard.type('12a3')

    await expect(input(page, 'empty')).toHaveValue('123')
    await expectActive(page, 'empty', 3)
  })

  test('a pasted code is sanitised and truncated to the length', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openFixture(page, 'otp-input/matrix')
    await page.evaluate(() => navigator.clipboard.writeText('١٢٣-٤٥٦ 789'))

    await input(page, 'empty').focus()
    await page.keyboard.press('ControlOrMeta+V')

    await expect(input(page, 'empty')).toHaveValue('123456')
  })

  test('Backspace walks back across cells', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await input(page, 'filled').focus()
    await page.keyboard.press('End')
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Backspace')

    await expect(input(page, 'filled')).toHaveValue('1234')
    await expectActive(page, 'filled', 4)
  })

  test('arrow keys and Home/End move the active cell', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await input(page, 'filled').focus()
    await page.keyboard.press('End')
    await expectActive(page, 'filled', -1)

    await page.keyboard.press('ArrowLeft')
    await expectActive(page, 'filled', 5)

    await page.keyboard.press('Home')
    await expectActive(page, 'filled', 0)

    await page.keyboard.press('ArrowRight')
    await expectActive(page, 'filled', 1)
  })

  // TS-07: the transparent input lies over the grid and takes the click.
  test('a click lands on the cell under the pointer', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await clickCell(page, 'filled', 2)
    await expectActive(page, 'filled', 2)
    expect(await input(page, 'filled').evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(2)

    await clickCell(page, 'partial', 4)
    await expectActive(page, 'partial', 2)
  })

  test('the active cell is visible and outranks the error', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')
    // Colour, not width: the 2rem ring can round to the 1rem edge on a vw-scaled root.
    const idle = await borderColor(cells(page, 'error-message').nth(1))

    await clickCell(page, 'error-message', 2)

    await expectActive(page, 'error-message', 2)
    await expect.poll(() => borderColor(cells(page, 'error-message').nth(2))).not.toBe(idle)
  })

  test('read-only shows focus but keeps the code', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await clickCell(page, 'readonly', 1)
    await page.keyboard.type('9')

    await expect(input(page, 'readonly')).toHaveValue('123456')
    await expectActive(page, 'readonly', 1)
  })

  test('disabled and loading fields hold their code', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await expect(input(page, 'disabled')).toBeDisabled()
    await expect(input(page, 'loading')).toHaveAttribute('aria-busy', 'true')

    await input(page, 'loading').focus()
    await page.keyboard.press('Backspace')
    await expect(input(page, 'loading')).toHaveValue('123456')
  })

  test('an error after completion is announced from a live region that was already there', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')
    const region = field(page, 'live').getByRole('alert')

    await expect(region).toHaveCount(1)
    await expect(region).toHaveText('')
    const handle = await region.elementHandle()

    await input(page, 'live').focus()
    await page.keyboard.type('123456')

    await expect(page.getByTestId('completions')).toHaveText('1')
    await expect(region).toHaveText('The code is wrong')
    expect(await region.evaluate((el, before) => el === before, handle)).toBe(true)
    await expect(input(page, 'live')).toHaveAttribute('aria-invalid', 'true')
    await expect(input(page, 'live')).toHaveAccessibleDescription('The code is wrong')
  })

  test('an appearing error does not move what follows', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')
    const below = page.getByTestId('completions')
    const top = () => below.evaluate(el => el.getBoundingClientRect().top + window.scrollY)
    const before = await top()

    await input(page, 'live').focus()
    await page.keyboard.type('123456')
    await expect(field(page, 'live').getByRole('alert')).toHaveText('The code is wrong')

    expect(await top()).toBeCloseTo(before, 0)
  })

  test('an error without a message still shows a glyph', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix')

    await expect(field(page, 'error-only').locator('.ui-otp-input__message-icon')).toBeVisible()
  })

  test('the code reads left to right in RTL', async ({ page }) => {
    await openFixture(page, 'otp-input/matrix', { dir: 'rtl' })
    const first = (await cells(page, 'filled').first().boundingBox())!
    const second = (await cells(page, 'filled').nth(1).boundingBox())!

    expect(first.x).toBeLessThan(second.x)
    await expect(cells(page, 'filled').first()).toHaveText('1')
  })

  test('cell states stay distinguishable in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'otp-input/matrix')

    expect(await cells(page, 'error-message').first().evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('dashed')
  })
})
