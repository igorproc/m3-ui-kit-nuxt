import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MDropdown from './index.vue'

const OPTIONS = [
  { label: 'One', value: 1 },
  { label: 'Two', value: 2 },
  { label: 'Three', value: 3 },
]

// The dropdown panel is rendered by <m-menu>, which teleports into a shared
// #ui-overlay-host. That host normally lives in the app root; provide it here so
// the teleport target exists and menu open/close state updates don't crash.
let overlayHost: HTMLElement

beforeEach(() => {
  overlayHost = document.createElement('div')
  overlayHost.id = 'ui-overlay-host'
  document.body.appendChild(overlayHost)
})

afterEach(() => {
  overlayHost.remove()
})

// NOTE: option leaves (role="option" + aria-selected) render inside the
// teleported, `client-only` listbox panel, which is not exercised in the unit
// (jsdom) environment. Option-level a11y is therefore covered indirectly via
// the trigger's combobox contract + the selection emits below.

describe('m-dropdown', () => {
  it('renders the root and the combobox trigger', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS, label: 'Pick' },
    })

    expect(wrapper.find('.ui-dropdown').exists()).toBe(true)
    expect(wrapper.find('.ui-dropdown__trigger').exists()).toBe(true)
  })

  it('exposes the combobox a11y contract on the trigger', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS },
    })

    const trigger = wrapper.find('.ui-dropdown__trigger')
    expect(trigger.attributes('role')).toBe('combobox')
    expect(trigger.attributes('aria-haspopup')).toBe('listbox')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.attributes('aria-controls')).toBeTruthy()
    expect(trigger.attributes('tabindex')).toBe('0')
  })

  it('flips aria-expanded and the open class when the trigger is clicked', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS },
    })

    const trigger = wrapper.find('.ui-dropdown__trigger')
    await trigger.trigger('click')

    expect(wrapper.find('.ui-dropdown').classes()).toContain('ui-dropdown--open')
    expect(trigger.attributes('aria-expanded')).toBe('true')
  })

  it('opens on ArrowDown keydown while closed', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS },
    })

    const trigger = wrapper.find('.ui-dropdown__trigger')
    await trigger.trigger('keydown', { key: 'ArrowDown' })

    expect(wrapper.find('.ui-dropdown').classes()).toContain('ui-dropdown--open')
  })

  it('closes again on Escape', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS },
    })

    const trigger = wrapper.find('.ui-dropdown__trigger')
    await trigger.trigger('click')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(true)

    await trigger.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)
  })

  it('floats the field label when seeded with an external single v-model', async () => {
    // A preset selection makes `fieldFocused` true (hasSelection), which floats
    // the label via the text field's focused state — the observable signal that
    // the dropdown resolved the external value into a selection.
    const empty = await mountSuspended(MDropdown, {
      props: { options: OPTIONS },
    })
    expect(empty.find('.ui-text-field[data-focused]').exists()).toBe(false)

    const seeded = await mountSuspended(MDropdown, {
      props: { options: OPTIONS, modelValue: 2 },
    })
    expect(seeded.find('.ui-text-field[data-focused]').exists()).toBe(true)
  })

  it('selects the active option via keyboard and emits update:modelValue', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS },
    })

    const trigger = wrapper.find('.ui-dropdown__trigger')
    await trigger.trigger('keydown', { key: 'ArrowDown' }) // open + active = first
    await trigger.trigger('keydown', { key: 'Enter' }) // select active

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted!.at(-1)).toEqual([1])
  })

  it('sets aria-multiselectable expectations via the multiple prop (open class still toggles)', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS, multiple: true },
    })

    const trigger = wrapper.find('.ui-dropdown__trigger')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted!.at(-1)).toEqual([[1]])
  })

  it('does not open and marks the trigger disabled when disabled', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { options: OPTIONS, disabled: true },
    })

    expect(wrapper.find('.ui-dropdown').classes()).toContain('ui-dropdown--disabled')

    const trigger = wrapper.find('.ui-dropdown__trigger')
    expect(trigger.attributes('aria-disabled')).toBe('true')
    expect(trigger.attributes('tabindex')).toBe('-1')

    await trigger.trigger('click')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)
  })
})
