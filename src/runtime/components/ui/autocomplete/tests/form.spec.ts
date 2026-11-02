import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import type { DOMWrapper } from '@vue/test-utils'
import MAutocomplete from '../index.vue'

interface City { id: number, name: string, off?: boolean }

const items: City[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta', off: true },
  { id: 3, name: 'Gamma' },
]

const messages = { clear: 'Clear selection', toggle: 'Toggle options', loading: 'Loading options', empty: 'No options', noResults: 'No results' }
const base = { items, itemTitle: 'name', itemValue: 'id', itemDisabled: 'off', messages } as const

let host: HTMLElement
let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown>, attach = false) {
  if (current) current.unmount()
  current = await mountSuspended(MAutocomplete, { props, ...(attach ? { attachTo: document.body } : {}) })
  return current as Awaited<ReturnType<typeof mountSuspended>>
}

beforeEach(() => {
  host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  current?.unmount()
  current = null
  host.remove()
})

const optionEls = () => [...document.querySelectorAll<HTMLElement>('.ui-dropdown-panel__option')]
const optionByText = (text: string) => optionEls().find(option => option.textContent?.includes(text))

async function openMenu(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'ArrowDown' })
  await nextTick()
}

describe('m-autocomplete · form', () => {
  async function mountForm(props: Record<string, unknown>) {
    if (current) current.unmount()
    current = await mountSuspended(MAutocomplete, { props })
    return current as Awaited<ReturnType<typeof mountSuspended>>
  }

  const hidden = (wrapper: Awaited<ReturnType<typeof mountForm>>) => wrapper.findAll('input[type="hidden"]')

  // Q30-А: a form gets the value, not the title in the box.
  it('submits the chosen value under its name, not the title', async () => {
    const wrapper = await mountForm({ ...base, name: 'city', modelValue: 3 })

    expect(hidden(wrapper).map((input: DOMWrapper<Element>) => [input.attributes('name'), (input.element as HTMLInputElement).value])).toEqual([['city', '3']])
    expect(wrapper.find('input.ui-text-field__input').attributes('name')).toBeUndefined()
  })

  it('submits one value per choice with multiple, like a select', async () => {
    const wrapper = await mountForm({ ...base, name: 'cities', multiple: true, modelValue: [1, 3] })

    expect(hidden(wrapper).map((input: DOMWrapper<Element>) => (input.element as HTMLInputElement).value)).toEqual(['1', '3'])
  })

  it('submits the id of a whole item when there is no item-value', async () => {
    const wrapper = await mountForm({ items, itemTitle: 'name', messages, name: 'city', modelValue: items[2] })

    expect((hidden(wrapper)[0]!.element as HTMLInputElement).value).toBe('3')
  })

  it('falls back to the adapter path for the name', async () => {
    const wrapper = await mountForm({ ...base, path: 'city', modelValue: 3 })

    expect(hidden(wrapper)[0]!.attributes('name')).toBe('city')
  })

  it('submits nothing without a name, and nothing while disabled', async () => {
    const bare = await mountForm({ ...base, modelValue: 3 })
    expect(hidden(bare)).toHaveLength(0)

    const disabled = await mountForm({ ...base, name: 'city', modelValue: 3, disabled: true })
    expect(hidden(disabled)[0]!.attributes('disabled')).toBeDefined()
  })
})
