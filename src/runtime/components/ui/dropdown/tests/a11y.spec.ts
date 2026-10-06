import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MDropdown from '../index.vue'
import { base, createHost, destroyHost, input, mount, open, options } from './helpers'
import type { Wrapper } from './helpers'

beforeEach(createHost)
afterEach(destroyHost)

describe('m-dropdown · a11y', () => {
  it('puts the combobox contract on the real input, not on a wrapper', async () => {
    const wrapper = await mount({ ...base, label: 'City' })
    const field = input(wrapper)

    expect(field.attributes('role')).toBe('combobox')
    expect(field.attributes('aria-haspopup')).toBe('listbox')
    expect(field.attributes('aria-expanded')).toBe('false')
    expect(field.attributes('aria-controls')).toBeTruthy()
    // A select offers no inline completion; the combobox says so.
    expect(field.attributes('aria-autocomplete')).toBe('none')
    expect(field.attributes('readonly')).toBeDefined()
  })

  it('points aria-controls at the listbox it opens', async () => {
    const wrapper = await mount(base)
    await open(wrapper)

    const listbox = document.querySelector('[role="listbox"]')
    expect(listbox).not.toBeNull()
    expect(listbox!.id).toBe(input(wrapper).attributes('aria-controls'))
    expect(input(wrapper).attributes('aria-expanded')).toBe('true')
  })

  it('marks the listbox multiselectable only in multiple mode', async () => {
    const single = await mount(base)
    await open(single)
    expect(document.querySelector('[role="listbox"]')!.getAttribute('aria-multiselectable')).toBeNull()

    const multi = await mount({ ...base, multiple: true })
    await open(multi)
    expect(document.querySelector('[role="listbox"]')!.getAttribute('aria-multiselectable')).toBe('true')
  })

  it('moves the virtual focus with aria-activedescendant while real focus stays put', async () => {
    const wrapper = await mount(base)
    await open(wrapper)

    const active = input(wrapper).attributes('aria-activedescendant')
    expect(active).toBeTruthy()
    expect(options().some(option => option.id === active)).toBe(true)
  })

  it('gives every row the option role, a stable id and no tab stop', async () => {
    const wrapper = await mount(base)
    await open(wrapper)

    for (const option of options()) {
      expect(option.getAttribute('role')).toBe('option')
      expect(option.getAttribute('tabindex')).toBe('-1')
      expect(option.id).toBeTruthy()
    }
  })

  it('reports selection and per-item disabled state on the rows', async () => {
    const wrapper = await mount({ ...base, modelValue: 1 })
    await open(wrapper)

    const [alpha, beta] = options()
    expect(alpha!.getAttribute('aria-selected')).toBe('true')
    expect(beta!.getAttribute('aria-selected')).toBe('false')
    expect(beta!.getAttribute('aria-disabled')).toBe('true')
  })

  it('names the listbox after the field and marks it busy while loading', async () => {
    const wrapper = await mount({ ...base, label: 'City', loading: true })
    await open(wrapper)

    const listbox = document.querySelector('[role="listbox"]')!
    expect(listbox.getAttribute('aria-label')).toBe('City')
    expect(listbox.getAttribute('aria-busy')).toBe('true')
  })

  it('lets the listbox own options only; progress and state sit beside it', async () => {
    const wrapper = await mount({ items: [], loading: true })
    await open(wrapper)

    const listbox = document.querySelector('[role="listbox"]')!
    expect(listbox.querySelector('[role="progressbar"]')).toBeNull()
    expect(document.querySelector('[role="progressbar"]')).not.toBeNull()

    await wrapper.setProps({ loading: false })
    expect(document.querySelector('.ui-dropdown__state')).not.toBeNull()
    expect(listbox.querySelector('.ui-dropdown__state')).toBeNull()
  })

  it('announces the empty panel through a live region that was already there', async () => {
    const wrapper = await mount({ items: [] })
    const region = wrapper.find('[role="status"]')

    expect(region.exists()).toBe(true)
    expect(region.text()).toBe('')

    await open(wrapper)
    await nextTick()
    expect(wrapper.find('[role="status"]').text()).toBe('No options')
  })

  it('announces a localised empty slot, not the fallback copy', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: { items: [] },
      slots: { empty: () => 'Нет вариантов' },
    })
    await open(wrapper as Wrapper)
    await nextTick()

    expect(wrapper.find('[role="status"]').text()).toBe('Нет вариантов')
    wrapper.unmount()
  })

  it('sends fallthrough attributes to the combobox and keeps class on the root', async () => {
    const wrapper = await mountSuspended(MDropdown, {
      props: base,
      attrs: { 'class': 'consumer', 'aria-describedby': 'hint', 'data-test': 'city' },
    })

    expect(wrapper.classes()).toContain('consumer')
    expect(wrapper.attributes('data-test')).toBeUndefined()
    expect(input(wrapper as Wrapper).attributes('data-test')).toBe('city')
    wrapper.unmount()
  })

  it('announces rows blocked by max as disabled', async () => {
    const wrapper = await mount({ ...base, multiple: true, max: 1, modelValue: [1] })
    await open(wrapper)

    expect(optionsById()['3']!.getAttribute('aria-disabled')).toBe('true')
    // The selected one is not blocked: removing it is the only legal move left.
    expect(optionsById()['1']!.getAttribute('aria-disabled')).toBeNull()
  })
})

/** Rows keyed by the item id embedded in their generated DOM id. */
function optionsById(): Record<string, HTMLElement> {
  return Object.fromEntries(options().map(option => [option.id.split('-option-')[1]!, option]))
}
