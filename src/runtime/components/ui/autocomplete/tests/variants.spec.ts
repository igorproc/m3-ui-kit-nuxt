import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MAutocomplete from '../index.vue'

interface City { id: number, name: string, off?: boolean }

const items: City[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta', off: true },
  { id: 3, name: 'Gamma' },
  { id: 4, name: 'Delta' },
]

const base = { items, itemTitle: 'name', itemValue: 'id', itemDisabled: 'off' } as const

let host: HTMLElement
// Only one component stays mounted at a time so its teleported menu is the only
// one in the document — querying options across tests then never leaks.
let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown>, slots?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MAutocomplete, slots ? { props, slots } : { props })
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

async function openMenu(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'ArrowDown' })
  await nextTick()
}

const options = () => document.querySelectorAll('.ui-autocomplete__option')

describe('m-autocomplete · variants', () => {
  it('reflects the multiple and open props as root modifier classes', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1] })
    expect(wrapper.find('.ui-autocomplete').classes()).toContain('ui-autocomplete--multiple')

    await openMenu(wrapper)
    expect(wrapper.find('.ui-autocomplete').classes()).toContain('ui-autocomplete--open')
  })

  it('forwards the field variant to the underlying text field', async () => {
    for (const variant of ['filled', 'outlined'] as const) {
      const wrapper = await mount({ ...base, variant })
      expect(wrapper.find(`.ui-text-field--${variant}`).exists()).toBe(true)
    }
  })

  it('forwards label and placeholder to the native input', async () => {
    const wrapper = await mount({ ...base, label: 'City', placeholder: 'Search' })
    expect(wrapper.find('label.ui-text-field__label').text()).toBe('City')
    expect(wrapper.find('input.ui-text-field__input').attributes('placeholder')).toBe('Search')
  })

  it('applies disabled and readonly to the native input', async () => {
    const disabled = await mount({ ...base, disabled: true })
    expect(disabled.find('input.ui-text-field__input').attributes('disabled')).toBeDefined()

    const readonly = await mount({ ...base, readonly: true })
    expect(readonly.find('input.ui-text-field__input').attributes('readonly')).toBeDefined()
  })

  it('resolves item title, value, and disabled through string keys', async () => {
    const wrapper = await mount(base)
    await openMenu(wrapper)

    expect(options()).toHaveLength(4)
    expect(options()[0]!.textContent).toContain('Alpha')
    // The `off` entry (Beta) is rendered but disabled.
    expect(options()[1]!.getAttribute('aria-disabled')).toBe('true')
    expect(options()[1]!.classList.contains('ui-list-item--disabled')).toBe(true)
  })

  it('resolves item title and value through function resolvers', async () => {
    const wrapper = await mount({
      items,
      itemTitle: (item: City) => item.name.toUpperCase(),
      itemValue: (item: City) => item.id,
    })
    await openMenu(wrapper)
    expect(options()[0]!.textContent).toContain('ALPHA')
  })

  it('marks the selected option', async () => {
    const wrapper = await mount({ ...base, modelValue: 1 })
    await openMenu(wrapper)
    expect(document.querySelector('.ui-autocomplete__option.ui-list-item--selected')).toBeTruthy()
  })

  it('removes selected entries from the list when hide-selected is set', async () => {
    const wrapper = await mount({ ...base, multiple: true, hideSelected: true, modelValue: [1] })
    await openMenu(wrapper)
    const titles = [...options()].map(option => option.textContent)
    expect(titles.every(text => !text?.includes('Alpha'))).toBe(true)
    expect(titles).toHaveLength(3)
  })

  it('gates options behind min-search-length', async () => {
    const wrapper = await mount({ ...base, minSearchLength: 2 })
    const input = wrapper.find('input.ui-text-field__input')

    await input.setValue('a')
    await nextTick()
    expect(options()).toHaveLength(0)

    await input.setValue('al')
    await nextTick()
    expect(options()[0]!.textContent).toContain('Alpha')
  })

  it('filters by contains and starts-with modes', async () => {
    const contains = await mount(base)
    await contains.find('input.ui-text-field__input').setValue('a')
    await nextTick()
    // "a" is a substring of Alpha, Beta, Gamma, and Delta.
    expect(options()).toHaveLength(4)

    const prefix = await mount({ ...base, filterMode: 'starts-with' })
    await prefix.find('input.ui-text-field__input').setValue('a')
    await nextTick()
    // Only Alpha starts with "a".
    expect(options()).toHaveLength(1)
  })

  it('disables filtering when filter is false', async () => {
    const wrapper = await mount({ ...base, filter: false })
    await wrapper.find('input.ui-text-field__input').setValue('zzz')
    await nextTick()
    expect(options()).toHaveLength(4)
  })

  it('renders the clear control only when clearable and there is a value', async () => {
    const withoutValue = await mount({ ...base, clearable: true })
    expect(withoutValue.find('[aria-label="Clear selection"]').exists()).toBe(false)

    const withValue = await mount({ ...base, clearable: true, modelValue: 1 })
    expect(withValue.find('[aria-label="Clear selection"]').exists()).toBe(true)
  })

  it('shows the loading affordance while loading', async () => {
    const wrapper = await mount({ ...base, loading: true })
    await openMenu(wrapper)
    expect(document.querySelector('[aria-label="Loading options"]')).toBeTruthy()
  })

  describe('slots', () => {
    it('renders a custom item slot', async () => {
      const wrapper = await mount(base, { item: ({ title }: { title: string }) => `★ ${title}` })
      await openMenu(wrapper)
      expect(options()[0]!.textContent).toContain('★ Alpha')
    })

    it('renders a custom selection slot for chips', async () => {
      const wrapper = await mount(
        { ...base, multiple: true, modelValue: [1] },
        { selection: ({ title }: { title: string }) => `#${title}` },
      )
      expect(wrapper.text()).toContain('#Alpha')
    })

    it('renders the empty slot when there are no items', async () => {
      const wrapper = await mount({ items: [] }, { empty: () => 'Nothing here' })
      await openMenu(wrapper)
      expect(document.body.textContent).toContain('Nothing here')
    })

    it('renders the no-results slot with the current query', async () => {
      const wrapper = await mount(base, { 'no-results': ({ query }: { query: string }) => `No match for ${query}` })
      await wrapper.find('input.ui-text-field__input').setValue('zzz')
      await nextTick()
      expect(document.body.textContent).toContain('No match for zzz')
    })
  })
})
