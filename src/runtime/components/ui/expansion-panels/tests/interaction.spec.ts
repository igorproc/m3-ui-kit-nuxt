import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MExpansionPanel from '#kit/components/ui/expansion-panel/index.vue'
import MExpansionPanels from '../index.vue'
import { expanded, group } from './helpers'
import type { Model } from './helpers'

let current: { unmount: () => void } | null = null

async function mount(component: ReturnType<typeof group>) {
  if (current) current.unmount()
  current = await mountSuspended(component)

  return current as VueWrapper
}

const click = (wrapper: VueWrapper, index: number) => wrapper.findAll('.ui-expansion-panel__header')[index]!.trigger('click')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-expansion-panels · interaction', () => {
  describe('exclusive', () => {
    it('opens the clicked panel and closes the open one', async () => {
      const model = ref<Model>('a')
      const wrapper = await mount(group({ model }))

      await click(wrapper, 1)

      expect(model.value).toBe('b')
      expect(expanded(wrapper)).toEqual([false, true, false])
    })

    it('closes the open panel on a second click, leaving the model empty', async () => {
      const model = ref<Model>('a')
      const wrapper = await mount(group({ model }))

      await click(wrapper, 0)

      expect(model.value).toBeUndefined()
      expect(expanded(wrapper)).toEqual([false, false, false])
    })

    it('emits the opened value without a bound model', async () => {
      const wrapper = await mountSuspended(defineComponent({
        render: () => h(MExpansionPanels, null, () => [
          h(MExpansionPanel, { value: 'a', title: 'A' }),
          h(MExpansionPanel, { value: 'b', title: 'B' }),
        ]),
      }))

      await wrapper.findAll('.ui-expansion-panel__header')[1]!.trigger('click')

      expect(wrapper.findComponent(MExpansionPanels).emitted('update:modelValue')?.at(-1)).toEqual(['b'])
      wrapper.unmount()
    })

    it('follows a model changed from outside', async () => {
      const model = ref<Model>('a')
      const wrapper = await mount(group({ model }))

      model.value = 'c'
      await nextTick()

      expect(expanded(wrapper)).toEqual([false, false, true])
    })
  })

  describe('multiple', () => {
    it('accumulates open values into an array', async () => {
      const model = ref<Model>(undefined)
      const wrapper = await mount(group({ multiple: ref(true), model }))

      await click(wrapper, 0)
      await click(wrapper, 2)

      expect([...(model.value as string[])].sort()).toEqual(['a', 'c'])
      expect(expanded(wrapper)).toEqual([true, false, true])
    })

    it('closes one panel without touching the others', async () => {
      const model = ref<Model>(['a', 'b'])
      const wrapper = await mount(group({ multiple: ref(true), model }))

      await click(wrapper, 0)

      expect(model.value).toEqual(['b'])
    })
  })

  describe('mandatory', () => {
    it('keeps the open panel open on its own click and moves the lock on another', async () => {
      const model = ref<Model>('a')
      const wrapper = await mount(group({ mandatory: ref(true), model }))

      await click(wrapper, 0)
      expect(model.value).toBe('a')

      await click(wrapper, 1)
      expect(model.value).toBe('b')
      expect(expanded(wrapper)).toEqual([false, true, false])
    })
  })

  describe('disabled panel', () => {
    it('cannot be opened from its header', async () => {
      const model = ref<Model>(undefined)
      const wrapper = await mount(group({ model, disabled: ref(['b']) }))

      await click(wrapper, 1)

      expect(model.value).toBeUndefined()
    })
  })

  describe('reactive mode', () => {
    it('keeps the open panel when it becomes multiple, as an array model', async () => {
      const multiple = ref(false)
      const model = ref<Model>('b')
      const wrapper = await mount(group({ multiple, model }))

      multiple.value = true
      await nextTick()
      await nextTick()

      expect(model.value).toEqual(['b'])
      expect(expanded(wrapper)).toEqual([false, true, false])

      await click(wrapper, 2)
      expect(expanded(wrapper)).toEqual([false, true, true])
    })

    it('keeps the first open panel when it becomes exclusive', async () => {
      const multiple = ref(true)
      const model = ref<Model>(['a', 'c'])
      const wrapper = await mount(group({ multiple, model }))

      multiple.value = false
      await nextTick()
      await nextTick()

      expect(model.value).toBe('a')
      expect(expanded(wrapper)).toEqual([true, false, false])
    })

    it('follows a panel whose value changes', async () => {
      const values = ref(['a', 'b', 'c'])
      const model = ref<Model>('z')
      const wrapper = await mount(group({ model, values }))

      values.value = ['a', 'z', 'c']
      await nextTick()
      await nextTick()

      expect(expanded(wrapper)).toEqual([false, true, false])

      await click(wrapper, 1)
      expect(model.value).toBeUndefined()
    })
  })

  describe('server render', () => {
    // E-1 (M3-polish): applied only by a watch, the preset panel opened after
    // hydration with a height transition that pushed everything below it down.
    it('renders the preset panels open on the server', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => [
          h(MExpansionPanels, { modelValue: 'b' }, () => [
            h(MExpansionPanel, { value: 'a', title: 'A' }, () => 'A body'),
            h(MExpansionPanel, { value: 'b', title: 'B' }, () => 'B body'),
          ]),
          h(MExpansionPanels, { modelValue: ['a', 'c'], multiple: true }, () => ['a', 'b', 'c'].map(value =>
            h(MExpansionPanel, { value, title: value }, () => value))),
        ],
      })))

      expect(html.match(/aria-expanded="(true|false)"/g)).toEqual([
        'aria-expanded="false"',
        'aria-expanded="true"',
        'aria-expanded="true"',
        'aria-expanded="false"',
        'aria-expanded="true"',
      ])
    })
  })
})
