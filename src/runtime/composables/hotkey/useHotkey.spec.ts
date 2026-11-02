import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, provide, ref, shallowRef } from 'vue'
import { clearNuxtState, useNuxtApp } from '#app'
import { useHotkey } from './useHotkey'
import { __resetHotkeyRegistry } from '#kit/utils/hotkey/registry'
import type { HotkeyKey, UseHotkeyOptions, UseHotkeyReturn } from '#kit/shared/types/hotkey'

function press(key: string, init: KeyboardEventInit = {}, type: 'keydown' | 'keyup' = 'keydown') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...init }))
}

async function mountHotkey(
  keys: HotkeyKey[] | { keys: HotkeyKey[], platform?: 'mac' | 'windows' | 'linux' },
  options?: UseHotkeyOptions,
) {
  const handler = vi.fn()
  let hotkey: UseHotkeyReturn | undefined
  const Host = defineComponent({
    setup() {
      hotkey = useHotkey(keys, handler, options)
      return () => h('div')
    },
  })
  const wrapper = await mountSuspended(Host)
  return { handler, wrapper, hotkey: hotkey! }
}

beforeEach(() => __resetHotkeyRegistry())
afterEach(() => {
  __resetHotkeyRegistry()
  clearNuxtState('m3:hotkey-platform')
  vi.restoreAllMocks()
})

describe('useHotkey · matching', () => {
  it('fires on an exact modifier + key match', async () => {
    const { handler } = await mountHotkey(['ctrl', 'k'])

    press('k', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)

    press('k')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not fire when an extra modifier is held (exact by default)', async () => {
    const { handler } = await mountHotkey(['ctrl', 'k'])

    press('k', { ctrlKey: true, shiftKey: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('allows extra modifiers when exact is false', async () => {
    const { handler } = await mountHotkey(['ctrl', 'k'], { exact: false })

    press('k', { ctrlKey: true, shiftKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('resolves `mod` per the declared platform', async () => {
    const { handler } = await mountHotkey({ keys: ['mod', 'k'], platform: 'mac' })

    press('k', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()

    press('k', { metaKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('matches a key written in any spelling', async () => {
    const { handler } = await mountHotkey(['Control', 'up'])

    press('ArrowUp', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ignores auto-repeat unless repeat is enabled', async () => {
    const { handler } = await mountHotkey(['ctrl', 'k'])

    press('k', { ctrlKey: true, repeat: true })
    expect(handler).not.toHaveBeenCalled()

    press('k', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('useHotkey · policies', () => {
  it('does not fire while typing in an input unless inputs is true', async () => {
    const input = document.createElement('input')
    document.body.appendChild(input)

    const { handler } = await mountHotkey(['ctrl', 'k'])
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))
    expect(handler).not.toHaveBeenCalled()

    const { handler: allowed } = await mountHotkey(['ctrl', 'j'], { inputs: true })
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true, bubbles: true, cancelable: true }))
    expect(allowed).toHaveBeenCalledTimes(1)

    input.remove()
  })

  it('gives the shortcut to an open modal over the page beneath it', async () => {
    const service = useNuxtApp().$material.modal
    const unregister = service.register({ id: 'hotkey-dialog', isOpen: () => true, open: async () => {}, close: async () => {} })
    const page = vi.fn()
    const dialog = vi.fn()
    const DialogContent = defineComponent({
      setup() {
        useHotkey(['ctrl', 'k'], dialog)
        return () => h('p')
      },
    })
    const Host = defineComponent({
      setup() {
        useHotkey(['ctrl', 'k'], page)
        return () => h(defineComponent({
          setup() {
            provide('m3:modal', { id: 'hotkey-dialog', parent: null, children: shallowRef([]), status: ref('open'), close: async () => {} })
            return () => h(DialogContent)
          },
        }))
      },
    })
    await mountSuspended(Host)

    service.markOpened('hotkey-dialog', false)
    press('k', { ctrlKey: true })
    expect(dialog).toHaveBeenCalledTimes(1)
    expect(page).not.toHaveBeenCalled()

    service.markClosed('hotkey-dialog')
    press('k', { ctrlKey: true })
    expect(page).toHaveBeenCalledTimes(1)
    expect(dialog).toHaveBeenCalledTimes(1)

    unregister()
  })

  it('stops firing after unmount', async () => {
    const { handler, wrapper } = await mountHotkey(['ctrl', 'k'])
    wrapper.unmount()

    press('k', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
  })
})

// B1.7a: everything under `composables/` is auto-imported into the app, so this
// folder holds the public hotkey API only; the matcher and the presentation
// internals live in `utils/hotkey/`.
describe('useHotkey · public surface', () => {
  // Q49-А: overlays are covered by the top layer; a `scope` nobody pushed did nothing.
  it('takes no scope option', () => {
    expectTypeOf<UseHotkeyOptions>().not.toHaveProperty('scope')
  })

  it('auto-imports only useHotkey and provideHotkeyLabels', () => {
    const modules = import.meta.glob<Record<string, unknown>>(['./*.ts', '!./*.spec.ts'], { eager: true })
    const exported = Object.values(modules).flatMap(module => Object.keys(module)).sort()

    expect(exported).toEqual(['provideHotkeyLabels', 'useHotkey'])
  })
})

describe('useHotkey · presentation', () => {
  it('describes the shortcut for aria-keyshortcuts', async () => {
    const { hotkey } = await mountHotkey({ keys: ['shift', 'mod', 'p'], platform: 'windows' })

    expect(hotkey.ariaKeyShortcuts.value).toBe('Control+Shift+P')
    expect(hotkey.ariaLabel.value).toBe('Control Shift P')
  })

  it('reports the keys held right now', async () => {
    const { hotkey } = await mountHotkey({ keys: ['mod', 'k'], platform: 'windows' })

    press('Control', { ctrlKey: true })
    expect(hotkey.pressedKeys.value).toEqual(['mod'])
    expect(hotkey.isPressed.value).toBe(false)

    press('k', { ctrlKey: true })
    expect(hotkey.isPressed.value).toBe(true)
  })

  it('returns a model without classes or data attributes', async () => {
    const { hotkey } = await mountHotkey(['ctrl', 'k'])

    expect(Object.keys(hotkey).some(key => key === 'class' || key.startsWith('data-'))).toBe(false)
  })
})
