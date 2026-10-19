import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
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

describe('m-autocomplete · interaction', () => {
  it('selects an option on click and closes the menu (single)', async () => {
    const wrapper = await mount(base)
    await openMenu(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('does not select a disabled option', async () => {
    const wrapper = await mount(base)
    await openMenu(wrapper)

    optionByText('Beta')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('toggles values on click (multiple)', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [] })
    await openMenu(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1]])

    // Clicking the same option again toggles it back out.
    optionByText('Alpha')!.click()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('removes a chip on click', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })

    await wrapper.find('.ui-autocomplete__chip').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[3]])
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('clears the value with the clear control', async () => {
    const wrapper = await mount({ ...base, clearable: true, modelValue: 1 })

    await wrapper.find('[aria-label="Clear selection"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('toggles the menu with the toggle control', async () => {
    const wrapper = await mount(base)
    const toggle = wrapper.find('[aria-label="Toggle options"]')

    await toggle.trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])

    await toggle.trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('updates search and opens the menu on input', async () => {
    const wrapper = await mount(base)

    await wrapper.find('input.ui-text-field__input').setValue('ga')
    await nextTick()

    expect(wrapper.emitted('update:search')?.at(-1)).toEqual(['ga'])
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
    expect(optionByText('Gamma')).toBeTruthy()
  })

  it('does not open on focus before the query is long enough, and closes when it falls short', async () => {
    const wrapper = await mount({ ...base, minSearchLength: 2 })
    const input = wrapper.find('input.ui-text-field__input')

    await input.trigger('focus')
    await nextTick()
    expect(wrapper.emitted('update:open')).toBeFalsy()

    await input.setValue('ga')
    await nextTick()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])

    await input.setValue('g')
    await nextTick()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('opens on a press into the field, not on a keyboard focus', async () => {
    const wrapper = await mount(base)
    const input = wrapper.find('input.ui-text-field__input')

    await input.trigger('focus')
    await nextTick()
    expect(wrapper.emitted('update:open')).toBeFalsy()

    await input.trigger('blur')
    await input.trigger('pointerdown')
    await input.trigger('focus')
    await nextTick()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('opens on any focus with open-on-focus set to true', async () => {
    const wrapper = await mount({ ...base, openOnFocus: true })

    await wrapper.find('input.ui-text-field__input').trigger('focus')
    await nextTick()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('reopens a field with a value on the whole list, landing on the value', async () => {
    const wrapper = await mount({ ...base, modelValue: 3 })
    await openMenu(wrapper)

    expect(optionEls()).toHaveLength(3)
    const active = wrapper.find('input.ui-text-field__input').attributes('aria-activedescendant')
    expect(optionByText('Gamma')!.id).toBe(active)
  })

  it('does not turn a chosen title into a query', async () => {
    const wrapper = await mount(base)
    await openMenu(wrapper)

    optionByText('Gamma')!.click()
    await nextTick()

    expect((wrapper.find('input.ui-text-field__input').element as HTMLInputElement).value).toBe('Gamma')
    expect(wrapper.emitted('update:search')?.at(-1) ?? ['']).toEqual([''])
    await openMenu(wrapper)
    expect(optionEls()).toHaveLength(3)
  })

  it('opens on a press into a field that already has focus', async () => {
    const wrapper = await mount(base, true)
    const input = wrapper.find('input.ui-text-field__input')
    ;(input.element as HTMLInputElement).focus()
    await nextTick()

    await input.trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('does not open the toggle onto nothing below the minimum length', async () => {
    const wrapper = await mount({ ...base, minSearchLength: 2 })

    await wrapper.find('.ui-autocomplete__toggle').trigger('click')
    expect(wrapper.emitted('update:open')).toBeFalsy()
  })

  it('shows the selected title from the first render, without reporting a query', async () => {
    const wrapper = await mount({ ...base, modelValue: 3 })

    expect((wrapper.find('input.ui-text-field__input').element as HTMLInputElement).value).toBe('Gamma')
    expect(wrapper.emitted('update:search')).toBeFalsy()
  })

  it('leaves the query empty for a multiple selection — the chips name it', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1] })

    expect((wrapper.find('input.ui-text-field__input').element as HTMLInputElement).value).toBe('')
  })

  it('finds a title regardless of its diacritics', async () => {
    const wrapper = await mount({ ...base, items: [{ id: 1, name: 'Zürich' }, { id: 2, name: 'São Paulo' }] })
    const input = wrapper.find('input.ui-text-field__input')

    await input.setValue('zurich')
    await nextTick()
    expect(optionByText('Zürich')).toBeTruthy()

    await input.setValue('sao')
    await nextTick()
    expect(optionByText('São Paulo')).toBeTruthy()
  })

  it('keeps the rows while a new query loads', async () => {
    const wrapper = await mount(base)
    await openMenu(wrapper)

    await wrapper.setProps({ loading: true })
    expect(optionEls()).toHaveLength(3)
    expect(document.querySelector('[role="progressbar"]')).not.toBeNull()
    expect(document.querySelector('.ui-dropdown-panel__state')).toBeNull()
  })

  it('shows the loading state in place of rows only when there are none', async () => {
    const wrapper = await mount({ ...base, items: [], loading: true })
    await openMenu(wrapper)

    expect(document.querySelector('.ui-dropdown-panel__state')?.textContent).toContain('Loading options')
  })

  it('does not react to keyboard or clicks when disabled', async () => {
    const wrapper = await mount({ ...base, disabled: true })

    await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    expect(wrapper.emitted('update:open')).toBeFalsy()
    expect(document.querySelector('.ui-dropdown-panel__option')).toBeNull()
  })
})
