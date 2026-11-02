import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import type { Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MTabs from '../index.vue'
import MTab from '../tab/index.vue'
import type { MTabItem } from '../props'

const items: MTabItem[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTabs, { props: { items, ariaLabel: 'Sections', ...props }, slots, attachTo: document.body })

  return current as VueWrapper
}

async function mountHost(component: Component) {
  if (current) current.unmount()
  current = await mountSuspended(component, { attachTo: document.body })

  return current as VueWrapper
}

const selectedOf = (wrapper: VueWrapper) => wrapper.findAll('[role="tab"]').map(tab => tab.attributes('aria-selected'))

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-tabs · interaction', () => {
  describe('pointer', () => {
    it('selects a tab on click and writes it to the model', async () => {
      const wrapper = await mount({ modelValue: 'one' })

      await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['two'])
      expect(selectedOf(wrapper)).toEqual(['false', 'true', 'false'])
    })

    it('does not select a disabled tab on click', async () => {
      const wrapper = await mount({ items: [items[0]!, { ...items[1]!, disabled: true }], modelValue: 'one' })

      await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(selectedOf(wrapper)).toEqual(['true', 'false'])
    })

    it('moves the default panel with the selection', async () => {
      const wrapper = await mount({ modelValue: 'one' }, {
        default: ({ value }: { value: string | number | null }) => `Panel ${value}`,
      })

      await wrapper.findAll('[role="tab"]')[2]!.trigger('click')

      expect(wrapper.find('[role="tabpanel"]').text()).toBe('Panel three')
    })
  })

  describe('model', () => {
    it('follows a model changed by the parent', async () => {
      const wrapper = await mount({ modelValue: 'one' })

      await wrapper.setProps({ modelValue: 'three' })

      expect(selectedOf(wrapper)).toEqual(['false', 'false', 'true'])
    })

    it('selects the bound tab when the tabs arrive after mount', async () => {
      const wrapper = await mount({ items: [], modelValue: 'two' })

      await wrapper.setProps({ items })
      await nextTick()

      expect(selectedOf(wrapper)).toEqual(['false', 'true', 'false'])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  // N.1a: a preset non-first v-model used to be applied only by a watch that
  // never ran again once the tabs had registered.
  describe('preset', () => {
    it('selects a preset non-first tab and leaves the model alone', async () => {
      const wrapper = await mount({ modelValue: 'two' })
      await nextTick()

      expect(selectedOf(wrapper)).toEqual(['false', 'true', 'false'])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('selects a preset slotted tab that registers after the first', async () => {
      const wrapper = await mountHost(defineComponent({
        render: () => h(MTabs, { modelValue: 'c', ariaLabel: 'Sections' }, {
          tabs: () => ['a', 'b', 'c'].map(value => h(MTab, { value, label: value })),
        }),
      }))
      await nextTick()

      expect(selectedOf(wrapper)).toEqual(['false', 'false', 'true'])
    })

    // N.1b (Q50-А): the auto-selected first tab is written to an empty model.
    it('writes the auto-selected first tab into an empty model', async () => {
      const wrapper = await mount()
      await nextTick()

      expect(selectedOf(wrapper)[0]).toBe('true')
      expect(wrapper.emitted('update:modelValue')).toEqual([['one']])
    })

    it('falls back to the first tab when the preset matches none', async () => {
      const wrapper = await mount({ modelValue: 'missing' })
      await nextTick()

      expect(selectedOf(wrapper)[0]).toBe('true')
      expect(wrapper.emitted('update:modelValue')).toEqual([['one']])
    })

    it('falls back to the first tab when the preset tab is disabled', async () => {
      const wrapper = await mount({ items: [items[0]!, { ...items[1]!, disabled: true }], modelValue: 'two' })
      await nextTick()

      expect(selectedOf(wrapper)).toEqual(['true', 'false'])
      expect(wrapper.emitted('update:modelValue')).toEqual([['one']])
    })

    it('keeps a two-way binding in step with the selection', async () => {
      const value = ref<string | number | null>('three')
      const wrapper = await mountHost(defineComponent({
        render: () => h(MTabs, {
          'items': items,
          'ariaLabel': 'Sections',
          'modelValue': value.value,
          'onUpdate:modelValue': (next: string | number | null) => {
            value.value = next
          },
        }),
      }))

      await wrapper.findAll('[role="tab"]')[0]!.trigger('click')

      expect(value.value).toBe('one')
    })
  })

  describe('server render', () => {
    it('renders the preset tab selected in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MTabs, { items, modelValue: 'three', ariaLabel: 'Sections' }),
      })))

      expect(html.match(/aria-selected="(true|false)"/g)).toEqual(['aria-selected="false"', 'aria-selected="false"', 'aria-selected="true"'])
    })

    it('renders the first tab selected in the server HTML when the model is empty', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MTabs, { items, ariaLabel: 'Sections' }),
      })))

      expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
      expect(html.indexOf('aria-selected="true"')).toBeLessThan(html.indexOf('aria-selected="false"'))
    })

    it('fills the default panel for the preset tab in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MTabs, { items, modelValue: 'two', ariaLabel: 'Sections' }, {
          default: ({ value }: { value: string }) => `Panel ${value}`,
        }),
      })))

      expect(html).toContain('Panel two')
    })
  })
})
