import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useHotkey } from '#kit/composables/hotkey/useHotkey'
import { __resetHotkeyRegistry, popScope, pushScope } from '#kit/composables/hotkey/registry'
import { buildAriaLabel, buildDisplayKeys } from '#kit/composables/hotkey/format'
import MHotkey from './index.vue'
import type { HotkeyKey } from '#kit/shared/types/hotkey'

function press(key: string, init: KeyboardEventInit = {}, type: 'keydown' | 'keyup' = 'keydown') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...init }))
}

async function mountHotkey(
  keys: HotkeyKey[] | { keys: HotkeyKey[], platform?: 'mac' | 'windows' | 'linux' },
  options?: Record<string, unknown>,
) {
  const handler = vi.fn()
  const Host = defineComponent({
    setup() {
      useHotkey(keys as HotkeyKey[], handler, options)
      return () => h('div')
    },
  })
  const wrapper = await mountSuspended(Host)
  return { handler, wrapper }
}

beforeEach(() => __resetHotkeyRegistry())
afterEach(() => __resetHotkeyRegistry())

describe('hotkey format', () => {
  it('renders mac modifiers as glyphs in canonical order', () => {
    const keys: HotkeyKey[] = ['shift', 'mod', 'p']
    const display = buildDisplayKeys(keys, 'mac')
    expect(display.map(d => d.symbol)).toEqual(['⇧', '⌘', 'P'])
    expect(buildAriaLabel(display)).toBe('Shift Command P')
  })

  it('renders windows modifiers as text', () => {
    const display = buildDisplayKeys(['mod', 'k'], 'windows')
    expect(display.map(d => d.symbol)).toEqual(['Ctrl', 'K'])
    expect(buildAriaLabel(display)).toBe('Control K')
  })

  it('normalizes named-key aliases', () => {
    const display = buildDisplayKeys(['esc'], 'windows')
    expect(display[0]!.key).toBe('escape')
    expect(display[0]!.label).toBe('Escape')
  })
})

describe('useHotkey matching', () => {
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

  it('ignores auto-repeat unless repeat is enabled', async () => {
    const { handler } = await mountHotkey(['ctrl', 'k'])

    press('k', { ctrlKey: true, repeat: true })
    expect(handler).not.toHaveBeenCalled()

    press('k', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('useHotkey policies', () => {
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

  it('suppresses lower scopes while a scope is active', async () => {
    const { handler } = await mountHotkey(['ctrl', 'k'])

    pushScope('dialog')
    press('k', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()

    popScope('dialog')
    press('k', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('stops firing after unmount', async () => {
    const { handler, wrapper } = await mountHotkey(['ctrl', 'k'])
    wrapper.unmount()

    press('k', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('MHotkey', () => {
  it('renders a static key list with a platform-aware separator', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['mod', 'k'], platform: 'windows' } })

    expect(wrapper.attributes('aria-label')).toBe('Control K')
    const keycaps = wrapper.findAll('.ui-hotkey__key')
    expect(keycaps).toHaveLength(2)
    expect(keycaps[0]!.text()).toBe('Ctrl')
    expect(keycaps[1]!.text()).toBe('K')
    expect(wrapper.find('.ui-hotkey__separator').text()).toBe('+')
  })

  it('covers the single-key badge role', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['enter'], platform: 'windows' } })

    expect(wrapper.findAll('.ui-hotkey__key')).toHaveLength(1)
    expect(wrapper.attributes('aria-label')).toBe('Enter')
  })

  it('reflects disabled state', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['ctrl', 'k'], disabled: true } })

    expect(wrapper.classes()).toContain('ui-hotkey--disabled')
  })
})
