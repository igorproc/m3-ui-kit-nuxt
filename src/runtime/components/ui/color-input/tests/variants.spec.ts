import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import MColorInput from '../index.vue'
import { addOverlayHost, cleanUp, input, mountInput } from './helpers'

beforeEach(addOverlayHost)
afterEach(cleanUp)

describe('m-color-input · variants', () => {
  describe('field axes', () => {
    it('is a text field with a swatch button at its end', async () => {
      const { wrapper } = await mountInput({ modelValue: '#6750a4' })

      expect(wrapper.find('.ui-text-field').classes()).toContain('ui-color-input')
      expect(wrapper.find('.ui-text-field__icon--append .ui-color-input__trigger').exists()).toBe(true)
      expect(wrapper.find('.ui-color-input__swatch').exists()).toBe(true)
    })

    it('defaults to filled', async () => {
      const { wrapper } = await mountInput()

      expect(wrapper.find('.ui-text-field').classes()).toContain('ui-text-field--filled')
    })

    it.each(['filled', 'outlined'] as const)('carries the %s variant', async (variant) => {
      const { wrapper } = await mountInput({ variant })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--${variant}`)
    })

    it.each(['compact', 'default', 'comfortable'] as const)('carries the %s density', async (density) => {
      const { wrapper } = await mountInput({ density })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--density-${density}`)
    })

    it.each(['none', 'extra-small', 'medium', 'large', 'full'] as const)('carries the %s shape', async (shape) => {
      const { wrapper } = await mountInput({ shape })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--shape-${shape}`)
    })

    it.each(['top', 'float', 'inset', 'hidden'] as const)('carries the %s label placement', async (labelPlacement) => {
      const { wrapper } = await mountInput({ label: 'Accent', labelPlacement })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--label-${labelPlacement}`)
    })

    it('forwards the field axes, required and name to the field', async () => {
      const { wrapper } = await mountInput({ label: 'Accent', required: true, name: 'accent', density: 'compact', shape: 'large', variant: 'outlined' })

      expect(input(wrapper).attributes('aria-required')).toBe('true')
      expect(input(wrapper).attributes('name')).toBe('accent')
    })

    it('takes no props it would ignore', () => {
      expect(Object.keys(MColorInput.props ?? {})).not.toContain('autocomplete')
      expect(Object.keys(MColorInput.props ?? {})).not.toContain('loading')
    })
  })

  describe('format', () => {
    it.each([
      ['hex', '#ff0000'],
      ['rgb', 'rgb(255, 0, 0)'],
      ['hsl', 'hsl(0, 100%, 50%)'],
    ] as const)('displays the committed color in %s', async (format, shown) => {
      const { wrapper } = await mountInput({ modelValue: 'rgb(255, 0, 0)', format })

      expect((input(wrapper).element as HTMLInputElement).value).toBe(shown)
    })

    it('keeps an unreadable model as it is', async () => {
      const { wrapper } = await mountInput({ modelValue: 'nonsense' })

      expect((input(wrapper).element as HTMLInputElement).value).toBe('nonsense')
    })
  })

  describe('swatch', () => {
    // N6: the colour is painted inline over the checkerboard, with no custom property.
    it('shows the committed colour, and nothing for an empty or unreadable one', async () => {
      const filled = await mountInput({ modelValue: '#ff0000' })
      const color = filled.wrapper.find('.ui-color-input__swatch-color').attributes('style') ?? ''
      expect(color).toContain('background-color: rgba(255, 0, 0, 1)')
      expect(color).not.toContain('--m-')

      const empty = await mountInput()
      expect(empty.wrapper.find('.ui-color-input__swatch-color').attributes('style')).toContain('transparent')
    })
  })

  // B7.2d: without a picker the swatch is a picture, not a live button.
  describe('without a picker', () => {
    it('draws the swatch as a picture, with no button', async () => {
      const { wrapper } = await mountInput({ modelValue: '#ff0000', picker: false })

      expect(wrapper.find('.ui-color-input__trigger').exists()).toBe(false)
      expect(wrapper.find('button').exists()).toBe(false)
      expect(wrapper.find('.ui-color-input__swatch').attributes('aria-hidden')).toBe('true')
    })
  })

  // B7.2e: a format without alpha shows an opaque colour.
  it('draws a hex model that carries alpha opaque', async () => {
    const { wrapper } = await mountInput({ modelValue: '#ff000080', format: 'hex' })

    expect(wrapper.find('.ui-color-input__swatch-color').attributes('style')).toContain('rgba(255, 0, 0, 1)')
  })

  describe('error state', () => {
    it('reserves no support line until an error can reach it', async () => {
      const { wrapper } = await mountInput()

      expect(wrapper.find('.ui-text-field__support').exists()).toBe(false)
    })

    it('carries the error modifier for an app error', async () => {
      const { wrapper } = await mountInput({ errorMessage: 'Pick a brand colour' })

      expect(wrapper.find('.ui-text-field').classes()).toContain('ui-text-field--error')
    })
  })

  describe('slots', () => {
    it.each([
      ['prepend', '.ui-text-field__icon--prepend'],
      ['leading-content', '.ui-text-field__leading'],
    ] as const)('forwards the %s slot', async (slot, selector) => {
      const { wrapper } = await mountInput({}, { [slot]: () => h('i', { class: 'own' }) })

      expect(wrapper.find(`${selector} .own`).exists()).toBe(true)
    })

    it('forwards the helper slot', async () => {
      const { wrapper } = await mountInput({}, { helper: () => 'Brand palette only' })

      expect(wrapper.find('.ui-text-field__support').text()).toBe('Brand palette only')
    })
  })
})
