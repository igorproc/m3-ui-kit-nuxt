import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MToolbar from '../index.vue'
import type { MToolbarItem } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MToolbar, { props, slots })

  return current as VueWrapper
}

async function mountParent(render: () => unknown) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }))

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const ABC: MToolbarItem[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]

const pressedOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-toolbar__item').map(item => item.attributes('aria-pressed'))

const menuItems = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.ui-toolbar__menu-item'))

async function openMore(wrapper: VueWrapper) {
  await wrapper.find('.ui-toolbar__overflow .ui-icon-button').trigger('click')
  await flushPromises()
}

describe('m-toolbar · interaction', () => {
  describe('without a model', () => {
    it('emits select with the activated item', async () => {
      const wrapper = await mount({ items: ABC })

      await wrapper.findAll('.ui-button')[1]!.trigger('click')

      expect((wrapper.emitted('select')![0]![0] as MToolbarItem).id).toBe('b')
    })

    it('does not emit select for a disabled item', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A', disabled: true }] })

      await wrapper.find('.ui-button').trigger('click')

      expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('writes no model', async () => {
      const wrapper = await mount({ items: ABC })

      await wrapper.find('.ui-button').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('lets the #item slot activate an item through onSelect', async () => {
      const wrapper = await mount({ items: ABC }, {
        item: ({ item, onSelect }: { item: MToolbarItem, onSelect: () => void }) =>
          h('button', { type: 'button', class: 'own-item', onClick: onSelect }, item.label),
      })

      await wrapper.findAll('.own-item')[2]!.trigger('click')

      expect((wrapper.emitted('select')![0]![0] as MToolbarItem).id).toBe('c')
    })
  })

  describe('single model', () => {
    it('presses an item on activation and reports it', async () => {
      const wrapper = await mount({ items: ABC, modelValue: null })

      await wrapper.findAll('.ui-button')[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['b'])
      expect(pressedOf(wrapper)).toEqual(['false', 'true', 'false'])
    })

    it('moves the press to another item', async () => {
      const wrapper = await mount({ items: ABC, modelValue: 'a' })

      await wrapper.findAll('.ui-button')[2]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['c'])
      expect(pressedOf(wrapper)).toEqual(['false', 'false', 'true'])
    })

    it('releases the pressed item on a second activation: the selection is optional', async () => {
      const wrapper = await mount({ items: ABC, modelValue: 'a' })

      await wrapper.find('.ui-button').trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null])
      expect(pressedOf(wrapper)).toEqual(['false', 'false', 'false'])
    })

    it('follows a model changed by the parent', async () => {
      const wrapper = await mount({ items: ABC, modelValue: 'a' })

      await wrapper.setProps({ modelValue: 'b' })

      expect(pressedOf(wrapper)).toEqual(['false', 'true', 'false'])
    })

    it('does not press a disabled item', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', disabled: true }], modelValue: null })

      await wrapper.findAll('.ui-button')[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('makes an item that arrives later selectable', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A' }], modelValue: null })

      await wrapper.setProps({ items: ABC })
      await wrapper.findAll('.ui-button')[2]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['c'])
    })

    it('takes a model bound before it holds a value', async () => {
      const model = ref<string | null | undefined>()
      const wrapper = await mountParent(() => h(MToolbar, {
        'items': ABC,
        'modelValue': model.value,
        'onUpdate:modelValue': (value: unknown) => {
          model.value = value as string | null
        },
      }))

      expect(pressedOf(wrapper)).toEqual(['false', 'false', 'false'])
      await wrapper.findAll('.ui-button')[1]!.trigger('click')

      expect(model.value).toBe('b')
      expect(pressedOf(wrapper)).toEqual(['false', 'true', 'false'])
    })

    it('turns selection on for a model bound after mount', async () => {
      const bound = ref(false)
      const model = ref<string | null>(null)
      const binding = () => (bound.value
        ? { 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value as string | null } }
        : {})
      const wrapper = await mountParent(() => h(MToolbar, { items: ABC, ...binding() }))

      expect(pressedOf(wrapper)).toEqual([undefined, undefined, undefined])

      bound.value = true
      await nextTick()
      expect(pressedOf(wrapper)).toEqual(['false', 'false', 'false'])

      await wrapper.findAll('.ui-button')[0]!.trigger('click')
      expect(model.value).toBe('a')
    })

    it('drops the press of an item that goes away', async () => {
      const wrapper = await mount({ items: ABC, modelValue: 'c' })

      await wrapper.setProps({ items: ABC.slice(0, 2) })
      await nextTick()

      expect(pressedOf(wrapper)).toEqual(['false', 'false'])
    })
  })

  // W67-А: the items past maxVisible act from the "more" menu exactly as in the bar.
  describe('more menu', () => {
    it('opens on the "more" button with the hidden items, in order', async () => {
      const wrapper = await mount({ items: ABC, maxVisible: 1, moreLabel: 'More' })

      expect(menuItems()).toHaveLength(0)
      await openMore(wrapper)

      expect(menuItems().map(item => item.textContent?.trim())).toEqual(['B', 'C'])
    })

    it('emits select for a hidden item and closes the menu', async () => {
      const wrapper = await mount({ items: ABC, maxVisible: 1, moreLabel: 'More' })

      await openMore(wrapper)
      menuItems()[1]!.click()
      await flushPromises()

      expect((wrapper.emitted('select')![0]![0] as MToolbarItem).id).toBe('c')
      expect(menuItems()).toHaveLength(0)
    })

    it('presses a hidden item of a single model', async () => {
      const wrapper = await mount({ items: ABC, maxVisible: 1, moreLabel: 'More', modelValue: null })

      await openMore(wrapper)
      menuItems()[0]!.click()
      await flushPromises()

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['b'])
    })

    it('toggles a hidden item of a multiple model', async () => {
      const wrapper = await mount({ items: ABC, maxVisible: 1, moreLabel: 'More', modelValue: ['a'], multiple: true })

      await openMore(wrapper)
      menuItems()[1]!.click()
      await flushPromises()

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['a', 'c']])
    })

    it('ignores a disabled hidden item and stays open', async () => {
      const wrapper = await mount({ items: [ABC[0]!, { id: 'b', label: 'B', disabled: true }], maxVisible: 1, moreLabel: 'More' })

      await openMore(wrapper)
      menuItems()[0]!.click()
      await flushPromises()

      expect(wrapper.emitted('select')).toBeUndefined()
      expect(menuItems()).toHaveLength(1)
    })
  })

  describe('multiple model', () => {
    it('adds and removes items independently', async () => {
      const wrapper = await mount({ items: ABC, modelValue: [], multiple: true })
      const buttons = wrapper.findAll('.ui-button')

      await buttons[0]!.trigger('click')
      await buttons[2]!.trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['a', 'c']])

      await buttons[0]!.trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['c']])
    })

    it('presses the preset values when the items register', async () => {
      const wrapper = await mount({ items: ABC, modelValue: ['a', 'c'], multiple: true })

      expect(pressedOf(wrapper)).toEqual(['true', 'false', 'true'])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('follows a model changed by the parent', async () => {
      const wrapper = await mount({ items: ABC, modelValue: ['a'], multiple: true })

      await wrapper.setProps({ modelValue: ['b', 'c'] })

      expect(pressedOf(wrapper)).toEqual(['false', 'true', 'true'])
    })
  })
})
