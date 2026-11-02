import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MNavigationBar from '../index.vue'
import type { MNavigationBarItem } from '../props'

const items: MNavigationBarItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'search', icon: 'outline-search', label: 'Search' },
  { id: 'profile', icon: 'outline-person', label: 'Profile' },
]

let current: { unmount: () => void } | null = null

// Attached: a detached element takes no focus.
async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MNavigationBar, { props: { items, ...props }, attachTo: document.body })

  return current as VueWrapper
}

const buttonsOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-navigation-bar__item')
const activeLabel = (wrapper: VueWrapper) => wrapper.find('.ui-navigation-item--active').text()

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-navigation-bar · interaction', () => {
  describe('model', () => {
    it('writes the clicked destination to the model', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await buttonsOf(wrapper)[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['search'])
      expect(activeLabel(wrapper)).toBe('Search')
    })

    it('selects a destination from an empty model', async () => {
      const wrapper = await mount()

      await buttonsOf(wrapper)[2]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['profile'])
    })

    it('follows a model changed by the parent', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await wrapper.setProps({ modelValue: 'profile' })

      expect(activeLabel(wrapper)).toBe('Profile')
    })

    it('clears the selection when the parent clears the model', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await wrapper.setProps({ modelValue: null })

      expect(wrapper.find('.ui-navigation-item--active').exists()).toBe(false)
    })

    it('selects the bound destination when its item arrives after mount', async () => {
      const wrapper = await mount({ items: [], modelValue: 'search' })

      await wrapper.setProps({ items })

      expect(activeLabel(wrapper)).toBe('Search')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('keeps a two-way binding in step', async () => {
      const value = ref<string | null>('home')

      if (current) current.unmount()
      current = await mountSuspended(defineComponent({
        render: () => h(MNavigationBar, {
          'items': items,
          'modelValue': value.value,
          'onUpdate:modelValue': (next: string | null) => {
            value.value = next
          },
        }),
      }))

      await buttonsOf(current as VueWrapper)[2]!.trigger('click')

      expect(value.value).toBe('profile')
    })

    it('does not select a disabled destination', async () => {
      const wrapper = await mount({ items: [items[0]!, { ...items[1]!, disabled: true }], modelValue: 'home' })

      await buttonsOf(wrapper)[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('select')).toBeUndefined()
    })
  })

  // B5.1b (Q56-А)
  describe('select event', () => {
    it('emits select with the id and the event on every activation, the active one included', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await buttonsOf(wrapper)[0]!.trigger('click')
      await buttonsOf(wrapper)[2]!.trigger('click')

      const events = wrapper.emitted('select')!
      expect(events.map(([id]) => id)).toEqual(['home', 'profile'])
      expect(events[0]![1]).toBeInstanceOf(MouseEvent)
    })

    it('does not rewrite the model when the active destination is pressed again', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await buttonsOf(wrapper)[0]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  // W56-А: a navigation landmark, not a composite widget — Tab moves, arrows do not.
  describe('keyboard', () => {
    it.each(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'])('leaves %s to the browser', async (key) => {
      const wrapper = await mount({ modelValue: 'home' })
      const first = buttonsOf(wrapper)[0]!.element as HTMLButtonElement
      first.focus()

      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      first.dispatchEvent(event)
      await nextTick()

      expect(event.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(first)
    })
  })
})
