import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { clearNuxtState, useState } from '#app'
import { useHotkey } from '#kit/composables/hotkey/useHotkey'
import { provideHotkeyLabels } from '#kit/composables/hotkey/provideHotkeyLabels'
import { __resetHotkeyRegistry } from '#kit/utils/hotkey/registry'
import MHotkey from '../index.vue'
import type { HotkeyLabels, UseHotkeyReturn } from '#kit/shared/types/hotkey'

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MHotkey, { props })

  return current as VueWrapper
}

async function withLabels(labels: HotkeyLabels, render: () => ReturnType<typeof h>) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({
    setup() {
      provideHotkeyLabels(labels)
      return render
    },
  }))

  return (current as VueWrapper).find('.ui-hotkey')
}

beforeEach(() => __resetHotkeyRegistry())
afterEach(() => {
  current?.unmount()
  current = null
  __resetHotkeyRegistry()
  clearNuxtState('m3:hotkey-platform')
  vi.restoreAllMocks()
})

describe('m-hotkey · a11y', () => {
  describe('naming', () => {
    it('is one named image, read as words rather than glyphs', async () => {
      const wrapper = await mount({ keys: ['mod', 'k'], platform: 'windows' })

      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Control K')
    })

    it.each([
      [['enter'], 'Enter'],
      [['up'], 'Up'],
      [['shift', 'mod', 'p'], 'Control Shift P'],
    ] as const)('names %j as %j', async (keys, name) => {
      const wrapper = await mount({ keys: [...keys], platform: 'windows' })

      expect(wrapper.attributes('aria-label')).toBe(name)
    })

    it('names the Mac form by its own key names', async () => {
      const wrapper = await mount({ keys: ['mod', 'k'], platform: 'mac' })

      expect(wrapper.attributes('aria-label')).toBe('Command K')
    })

    it('hides the drawn keycaps — the root name already says them', async () => {
      const wrapper = await mount({ keys: ['mod', 'k'], platform: 'windows' })

      expect(wrapper.find('.ui-hotkey__combo').attributes('aria-hidden')).toBe('true')
    })

    it('names the shown form only, keeping the reserved one hidden', async () => {
      useState('m3:hotkey-platform').value = null
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MAC_UA)

      const wrapper = await mount({ keys: ['mod', 'k'] })
      await nextTick()

      expect(wrapper.findAll('.ui-hotkey__combo').every(combo => combo.attributes('aria-hidden') === 'true')).toBe(true)
      expect(wrapper.attributes('aria-label')).toBe('Command K')
    })

    it('lets the ariaLabel prop replace the generated name', async () => {
      const wrapper = await mount({ keys: ['ctrl', 'k'], ariaLabel: 'Search' })

      expect(wrapper.attributes('aria-label')).toBe('Search')
    })

    it('does not claim an unnamed image for an empty key list', async () => {
      const wrapper = await mount({ keys: [] })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })
  })

  describe('localised names', () => {
    it('speaks key names provided for its subtree', async () => {
      const root = await withLabels({ control: 'Контрол', shift: 'Шифт' }, () => h(MHotkey, { keys: ['shift', 'ctrl', 'k'], platform: 'windows' }))

      expect(root.attributes('aria-label')).toBe('Контрол Шифт K')
    })

    it('lets a nested provider override one name and keep the rest', async () => {
      const Inner = defineComponent({
        setup() {
          provideHotkeyLabels({ shift: 'Шифт' })
          return () => h(MHotkey, { keys: ['shift', 'ctrl', 'k'], platform: 'windows' })
        },
      })
      const root = await withLabels({ control: 'Контрол', shift: 'Shift' }, () => h(Inner))

      expect(root.attributes('aria-label')).toBe('Контрол Шифт K')
    })
  })

  describe('disabled', () => {
    it('announces a disabled hint through aria-disabled, keeping its name', async () => {
      const wrapper = await mount({ keys: ['ctrl', 'k'], platform: 'windows', disabled: true })

      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.attributes('aria-label')).toBe('Control K')
    })

    it('adds the translated state to the name of a disabled hint', async () => {
      const root = await withLabels({ disabled: 'недоступно' }, () => h(MHotkey, { keys: ['ctrl', 'k'], platform: 'windows', disabled: true }))

      expect(root.attributes('aria-label')).toBe('Control K, недоступно')
    })

    it('leaves an enabled hint without aria-disabled', async () => {
      const wrapper = await mount({ keys: ['ctrl', 'k'], platform: 'windows' })

      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })

    it('follows the enabled state of a behavior-linked shortcut', async () => {
      const enabled = ref(true)
      let hotkey: UseHotkeyReturn | undefined
      current = await mountSuspended(defineComponent({
        setup() {
          hotkey = useHotkey({ keys: ['mod', 'k'], platform: 'mac' }, () => {}, { enabled })
          return () => h(MHotkey, { hotkey })
        },
      }))
      const root = (current as VueWrapper).find('.ui-hotkey')

      expect(root.attributes('aria-label')).toBe('Command K')

      enabled.value = false
      await nextTick()

      expect(root.attributes('aria-disabled')).toBe('true')
    })
  })

  describe('passive hint', () => {
    it('is never a tab stop — the shortcut belongs to the control it describes', async () => {
      const wrapper = await mount({ keys: ['ctrl', 'k'], platform: 'windows' })

      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })
  })
})
