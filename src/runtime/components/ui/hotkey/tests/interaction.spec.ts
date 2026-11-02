import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { clearNuxtState } from '#app'
import { useHotkey } from '#kit/composables/hotkey/useHotkey'
import { __resetHotkeyRegistry } from '#kit/utils/hotkey/registry'
import MHotkey from '../index.vue'
import type { UseHotkeyReturn } from '#kit/shared/types/hotkey'

function press(key: string, init: KeyboardEventInit = {}, type: 'keydown' | 'keyup' = 'keydown') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...init }))
}

let current: { unmount: () => void } | null = null

async function mountLinked(enabled = ref(true)) {
  if (current) current.unmount()
  let hotkey: UseHotkeyReturn | undefined
  current = await mountSuspended(defineComponent({
    setup() {
      hotkey = useHotkey({ keys: ['mod', 'k'], platform: 'mac' }, () => {}, { enabled })
      return () => h(MHotkey, { hotkey })
    },
  }))

  return { wrapper: current as VueWrapper, enabled, hotkey: hotkey! }
}

const pressedKeycaps = (wrapper: VueWrapper) => wrapper.findAll('.ui-hotkey__key--pressed').map(key => key.text())

beforeEach(() => __resetHotkeyRegistry())
afterEach(() => {
  current?.unmount()
  current = null
  __resetHotkeyRegistry()
  clearNuxtState('m3:hotkey-platform')
  vi.restoreAllMocks()
})

describe('m-hotkey · interaction', () => {
  describe('static keys', () => {
    it('redraws when the platform prop changes', async () => {
      const wrapper = await mountSuspended(MHotkey, { props: { keys: ['mod', 'k'], platform: 'windows' } })

      await wrapper.setProps({ platform: 'mac' })

      expect(wrapper.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['⌘', 'K'])
      wrapper.unmount()
    })

    it('redraws when the keys change', async () => {
      const wrapper = await mountSuspended(MHotkey, { props: { keys: ['ctrl', 'k'], platform: 'windows' } })

      await wrapper.setProps({ keys: ['ctrl', 'shift', 'p'] })

      expect(wrapper.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['Ctrl', 'Shift', 'P'])
      wrapper.unmount()
    })

    it('never lights a static hint, whatever is held', async () => {
      const wrapper = await mountSuspended(MHotkey, { props: { keys: ['ctrl', 'k'], platform: 'windows' } })

      press('Control', { ctrlKey: true })
      await nextTick()

      expect(wrapper.find('.ui-hotkey__key--pressed').exists()).toBe(false)
      wrapper.unmount()
    })
  })

  describe('behavior-linked', () => {
    it('lights the keys held right now and lets them go on release', async () => {
      const { wrapper } = await mountLinked()

      press('Meta', { metaKey: true })
      await nextTick()
      expect(pressedKeycaps(wrapper)).toEqual(['⌘'])

      press('Meta', {}, 'keyup')
      await nextTick()
      expect(pressedKeycaps(wrapper)).toEqual([])
    })

    it('goes dark and unlit while its shortcut is disabled', async () => {
      const { wrapper, enabled } = await mountLinked()

      press('Meta', { metaKey: true })
      enabled.value = false
      await nextTick()

      expect(wrapper.find('.ui-hotkey').classes()).toContain('ui-hotkey--disabled')
      expect(wrapper.findAll('.ui-hotkey__key--pressed')).toHaveLength(0)
    })

    it('comes back when the shortcut is enabled again', async () => {
      const { wrapper, enabled } = await mountLinked(ref(false))

      enabled.value = true
      await nextTick()

      expect(wrapper.find('.ui-hotkey').classes()).not.toContain('ui-hotkey--disabled')
    })

    it('draws the platform of the shortcut, not of its own prop', async () => {
      const { wrapper } = await mountLinked()

      expect(wrapper.findAll('.ui-hotkey__key').map(key => key.text())).toEqual(['⌘', 'K'])
    })
  })

  // The "exactly one of hotkey or keys" warning is guarded by `import.meta.dev`,
  // which Vitest resolves to `false`; it cannot be asserted here.
})
