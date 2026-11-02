import { afterEach, describe, expect, it } from 'vitest'
import { TYPES, mount, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-chip · variants', () => {
  describe('type', () => {
    it.each(TYPES)('maps type="%s" onto its own modifier', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.classes()).toContain(`ui-chip--${type}`)
      expect(TYPES.filter(other => other !== type).some(other => wrapper.classes().includes(`ui-chip--${other}`))).toBe(false)
    })

    it('defaults to an assist chip', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-chip--assist')
    })
  })

  describe('slots', () => {
    it('renders the default slot as the label', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-chip__label').text()).toBe('Label')
    })

    it('renders the icon and trailing slots in their own boxes', async () => {
      const wrapper = await mount({}, { default: () => 'X', icon: () => 'I', trailing: () => 'T' })

      expect(wrapper.find('.ui-chip__icon').text()).toBe('I')
      expect(wrapper.find('.ui-chip__trailing').text()).toBe('T')
    })

    it('renders no icon or trailing box when the slots are unused', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-chip__icon').exists()).toBe(false)
      expect(wrapper.find('.ui-chip__trailing').exists()).toBe(false)
    })
  })

  describe('selection', () => {
    it.each([
      [true, true],
      [false, false],
    ])('a filter chip with model %s → selected modifier %s', async (modelValue, selected) => {
      const wrapper = await mount({ type: 'filter', modelValue })

      expect(wrapper.classes().includes('ui-chip--selected')).toBe(selected)
    })
  })

  describe('state modifiers', () => {
    it('marks a disabled chip on the root and on the native button', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-chip--disabled')
      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('stays enabled by default', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-chip--disabled')
      expect(wrapper.classes()).not.toContain('ui-chip--blocked')
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ type: 'filter', modelValue: true, disabled: true })
      const names = [wrapper.element, ...wrapper.element.querySelectorAll('*')]
        .flatMap(el => [...el.attributes].map(attribute => attribute.name))

      expect(names.filter(name => name.startsWith('data-'))).toEqual([])
    })
  })

  describe('fallthrough attributes', () => {
    it('lands class, id and listeners on the button', async () => {
      const wrapper = await mount({ class: 'consumer', id: 'chip-1' })

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.classes()).toContain('consumer')
      expect(wrapper.attributes('id')).toBe('chip-1')
    })
  })
})
