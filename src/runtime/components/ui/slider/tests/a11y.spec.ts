import { afterEach, describe, expect, it } from 'vitest'
import { mount, thumbs, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-slider · a11y', () => {
  describe('role', () => {
    it('puts role="slider" on each thumb and on nothing else', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80] })

      expect(thumbs(wrapper)).toHaveLength(2)
      expect(wrapper.find('.ui-slider-track').attributes('role')).toBeUndefined()
    })
  })

  describe('value', () => {
    it('reports value and bounds on the thumb', async () => {
      const wrapper = await mount({ modelValue: 40, min: 10, max: 90 })
      const thumb = thumbs(wrapper)[0]!

      expect(thumb.attributes('aria-valuenow')).toBe('40')
      expect(thumb.attributes('aria-valuemin')).toBe('10')
      expect(thumb.attributes('aria-valuemax')).toBe('90')
    })

    it('clamps each range thumb by its neighbour', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80] })
      const [start, end] = thumbs(wrapper)

      expect(start!.attributes('aria-valuemin')).toBe('0')
      expect(start!.attributes('aria-valuemax')).toBe('80')
      expect(end!.attributes('aria-valuemin')).toBe('20')
      expect(end!.attributes('aria-valuemax')).toBe('100')
    })

    it.each(['horizontal', 'vertical'] as const)('reports aria-orientation="%s"', async (orientation) => {
      const wrapper = await mount({ modelValue: 40, orientation })

      expect(thumbs(wrapper)[0]!.attributes('aria-orientation')).toBe(orientation)
    })
  })

  describe('value text', () => {
    it('words each thumb with formatValue', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80], formatValue: (value: number) => `${value} ₽` })

      expect(thumbs(wrapper).map(thumb => thumb.attributes('aria-valuetext'))).toEqual(['20 ₽', '80 ₽'])
    })

    it('falls back to the number itself', async () => {
      const wrapper = await mount({ modelValue: 40 })

      expect(thumbs(wrapper)[0]!.attributes('aria-valuetext')).toBe('40')
    })
  })

  describe('naming', () => {
    it('names a single thumb by its visible label', async () => {
      const wrapper = await mount({ modelValue: 40, label: 'Volume' })
      const label = wrapper.find('.ui-slider__label')

      expect(thumbs(wrapper)[0]!.attributes('aria-labelledby')).toBe(label.attributes('id'))
      expect(thumbs(wrapper)[0]!.attributes('aria-label')).toBeUndefined()
    })

    it('adds no English "start" / "end" to range thumbs named only by the label', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80], label: 'Цена' })
      const id = wrapper.find('.ui-slider__label').attributes('id')

      expect(thumbs(wrapper).map(thumb => thumb.attributes('aria-labelledby'))).toEqual([id, id])
      expect(thumbs(wrapper).some(thumb => /start|end/.test(thumb.attributes('aria-label') ?? ''))).toBe(false)
    })

    it('makes a range a group named by the label', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80], label: 'Цена', ariaLabelStart: 'От', ariaLabelEnd: 'До' })

      expect(wrapper.attributes('role')).toBe('group')
      expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ui-slider__label').attributes('id'))
    })

    it('leaves a single slider without a group role', async () => {
      const wrapper = await mount({ modelValue: 40, label: 'Volume' })

      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('renders no empty aria-label', async () => {
      const wrapper = await mount({ modelValue: 40 })

      expect(thumbs(wrapper)[0]!.attributes('aria-label')).toBeUndefined()
    })

    it('hands a consumer aria-describedby to the thumbs and keeps class on the root', async () => {
      const wrapper = await mount({ 'modelValue': 40, 'aria-describedby': 'hint', 'class': 'own' })

      expect(thumbs(wrapper)[0]!.attributes('aria-describedby')).toBe('hint')
      expect(wrapper.classes()).toContain('own')
    })

    it('names range thumbs by their own labels', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80], ariaLabelStart: 'Minimum price', ariaLabelEnd: 'Maximum price' })
      const [start, end] = thumbs(wrapper)

      expect(start!.attributes('aria-label')).toBe('Minimum price')
      expect(end!.attributes('aria-label')).toBe('Maximum price')
    })
  })

  describe('states', () => {
    it('leaves the Tab order and reports itself disabled', async () => {
      const wrapper = await mount({ modelValue: 40, disabled: true })
      const thumb = thumbs(wrapper)[0]!

      expect(thumb.attributes('tabindex')).toBe('-1')
      expect(thumb.attributes('aria-disabled')).toBe('true')
    })

    it('stays in the Tab order but reports itself read-only', async () => {
      const wrapper = await mount({ modelValue: 40, readonly: true })
      const thumb = thumbs(wrapper)[0]!

      expect(thumb.attributes('tabindex')).toBe('0')
      expect(thumb.attributes('aria-readonly')).toBe('true')
    })

    it('announces neither state on an editable slider', async () => {
      const wrapper = await mount({ modelValue: 40 })
      const thumb = thumbs(wrapper)[0]!

      expect(thumb.attributes('aria-disabled')).toBeUndefined()
      expect(thumb.attributes('aria-readonly')).toBeUndefined()
    })
  })

  describe('field (W4-А)', () => {
    it('shows the support line and describes every thumb by it', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80], label: 'Цена', helperText: 'В рублях', ariaLabelStart: 'От', ariaLabelEnd: 'До' })
      const line = wrapper.find('.ui-slider__support')

      expect(line.text()).toBe('В рублях')
      expect(thumbs(wrapper).every(thumb => thumb.attributes('aria-describedby') === line.attributes('id'))).toBe(true)
    })

    it('marks every thumb invalid with the error, and says why', async () => {
      const wrapper = await mount({ modelValue: 40, label: 'Volume', errorMessage: 'Too loud' })

      expect(thumbs(wrapper)[0]!.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('.ui-slider__support').text()).toBe('Too loud')
    })

    it('marks a required slider on its thumbs and its label', async () => {
      const wrapper = await mount({ modelValue: 40, label: 'Volume', required: true })

      expect(thumbs(wrapper)[0]!.attributes('aria-required')).toBe('true')
      expect(wrapper.find('.ui-slider__required').attributes('aria-hidden')).toBe('true')
    })

    it('renders no line when nothing can appear in it', async () => {
      const wrapper = await mount({ modelValue: 40, label: 'Volume' })

      expect(wrapper.find('.ui-slider__support').exists()).toBe(false)
    })
  })

  describe('value indicator', () => {
    it('hides the capsule from assistive tech — aria-valuetext already says it', async () => {
      const wrapper = await mount({ modelValue: 40, showValue: true })

      expect(wrapper.find('.ui-slider-thumb__value').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('focus order', () => {
    it('gives every thumb of a range its own Tab stop, in value order', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80] })

      expect(thumbs(wrapper).map(thumb => thumb.attributes('tabindex'))).toEqual(['0', '0'])
      expect(thumbs(wrapper).map(thumb => thumb.attributes('aria-valuenow'))).toEqual(['20', '80'])
    })
  })
})
