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

const base = { items, itemTitle: 'name', itemValue: 'id', itemDisabled: 'off' } as const

let host: HTMLElement
let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MAutocomplete, { props })
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

const optionEls = () => [...document.querySelectorAll<HTMLElement>('.ui-autocomplete__option')]
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

  it('does not react to keyboard or clicks when disabled', async () => {
    const wrapper = await mount({ ...base, disabled: true })

    await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    expect(wrapper.emitted('update:open')).toBeFalsy()
    expect(document.querySelector('.ui-autocomplete__option')).toBeNull()
  })
})
