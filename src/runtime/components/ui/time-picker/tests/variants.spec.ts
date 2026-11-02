import { afterEach, describe, expect, it } from 'vitest'
import { mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

describe('m-time-picker · variants', () => {
  describe('mode', () => {
    it('turns a dial by default, with two selectors over it and no fields', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      expect(wrapper.classes()).toContain('ui-time-picker--picker')
      expect(wrapper.findAll('[role="radio"]').map(radio => radio.text())).toEqual(['14', '30'])
      expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe('14')
      expect(wrapper.find('input:not([type="hidden"])').exists()).toBe(false)
    })

    it('types the time in two fields in input mode, with no dial', async () => {
      const wrapper = await mountPicker({ mode: 'input', modelValue: '08:30' })
      const fields = wrapper.findAll('.ui-time-picker__field')

      expect(wrapper.classes()).toContain('ui-time-picker--input')
      expect(fields.map(field => (field.element as HTMLInputElement).value)).toEqual(['08', '30'])
      expect(fields.map(field => field.attributes('type'))).toEqual(['text', 'text'])
      expect(wrapper.find('[role="slider"]').exists()).toBe(false)
    })

    it('offers no mode switch unless asked', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-time-picker__actions').exists()).toBe(false)
    })

    it.each([
      ['picker', 'Type the time'],
      ['input', 'Use the dial'],
    ] as const)('names the switch for the other mode in %s mode', async (mode, name) => {
      const wrapper = await mountPicker({ mode, modeToggle: true, switchToInputLabel: 'Type the time', switchToPickerLabel: 'Use the dial' })

      expect(wrapper.find('.ui-time-picker__actions button').attributes('aria-label')).toBe(name)
    })
  })

  describe('layout', () => {
    it('defaults to vertical', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.classes()).toContain('ui-time-picker--vertical')
    })

    it.each(['vertical', 'horizontal'] as const)('carries the %s layout on the root', async (layout) => {
      const wrapper = await mountPicker({ layout })

      expect(wrapper.classes()).toContain(`ui-time-picker--${layout}`)
    })
  })

  describe('hour cycle', () => {
    it('defaults to 24 hours, with no column kept for a period', async () => {
      const wrapper = await mountPicker({ modelValue: '21:00' })

      expect(wrapper.find('.ui-time-picker__period').exists()).toBe(false)
      expect(wrapper.classes()).toContain('ui-time-picker--h23')
    })

    it('draws the period in a 12-hour cycle only', async () => {
      const wrapper = await mountPicker({ modelValue: '21:00', hourCycle: 'h12' })

      expect(wrapper.find('.ui-time-picker__period').exists()).toBe(true)
      expect(wrapper.find('.ui-time-picker__selector').text()).toBe('09')
      expect(wrapper.classes()).toContain('ui-time-picker--h12')
    })

    it('takes the cycle from the locale on auto', async () => {
      const us = await mountPicker({ modelValue: '21:00', hourCycle: 'auto', locale: 'en-US' })
      expect(us.classes()).toContain('ui-time-picker--h12')

      const de = await mountPicker({ modelValue: '21:00', hourCycle: 'auto', locale: 'de-DE' })
      expect(de.classes()).toContain('ui-time-picker--h23')
    })

    it('names the periods in the locale\'s words unless set', async () => {
      const locale = await mountPicker({ modelValue: '21:00', hourCycle: 'h12' })
      expect(locale.findAll('.ui-time-picker__period-option').map(option => option.text())).toEqual(['AM', 'PM'])

      const own = await mountPicker({ modelValue: '21:00', hourCycle: 'h12', amLabel: 'до', pmLabel: 'после' })
      expect(own.findAll('.ui-time-picker__period-option').map(option => option.text())).toEqual(['до', 'после'])
    })

    // S9: the period is a pair of toggle buttons, so it wears the button family's toggle states.
    it('marks the chosen period as a selected toggle button', async () => {
      const wrapper = await mountPicker({ modelValue: '21:00', hourCycle: 'h12' })
      const [am, pm] = wrapper.findAll('.ui-time-picker__period-option')

      expect(am!.classes()).toEqual(expect.arrayContaining(['ui-button', 'ui-button--unselected']))
      expect(pm!.classes()).toEqual(expect.arrayContaining(['ui-button', 'ui-button--selected']))
    })

    it('greys the period by the button family\'s disabled roles while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: '21:00', hourCycle: 'h12', disabled: true })

      for (const option of wrapper.findAll('.ui-time-picker__period-option')) {
        expect(option.classes()).toContain('ui-button--disabled')
      }
    })
  })

  describe('display', () => {
    it('pads the hour to two digits', async () => {
      const wrapper = await mountPicker({ modelValue: '09:05' })

      expect(wrapper.find('.ui-time-picker__selector').text()).toBe('09')
    })

    it('shows nothing chosen on an empty model', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-time-picker__selector--selected').exists()).toBe(false)
      expect(wrapper.find('.ui-time-picker__hand').exists()).toBe(false)
      expect(wrapper.findAll('.ui-time-picker__selector').map(selector => selector.text())).toEqual(['--', '--'])
    })

    it('marks the hours selector and the hour on the face', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      expect(wrapper.find('.ui-time-picker__selector').classes()).toContain('ui-time-picker__selector--selected')
      expect(wrapper.find('.ui-time-picker__number--selected').text()).toBe('14')
    })

    it('puts a dot in the handle for a minute between the five-minute marks', async () => {
      const wrapper = await mountPicker({ modelValue: '14:32' })

      await wrapper.findAll('.ui-time-picker__selector')[1]!.trigger('click')

      expect(wrapper.find('.ui-time-picker__handle-dot').exists()).toBe(true)
    })
  })

  describe('headline', () => {
    it('draws the headline only when there is one', async () => {
      const bare = await mountPicker()
      expect(bare.find('.ui-time-picker__headline').exists()).toBe(false)

      const named = await mountPicker({ label: 'Alarm' })
      expect(named.find('.ui-time-picker__headline').text()).toBe('Alarm')
    })

    it('fills the headline from the label slot', async () => {
      const wrapper = await mountPicker({}, { slots: { label: () => 'Wake up' } })

      expect(wrapper.find('.ui-time-picker__headline').text()).toBe('Wake up')
    })
  })

  describe('state modifiers', () => {
    it.each(['disabled', 'readonly'] as const)('carries the %s modifier', async (state) => {
      const wrapper = await mountPicker({ [state]: true })

      expect(wrapper.classes()).toContain(`ui-time-picker--${state}`)
    })

    it('marks the field boxes of an app error', async () => {
      const wrapper = await mountPicker({ mode: 'input', error: true, errorMessage: 'Too late' })

      expect(wrapper.find('.ui-time-picker__field-box').classes()).toContain('ui-time-picker__field-box--error')
    })
  })

  describe('support line', () => {
    it('reserves no support line for a dial outside a form', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      expect(wrapper.find('.ui-picker-support').exists()).toBe(false)
    })

    it.each([
      ['typed fields', { mode: 'input' }],
      ['a helper text', { helperText: 'Hint' }],
      ['an error flag', { error: true }],
      ['required', { required: true }],
      ['a form name', { name: 'start' }],
    ])('reserves the line for %s', async (_, props) => {
      const wrapper = await mountPicker(props)

      expect(wrapper.find('.ui-picker-support').exists()).toBe(true)
    })

    it('renders the helper slot', async () => {
      const wrapper = await mountPicker({ mode: 'input' }, { slots: { helper: () => 'Opening hours 9–18' } })

      expect(wrapper.find('.ui-picker-support__line:not([role="alert"])').text()).toBe('Opening hours 9–18')
    })
  })
})
