import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MColorInput from './index.vue'

// The picker opens in an MMenu that teleports into #ui-overlay-host.
beforeEach(() => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  document.getElementById('ui-overlay-host')?.remove()
})

function mountInput(inputProps: Record<string, unknown> = {}) {
  const model = ref<string | null>((inputProps.modelValue as string) ?? null)
  const open = ref<boolean>(Boolean(inputProps.open))
  const changes: Array<string | null> = []
  const Harness = defineComponent({
    setup: () => () => h(MColorInput, {
      ...inputProps,
      'modelValue': model.value,
      'onUpdate:modelValue': (v: string | null) => { model.value = v },
      'open': open.value,
      'onUpdate:open': (v: boolean) => { open.value = v },
      'onChange': (v: string | null) => { changes.push(v) },
    }),
  })
  return { model, open, changes, mount: () => mountSuspended(Harness) }
}

function typeInto(wrapper: VueWrapper, value: string) {
  return wrapper.find('.ui-text-field__input').setValue(value)
}

describe('m-color-input', () => {
  it('displays the committed color formatted in the chosen family', async () => {
    const { mount } = mountInput({ modelValue: 'rgb(255, 0, 0)', format: 'hex' })
    const wrapper = await mount()

    expect((wrapper.find('.ui-text-field__input').element as HTMLInputElement).value).toBe('#ff0000')
  })

  it('commits a valid draft on Enter and emits change', async () => {
    const { model, changes, mount } = mountInput({ format: 'hex' })
    const wrapper = await mount()

    await typeInto(wrapper, '#00ff00')
    await wrapper.find('.ui-text-field__input').trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(model.value).toBe('#00ff00')
    expect(changes).toContain('#00ff00')
  })

  it('marks an invalid draft as error and emits invalid without touching the model', async () => {
    let invalidDraft: string | null = null
    const model = ref<string | null>('#111111')
    const Harness = defineComponent({
      setup: () => () => h(MColorInput, {
        'modelValue': model.value,
        'onUpdate:modelValue': (v: string | null) => { model.value = v },
        'onInvalid': (draft: string) => { invalidDraft = draft },
      }),
    })
    const wrapper = await mountSuspended(Harness)

    await typeInto(wrapper, 'nonsense')
    await wrapper.find('.ui-text-field__input').trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(invalidDraft).toBe('nonsense')
    expect(model.value).toBe('#111111')
  })

  it('opens the picker popover on the swatch trigger', async () => {
    const { open, mount } = mountInput({ modelValue: '#6750a4' })
    const wrapper = await mount()

    await wrapper.find('.ui-color-input__trigger').trigger('click')
    await nextTick()

    expect(open.value).toBe(true)
    expect(document.querySelector('.ui-color-picker')).not.toBeNull()
  })

  it('says which forms it takes when a typed value cannot be read', async () => {
    const { mount } = mountInput({ modelValue: '#111111', formatHint: 'Use #RRGGBB, rgb() or hsl()' })
    const wrapper = await mount()

    await typeInto(wrapper, 'nonsense')
    await wrapper.find('.ui-text-field__input').trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(wrapper.find('[role="alert"]').text()).toBe('Use #RRGGBB, rgb() or hsl()')
    expect(wrapper.find('.ui-text-field__input').attributes('aria-invalid')).toBe('true')
  })

  it('names the swatch button from its prop, with no copy of its own', async () => {
    const named = mountInput({ pickerLabel: 'Pick a colour' })
    expect((await named.mount()).find('.ui-color-input__trigger').attributes('aria-label')).toBe('Pick a colour')

    const bare = mountInput()
    expect((await bare.mount()).find('.ui-color-input__trigger').attributes('aria-label')).toBeUndefined()
  })

  it('forwards the field axes, required and name to the field', async () => {
    const { mount } = mountInput({ label: 'Accent', required: true, name: 'accent', density: 'compact', shape: 'large', variant: 'outlined' })
    const wrapper = await mount()
    const input = wrapper.find('.ui-text-field__input')

    expect(input.attributes('aria-required')).toBe('true')
    expect(input.attributes('name')).toBe('accent')
    expect(wrapper.find('.ui-text-field').classes()).toEqual(expect.arrayContaining([
      'ui-text-field--density-compact',
      'ui-text-field--shape-large',
      'ui-text-field--outlined',
    ]))
  })

  it('keeps the picker keys inside the picker, so the menu around it does not take them', async () => {
    const { mount } = mountInput({ modelValue: '#ff0000', open: true })
    await mount()
    await nextTick()

    const host = document.querySelector('.ui-color-input__picker')!
    const reached: string[] = []
    host.parentElement!.addEventListener('keydown', event => reached.push((event as KeyboardEvent).key))
    host.querySelector('.ui-color-picker__hue')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    host.querySelector('.ui-color-picker__hue')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(reached).toEqual(['Escape'])
  })

  it('does not open the picker when readonly', async () => {
    const { open, mount } = mountInput({ modelValue: '#6750a4', readonly: true })
    const wrapper = await mount()

    await wrapper.find('.ui-color-input__trigger').trigger('click')
    await nextTick()

    expect(open.value).toBe(false)
  })
})
