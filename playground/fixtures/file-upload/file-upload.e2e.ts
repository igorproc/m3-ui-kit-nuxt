import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'
import { traceMotion } from '../../e2e/probe'

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

  test('the picker is one native input out of sight: the dropzone button opens it', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'enabled')

    await expect(zone.locator('input[type="file"]')).toHaveCount(1)
    await expect(zone.locator('.ui-file-input')).toHaveCount(0)

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

test.describe('MFileUpload · the queue holds still (M3-polish)', () => {
  test('the server starts no upload and the page hydrates without a mismatch', async ({ page }) => {
    const html = await (await page.request.get('/file-upload/matrix')).text()
    expect(html.match(/ui-file-upload__item--uploading/g)).toBeNull()

    const warnings: string[] = []
    page.on('console', (message) => {
      if (/hydrat/i.test(message.text())) warnings.push(message.text().slice(0, 200))
    })
    await openFixture(page, 'file-upload/matrix')
    await expect(group(page, 'auto').getByRole('listitem').filter({ hasText: 'done.pdf' })).toContainText('Uploaded')
    expect(warnings).toEqual([])
  })

  test('removing a row slides the next one up instead of making it jump', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const rows = '[data-test="enabled"] .ui-file-upload__item'

    const trace = await traceMotion(page, {
      targets: { next: `${rows}:nth-child(2)` },
      duration: 600,
      act: () => page.getByRole('button', { name: 'Remove contract.pdf' }).click(),
    })

    // A slide, not a snap: no single frame carries most of the way (an ease-out
    // curve front-loads its steps, so the median rule of analyzeMotion is too tight here).
    const ys = trace.frames.map(frame => frame.rects.next?.y).filter((y): y is number => y !== undefined)
    const steps = ys.slice(1).map((y, index) => Math.abs(y - ys[index]!))
    const total = Math.abs(ys.at(-1)! - ys[0]!)
    expect(total).toBeGreaterThan(0)
    expect(Math.max(...steps)).toBeLessThan(total / 2)
  })

  test('the last row fades out before the empty state comes', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    await page.getByRole('button', { name: 'Remove contract.pdf' }).click()
    await waitForMotion(page)

    const trace = await traceMotion(page, {
      targets: { row: '[data-test="enabled"] .ui-file-upload__item' },
      styles: ['opacity'],
      duration: 600,
      act: () => page.getByRole('button', { name: /^Remove a_very_long/ }).click(),
    })
    const opacities = trace.frames.map(frame => Number(frame.styles.row?.opacity ?? Number.NaN)).filter(value => !Number.isNaN(value))
    expect(opacities.some(value => value > 0 && value < 1)).toBe(true)
    await expect(group(page, 'enabled')).toContainText('Nothing chosen yet')
  })

  test('a row is as tall uploading as waiting or done', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'auto')
    await expect(zone.getByRole('listitem').filter({ hasText: 'done.pdf' })).toContainText('Uploaded')

    const height = (name: string) => zone.getByRole('listitem').filter({ hasText: name }).evaluate(el => el.getBoundingClientRect().height)
    expect(await height('hang-scan')).toBeCloseTo(await height('done.pdf'), 1)
  })

  test('the start-all action stays when nothing is left to start, off and as wide as its label', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = group(page, 'enabled')
    const start = zone.getByRole('button', { name: 'Start uploads' })

    await start.click()
    await expect(zone.getByRole('listitem').first()).toContainText('Uploaded')
    await expect(start).toBeDisabled()
    const [button, list] = await Promise.all([start.boundingBox(), zone.locator('.ui-file-upload__list').boundingBox()])
    expect(button!.width).toBeLessThan(list!.width)
  })

  test('a dragged file it takes is told by a solid edge, not by colour alone', async ({ page }) => {
    await openFixture(page, 'file-upload/matrix')
    const zone = '[data-test="enabled"] .ui-file-upload__dropzone'
    await page.evaluate((selector) => {
      const transfer = new DataTransfer()
      transfer.items.add(new File(['%PDF'], 'scan.pdf', { type: 'application/pdf' }))
      document.querySelector(selector)!.dispatchEvent(new DragEvent('dragenter', { dataTransfer: transfer, bubbles: true, cancelable: true }))
    }, zone)
    await waitForMotion(page)

    const look = await page.locator(zone).evaluate(el => ({ style: getComputedStyle(el).borderTopStyle, ink: getComputedStyle(el).color }))
    expect(look.style).toBe('solid')
    const button = await page.locator(`${zone} .ui-file-upload__choose`).evaluate(el => getComputedStyle(el).color)
    expect(button).toBe(look.ink)
  })

  test('a required control with files from its model lets the form go', async ({ page }) => {
    await openFixture(page, 'file-upload/cases')

    await expect.poll(() => page.locator('[data-test="form"]').evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(true)
    await page.getByTestId('submit').click()
    await expect(page.getByTestId('submits')).toHaveText('1')
  })
})
