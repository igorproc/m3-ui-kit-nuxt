import { afterEach, describe, expect, it } from 'vitest'
import { mount, stubItems, unmountCurrent, slider } from './helpers'

afterEach(unmountCurrent)

describe('m-rating · a11y', () => {
  describe('role', () => {
    it('is one slider — a single Tab stop, not one per star', async () => {
      const wrapper = await mount({ modelValue: 2 })

      expect(slider(wrapper).attributes('role')).toBe('slider')
      expect(slider(wrapper).attributes('tabindex')).toBe('0')
      expect(wrapper.findAll('[tabindex="0"]')).toHaveLength(1)
    })

    it('hides every drawn item from assistive tech', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-rating__item').every(item => item.attributes('aria-hidden') === 'true')).toBe(true)
    })
  })

  describe('value', () => {
    it('reports the value against a scale of its length', async () => {
      const wrapper = await mount({ modelValue: 2.5, step: 0.5, length: 10 })

      expect(slider(wrapper).attributes('aria-valuemin')).toBe('0')
      expect(slider(wrapper).attributes('aria-valuemax')).toBe('10')
      expect(slider(wrapper).attributes('aria-valuenow')).toBe('2.5')
    })
  })

  describe('naming', () => {
    it('takes an aria-label', async () => {
      const wrapper = await mount({ ariaLabel: 'Оценка' })

      expect(slider(wrapper).attributes('aria-label')).toBe('Оценка')
    })

    it('ships no English name of its own', async () => {
      const wrapper = await mount()

      expect(slider(wrapper).attributes('aria-label')).toBeUndefined()
    })

    it('takes aria-labelledby from the consumer instead', async () => {
      const wrapper = await mount({ 'aria-labelledby': 'score-label' })

      expect(slider(wrapper).attributes('aria-labelledby')).toBe('score-label')
      expect(slider(wrapper).attributes('aria-label')).toBeUndefined()
    })
  })

  describe('value text', () => {
    it('says nothing beyond the number by default — no English "N of M"', async () => {
      const wrapper = await mount({ modelValue: 3 })

      expect(slider(wrapper).attributes('aria-valuetext')).toBeUndefined()
      expect(slider(wrapper).attributes('aria-valuenow')).toBe('3')
    })

    it('words the value through valueText', async () => {
      const wrapper = await mount({ modelValue: 3, length: 5, valueText: (value: number, length: number) => `${value} из ${length}` })

      expect(slider(wrapper).attributes('aria-valuetext')).toBe('3 из 5')
    })

    it('keeps wording the committed value while a hover previews another', async () => {
      const wrapper = await mount({ modelValue: 1, valueText: (value: number) => `${value}★` })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointermove', { clientX: 110, pointerType: 'mouse' })

      expect(slider(wrapper).attributes('aria-valuetext')).toBe('1★')
    })
  })

  describe('states', () => {
    it('leaves the Tab order and reports itself disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(slider(wrapper).attributes('tabindex')).toBe('-1')
      expect(slider(wrapper).attributes('aria-disabled')).toBe('true')
    })

    it('reports itself read-only', async () => {
      const wrapper = await mount({ readonly: true, modelValue: 4 })

      expect(slider(wrapper).attributes('aria-readonly')).toBe('true')
      expect(slider(wrapper).attributes('aria-valuenow')).toBe('4')
    })

    it('announces neither state while editable', async () => {
      const wrapper = await mount()

      expect(slider(wrapper).attributes('aria-disabled')).toBeUndefined()
      expect(slider(wrapper).attributes('aria-readonly')).toBeUndefined()
    })
  })
})
