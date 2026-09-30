import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { base, createHost, destroyHost, input, mount, open, options } from './helpers'

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
