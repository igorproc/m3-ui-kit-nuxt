import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { base, chips, cities, createHost, destroyHost, input, mount, open, optionByText, options } from './helpers'
import type { City } from './helpers'

beforeEach(createHost)
afterEach(destroyHost)

describe('m-dropdown · axes', () => {
  it('forwards the field axes to the box it draws', async () => {
    const wrapper = await mount({
      ...base,
      variant: 'outlined',
      rounded: 'large',
      labelPlacement: 'top',
      density: 'compact',
      label: 'City',
    })

    const field = wrapper.find('.ui-text-field')
    expect(field.classes()).toContain('ui-text-field--outlined')
    expect(field.classes()).toContain('ui-text-field--large')
    expect(field.classes()).toContain('ui-text-field--label-top')
    expect(field.classes()).toContain('ui-text-field--density-compact')
  })

  it('carries its density into the rows of the panel', async () => {
    const wrapper = await mount({ ...base, density: 'compact' })
    await open(wrapper)

    expect(options()[0]!.className).toContain('ui-list-item--density-compact')
  })

  it('caps the panel through a custom property when maxHeight is given', async () => {
    const wrapper = await mount({ ...base, maxHeight: 200 })
    await open(wrapper)

    const list = document.querySelector<HTMLElement>('.ui-dropdown__list')!
    expect(list.style.getPropertyValue('--m-dropdown-panel-max-height')).toBe('200rem')
  })

  it('passes a string maxHeight through untouched', async () => {
    const wrapper = await mount({ ...base, maxHeight: '50vh' })
    await open(wrapper)

    const list = document.querySelector<HTMLElement>('.ui-dropdown__list')!
    expect(list.style.getPropertyValue('--m-dropdown-panel-max-height')).toBe('50vh')
  })

  it('drops the placeholder once something is selected', async () => {
    const empty = await mount({ ...base, placeholder: 'Nobody assigned' })
    expect(input(empty).attributes('placeholder')).toBe('Nobody assigned')

    // With chips in the box the field is not empty, and a floating label makes
    // the placeholder visible exactly when it has nothing left to say.
    const chosen = await mount({ ...base, multiple: true, modelValue: [1], placeholder: 'Nobody assigned' })
    expect(input(chosen).attributes('placeholder')).toBeUndefined()
  })

  it('shows the error state and message on the field', async () => {
    const wrapper = await mount({ ...base, error: true, errorMessage: 'Pick one' })

    expect(wrapper.find('.ui-text-field').classes()).toContain('ui-text-field--error')
    expect(wrapper.find('.ui-text-field__support').text()).toBe('Pick one')
  })
})

describe('m-dropdown · items', () => {
  it('reads label and value from the default keys', async () => {
    const wrapper = await mount({ items: [{ id: 7, label: 'Seven' }] })
    await open(wrapper)

    expect(options()[0]!.textContent).toContain('Seven')

    options()[0]!.click()
    // No `item-value`: the model carries the item that was chosen.
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ id: 7, label: 'Seven' }])
  })

  it('accepts resolver functions as well as keys', async () => {
    const wrapper = await mount({
      items: cities,
      itemTitle: (item: City) => item.name.toUpperCase(),
      itemValue: (item: City) => item.id,
    })
    await open(wrapper)

    expect(options()[0]!.textContent).toContain('ALPHA')
    options()[0]!.click()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
  })

  it('matches object values by id, so a refetched list keeps the selection', async () => {
    // A different object with the same id — what a second fetch returns.
    const wrapper = await mount({ items: cities, itemTitle: 'name', modelValue: { id: 3, name: 'Gamma' } })
    await open(wrapper)

    expect(optionByText('Gamma')!.getAttribute('aria-selected')).toBe('true')
    expect((input(wrapper).element as HTMLInputElement).value).toBe('Gamma')
  })

  it('honours a custom comparator', async () => {
    const wrapper = await mount({
      ...base,
      modelValue: '3',
      valueComparator: (left: unknown, right: unknown) => String(left) === String(right),
    })
    await open(wrapper)

    expect(optionByText('Gamma')!.getAttribute('aria-selected')).toBe('true')
  })

  it('keeps a selected value the items do not contain', async () => {
    // The async case: the form has a value, the options have not arrived.
    const wrapper = await mount({
      items: [],
      multiple: true,
      modelValue: [{ id: 42, label: 'Preset' }],
    })

    expect(chips(wrapper)).toHaveLength(1)
    expect(chips(wrapper)[0]!.text()).toContain('Preset')
    // And nothing rewrote the model behind the consumer's back.
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})

describe('m-dropdown · slots', () => {
  it('replaces a row body through the item slot without losing its semantics', async () => {
    const wrapper = await mountItemSlot()
    await open(wrapper)

    expect(options()).toHaveLength(3)
    expect(options()[0]!.textContent).toContain('· Alpha ·')
    // Custom content, kit semantics: the row root is still the option.
    expect(options()[0]!.getAttribute('role')).toBe('option')
    expect(options()[0]!.querySelector('.custom-row')).not.toBeNull()
  })

  it('replaces the whole panel through the default slot', async () => {
    const wrapper = await mountWithSlots()
    await open(wrapper)

    // The kit's list is gone; the consumer's markup carries the semantics.
    expect(document.querySelector('.ui-dropdown__list')).toBeNull()
    const listbox = document.querySelector('[role="listbox"].custom-panel')
    expect(listbox).not.toBeNull()
    expect(listbox!.querySelectorAll('[role="option"]')).toHaveLength(3)

    const row = listbox!.querySelector<HTMLElement>('[role="option"]')!
    row.click()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
  })

  it('renders the empty slot instead of the default copy', async () => {
    const wrapper = await mountEmptySlot()
    await open(wrapper)

    expect(document.querySelector('.custom-empty')?.textContent).toBe('Nothing here')
  })
})

async function mountWithSlots() {
  const { mountSuspended } = await import('@nuxt/test-utils/runtime')
  const { h } = await import('vue')
  const MDropdown = (await import('../index.vue')).default

  return mountSuspended(MDropdown, {
    props: base,
    slots: {
      default: (scope) => {
        const slot = scope as unknown as {
          entries: { id: string, title: string }[]
          listboxAttrs: Record<string, unknown>
          getOptionAttrs: (entry: unknown) => Record<string, unknown>
        }
        return h('div', { ...slot.listboxAttrs, class: 'custom-panel' },
          slot.entries.map(entry => h('div', slot.getOptionAttrs(entry), entry.title)))
      },
    },
  })
}

async function mountItemSlot() {
  const { mountSuspended } = await import('@nuxt/test-utils/runtime')
  const { h } = await import('vue')
  const MDropdown = (await import('../index.vue')).default

  return mountSuspended(MDropdown, {
    props: base,
    slots: {
      item: (scope) => {
        const { title } = scope as unknown as { title: string }
        return h('span', { class: 'custom-row' }, `· ${title} ·`)
      },
    },
  })
}

async function mountEmptySlot() {
  const { mountSuspended } = await import('@nuxt/test-utils/runtime')
  const { h } = await import('vue')
  const MDropdown = (await import('../index.vue')).default

  return mountSuspended(MDropdown, {
    props: { items: [] },
    slots: { empty: () => h('div', { class: 'custom-empty' }, 'Nothing here') },
  })
}
