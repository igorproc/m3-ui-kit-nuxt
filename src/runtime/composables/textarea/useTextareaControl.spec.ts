import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, reactive, ref } from 'vue'
import { useTextareaControl } from './useTextareaControl'
import type { TextareaControlProps } from './useTextareaControl'
import type { Ref } from 'vue'

type Control = ReturnType<typeof useTextareaControl>

/**
 * Mounts the attr bags onto anonymous markup — no kit component, no kit class
 * names. Anything asserted here is behavior the bags carry on their own.
 */
function createHarness(model: Ref<string>, props: TextareaControlProps = {}) {
  let control: Control | null = null
  const focused = ref(false)

  const component = defineComponent({
    setup() {
      control = useTextareaControl(model, focused, props, 'harness')

      return () => h('div', [
        h('label', control!.labelAttrs.value, 'Notes'),
        h('textarea', {
          ...control!.inputAttrs.value,
          ref: (el: unknown) => {
            control!.element.value = el as HTMLTextAreaElement
          },
          value: model.value,
        }),
        h('span', control!.counterAttrs.value, control!.counter.value?.text),
        h('p', control!.supportAttrs.value, control!.message.value),
        h('i', control!.gripAttrs.value),
      ])
    },
  })

  return { component, focused, getControl: () => control! }
}

describe('useTextareaControl', () => {
  it('wires a label, a description and a counter to markup it knows nothing about', async () => {
    const model = ref('abc')
    const { component } = createHarness(model, { helperText: 'Markdown supported', counter: 20 })

    const wrapper = await mountSuspended(component)
    const textarea = wrapper.find('textarea')

    expect(wrapper.find('label').attributes('for')).toBe(textarea.attributes('id'))
    expect(textarea.attributes('aria-describedby'))
      .toBe(`${wrapper.find('p').attributes('id')} ${wrapper.find('span').attributes('id')}`)
    expect(wrapper.find('span').text()).toBe('3 / 20')
  })

  it('tracks a reactive props object without any getter plumbing', async () => {
    const model = ref('')
    const props = reactive<TextareaControlProps>({ helperText: 'Hint', required: false })
    const { component } = createHarness(model, props)

    const wrapper = await mountSuspended(component)
    expect(wrapper.find('textarea').attributes('aria-required')).toBeUndefined()

    props.required = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('textarea').attributes('aria-required')).toBe('true')
  })

  it('resolves the support message in priority order', async () => {
    const model = ref('')
    const { component } = createHarness(model, { helperText: 'Hint', errorMessage: 'External failure' })

    const wrapper = await mountSuspended(component)

    expect(wrapper.find('p').text()).toBe('External failure')
    expect(wrapper.find('p').attributes('role')).toBe('alert')
  })

  it('derives the counter limit from maxlength when the counter is a plain flag', async () => {
    const model = ref('hello')
    const { component, getControl } = createHarness(model, { counter: true, maxlength: 50 })

    await mountSuspended(component)

    expect(getControl().counter.value).toMatchObject({ length: 5, limit: 50, remaining: 45, nearLimit: false })
  })

  it('flags the counter as near the limit only inside the announcement threshold', async () => {
    const model = ref('a'.repeat(89))
    const { component, getControl } = createHarness(model, { counter: true, maxlength: 100 })

    await mountSuspended(component)
    expect(getControl().counter.value?.nearLimit).toBe(false)

    model.value = 'a'.repeat(91)
    expect(getControl().counter.value?.nearLimit).toBe(true)
  })

  it('drops the counter entirely when it is switched off', async () => {
    const model = ref('abc')
    const { component, getControl } = createHarness(model, { helperText: 'Hint' })

    const wrapper = await mountSuspended(component)

    expect(getControl().counter.value).toBeUndefined()
    expect(wrapper.find('textarea').attributes('aria-describedby')).toBe(wrapper.find('p').attributes('id'))
  })

  it('flips the focus model through the input bag handlers', async () => {
    const model = ref('')
    const { component, focused } = createHarness(model)

    const wrapper = await mountSuspended(component)

    await wrapper.find('textarea').trigger('focus')
    expect(focused.value).toBe(true)

    await wrapper.find('textarea').trigger('blur')
    expect(focused.value).toBe(false)
  })

  it('publishes the interaction state the container passes down to a footer', async () => {
    const model = ref('')
    const props = reactive<TextareaControlProps>({ disabled: false, readonly: false })
    const { component, getControl } = createHarness(model, props)

    await mountSuspended(component)
    expect(getControl().fieldState.value).toEqual({ disabled: false, readonly: false })

    props.readonly = true
    expect(getControl().fieldState.value).toEqual({ disabled: false, readonly: true })
  })

  it('publishes growth bounds as custom properties instead of inline heights', async () => {
    const model = ref('')
    const { component } = createHarness(model, { rows: 2, maxRows: 6, autoGrow: true })

    const wrapper = await mountSuspended(component)
    const style = wrapper.find('textarea').attributes('style')!

    expect(style).toContain('--m-textarea-rows: 2')
    expect(style).toContain('--m-textarea-max-rows: 6')
    expect(style).not.toContain('height:')
  })

  it('carries the whole resize widget role on the grip bag', async () => {
    const model = ref('')
    const { component, getControl } = createHarness(model, {
      rows: 3,
      maxRows: 9,
      resizable: true,
      resizeLabel: 'Resize',
    })

    const wrapper = await mountSuspended(component)
    const grip = wrapper.find('i')

    expect(grip.attributes('role')).toBe('separator')
    expect(grip.attributes('aria-valuenow')).toBe('3')

    await grip.trigger('keydown', { key: 'End' })

    expect(getControl().currentRows.value).toBe(9)
    expect(wrapper.find('textarea').attributes('style')).toContain('height:')
  })

  it('reports and clears a hand-set height', async () => {
    const model = ref('')
    const { component, getControl } = createHarness(model, { rows: 3, resizable: true })

    const wrapper = await mountSuspended(component)

    await wrapper.find('i').trigger('keydown', { key: 'ArrowDown' })
    expect(getControl().hasManualHeight.value).toBe(true)

    getControl().reset()
    expect(getControl().hasManualHeight.value).toBe(false)
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    const model = ref('text')
    const { component, getControl } = createHarness(model, { error: true })

    await mountSuspended(component)
    const bags = [
      getControl().inputAttrs.value,
      getControl().labelAttrs.value,
      getControl().supportAttrs.value,
      getControl().counterAttrs.value,
      getControl().gripAttrs.value,
    ]

    for (const bag of bags) {
      const keys = Object.keys(bag)

      expect(keys).not.toContain('class')
      expect(keys.filter(key => key.startsWith('data-'))).toHaveLength(0)
    }
  })
})
