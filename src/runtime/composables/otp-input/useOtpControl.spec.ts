import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, reactive, ref } from 'vue'
import { useOtpControl } from './useOtpControl'
import type { OtpControlProps } from './useOtpControl'
import type { OtpValueHooks } from './useOtpValue'
import type { Ref } from 'vue'

type Control = ReturnType<typeof useOtpControl>

/**
 * Mounts the attr bags onto anonymous markup — no kit component, no kit class
 * names. Anything asserted here is behavior the bags carry on their own, which
 * is the whole promise of the escape hatch.
 */
function createHarness(
  model: Ref<string>,
  props: OtpControlProps,
  hooks: OtpValueHooks = {},
) {
  let control: Control | null = null
  const focused = ref(false)

  const component = defineComponent({
    setup() {
      control = useOtpControl(model, focused, props, hooks, 'harness')

      return () => h('div', [
        h('label', control!.labelAttrs.value, 'One-time code'),
        ...control!.groups.value.flatMap(cells => cells.map(cell =>
          h('i', { ...control!.cellAttrs(cell.index), key: cell.index }, cell.character || '·'),
        )),
        h('input', {
          ...control!.inputAttrs.value,
          ref: (el: unknown) => {
            control!.element.value = el as HTMLInputElement
          },
        }),
        h('p', control!.supportAttrs.value, control!.message.value),
      ])
    },
  })

  return { component, focused, getControl: () => control! }
}

describe('useOtpControl', () => {
  it('wires one named input to a grid it knows nothing about', async () => {
    const model = ref('12')
    const { component } = createHarness(model, { length: 4, mode: 'numeric' })

    const wrapper = await mountSuspended(component)
    const input = wrapper.find('input')

    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.findAll('i')).toHaveLength(4)
    expect(input.attributes('aria-labelledby')).toBe(wrapper.find('label').attributes('id'))
    expect(input.attributes('autocomplete')).toBe('one-time-code')
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    const model = ref('')
    const { component, getControl } = createHarness(model, { length: 2, mode: 'numeric', error: true })

    await mountSuspended(component)
    const bags: object[] = [
      getControl().inputAttrs.value,
      getControl().labelAttrs.value,
      getControl().supportAttrs.value,
      getControl().cellAttrs(0),
    ]

    for (const bag of bags) {
      for (const key of Object.keys(bag)) {
        expect(key).not.toBe('class')
        expect(key.startsWith('data-')).toBe(false)
      }
    }
  })

  it('tracks a reactive props object without any getter plumbing', async () => {
    const model = ref('')
    const props = reactive<OtpControlProps>({ length: 4, mode: 'numeric' })
    const { component } = createHarness(model, props)

    const wrapper = await mountSuspended(component)
    expect(wrapper.findAll('i')).toHaveLength(4)

    props.length = 6
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('i')).toHaveLength(6)
    expect(wrapper.find('input').attributes('maxlength')).toBe('6')
  })

  it('splits the cells into the groups it was given', async () => {
    const model = ref('')
    const { component, getControl } = createHarness(model, { length: 6, mode: 'numeric', groups: [2, 4] })

    await mountSuspended(component)

    expect(getControl().groups.value.map(group => group.length)).toEqual([2, 4])
  })

  it('sanitizes on the way in and reports what it dropped', async () => {
    const model = ref('')
    const onInvalid = vi.fn()
    const { component } = createHarness(model, { length: 4, mode: 'numeric' }, { onInvalid })

    const wrapper = await mountSuspended(component)
    await wrapper.find('input').setValue('1a2b')

    expect(model.value).toBe('12')
    expect(onInvalid).toHaveBeenCalledWith('1a2b', ['a', 'b'])
  })

  it('reports completion once and a clear once', async () => {
    const model = ref('')
    const onComplete = vi.fn()
    const onClear = vi.fn()
    const { component } = createHarness(model, { length: 3, mode: 'numeric' }, { onComplete, onClear })

    const wrapper = await mountSuspended(component)
    const input = wrapper.find('input')

    await input.setValue('123')
    await input.setValue('123')
    expect(onComplete).toHaveBeenCalledTimes(1)

    await input.setValue('')
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('marks a position live only while the field is focused', async () => {
    const model = ref('')
    const { component, focused, getControl } = createHarness(model, { length: 3, mode: 'numeric' })

    const wrapper = await mountSuspended(component)
    expect(getControl().groups.value[0]!.some(cell => cell.active)).toBe(false)

    focused.value = true
    await wrapper.vm.$nextTick()

    expect(getControl().groups.value[0]![0]!.active).toBe(true)
  })

  it('hides every cell from assistive tech', async () => {
    const model = ref('12')
    const { component } = createHarness(model, { length: 4, mode: 'numeric' })

    const wrapper = await mountSuspended(component)

    for (const cell of wrapper.findAll('i')) {
      expect(cell.attributes('aria-hidden')).toBe('true')
    }
  })

  it('takes a caller-supplied id, so ids stay stable across SSR', async () => {
    const model = ref('')
    const { component } = createHarness(model, { length: 4, mode: 'numeric', errorMessage: 'Nope' })

    const wrapper = await mountSuspended(component)

    expect(wrapper.find('input').attributes('id')).toBe('harness')
    expect(wrapper.find('p').attributes('id')).toBe('harness-message')
    expect(wrapper.find('input').attributes('aria-describedby')).toBe('harness-message')
  })
})
