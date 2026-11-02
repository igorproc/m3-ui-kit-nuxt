import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addOverlayHost, cleanUp, mountDialog } from './helpers'

beforeEach(addOverlayHost)
afterEach(cleanUp)

const overlay = () => document.querySelector<HTMLElement>('.ui-overlay')!

describe('m-dialog-date · a11y', () => {
  it('is a native modal dialog', async () => {
    const view = await mountDialog()
    await view.show()

    expect(overlay().tagName).toBe('DIALOG')
    expect(view.dialog().closest('dialog')).toBe(overlay())
  })

  it('is named by the picker title, and by the input title while typing', async () => {
    const calendar = await mountDialog()
    await calendar.show()
    expect(overlay().getAttribute('aria-label')).toBe('Select date')
    await calendar.hide()
    cleanUp()
    addOverlayHost()

    const typed = await mountDialog({ props: { initialMode: 'input' } })
    await typed.show()
    expect(overlay().getAttribute('aria-label')).toBe('Enter date')
  })

  it('puts the focus on the chosen day as it opens', async () => {
    const view = await mountDialog({ date: new Date(2026, 9, 14) })
    await view.show()

    // The focus moves once the opening transition has ended, which a loaded runner can delay.
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Wednesday, October 14, 2026'))
  })

  it('puts the focus in the typed field when it opens to type', async () => {
    const view = await mountDialog({ props: { initialMode: 'input' } })
    await view.show()

    await vi.waitFor(() => expect(document.activeElement).toBe(view.dialog().querySelector('input[inputmode="numeric"]')))
  })

  it('names its actions with their text', async () => {
    const view = await mountDialog()
    await view.show()

    expect(view.button('Cancel').getAttribute('type')).toBe('button')
    expect(view.button('OK').getAttribute('type')).toBe('button')
  })
})
