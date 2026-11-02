import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { clearNuxtState, useState } from '#app'
import MHotkey from '../index.vue'

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown>, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MHotkey, { props, slots, attrs })

  return current as VueWrapper
}

const keycaps = (wrapper: VueWrapper) => wrapper.findAll('.ui-hotkey__key').map(key => key.text())

afterEach(() => {
  current?.unmount()
  current = null
  clearNuxtState('m3:hotkey-platform')
  vi.restoreAllMocks()
})

describe('m-hotkey · variants', () => {
  describe('keys', () => {
    it('renders one keycap per key, carrying only its block class at rest', async () => {
      const wrapper = await mount({ keys: ['mod', 'k'], platform: 'windows' })

      expect(wrapper.classes()).toEqual(['ui-hotkey'])
      expect(keycaps(wrapper)).toEqual(['Ctrl', 'K'])
      expect(wrapper.find('.ui-hotkey__key').element.tagName).toBe('KBD')
    })

    it('covers the single-key badge role', async () => {
      const wrapper = await mount({ keys: ['enter'], platform: 'windows' })

      expect(keycaps(wrapper)).toEqual(['↵'])
      expect(wrapper.find('.ui-hotkey__separator').exists()).toBe(false)
    })

    it.each(['arrowup', 'ArrowUp', 'up'])('draws %s as an arrow', async (key) => {
      const wrapper = await mount({ keys: [key], platform: 'windows' })

      expect(keycaps(wrapper)).toEqual(['↑'])
    })

    it('marks modifier keycaps', async () => {
      const wrapper = await mount({ keys: ['shift', 'k'], platform: 'windows' })
      const [shift, k] = wrapper.findAll('.ui-hotkey__key')

      expect(shift!.classes()).toContain('ui-hotkey__key--modifier')
      expect(k!.classes()).not.toContain('ui-hotkey__key--modifier')
    })

    it('renders no keycap for an empty key list', async () => {
      const wrapper = await mount({ keys: [] })

      expect(wrapper.findAll('.ui-hotkey__key')).toHaveLength(0)
    })
  })

  describe('platform', () => {
    it.each([
      ['windows', ['Ctrl', 'K']],
      ['linux', ['Ctrl', 'K']],
      ['mac', ['⌘', 'K']],
    ] as const)('draws mod for %s', async (platform, expected) => {
      const wrapper = await mount({ keys: ['mod', 'k'], platform })

      expect(keycaps(wrapper)).toEqual(expected)
    })

    it('joins keys with + off the Mac and with nothing on it', async () => {
      const windows = await mount({ keys: ['mod', 'k'], platform: 'windows' })
      expect(windows.find('.ui-hotkey__separator').text()).toBe('+')

      const mac = await mount({ keys: ['mod', 'k'], platform: 'mac' })
      expect(mac.find('.ui-hotkey__separator').text()).toBe('')
    })

    it('lets the separator prop replace the platform glyph', async () => {
      const wrapper = await mount({ keys: ['mod', 'shift', 'k'], platform: 'mac', separator: '·' })

      expect(wrapper.findAll('.ui-hotkey__separator').map(separator => separator.text())).toEqual(['·', '·'])
    })

    it('reserves the wider form when the server could not tell the platform', async () => {
      useState('m3:hotkey-platform').value = null
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC_UA)

      const wrapper = await mount({ keys: ['mod', 'k'] })
      await nextTick()

      const [shown, reserved] = wrapper.findAll('.ui-hotkey__combo')
      expect(shown!.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['⌘', 'K'])
      expect(shown!.classes()).not.toContain('ui-hotkey__combo--reserve')
      expect(reserved!.classes()).toContain('ui-hotkey__combo--reserve')
      expect(reserved!.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['Ctrl', 'K'])
    })

    it('reserves nothing when the platform was known', async () => {
      useState('m3:hotkey-platform').value = 'mac'
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC_UA)

      const wrapper = await mount({ keys: ['mod', 'k'] })

      expect(wrapper.findAll('.ui-hotkey__combo')).toHaveLength(1)
      expect(keycaps(wrapper)).toEqual(['⌘', 'K'])
    })

    it('reserves nothing for an explicit platform', async () => {
      useState('m3:hotkey-platform').value = null

      const wrapper = await mount({ keys: ['mod', 'k'], platform: 'mac' })

      expect(wrapper.findAll('.ui-hotkey__combo')).toHaveLength(1)
    })
  })

  describe('slots', () => {
    it('hands every keycap to #key with its token, label and state', async () => {
      const wrapper = await mount(
        { keys: ['ctrl', 'k'], platform: 'windows', disabled: true },
        { key: ({ token, label, pressed, disabled, index }: { token: string, label: string, pressed: boolean, disabled: boolean, index: number }) => `${index}:${token}:${label}:${pressed}:${disabled}` },
      )

      expect(keycaps(wrapper)).toEqual(['0:ctrl:Control:false:true', '1:k:K:false:true'])
    })

    it('hands every separator to #separator with its index and platform', async () => {
      const wrapper = await mount(
        { keys: ['mod', 'shift', 'k'], platform: 'mac' },
        { separator: ({ index, platform }: { index: number, platform: string }) => h('i', `${index}${platform}`) },
      )

      expect(wrapper.findAll('.ui-hotkey__separator').map(separator => separator.text())).toEqual(['1mac', '2mac'])
    })
  })

  describe('state modifiers', () => {
    it('marks a disabled hint', async () => {
      const wrapper = await mount({ keys: ['ctrl', 'k'], platform: 'windows', disabled: true })

      expect(wrapper.classes()).toContain('ui-hotkey--disabled')
    })

    it('passes attributes through to the root', async () => {
      const wrapper = await mount({ keys: ['ctrl', 'k'] }, undefined, { 'data-test': 'hint', 'class': 'extra' })

      expect(wrapper.attributes('data-test')).toBe('hint')
      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-hotkey', 'extra']))
    })
  })
})
