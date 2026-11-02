import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MColorPicker from '../index.vue'
import { provideColorPickerHosted } from '../context'
import { mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

describe('m-color-picker · variants', () => {
  describe('anatomy', () => {
    it('renders canvas, preview and edit for a preset color', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4' })

      expect(wrapper.find('.ui-color-canvas').exists()).toBe(true)
      expect(wrapper.find('.ui-color-preview').exists()).toBe(true)
      expect(wrapper.find('.ui-color-edit').exists()).toBe(true)
      expect((wrapper.find('.ui-color-edit input').element as HTMLInputElement).value).toBe('#6750a4')
    })

    it('sets the preview, the format and a hex value in one row, with no value said twice', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', format: 'hex' })
      const row = wrapper.find('.ui-color-picker__value-row')

      expect(row.find('.ui-color-preview').exists()).toBe(true)
      expect(row.find('.ui-color-picker__format').exists()).toBe(true)
      expect(row.find('.ui-color-edit').classes()).not.toContain('ui-color-edit--channels')
      expect(row.find('.ui-color-preview').text()).toBe('')
    })

    it('draws no palette without swatches', async () => {
      const { wrapper } = await mountPicker()

      expect(wrapper.find('.ui-color-swatches').exists()).toBe(false)
    })
  })

  describe('format', () => {
    it.each([
      ['hex', false],
      ['hexa', true],
      ['rgb', false],
      ['rgba', true],
      ['hsl', false],
      ['hsla', true],
    ] as const)('shows the alpha slider for %s: %s', async (format, alpha) => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', format })

      expect(wrapper.find('.ui-color-picker__alpha').exists()).toBe(alpha)
    })

    it.each(['hex', 'hexa'] as const)('edits %s in one value field', async (format) => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', format })

      expect(wrapper.find('.ui-color-edit__hex').exists()).toBe(true)
      expect(wrapper.find('.ui-color-edit__channels').exists()).toBe(false)
    })

    // N7: the letters are notation; the percent is the field's unit, said with the value.
    it.each([
      ['rgb', ['R', 'G', 'B'], [false, false, false]],
      ['rgba', ['R', 'G', 'B', 'A'], [false, false, false, true]],
      ['hsl', ['H', 'S', 'L'], [false, true, true]],
      ['hsla', ['H', 'S', 'L', 'A'], [false, true, true, true]],
    ] as const)('edits %s in precise number channels', async (format, letters, percent) => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', format })
      const channels = wrapper.findAll('.ui-color-edit__channel')

      expect(channels.map(channel => channel.find('label').text())).toEqual(letters)
      expect(channels.map(channel => channel.find('input').attributes('aria-valuetext')?.endsWith(' %') ?? false)).toEqual(percent)
    })

    it.each([
      ['rgba', true],
      ['hsla', true],
      ['rgb', false],
      ['hsl', false],
    ] as const)('puts four channels in two pairs, so no value is cut short (%s → %s)', async (format, pairs) => {
      const { wrapper } = await mountPicker({ modelValue: 'rgba(103, 80, 164, 1)', format })

      expect(wrapper.find('.ui-color-edit').classes()).toContain('ui-color-edit--channels')
      expect(wrapper.find('.ui-color-edit__channels').classes().includes('ui-color-edit__channels--pairs')).toBe(pairs)
    })

    it('hides the format selector when only one format is allowed', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', formats: ['hex'] })

      expect(wrapper.find('.ui-color-picker__format').exists()).toBe(false)
    })
  })

  describe('hidden parts', () => {
    it.each([
      ['hideCanvas', '.ui-color-canvas'],
      ['hidePreview', '.ui-color-preview'],
      ['hideInputs', '.ui-color-edit'],
      ['hideSwatches', '.ui-color-swatches'],
    ] as const)('%s leaves %s out', async (prop, selector) => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', swatches: ['#ff0000'], [prop]: true })

      expect(wrapper.find(selector).exists()).toBe(false)
    })

    it('drops the whole value row with no preview and no inputs', async () => {
      const { wrapper } = await mountPicker({ hidePreview: true, hideInputs: true })

      expect(wrapper.find('.ui-color-picker__value-row').exists()).toBe(false)
    })
  })

  describe('swatches', () => {
    it('marks a swatch chosen whenever it is the same colour, however either is spelled', async () => {
      const { wrapper } = await mountPicker({ modelValue: 'rgb(103, 80, 164)', format: 'rgb', swatches: ['#6750A4', '#ff0000'] })
      const [first, second] = wrapper.findAll('.ui-color-swatches__item')

      expect(first!.classes()).toContain('ui-color-swatches__item--selected')
      expect(first!.find('.ui-color-swatches__check').exists()).toBe(true)
      expect(second!.classes()).not.toContain('ui-color-swatches__item--selected')
    })

    // Audit: an hsl round trip lands a fraction off the swatch it came from.
    it.each([
      ['hsl', 'hsl(256, 34%, 48%)'],
      ['hsla', 'hsla(256, 34%, 48%, 1)'],
    ] as const)('marks the swatch chosen in %s too', async (format, modelValue) => {
      const { wrapper } = await mountPicker({ modelValue, format, swatches: ['#6750A4', '#ff0000'] })

      expect(wrapper.find('.ui-color-swatches__item').classes()).toContain('ui-color-swatches__item--selected')
    })

    // B7.2e: a format without alpha shows an opaque colour.
    it('draws a hex model that carries alpha opaque', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#ff000080', format: 'hex' })

      expect(wrapper.find('.ui-color-preview').attributes('style')).toContain('rgba(255, 0, 0, 1)')
    })

    it('keeps two equal swatches as two options', async () => {
      const { wrapper } = await mountPicker({ swatches: ['#ff0000', '#ff0000'] })

      expect(wrapper.findAll('.ui-color-swatches__item')).toHaveLength(2)
    })

    it('marks a light swatch so its check stays readable', async () => {
      const { wrapper } = await mountPicker({ swatches: ['#ffffff', '#000000'] })
      const [light, dark] = wrapper.findAll('.ui-color-swatches__item')

      expect(light!.classes()).toContain('ui-color-swatches__item--light')
      expect(dark!.classes()).not.toContain('ui-color-swatches__item--light')
    })

    // N6: a palette swatch paints its colour inline, with no custom property.
    it('paints a swatch with its colour inline', async () => {
      const { wrapper } = await mountPicker({ swatches: ['#ff0000'] })
      const style = wrapper.find('.ui-color-swatches__item').attributes('style') ?? ''

      expect(style).toContain('background-color')
      expect(style).not.toContain('--m-')
    })

    it('takes a { value, label } swatch', async () => {
      const { wrapper } = await mountPicker({ swatches: [{ value: '#ff0000', label: 'Signal red' }] })

      expect(wrapper.find('.ui-color-swatches__item').attributes('aria-label')).toBe('Signal red')
    })
  })

  describe('state modifiers', () => {
    it.each(['disabled', 'readonly'] as const)('carries the %s modifier', async (state) => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', [state]: true })

      expect(wrapper.find('.ui-color-picker').classes()).toContain(`ui-color-picker--${state}`)
    })

    it('locks the palette and the canvas while disabled or read-only', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', readonly: true, swatches: ['#ff0000'] })

      expect(wrapper.find('.ui-color-swatches').classes()).toContain('ui-color-swatches--locked')
      expect(wrapper.find('.ui-color-canvas').classes()).toContain('ui-color-canvas--locked')
    })

    it('drops its own surface inside a host that draws one', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          provideColorPickerHosted(true)
          return () => h(MColorPicker)
        },
      }))

      expect(wrapper.find('.ui-color-picker').classes()).toContain('ui-color-picker--hosted')
      wrapper.unmount()
    })
  })

  describe('slots', () => {
    it('takes a preview, swatch content and actions from slots', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', swatches: ['#6750a4', '#ffffff'] }, {
        preview: ({ value }: { value: string }) => h('i', { class: 'own-preview' }, value),
        swatch: ({ selected }: { selected: boolean }) => h('b', { class: 'own-swatch' }, selected ? 'yes' : 'no'),
        actions: () => h('button', { class: 'own-action' }, 'Apply'),
      })

      expect(wrapper.find('.own-preview').text()).toBe('#6750a4')
      expect(wrapper.findAll('.own-swatch').map(item => item.text())).toEqual(['yes', 'no'])
      expect(wrapper.find('.ui-color-picker__actions .own-action').exists()).toBe(true)
    })

    it('keeps the value row for a preview slot even with no inputs', async () => {
      const { wrapper } = await mountPicker({ hidePreview: true, hideInputs: true }, { preview: () => h('i', { class: 'own-preview' }) })

      expect(wrapper.find('.ui-color-picker__value-row .own-preview').exists()).toBe(true)
    })
  })
})
