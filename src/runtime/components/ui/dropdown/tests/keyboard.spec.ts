import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { base, createHost, destroyHost, input, mount, optionByText, options } from './helpers'
import type { Wrapper } from './helpers'

beforeEach(createHost)
afterEach(destroyHost)

const fruit = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Blueberry' },
  { id: 4, name: 'Cherry', off: true },
  { id: 5, name: 'New Delhi' },
  { id: 6, name: 'New York' },
]

const many = Array.from({ length: 30 }, (_, index) => ({ id: index + 1, name: `Row ${index + 1}` }))

/** Keys with modifiers, which the helpers' `press` does not carry. */
async function key(wrapper: Wrapper, name: string, modifiers: Partial<KeyboardEventInit> = {}) {
  await input(wrapper).trigger('keydown', { key: name, ...modifiers })
  await nextTick()
  await nextTick()
}

const activeTitle = (wrapper: Wrapper) => {
  const id = input(wrapper).attributes('aria-activedescendant')
  return options().find(option => option.id === id)?.textContent?.trim()
}

const isOpen = (wrapper: Wrapper) => wrapper.find('.ui-dropdown--open').exists()

describe('m-dropdown · keyboard (APG select-only combobox)', () => {
  it('opens on a typed letter and lands on the first row starting with it', async () => {
    const wrapper = await mount({ ...base, items: fruit })

    await key(wrapper, 'b')
    expect(isOpen(wrapper)).toBe(true)
    expect(activeTitle(wrapper)).toBe('Banana')
  })

  it('cycles through the rows sharing a repeated first letter', async () => {
    const wrapper = await mount({ ...base, items: fruit })

    await key(wrapper, 'b')
    await key(wrapper, 'b')
    expect(activeTitle(wrapper)).toBe('Blueberry')

    await key(wrapper, 'b')
    expect(activeTitle(wrapper)).toBe('Banana')
  })

  it('matches a typed word, Space included, and skips disabled rows', async () => {
    const wrapper = await mount({ ...base, items: fruit })

    for (const letter of 'new y') await key(wrapper, letter)
    expect(activeTitle(wrapper)).toBe('New York')
    // Space was part of the word, not a choice.
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    await key(wrapper, 'Escape')
    await new Promise(resolve => setTimeout(resolve, 550))
    await key(wrapper, 'c')
    expect(activeTitle(wrapper)).not.toBe('Cherry')
  })

  it('opens on Home and End and lands on the first and last rows', async () => {
    const home = await mount(base)
    await key(home, 'Home')
    expect(isOpen(home)).toBe(true)
    expect(activeTitle(home)).toBe('Alpha')

    const end = await mount(base)
    await key(end, 'End')
    expect(activeTitle(end)).toBe('Gamma')
  })

  it('jumps ten rows with PageDown and PageUp, stopping at the ends', async () => {
    const wrapper = await mount({ ...base, items: many })

    await key(wrapper, 'ArrowDown')
    await key(wrapper, 'PageDown')
    expect(activeTitle(wrapper)).toBe('Row 11')

    await key(wrapper, 'PageDown')
    await key(wrapper, 'PageDown')
    expect(activeTitle(wrapper)).toBe('Row 30')

    await key(wrapper, 'PageUp')
    expect(activeTitle(wrapper)).toBe('Row 20')
  })

  it('opens with Alt+ArrowDown onto the current value', async () => {
    const wrapper = await mount({ ...base, modelValue: 3 })

    await key(wrapper, 'ArrowDown', { altKey: true })
    expect(isOpen(wrapper)).toBe(true)
    expect(activeTitle(wrapper)).toBe('Gamma')
  })

  it('chooses the active row and closes with Alt+ArrowUp', async () => {
    const wrapper = await mount(base)

    await key(wrapper, 'End')
    await key(wrapper, 'ArrowUp', { altKey: true })

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
    expect(isOpen(wrapper)).toBe(false)
  })

  it('names the chip under the keyboard as the active descendant', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })

    await key(wrapper, 'ArrowLeft')
    const chip = wrapper.findAll('.ui-dropdown__chip')[1]!
    expect(input(wrapper).attributes('aria-activedescendant')).toBe(chip.attributes('id'))

    await key(wrapper, 'ArrowRight')
    expect(input(wrapper).attributes('aria-activedescendant')).toBeUndefined()
  })

  it('rings the active row only while the keyboard drives it', async () => {
    const wrapper = await mount(base)

    await key(wrapper, 'ArrowDown')
    expect(optionByText('Alpha')!.classList).toContain('ui-dropdown__option--keyboard')

    optionByText('Gamma')!.dispatchEvent(new Event('pointermove', { bubbles: true }))
    await nextTick()
    await nextTick()
    const gamma = optionByText('Gamma')!
    expect(gamma.classList).toContain('ui-dropdown__option--active')
    expect(gamma.classList).not.toContain('ui-dropdown__option--keyboard')
  })
})
