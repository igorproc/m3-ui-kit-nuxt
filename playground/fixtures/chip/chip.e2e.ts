import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

test.describe('MChip', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'chip/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('a standalone filter chip is a toggle button', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const chip = page.getByTestId('filter-off')

    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await chip.click()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('type-assist')).not.toHaveAttribute('aria-pressed')
  })

  test('the selected label takes on-secondary-container, the role of its container', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const [label, role] = await page.getByTestId('filter-on').evaluate((el) => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--md-sys-color-on-secondary-container)'
      document.body.append(probe)
      const value = [getComputedStyle(el).color, getComputedStyle(probe).color]
      probe.remove()
      return value
    })

    expect(label).toBe(role)
  })

  test('a pressed chip does not move', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const chip = page.getByTestId('filter-off')
    const before = (await chip.boundingBox())!

    await chip.hover()
    await page.mouse.down()
    await waitForMotion(page)
    const pressed = (await chip.boundingBox())!
    await page.mouse.up()

    expect(pressed.y).toBeCloseTo(before.y, 1)
    expect(pressed.x).toBeCloseTo(before.x, 1)
  })

  test('the press shows on the state layer, not on the container', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const chip = page.getByTestId('filter-off')
    const rest = await chip.evaluate(el => getComputedStyle(el).backgroundColor)

    await chip.hover()
    await page.mouse.down()
    await waitForMotion(page)
    const [container, layer] = await chip.evaluate(el => [getComputedStyle(el).backgroundColor, Number(getComputedStyle(el, '::before').opacity)])
    await page.mouse.up()

    expect(container).toBe(rest)
    expect(layer).toBeGreaterThan(0)
  })

  test('a cut-off label shows its full text in a tooltip on hover, and the chip does not move', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const chip = page.getByTestId('cut')
    const before = (await chip.boundingBox())!

    expect(await chip.locator('.ui-chip__label').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
    await expect(chip.locator('.ui-tooltip')).toHaveCount(0)

    await chip.hover()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveText('Electronics, gadgets and accessories')

    const after = (await chip.boundingBox())!
    expect(after.width).toBeCloseTo(before.width, 1)
    expect(after.height).toBeCloseTo(before.height, 1)

    await page.mouse.move(0, 0)
    await expect(tooltip).toBeHidden()
  })

  test('a label that fits shows no tooltip', async ({ page }) => {
    await openFixture(page, 'chip/matrix')

    await page.getByTestId('fits').hover()
    await page.waitForTimeout(200)

    await expect(page.getByTestId('fits').locator('.ui-tooltip')).toHaveCount(0)
  })

  test('the outline is never thinner than one device pixel', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'chip/matrix')

    const width = await page.getByTestId('type-assist').evaluate(el => Number.parseFloat(getComputedStyle(el).borderTopWidth))

    expect(width).toBeGreaterThanOrEqual(1)
  })

  for (const dir of DIRECTIONS) {
    test(`stress content has no axe violations (${dir})`, async ({ page }) => {
      await openFixture(page, 'chip/stress', { dir })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'chip/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a long label stays on one line and is cut, the chip keeps its height', async ({ page }) => {
    await openFixture(page, 'chip/stress')
    const rem = await remInPx(page)

    for (const id of ['long-text', 'long-word', 'long-input']) {
      const chip = page.locator(`.ui-chip:has([data-test="${id}"]), [data-test="${id}"].ui-chip`).first()
      const box = (await chip.boundingBox())!
      const cut = await chip.locator('.ui-chip__label').evaluate(el => el.scrollWidth > el.clientWidth)

      expect(box.height / rem, id).toBeCloseTo(32, 0)
      expect(box.width / rem, id).toBeLessThanOrEqual(201)
      expect(cut, id).toBe(true)
    }
  })

  test('an elevated chip is raised on a container fill, a disabled one is flat', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const look = (id: string) => page.getByTestId(id).evaluate(el => ({ shadow: getComputedStyle(el).boxShadow, fill: getComputedStyle(el).backgroundColor }))

    const raised = await look('elevated-assist')
    expect(raised.shadow).not.toBe('none')
    expect(raised.fill).not.toBe('rgba(0, 0, 0, 0)')
    expect((await look('elevated-disabled')).shadow).toBe('none')
    expect((await look('type-assist')).shadow).toBe('none')
  })

  test('an input chip moves between its two actions with arrows and removes itself with Enter', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const action = page.getByTestId('input-Anna')
    const remove = page.getByRole('button', { name: 'Remove Anna' })

    await action.focus()
    await page.keyboard.press('ArrowRight')
    await expect(remove).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(action).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('people')).toHaveText('Boris')
  })

  test('the avatar of an input chip is 24 and decorative', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const avatar = page.locator('.ui-chip:has([data-test="input-Boris"]) .ui-chip__avatar')

    const box = (await avatar.boundingBox())!
    expect(box.height / await remInPx(page)).toBeCloseTo(24, 0)
    await expect(page.getByTestId('input-Boris')).toHaveAccessibleName('Boris')
  })

  test('chips in a scrolling group keep their labels whole instead of shrinking', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const group = page.getByTestId('scroll-group').locator('.ui-chip-group__chips')

    const [scrolls, wrapped] = await group.evaluate(el => [
      el.scrollWidth > el.clientWidth,
      [...el.querySelectorAll('.ui-chip__label')].some(label => label.getBoundingClientRect().height > (label.parentElement!.getBoundingClientRect().height)),
    ])

    expect(scrolls).toBe(true)
    expect(wrapped).toBe(false)
  })
})

test.describe('MChip · touch', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('takes a 48 target on a coarse pointer', async ({ page }) => {
    await openFixture(page, 'chip/matrix')

    const height = await page.getByTestId('type-assist').evaluate((el) => {
      const after = getComputedStyle(el, '::after')
      // The pseudo-element is laid out against the padding box: the border is outside it.
      return el.clientHeight - Number.parseFloat(after.top) - Number.parseFloat(after.bottom)
    })

    expect(height / await remInPx(page)).toBeCloseTo(48, 0)
  })

  test('with a remove button both actions take the 48 target, the wrapper takes none', async ({ page }) => {
    await openFixture(page, 'chip/matrix')
    const rem = await remInPx(page)
    const chip = page.locator('.ui-chip:has([data-test="input-Anna"])')
    const box = (await chip.boundingBox())!
    const removeBox = (await page.getByRole('button', { name: 'Remove Anna' }).boundingBox())!

    expect(await chip.evaluate(el => getComputedStyle(el, '::after').content)).toBe('none')

    const hit = (x: number, y: number) => page.evaluate(([px, py]) => {
      const element = document.elementFromPoint(px!, py!)
      return element?.closest('.ui-chip__action, .ui-chip__remove')?.className ?? element?.className ?? ''
    }, [x, y])

    const above = box.y - 6 * rem
    const below = box.y + box.height + 6 * rem
    expect(await hit(box.x + 12 * rem, above)).toContain('ui-chip__action')
    expect(await hit(box.x + 12 * rem, below)).toContain('ui-chip__action')
    expect(await hit(removeBox.x + removeBox.width / 2, above)).toContain('ui-chip__remove')

    const target = await page.getByRole('button', { name: 'Remove Anna' }).evaluate((el) => {
      const after = getComputedStyle(el, '::after')
      return el.getBoundingClientRect().height - Number.parseFloat(after.top) - Number.parseFloat(after.bottom)
    })
    expect(target / rem).toBeCloseTo(48, 0)

    await page.touchscreen.tap(box.x + 12 * rem, above)
    await expect(page.getByTestId('people')).toHaveText('Anna, Boris')
    await page.touchscreen.tap(removeBox.x + removeBox.width / 2, above)
    await expect(page.getByTestId('people')).toHaveText('Boris')
  })
})
