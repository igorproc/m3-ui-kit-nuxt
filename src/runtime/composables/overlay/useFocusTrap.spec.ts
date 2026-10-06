import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useFocusTrap } from './useFocusTrap'

function buildPanel() {
  const outside = document.createElement('button')
  outside.textContent = 'outside'
  const panel = document.createElement('div')
  panel.innerHTML = '<button class="first">first</button><input class="middle"><button class="last">last</button>'
  document.body.append(outside, panel)
  return { outside, panel, first: panel.querySelector<HTMLElement>('.first')!, last: panel.querySelector<HTMLElement>('.last')! }
}

function tab(target: HTMLElement, shiftKey = false) {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useFocusTrap', () => {
  it('moves focus in on activation and returns it on deactivation', async () => {
    const { outside, panel, first } = buildPanel()
    outside.focus()
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(panel))!

    trap.activate()
    expect(document.activeElement).toBe(first)

    trap.deactivate()
    await nextTick()
    expect(document.activeElement).toBe(outside)
    scope.stop()
  })

  it('returns focus to the element remembered before the surface took it', async () => {
    const { outside, panel, last } = buildPanel()
    outside.focus()
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(panel))!

    trap.rememberFocus()
    // `showModal()` moves focus into the dialog before the trap activates.
    last.focus()
    trap.activate()
    trap.deactivate()
    await nextTick()

    expect(document.activeElement).toBe(outside)
    scope.stop()
  })

  it('wraps Tab from the last focusable to the first and back', () => {
    const { panel, first, last } = buildPanel()
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(panel))!
    trap.activate()

    last.focus()
    expect(tab(last).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    expect(tab(first, true).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
    scope.stop()
  })

  it('skips tabindex="-1" (roving tabindex) when wrapping', () => {
    const { panel, first, last } = buildPanel()
    last.tabIndex = -1
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(panel))!
    trap.activate()

    const middle = panel.querySelector<HTMLElement>('.middle')!
    middle.focus()
    expect(tab(middle).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    scope.stop()
  })

  it('honours initialFocus and loop=false', () => {
    const { panel, last } = buildPanel()
    const scope = effectScope()
    const trap = scope.run(() => useFocusTrap(panel, { initialFocus: '.middle', loop: false }))!
    trap.activate()

    expect(document.activeElement).toBe(panel.querySelector('.middle'))
    last.focus()
    expect(tab(last).defaultPrevented).toBe(false)
    scope.stop()
  })
})
