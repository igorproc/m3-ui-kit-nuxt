import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import MSearch from './index.vue'
import MSearchList from './list/index.vue'
import MSearchListItem from './list/item/index.vue'

const cities = [
  { id: 1, title: 'Zürich' },
  { id: 2, title: 'Zagreb' },
  { id: 3, title: 'Berlin' },
]
const messages = { clear: 'Clear search', loading: 'Loading results', noResults: 'Nothing found' }

let host: HTMLElement
let current: { unmount: () => void } | null = null

async function mount(component: Parameters<typeof mountSuspended>[0], options: Parameters<typeof mountSuspended>[1] = {}) {
  current?.unmount()
  current = await mountSuspended(component, options)
  return current as Awaited<ReturnType<typeof mountSuspended>>
}

const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')]

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

describe('m-search · view', () => {
  it('opens a docked listbox of the items the query matches, without case or diacritics', async () => {
    const wrapper = await mount(MSearch, { props: { items: cities, messages } })
    const input = wrapper.find('input')

    await input.setValue('zu')
    await nextTick()

    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(document.querySelector('[role="listbox"]')!.id).toBe(input.attributes('aria-controls'))
    expect(options().map(option => option.textContent?.trim())).toEqual(['Zürich'])
  })

  it('walks the rows with the arrows and chooses one with Enter', async () => {
    const wrapper = await mount(MSearch, { props: { items: cities, messages } })
    const input = wrapper.find('input')

    await input.setValue('z')
    await nextTick()
    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    const active = input.attributes('aria-activedescendant')
    expect(active).toBe(options()[0]!.id)

    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(wrapper.emitted('select')!.at(-1)).toEqual([cities[0]])
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['Zürich'])
    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('runs the query on Enter when no row is active, and closes the view', async () => {
    const wrapper = await mount(MSearch, { props: { items: cities, messages } })
    const input = wrapper.find('input')

    await input.setValue('z')
    await nextTick()
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(wrapper.emitted('submit')!.at(-1)).toEqual(['z'])
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('steps back with Escape: closes the view, then clears the query', async () => {
    const wrapper = await mount(MSearch, { props: { items: cities, messages } })
    const input = wrapper.find('input')

    await input.setValue('z')
    await nextTick()
    await input.trigger('keydown', { key: 'Escape' })
    await nextTick()

    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('clear')).toBeFalsy()

    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('does not open onto nothing; a no-results message is something', async () => {
    const silent = await mount(MSearch, { props: { items: cities, messages: { clear: 'Clear' } } })
    await silent.find('input').setValue('xyz')
    await nextTick()
    expect(silent.find('input').attributes('aria-expanded')).toBe('false')

    const told = await mount(MSearch, { props: { items: cities, messages } })
    await told.find('input').setValue('xyz')
    await nextTick()
    expect(told.find('input').attributes('aria-expanded')).toBe('true')
    expect(document.querySelector('.ui-search-view__message')!.textContent?.trim()).toBe('Nothing found')
  })

  it('names a titled group and removes a row with Delete', async () => {
    const recent = ref(['acme renewal', 'invoices march'])
    const Host = defineComponent(() => () => h(MSearch, { ariaLabel: 'Search', messages }, {
      default: () => h(MSearchList, { title: 'Recent' }, () => recent.value.map(query => h(MSearchListItem, {
        key: query,
        headline: query,
        removable: true,
        onRemove: () => { recent.value = recent.value.filter(entry => entry !== query) },
      }))),
    }))

    const wrapper = await mount(Host)
    const input = wrapper.find('input')
    await input.trigger('pointerdown')
    await input.trigger('focus')
    await nextTick()

    const group = document.querySelector('[role="group"]')!
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent?.trim()).toBe('Recent')

    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    await input.trigger('keydown', { key: 'Delete' })
    await nextTick()

    expect(recent.value).toEqual(['invoices march'])
  })

  it('keeps the keyboard in document order when a row comes back', async () => {
    const wrapper = await mount(MSearch, { props: { items: cities, messages } })
    const input = wrapper.find('input')

    await input.setValue('zagreb')
    await nextTick()
    await input.setValue('z')
    await nextTick()
    await nextTick()

    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(input.attributes('aria-activedescendant')).toBe(options()[0]!.id)
    expect(options()[0]!.textContent?.trim()).toBe('Zürich')
  })

  it('lays an inline view in the flow, open while it has rows', async () => {
    const wrapper = await mount(MSearch, { props: { items: cities, messages, view: 'inline', modelValue: 'z' } })
    await nextTick()

    expect(wrapper.find('.ui-search-view--inline [role="listbox"]').exists()).toBe(true)
    expect(host.querySelector('[role="listbox"]')).toBeNull()
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true')
  })

  it('reports loading on the listbox and lays progress over the divider', async () => {
    const wrapper = await mount(MSearch, { props: { items: cities, messages, loading: true } })

    await wrapper.find('input').setValue('z')
    await nextTick()

    expect(document.querySelector('[role="listbox"]')!.getAttribute('aria-busy')).toBe('true')
    expect(document.querySelector('.ui-search-view__progress')).not.toBeNull()
  })
})
