import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MNumberInput from '../index.vue'

let host: HTMLElement
// Only one component stays mounted at a time so its teleported menu is the only
// one in the document — querying options across tests then never leaks.
let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MNumberInput, { props, slots })

  return current as VueWrapper
}

function options() {
  return [...host.querySelectorAll('.ui-number-input__unit-option')] as HTMLElement[]
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

describe('m-number-input · unit', () => {
  // B6.4d: the zone is a private part of the field, not a public `<MNumberInputUnit>`.
  it('is not a public component of its own', () => {
    const publicFiles = Object.keys(import.meta.glob('../*.vue')).map(path => path.split('/').at(-1))

    expect(publicFiles).toEqual(['index.vue'])
  })

  describe('static suffix', () => {
    it('renders a plain zone when there is nothing to choose between', async () => {
      const wrapper = await mount({ unit: 'MiB', modelValue: 512 })
      const unit = wrapper.find('.ui-number-input__unit')

      expect(unit.text()).toBe('MiB')
      expect(unit.classes()).not.toContain('ui-number-input__unit--menu')
      expect(wrapper.find('.ui-number-input__unit-trigger').exists()).toBe(false)
    })

    it('keeps the zone inside the container, so the pair shares one border', async () => {
      const wrapper = await mount({ unit: 'MiB' })

      expect(wrapper.find('.ui-number-input__control').element
        .contains(wrapper.find('.ui-number-input__unit').element)).toBe(true)
    })

    // B6.4a: a suffix only seen is not heard; the spinbutton says it with the value.
    it('says the unit with the value', async () => {
      const wrapper = await mount({ unit: 'kg', modelValue: 42 })

      expect(wrapper.find('input').attributes('aria-valuetext')).toBe('42 kg')
    })

    it('says no value text for an empty field, unit or not', async () => {
      const wrapper = await mount({ unit: 'kg' })

      expect(wrapper.find('input').attributes('aria-valuetext')).toBeUndefined()
    })

    it('renders no zone at all without a unit', async () => {
      const wrapper = await mount({ modelValue: 512 })

      expect(wrapper.find('.ui-number-input__unit').exists()).toBe(false)
    })
  })

  describe('menu', () => {
    it('turns the zone into a trigger once there is a list', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'MiB' })
      const trigger = wrapper.find('.ui-number-input__unit-trigger')

      expect(trigger.exists()).toBe(true)
      expect(trigger.text()).toContain('MiB')
    })

    it('opens on click and lists every choice', async () => {
      const wrapper = await mount({ units: ['B', 'KiB', 'MiB', 'GiB'], unit: 'MiB' })

      expect(options()).toHaveLength(0)

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')

      expect(options().map(option => option.textContent?.trim())).toEqual(['B', 'KiB', 'MiB', 'GiB'])
    })

    it('emits the picked unit and closes', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'MiB' })

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')
      options()[1]!.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:unit')?.at(-1)).toEqual(['GiB'])
      expect(wrapper.find('.ui-number-input__unit-trigger').attributes('aria-expanded')).toBe('false')
    })

    it('leaves the number alone — picking a unit relabels, it never converts', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'MiB', modelValue: 512 })

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')
      options()[1]!.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.find('input').element.value).toBe('512')
    })

    it('accepts entries that spell a label apart from the value', async () => {
      const wrapper = await mount({
        units: [{ value: 'ms', label: 'milliseconds' }, { value: 's', label: 'seconds' }],
        unit: 'ms',
      })

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')

      expect(wrapper.find('.ui-number-input__unit-trigger').text()).toContain('milliseconds')
      expect(options().map(option => option.textContent?.trim())).toEqual(['milliseconds', 'seconds'])
    })

    it('falls back to the first choice rather than showing an empty zone', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'] })

      expect(wrapper.find('.ui-number-input__unit-trigger').text()).toContain('MiB')
    })

    // Q31-А: the model is what the screen shows.
    it('writes the first choice into an empty unit model', async () => {
      const wrapper = await mount({ units: [{ value: 'mib', label: 'MiB' }, 'GiB'], unit: null })

      expect(wrapper.emitted('update:unit')?.at(-1)).toEqual(['mib'])
    })

    it('leaves a unit model that is already set alone', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'GiB' })

      expect(wrapper.emitted('update:unit')).toBeUndefined()
    })

    it('says the chosen unit by its label with the value', async () => {
      const wrapper = await mount({ units: [{ value: 'mib', label: 'MiB' }, 'GiB'], unit: 'mib', modelValue: 512 })

      expect(wrapper.find('input').attributes('aria-valuetext')).toBe('512 MiB')
    })

    it('closes without a pick when the surface is dismissed', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'MiB' })
      const trigger = wrapper.find('.ui-number-input__unit-trigger')

      await trigger.trigger('click')
      expect(options()).toHaveLength(2)

      await trigger.trigger('click')

      expect(options()).toHaveLength(0)
      expect(wrapper.emitted('update:unit')).toBeUndefined()
    })
  })

  describe('a11y', () => {
    it('announces itself as a menu trigger whose name contains the unit it shows', async () => {
      const wrapper = await mount({ units: ['MiB'], unit: 'MiB', unitLabel: 'Единица измерения' })
      const trigger = wrapper.find('.ui-number-input__unit-trigger')
      const name = trigger.attributes('aria-labelledby')!.split(' ')
        .map(id => wrapper.find(`[id="${id}"]`).text())
        .join(' ')

      expect(trigger.attributes('aria-haspopup')).toBe('menu')
      expect(trigger.attributes('aria-label')).toBeUndefined()
      expect(name).toBe('Единица измерения MiB')
      expect(trigger.attributes('type')).toBe('button')
    })

    it('reflects the open state', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'MiB' })
      const trigger = wrapper.find('.ui-number-input__unit-trigger')

      expect(trigger.attributes('aria-expanded')).toBe('false')

      await trigger.trigger('click')

      expect(wrapper.find('.ui-number-input__unit-trigger').attributes('aria-expanded')).toBe('true')
    })

    it('marks the options as a radio set — one unit is in force, not several', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'GiB' })

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')

      expect(options().map(option => option.getAttribute('role'))).toEqual(['menuitemradio', 'menuitemradio'])
      expect(options().map(option => option.getAttribute('aria-checked'))).toEqual(['false', 'true'])
    })

    // Q14-А: the choices are `MMenuItem`s of one `MMenuGroup`, a radio set.
    it('gathers the choices in one group of the menu', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'GiB' })

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')

      const group = host.querySelector('[role="menu"] [role="group"]')!
      expect([...group.querySelectorAll('[role="menuitemradio"]')].map(option => option.getAttribute('aria-checked'))).toEqual(['false', 'true'])
    })

    it('marks the chosen unit by a check, not by colour alone', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'GiB' })

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')

      expect(options()[1]!.querySelector('.ui-menu__item-leading .ui-icon')).not.toBeNull()
      expect(options()[0]!.querySelector('.ui-menu__item-leading')).toBeNull()
    })

    it.each([
      ['a choice', () => options()[1]!.click()],
      ['Escape', () => options()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))],
    ])('gives the focus back to the trigger after %s', async (_, act) => {
      if (current) current.unmount()
      current = await mountSuspended(MNumberInput, { props: { units: ['MiB', 'GiB'], unit: 'MiB' }, attachTo: document.body })
      const wrapper = current as VueWrapper
      const trigger = wrapper.find('.ui-number-input__unit-trigger')

      ;(trigger.element as HTMLElement).focus()
      await trigger.trigger('click')
      await vi.waitFor(() => expect(host.contains(document.activeElement)).toBe(true))

      act()

      await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))
    })

    it('goes dead with the field, and takes an open menu with it', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'MiB' })

      await wrapper.find('.ui-number-input__unit-trigger').trigger('click')
      expect(options()).toHaveLength(2)

      await wrapper.setProps({ disabled: true })

      expect(wrapper.find('.ui-number-input__unit-trigger').attributes('disabled')).toBeDefined()
      expect(options()).toHaveLength(0)
    })

    it('is equally dead in a read-only field', async () => {
      const wrapper = await mount({ units: ['MiB', 'GiB'], unit: 'MiB', readonly: true })

      expect(wrapper.find('.ui-number-input__unit-trigger').attributes('disabled')).toBeDefined()
    })
  })
})
