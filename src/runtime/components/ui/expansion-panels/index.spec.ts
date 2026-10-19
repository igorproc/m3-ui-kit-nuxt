import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MExpansionPanel from '#kit/components/ui/expansion-panel/index.vue'
import MExpansionPanels from './index.vue'
import type { PanelValue } from '#kit/components/ui/expansion-panel/props'

type Model = PanelValue | PanelValue[] | undefined

// Regression coverage for the grouped "initial v-model" bug: a preset value on
// the group must select/open the matching child at mount (the child registers
// after the group's setup, so the group applies the model when it registers).

describe('grouped initial v-model', () => {
  it('MExpansionPanels opens the panel matching a preset model at mount', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MExpansionPanels, { modelValue: 'b' }, () => [
        h(MExpansionPanel, { value: 'a', title: 'A' }, () => 'A body'),
        h(MExpansionPanel, { value: 'b', title: 'B' }, () => 'B body'),
      ]),
    }))

    const headers = wrapper.findAll('[aria-expanded]')
    expect(headers.length).toBeGreaterThanOrEqual(2)
    expect(headers[0]!.attributes('aria-expanded')).toBe('false')
    expect(headers[1]!.attributes('aria-expanded')).toBe('true')
  })

  // E-1 (M3-polish): the open panel has to be in the server HTML. Applied only
  // by a watch, it opened after hydration with a height transition that pushed
  // everything below it down.
  it('renders the preset panel open on the server', async () => {
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

interface GroupState {
  multiple: Ref<boolean>
  mandatory?: Ref<boolean>
  model: Ref<Model>
  values?: Ref<string[]>
}

function group({ multiple, mandatory = ref(false), model, values = ref(['a', 'b', 'c']) }: GroupState) {
  return defineComponent({
    render: () => h(MExpansionPanels, {
      'multiple': multiple.value,
      'mandatory': mandatory.value,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: Model) => {
        model.value = value
      },
    }, () => values.value.map((value, index) =>
      h(MExpansionPanel, { key: index, value, title: value.toUpperCase() }, () => `${value} body`))),
  })
}

const expanded = (wrapper: { findAll: (selector: string) => { attributes: (name: string) => string | undefined }[] }) =>
  wrapper.findAll('.ui-expansion-panel__header').map(header => header.attributes('aria-expanded') === 'true')

describe('reactive group mode', () => {
  it('keeps the open panel when it becomes multiple, as an array model', async () => {
    const state = { multiple: ref(false), model: ref<Model>('b') }
    const wrapper = await mountSuspended(group(state))

    state.multiple.value = true
    await nextTick()
    await nextTick()

    expect(state.model.value).toEqual(['b'])
    expect(expanded(wrapper)).toEqual([false, true, false])

    await wrapper.findAll('.ui-expansion-panel__header')[2]!.trigger('click')
    expect(expanded(wrapper)).toEqual([false, true, true])
  })

  it('keeps the first open panel when it becomes exclusive', async () => {
    const state = { multiple: ref(true), model: ref<Model>(['a', 'c']) }
    const wrapper = await mountSuspended(group(state))
    expect(expanded(wrapper)).toEqual([true, false, true])

    state.multiple.value = false
    await nextTick()
    await nextTick()

    expect(state.model.value).toBe('a')
    expect(expanded(wrapper)).toEqual([true, false, false])
  })

  it('follows a panel whose value changes', async () => {
    const values = ref(['a', 'b', 'c'])
    const state = { multiple: ref(false), model: ref<Model>('z'), values }
    const wrapper = await mountSuspended(group(state))
    expect(expanded(wrapper)).toEqual([false, false, false])

    values.value = ['a', 'z', 'c']
    await nextTick()
    await nextTick()

    expect(expanded(wrapper)).toEqual([false, true, false])

    await wrapper.findAll('.ui-expansion-panel__header')[1]!.trigger('click')
    expect(state.model.value).toBeUndefined()
  })

  it('marks the open panel of a mandatory exclusive group aria-disabled and keeps it open', async () => {
    const state = { multiple: ref(false), mandatory: ref(true), model: ref<Model>('a') }
    const wrapper = await mountSuspended(group(state))
    const headers = wrapper.findAll('.ui-expansion-panel__header')

    expect(headers[0]!.attributes('aria-disabled')).toBe('true')
    expect(headers[0]!.classes()).toContain('ui-expansion-panel__header--locked')
    expect(headers[1]!.attributes('aria-disabled')).toBeUndefined()
    expect(headers[1]!.classes()).not.toContain('ui-expansion-panel__header--locked')

    await headers[0]!.trigger('click')
    expect(state.model.value).toBe('a')

    await headers[1]!.trigger('click')
    expect(state.model.value).toBe('b')
    expect(headers[0]!.attributes('aria-disabled')).toBeUndefined()
    expect(headers[1]!.attributes('aria-disabled')).toBe('true')
  })
})
