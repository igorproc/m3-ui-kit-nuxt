import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DOMWrapper } from '@vue/test-utils'
import { base, cities, createHost, destroyHost, input, mount } from './helpers'

beforeEach(createHost)
afterEach(destroyHost)

// Q30-А: a form gets the value, not the title in the box.
describe('m-dropdown · form', () => {
  const hidden = (wrapper: Awaited<ReturnType<typeof mount>>) => wrapper.findAll('input[type="hidden"]')

  it('submits the chosen value under its name, and the visible input carries none', async () => {
    const wrapper = await mount({ ...base, name: 'city', modelValue: 3 })

    expect(hidden(wrapper).map((field: DOMWrapper<Element>) => [field.attributes('name'), (field.element as HTMLInputElement).value])).toEqual([['city', '3']])
    expect(input(wrapper).attributes('name')).toBeUndefined()
  })

  it('submits one value per choice with multiple, like a select', async () => {
    const wrapper = await mount({ ...base, name: 'cities', multiple: true, modelValue: [1, 3] })

    expect(hidden(wrapper).map((field: DOMWrapper<Element>) => (field.element as HTMLInputElement).value)).toEqual(['1', '3'])
  })

  it('submits the id of a whole item when there is no item-value', async () => {
    const wrapper = await mount({ items: cities, itemTitle: 'name', name: 'city', modelValue: cities[2] })

    expect((hidden(wrapper)[0]!.element as HTMLInputElement).value).toBe('3')
  })

  it('submits nothing for an empty selection, and nothing while disabled', async () => {
    const empty = await mount({ ...base, name: 'city' })
    expect(hidden(empty)).toHaveLength(0)

    const disabled = await mount({ ...base, name: 'city', modelValue: 3, disabled: true })
    expect(hidden(disabled)[0]!.attributes('disabled')).toBeDefined()
  })

  it('follows the selection', async () => {
    const wrapper = await mount({ ...base, name: 'city', modelValue: 1 })

    await wrapper.setProps({ modelValue: 3 })

    expect((hidden(wrapper)[0]!.element as HTMLInputElement).value).toBe('3')
  })
})
