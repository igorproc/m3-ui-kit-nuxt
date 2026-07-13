import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MAutocomplete from '../app/components/ui/autocomplete/index.vue'

const items = [
  { id: 1, title: 'Alpha' },
  { id: 2, title: 'Beta', disabled: true },
  { id: 3, title: 'Gamma' },
]

let overlayHost: HTMLElement

beforeEach(() => {
  overlayHost = document.createElement('div')
  overlayHost.id = 'ui-overlay-host'
  document.body.appendChild(overlayHost)
})

afterEach(() => overlayHost.remove())

describe('m-autocomplete', () => {
  it('puts combobox semantics on the native input and updates search immediately', async () => {
    const wrapper = await mountSuspended(MAutocomplete, {
      props: { items, itemTitle: 'title', itemValue: 'id', itemDisabled: 'disabled' },
    })
    const input = wrapper.find('input.ui-text-field__input')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-haspopup')).toBe('listbox')
    await input.setValue('ga')
    await nextTick()
    expect(document.querySelector('.ui-autocomplete__option.ui-list-item')).toBeTruthy()
    expect(wrapper.emitted('update:search')?.at(-1)).toEqual(['ga'])
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('skips disabled entries and selects with the keyboard', async () => {
    const wrapper = await mountSuspended(MAutocomplete, {
      props: { items, itemTitle: 'title', itemValue: 'id', itemDisabled: 'disabled' },
    })
    const input = wrapper.find('input.ui-text-field__input')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
  })

  it('supports multiple values and Backspace removal', async () => {
    const wrapper = await mountSuspended(MAutocomplete, {
      props: {
        items,
        itemTitle: 'title',
        itemValue: 'id',
        multiple: true,
        modelValue: [1, 3],
      },
    })
    const input = wrapper.find('input.ui-text-field__input')
    await input.trigger('keydown', { key: 'Backspace' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1]])
  })
})
