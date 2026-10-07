import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, provide, ref, shallowRef } from 'vue'
import { clearNuxtState, useNuxtApp, useState } from '#app'
import { useHotkey } from '#kit/composables/hotkey/useHotkey'
import { provideHotkeyLabels } from '#kit/composables/hotkey/useHotkeyLabels'
import { __resetHotkeyRegistry, popScope, pushScope } from '#kit/composables/hotkey/registry'
import MHotkey from './index.vue'
import type { HotkeyKey, HotkeyLabels, UseHotkeyOptions, UseHotkeyReturn } from '#kit/shared/types/hotkey'

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'

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

function withLabels(labels: HotkeyLabels, render: () => ReturnType<typeof h>) {
  return defineComponent({
    setup() {
      provideHotkeyLabels(labels)
      return render
    },
  })
}

beforeEach(() => __resetHotkeyRegistry())
afterEach(() => {
  __resetHotkeyRegistry()
  clearNuxtState('m3:hotkey-platform')
  vi.restoreAllMocks()
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

describe('useHotkey presentation', () => {
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

describe('MHotkey', () => {
  it('renders a static key list with a platform-aware separator', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['mod', 'k'], platform: 'windows' } })

    expect(wrapper.classes()).toContain('ui-hotkey')
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Control K')
    const keycaps = wrapper.findAll('.ui-hotkey__key')
    expect(keycaps).toHaveLength(2)
    expect(keycaps[0]!.text()).toBe('Ctrl')
    expect(keycaps[1]!.text()).toBe('K')
    expect(wrapper.find('.ui-hotkey__separator').text()).toBe('+')
    expect(wrapper.find('.ui-hotkey__combo').attributes('aria-hidden')).toBe('true')
  })

  it('covers the single-key badge role', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['enter'], platform: 'windows' } })

    expect(wrapper.findAll('.ui-hotkey__key')).toHaveLength(1)
    expect(wrapper.attributes('aria-label')).toBe('Enter')
  })

  it.each(['arrowup', 'ArrowUp', 'up'])('draws %s as an arrow', async (key) => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: [key], platform: 'windows' } })

    expect(wrapper.find('.ui-hotkey__key').text()).toBe('↑')
    expect(wrapper.attributes('aria-label')).toBe('Up')
  })

  it('redraws when the platform prop changes', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['mod', 'k'], platform: 'windows' } })

    await wrapper.setProps({ platform: 'mac' })

    expect(wrapper.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['⌘', 'K'])
    expect(wrapper.attributes('aria-label')).toBe('Command K')
  })

  it('announces a disabled hint through aria-disabled', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['ctrl', 'k'], platform: 'windows', disabled: true } })

    expect(wrapper.classes()).toContain('ui-hotkey--disabled')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('aria-label')).toBe('Control K')
  })

  it('adds the translated state to the name of a disabled hint', async () => {
    const Host = withLabels({ disabled: 'недоступно' }, () => h(MHotkey, { keys: ['ctrl', 'k'], platform: 'windows', disabled: true }))
    const wrapper = await mountSuspended(Host)

    expect(wrapper.find('.ui-hotkey').attributes('aria-label')).toBe('Control K, недоступно')
  })

  it('speaks key names provided for its subtree', async () => {
    const Host = withLabels({ control: 'Контрол', shift: 'Шифт' }, () => h(MHotkey, { keys: ['shift', 'ctrl', 'k'], platform: 'windows' }))
    const wrapper = await mountSuspended(Host)

    expect(wrapper.find('.ui-hotkey').attributes('aria-label')).toBe('Контрол Шифт K')
  })

  it('lets a nested provider override one name and keep the rest', async () => {
    const Inner = withLabels({ shift: 'Шифт' }, () => h(MHotkey, { keys: ['shift', 'ctrl', 'k'], platform: 'windows' }))
    const Outer = withLabels({ control: 'Контрол', shift: 'Shift' }, () => h(Inner))
    const wrapper = await mountSuspended(Outer)

    expect(wrapper.find('.ui-hotkey').attributes('aria-label')).toBe('Контрол Шифт K')
  })

  it('does not claim an unnamed image for an empty key list', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: [] } })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.findAll('.ui-hotkey__key')).toHaveLength(0)
  })

  it('lets the ariaLabel prop replace the generated name', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['ctrl', 'k'], ariaLabel: 'Search' } })

    expect(wrapper.attributes('aria-label')).toBe('Search')
  })

  it('passes attributes through to the root', async () => {
    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['ctrl', 'k'] }, attrs: { 'data-test': 'hint', 'class': 'extra' } })

    expect(wrapper.attributes('data-test')).toBe('hint')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-hotkey', 'extra']))
  })

  it('reserves the wider form when the server could not tell the platform', async () => {
    useState('m3:hotkey-platform').value = null
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC_UA)

    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['mod', 'k'] } })
    await nextTick()

    const [shown, reserved] = wrapper.findAll('.ui-hotkey__combo')
    expect(shown!.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['⌘', 'K'])
    expect(reserved!.classes()).toContain('ui-hotkey__combo--reserve')
    expect(reserved!.attributes('aria-hidden')).toBe('true')
    expect(reserved!.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['Ctrl', 'K'])
    expect(wrapper.attributes('aria-label')).toBe('Command K')
  })

  it('reserves nothing when the platform was known', async () => {
    useState('m3:hotkey-platform').value = 'mac'
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC_UA)

    const wrapper = await mountSuspended(MHotkey, { props: { keys: ['mod', 'k'] } })

    expect(wrapper.findAll('.ui-hotkey__combo')).toHaveLength(1)
    expect(wrapper.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['⌘', 'K'])
  })

  it('follows a behavior-linked hotkey: state, pressed keys and platform', async () => {
    const enabled = ref(true)
    let hotkey: UseHotkeyReturn | undefined
    const Host = defineComponent({
      setup() {
        hotkey = useHotkey({ keys: ['mod', 'k'], platform: 'mac' }, () => {}, { enabled })
        return () => h(MHotkey, { hotkey })
      },
    })
    const wrapper = await mountSuspended(Host)
    const root = wrapper.find('.ui-hotkey')

    expect(root.attributes('aria-label')).toBe('Command K')

    press('Meta', { metaKey: true })
    await nextTick()
    expect(wrapper.findAll('.ui-hotkey__key--pressed').map(key => key.text())).toEqual(['⌘'])

    enabled.value = false
    await nextTick()
    expect(root.attributes('aria-disabled')).toBe('true')
    expect(wrapper.findAll('.ui-hotkey__key--pressed')).toHaveLength(0)
  })
})
