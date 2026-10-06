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

describe('m-autocomplete · a11y', () => {
  describe('ARIA wiring', () => {
    it('exposes combobox semantics wired to the listbox', async () => {
      const wrapper = await mount(base)
      const input = wrapper.find('input.ui-text-field__input')

      expect(input.attributes('role')).toBe('combobox')
      expect(input.attributes('aria-autocomplete')).toBe('list')
      expect(input.attributes('aria-haspopup')).toBe('listbox')
      expect(input.attributes('aria-expanded')).toBe('false')
      expect(input.attributes('aria-controls')).toBeTruthy()

      await input.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(wrapper.find('input.ui-text-field__input').attributes('aria-expanded')).toBe('true')
      expect(document.querySelector('[role="listbox"]')!.id).toBe(input.attributes('aria-controls'))
    })

    it('marks the active option through aria-activedescendant', async () => {
      const wrapper = await mount(base)
      const input = wrapper.find('input.ui-text-field__input')

      await input.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      const active = document.querySelector('.ui-autocomplete__option--active')
      expect(active?.id).toBe(wrapper.find('input.ui-text-field__input').attributes('aria-activedescendant'))
    })

    it('describes options and multi-selectability', async () => {
      const wrapper = await mount({ ...base, multiple: true })
      await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'ArrowDown' })
      await nextTick()

      expect(document.querySelector('[role="listbox"]')!.getAttribute('aria-multiselectable')).toBe('true')
      const option = document.querySelector('.ui-autocomplete__option')!
      expect(option.getAttribute('role')).toBe('option')
      expect(option.getAttribute('aria-selected')).toBe('false')
    })

    it('wires the toggle to the listbox and keeps it out of the tab order', async () => {
      const wrapper = await mount(base)
      const toggle = wrapper.find('.ui-autocomplete__toggle')
      const controls = wrapper.find('input.ui-text-field__input').attributes('aria-controls')

      expect(toggle.attributes('tabindex')).toBe('-1')
      expect(toggle.attributes('aria-controls')).toBe(controls)
      expect(toggle.attributes('aria-expanded')).toBe('false')

      await toggle.trigger('click')
      expect(wrapper.find('.ui-autocomplete__toggle').attributes('aria-expanded')).toBe('true')
    })

    it('marks a selected row with a glyph, not with colour alone', async () => {
      const wrapper = await mount({ ...base, modelValue: 1 })
      await wrapper.find('input.ui-text-field__input').trigger('keydown', { key: 'ArrowDown' })
      await nextTick()

      const selected = document.querySelector('.ui-autocomplete__option.ui-list-item--selected')!
      expect(selected.querySelector('.ui-autocomplete__check')).not.toBeNull()
      expect(document.querySelectorAll('.ui-autocomplete__check')).toHaveLength(1)
    })

    it('announces "no results" through a live region that was already there', async () => {
      const wrapper = await mount(base)
      const region = wrapper.find('[role="status"]')
      expect(region.text()).toBe('')

      await wrapper.find('input.ui-text-field__input').setValue('zzz')
      await nextTick()
      await nextTick()
      expect(wrapper.find('[role="status"]').text()).toBe('No results')
    })
  })

  describe('keyboard — editing', () => {
    it('leaves Home and End to the caret', async () => {
      const wrapper = await mount(base)
      const input = wrapper.find('input.ui-text-field__input')
      await input.trigger('keydown', { key: 'ArrowDown' })

      for (const key of ['Home', 'End']) {
        const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true })
        input.element.dispatchEvent(event)
        expect(event.defaultPrevented, key).toBe(false)
      }
    })

    it('closes with Alt+ArrowUp and keeps the typed draft', async () => {
      const wrapper = await mount(base)
      const input = wrapper.find('input.ui-text-field__input')

      await input.setValue('Gam')
      await nextTick()
      await input.trigger('keydown', { key: 'ArrowUp', altKey: true })
      await nextTick()

      expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
      expect((input.element as HTMLInputElement).value).toBe('Gam')
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('does not type into the list: letters stay characters of the query', async () => {
      const wrapper = await mount(base)
      const input = wrapper.find('input.ui-text-field__input')

      const event = new KeyboardEvent('keydown', { key: 'g', cancelable: true, bubbles: true })
      input.element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('keyboard — options', () => {
    it('skips disabled entries and selects with the keyboard', async () => {
      const wrapper = await mount(base)
      const input = wrapper.find('input.ui-text-field__input')

      // Alpha (0), Beta (1, disabled), Gamma (2): two ArrowDowns land on Gamma.
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
    })

    it('closes the menu on Escape and on Tab', async () => {
      const escape = await mount(base)
      const escapeInput = escape.find('input.ui-text-field__input')
      await escapeInput.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      await escapeInput.trigger('keydown', { key: 'Escape' })
      expect(escape.emitted('update:open')?.at(-1)).toEqual([false])

      const tab = await mount(base)
      const tabInput = tab.find('input.ui-text-field__input')
      await tabInput.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      await tabInput.trigger('keydown', { key: 'Tab' })
      expect(tab.emitted('update:open')?.at(-1)).toEqual([false])
    })
  })

  describe('keyboard — chip navigation', () => {
    it('highlights and deletes the focused chip with arrows and Backspace', async () => {
      const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })
      const input = wrapper.find('input.ui-text-field__input')

      await input.trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect(wrapper.findAll('.ui-autocomplete__chip').at(-1)!.classes())
        .toContain('ui-autocomplete__chip--active')

      await input.trigger('keydown', { key: 'ArrowLeft' })
      await input.trigger('keydown', { key: 'Backspace' })
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[3]])
    })

    it('returns to the input on ArrowRight past the last chip', async () => {
      const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })
      const input = wrapper.find('input.ui-text-field__input')

      await input.trigger('keydown', { key: 'ArrowLeft' })
      await input.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(wrapper.find('.ui-autocomplete__chip--active').exists()).toBe(false)
    })

    it('deletes from the end with plain Backspace without trapping focus', async () => {
      const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })
      const input = wrapper.find('input.ui-text-field__input')

      await input.trigger('keydown', { key: 'Backspace' })
      await nextTick()
      expect(wrapper.find('.ui-autocomplete__chip--active').exists()).toBe(false)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1]])
    })
  })
})
