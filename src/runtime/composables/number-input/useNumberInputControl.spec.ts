import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, reactive, ref } from 'vue'
import { useNumberInputControl } from './useNumberInputControl'
import type { NumberInputControlProps } from './useNumberInputControl'
import type { NumberValueHooks } from './useNumberValue'
import type { Ref } from 'vue'

type Control = ReturnType<typeof useNumberInputControl>

/**
 * Mounts the attr bags onto anonymous markup — no kit component, no kit class
 * names, no `<MIcon>`. Anything asserted here is behavior the bags carry on
 * their own, which is the whole promise of the escape hatch.
 */
function createHarness(
  model: Ref<number | null>,
  props: NumberInputControlProps = {},
  hooks: NumberValueHooks = {},
) {
  let control: Control | null = null
  const focused = ref(false)

  const component = defineComponent({
    setup() {
      control = useNumberInputControl(model, focused, props, hooks, 'harness')

      return () => h('div', [
        h('label', { ...control!.labelAttrs.value, ref: (el: unknown) => {
          control!.handle.value = el as HTMLElement
        } }, 'Width'),
        h('input', {
          ...control!.inputAttrs.value,
          ref: (el: unknown) => {
            control!.element.value = el as HTMLInputElement
          },
          value: control!.draft.value,
          onInput: (event: Event) => {
            control!.draft.value = (event.target as HTMLInputElement).value
            control!.inputAttrs.value.onInput()
          },
        }),
        h('button', control!.decrementAttrs.value, '-'),
        h('button', control!.incrementAttrs.value, '+'),
        h('p', control!.supportAttrs.value, control!.message.value),
      ])
    },
  })

  return { component, focused, getControl: () => control! }
}

describe('useNumberInputControl', () => {
  it('wires a label, a description and a spinbutton to markup it knows nothing about', async () => {
    const model = ref<number | null>(5)
    const { component } = createHarness(model, { helperText: 'Pixels', min: 0, max: 10 })

    const wrapper = await mountSuspended(component)
    const input = wrapper.find('input')

    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBe(wrapper.find('p').attributes('id'))
    expect(input.attributes('role')).toBe('spinbutton')
    expect(input.attributes('aria-valuenow')).toBe('5')
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    const model = ref<number | null>(5)
    const { component, getControl } = createHarness(model, { error: true })

    await mountSuspended(component)
    const bags = [
      getControl().inputAttrs.value,
      getControl().labelAttrs.value,
      getControl().supportAttrs.value,
      getControl().incrementAttrs.value,
      getControl().decrementAttrs.value,
    ] as Record<string, unknown>[]

    for (const bag of bags) {
      for (const key of Object.keys(bag)) {
        expect(key).not.toBe('class')
        expect(key.startsWith('data-')).toBe(false)
      }
    }
  })

  it('tracks a reactive props object without any getter plumbing', async () => {
    const model = ref<number | null>(5)
    const props = reactive<NumberInputControlProps>({ max: 10, required: false })
    const { component } = createHarness(model, props)

    const wrapper = await mountSuspended(component)
    expect(wrapper.find('input').attributes('aria-required')).toBeUndefined()
    expect(wrapper.find('input').attributes('aria-valuemax')).toBe('10')

    props.required = true
    props.max = 20
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input').attributes('aria-required')).toBe('true')
    expect(wrapper.find('input').attributes('aria-valuemax')).toBe('20')
  })

  it('steps the model from the attr bags alone', async () => {
    const model = ref<number | null>(3)
    const onStep = vi.fn()
    const { component } = createHarness(model, {}, { onStep })

    const wrapper = await mountSuspended(component)
    await wrapper.findAll('button')[1]!.trigger('click')

    expect(model.value).toBe(4)
    expect(onStep).toHaveBeenCalledWith(1, 4)
  })

  it('disables the control that would leave the range', async () => {
    const model = ref<number | null>(10)
    const { component } = createHarness(model, { min: 0, max: 10 })

    const wrapper = await mountSuspended(component)

    expect(wrapper.findAll('button')[0]!.attributes('disabled')).toBeUndefined()
    expect(wrapper.findAll('button')[1]!.attributes('disabled')).toBeDefined()
  })

  it('keeps an unparsable draft on screen while leaving the model alone', async () => {
    const model = ref<number | null>(12)
    const { component } = createHarness(model)

    const wrapper = await mountSuspended(component)
    const input = wrapper.find('input')

    input.element.value = '-'
    await input.trigger('input')

    expect(input.element.value).toBe('-')
    expect(model.value).toBe(12)
  })

  it('clamps only on commit, and says so', async () => {
    const model = ref<number | null>(1)
    const onInvalid = vi.fn()
    const { component } = createHarness(model, { min: 0, max: 10 }, { onInvalid })

    const wrapper = await mountSuspended(component)
    const input = wrapper.find('input')

    input.element.value = '55'
    await input.trigger('input')
    expect(model.value).toBe(55)

    await input.trigger('blur')
    expect(model.value).toBe(10)
    expect(onInvalid).toHaveBeenCalledWith('55', 'out-of-range')
  })

  it('announces an error only when there is one', async () => {
    const model = ref<number | null>(1)
    const props = reactive<NumberInputControlProps>({ helperText: 'Pixels' })
    const { component } = createHarness(model, props)

    const wrapper = await mountSuspended(component)
    expect(wrapper.find('p').attributes('role')).toBeUndefined()

    props.errorMessage = 'Out of range'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('p').attributes('role')).toBe('alert')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('drives the value from a drag on whatever element is given as the handle', async () => {
    const model = ref<number | null>(240)
    const { component } = createHarness(model, { controls: 'scrub' })

    const wrapper = await mountSuspended(component)
    await wrapper.find('label').trigger('pointerdown', { clientX: 0, clientY: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 20, clientY: 0 }))

    expect(model.value).toBe(245)
  })

  it('leaves the handle inert until scrub is asked for', async () => {
    const model = ref<number | null>(240)
    const { component } = createHarness(model)

    const wrapper = await mountSuspended(component)
    await wrapper.find('label').trigger('pointerdown', { clientX: 0, clientY: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 20, clientY: 0 }))

    expect(model.value).toBe(240)
  })

  it('takes a caller-supplied id, so ids stay stable across SSR', async () => {
    const model = ref<number | null>(1)
    const { component } = createHarness(model, { helperText: 'Pixels' })

    const wrapper = await mountSuspended(component)

    expect(wrapper.find('input').attributes('id')).toBe('harness')
    expect(wrapper.find('p').attributes('id')).toBe('harness-message')
  })
})
