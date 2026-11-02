import { afterEach, describe, expect, it } from 'vitest'
import { mount, thumbs, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

const trackStyle = (wrapper: Awaited<ReturnType<typeof mount>>) => wrapper.find('.ui-slider-track').attributes('style') ?? ''

describe('m-slider · variants', () => {
  describe('anatomy (M3 Expressive)', () => {
    it('draws the active track, the inactive track and its stop, and one handle', async () => {
      const wrapper = await mount({ modelValue: 40 })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-slider', 'ui-slider-root']))
      expect(wrapper.findAll('.ui-slider-track__segment--active')).toHaveLength(1)
      expect(wrapper.findAll('.ui-slider-track__segment--inactive')).toHaveLength(1)
      expect(wrapper.findAll('.ui-slider-track__stop')).toHaveLength(1)
      expect(wrapper.findAll('.ui-slider-thumb .ui-slider-thumb__handle')).toHaveLength(1)
    })

    it('starts the active track at the edge of a standard slider', async () => {
      const wrapper = await mount({ modelValue: 40 })

      expect(wrapper.find('.ui-slider-track__segment--active').classes()).toContain('ui-slider-track__segment--from-edge')
      expect(trackStyle(wrapper)).toContain('--ui-slider-start: 0%')
      expect(trackStyle(wrapper)).toContain('--ui-slider-end: 40%')
    })

    it('draws inactive track and a stop on both sides of a range', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 70] })

      expect(wrapper.findAll('.ui-slider-track__segment--inactive')).toHaveLength(2)
      expect(wrapper.findAll('.ui-slider-track__stop')).toHaveLength(2)
      expect(trackStyle(wrapper)).toContain('--ui-slider-start: 20%')
      expect(trackStyle(wrapper)).toContain('--ui-slider-end: 70%')
    })

    it('cuts the track around both handles of a range', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 70] })

      expect(trackStyle(wrapper)).toContain('--ui-slider-start-cut: 1')
      expect(trackStyle(wrapper)).toContain('--ui-slider-end-cut: 1')
    })

    it('marks range thumbs start and end', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80] })
      const [start, end] = wrapper.findAll('.ui-slider-thumb')

      expect(start!.classes()).toContain('ui-slider-thumb--start')
      expect(end!.classes()).toContain('ui-slider-thumb--end')
    })
  })

  describe('origin (W2-А)', () => {
    it.each([
      [70, '50%', '70%', '0', '1'],
      [20, '20%', '50%', '1', '0'],
    ])('centers the active track: value %s → from %s to %s, cut at the handle only', async (modelValue, start, end, startCut, endCut) => {
      const wrapper = await mount({ modelValue, origin: 'center' })

      expect(trackStyle(wrapper)).toContain(`--ui-slider-start: ${start}`)
      expect(trackStyle(wrapper)).toContain(`--ui-slider-end: ${end}`)
      expect(trackStyle(wrapper)).toContain(`--ui-slider-start-cut: ${startCut}`)
      expect(trackStyle(wrapper)).toContain(`--ui-slider-end-cut: ${endCut}`)
      expect(wrapper.findAll('.ui-slider-track__segment--inactive')).toHaveLength(2)
    })

    it('ignores origin on a range', async () => {
      const wrapper = await mount({ range: true, origin: 'center', modelValue: [20, 30] })

      expect(trackStyle(wrapper)).toContain('--ui-slider-start: 20%')
      expect(trackStyle(wrapper)).toContain('--ui-slider-end: 30%')
    })
  })

  describe('density (W1-А)', () => {
    it.each(['default', 'comfortable'] as const)('carries density="%s" on the root, the track and the thumb', async (density) => {
      const wrapper = await mount({ modelValue: 40, density })

      expect(wrapper.classes()).toContain(`ui-slider-root--${density}`)
      expect(wrapper.find('.ui-slider-track').classes()).toContain(`ui-slider-track--${density}`)
      expect(wrapper.find('.ui-slider-thumb').classes()).toContain(`ui-slider-thumb--${density}`)
    })

    it('defaults to the M3 XS step', async () => {
      const wrapper = await mount({ modelValue: 40 })

      expect(wrapper.classes()).toContain('ui-slider-root--default')
    })

    it('draws the inset icon only on a comfortable standard slider', async () => {
      const icon = { icon: () => '🔊' }
      const comfortable = await mount({ modelValue: 40, density: 'comfortable' }, icon)
      expect(comfortable.findAll('.ui-slider-track__icon')).toHaveLength(2)
      expect(comfortable.find('.ui-slider-track__icon').attributes('aria-hidden')).toBe('true')

      const compactish = await mount({ modelValue: 40 }, icon)
      expect(compactish.find('.ui-slider-track__icon').exists()).toBe(false)

      const range = await mount({ range: true, modelValue: [20, 60], density: 'comfortable' }, icon)
      expect(range.find('.ui-slider-track__icon').exists()).toBe(false)
    })
  })

  describe('orientation', () => {
    it.each(['horizontal', 'vertical'] as const)('carries %s on the root, the track and the thumb', async (orientation) => {
      const wrapper = await mount({ modelValue: 40, orientation })
      const vertical = orientation === 'vertical'

      expect(wrapper.classes().includes('ui-slider-root--vertical')).toBe(vertical)
      expect(wrapper.find('.ui-slider-track').classes().includes('ui-slider-track--vertical')).toBe(vertical)
      expect(wrapper.find('.ui-slider-thumb').classes().includes('ui-slider-thumb--vertical')).toBe(vertical)
    })

    it('positions a vertical thumb from the bottom', async () => {
      const wrapper = await mount({ modelValue: 25, orientation: 'vertical' })

      expect(thumbs(wrapper)[0]!.attributes('style')).toContain('bottom: 25%')
    })

    it('defaults to horizontal, positioned from the inline start', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-slider-root--vertical')
      expect(thumbs(wrapper)[0]!.attributes('style')).toContain('inset-inline-start: 0%')
    })
  })

  describe('discrete', () => {
    it('draws a tick at every step, active ones on the active track', async () => {
      const wrapper = await mount({ modelValue: 40, discrete: true, step: 20 })
      const ticks = wrapper.findAll('.ui-slider-track__tick')

      expect(ticks).toHaveLength(6)
      expect(ticks.map(tick => tick.classes().includes('ui-slider-track__tick--active'))).toEqual([true, true, true, false, false, false])
    })

    it('draws no ticks for a continuous slider', async () => {
      const wrapper = await mount({ modelValue: 40, step: 10 })

      expect(wrapper.find('.ui-slider-track__tick').exists()).toBe(false)
    })

    it('draws no ticks without a step to count them by', async () => {
      const wrapper = await mount({ modelValue: 40, discrete: true, step: 0 })

      expect(wrapper.find('.ui-slider-track__tick').exists()).toBe(false)
    })
  })

  describe('value indicator', () => {
    it('renders the value capsule with showValue, hidden until the thumb is pressed or stepped', async () => {
      const wrapper = await mount({ modelValue: 40, showValue: true })

      expect(wrapper.find('.ui-slider-thumb__value').text()).toBe('40')
      expect(wrapper.find('.ui-slider-thumb').classes()).not.toContain('ui-slider-thumb--value')

      await thumbs(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(wrapper.find('.ui-slider-thumb').classes()).toContain('ui-slider-thumb--value')
    })

    it('formats the value with formatValue', async () => {
      const wrapper = await mount({ modelValue: 350, max: 1000, showValue: true, formatValue: (value: number) => `$${value}` })

      expect(wrapper.find('.ui-slider-thumb__value').text()).toBe('$350')
    })

    it('formats each range thumb by its index', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80], showValue: true, formatValue: (value: number, index: number) => `${index}:${value}` })

      expect(wrapper.findAll('.ui-slider-thumb__value').map(text => text.text())).toEqual(['0:20', '1:80'])
    })

    it('lets the value slot draw the label, with the value, the index and the formatted text', async () => {
      const wrapper = await mount(
        { modelValue: 40, showValue: true, formatValue: (value: number) => `${value} %` },
        { value: (scope: { value: number, index: number, text: string }) => `${scope.index}/${scope.value}/${scope.text}` },
      )

      expect(wrapper.find('.ui-slider-thumb__value').text()).toBe('0/40/40 %')
    })

    it('renders no value capsule by default', async () => {
      const wrapper = await mount({ modelValue: 40 })

      expect(wrapper.find('.ui-slider-thumb__value').exists()).toBe(false)
    })
  })

  describe('label', () => {
    it('renders the label text above the track', async () => {
      const wrapper = await mount({ modelValue: 10, label: 'Volume' })

      expect(wrapper.find('.ui-slider__label').text()).toBe('Volume')
    })

    it('renders no label element without a label', async () => {
      const wrapper = await mount({ modelValue: 10 })

      expect(wrapper.find('.ui-slider__label').exists()).toBe(false)
    })
  })

  describe('state modifiers', () => {
    it.each(['disabled', 'readonly'] as const)('marks %s on the root, the track and the thumb', async (state) => {
      const wrapper = await mount({ modelValue: 40, [state]: true })

      expect(wrapper.classes()).toContain(`ui-slider-root--${state}`)
      expect(wrapper.find('.ui-slider-track').classes()).toContain(`ui-slider-track--${state}`)
      expect(wrapper.find('.ui-slider-thumb').classes()).toContain(`ui-slider-thumb--${state}`)
    })
  })

  describe('form', () => {
    it('posts one hidden input per thumb under the name', async () => {
      const wrapper = await mount({ range: true, modelValue: [20, 80], name: 'price' })
      const inputs = wrapper.findAll('input[type="hidden"]')

      expect(inputs.map(input => input.attributes('name'))).toEqual(['price', 'price'])
      expect(inputs.map(input => (input.element as HTMLInputElement).value)).toEqual(['20', '80'])
    })

    it('posts nothing without a name, and nothing while disabled', async () => {
      const unnamed = await mount({ modelValue: 20 })
      expect(unnamed.findAll('input[type="hidden"]')).toHaveLength(0)

      const disabled = await mount({ modelValue: 20, name: 'price', disabled: true })
      expect(disabled.find('input[type="hidden"]').attributes('disabled')).toBeDefined()
    })
  })
})
