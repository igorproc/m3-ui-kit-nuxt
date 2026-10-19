import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import MColorPicker from './index.vue'
import type { ColorFormat } from '#kit/shared/utils/color'

function mountPicker(pickerProps: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const model = ref<string | null>((pickerProps.modelValue as string) ?? null)
  const format = ref<ColorFormat>((pickerProps.format as ColorFormat) ?? 'hex')
  const changes: Array<string | null> = []
  const Harness = defineComponent({
    setup: () => () => h(MColorPicker, {
      ...pickerProps,
      'modelValue': model.value,
      'onUpdate:modelValue': (v: string | null) => { model.value = v },
      'format': format.value,
      'onUpdate:format': (v: ColorFormat) => { format.value = v },
      'onChange': (v: string | null) => { changes.push(v) },
    }, slots),
  })
  return { model, format, changes, mount: () => mountSuspended(Harness) }
}

describe('m-color-picker', () => {
  it('renders canvas, preview and edit for a preset color', async () => {
    const { mount } = mountPicker({ modelValue: '#6750a4' })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-canvas').exists()).toBe(true)
    expect(wrapper.find('.ui-color-preview').exists()).toBe(true)
    expect((wrapper.find('.ui-color-edit input').element as HTMLInputElement).value).toBe('#6750a4')
    expect(wrapper.find('.ui-color-edit').exists()).toBe(true)
  })

  it('shows the alpha slider only for alpha formats', async () => {
    const opaque = mountPicker({ modelValue: '#6750a4', format: 'hex' })
    const opaqueWrapper = await opaque.mount()
    expect(opaqueWrapper.find('.ui-color-picker__alpha').exists()).toBe(false)

    const alpha = mountPicker({ modelValue: '#6750a480', format: 'hexa' })
    const alphaWrapper = await alpha.mount()
    expect(alphaWrapper.find('.ui-color-picker__alpha').exists()).toBe(true)
  })

  it('selects a swatch, updating the model and emitting change', async () => {
    const { model, changes, mount } = mountPicker({
      modelValue: '#000000',
      swatches: ['#ff0000', '#00ff00'],
    })
    const wrapper = await mount()

    const swatches = wrapper.findAll('.ui-color-swatches__item')
    expect(swatches.length).toBe(2)

    await swatches[0]!.trigger('click')
    await nextTick()

    expect(model.value).toBe('#ff0000')
    expect(changes).toContain('#ff0000')
  })

  it('reformats the model when the format changes', async () => {
    const { model, format, mount } = mountPicker({ modelValue: '#ff0000', format: 'hex' })
    await mount()

    format.value = 'rgb'
    await nextTick()

    expect(model.value).toBe('rgb(255, 0, 0)')
  })

  it('drives the hue slider to update the model', async () => {
    const { model, mount } = mountPicker({ modelValue: '#ff0000' })
    const wrapper = await mount()

    const hue = wrapper.find('.ui-color-picker__hue')
    ;(hue.element as HTMLInputElement).value = '120'
    await hue.trigger('input')
    await nextTick()

    // Hue 120 on a fully saturated/bright red yields green.
    expect(model.value).toBe('#00ff00')
  })

  it('reflects disabled state and takes the parts out of the tab order', async () => {
    const { mount } = mountPicker({ modelValue: '#6750a4', disabled: true, swatches: ['#ff0000'] })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-picker--disabled').exists()).toBe(true)
    expect(wrapper.find('.ui-color-canvas [role="slider"]').attributes('tabindex')).toBe('-1')
    expect(wrapper.find('[role="listbox"]').attributes('tabindex')).toBe('-1')
  })

  it('marks a swatch chosen whenever it is the same colour, however either is spelled', async () => {
    const { mount } = mountPicker({ modelValue: 'rgb(103, 80, 164)', format: 'rgb', swatches: ['#6750A4', '#ff0000'] })
    const wrapper = await mount()
    const [first, second] = wrapper.findAll('.ui-color-swatches__item')

    expect(first!.attributes('aria-selected')).toBe('true')
    expect(first!.find('.ui-color-swatches__check').exists()).toBe(true)
    expect(second!.attributes('aria-selected')).toBe('false')
  })

  it('walks the swatches with the arrows from one tab stop and chooses with Enter', async () => {
    const { model, mount } = mountPicker({ modelValue: '#000000', swatches: ['#ff0000', '#00ff00', '#0000ff'] })
    const wrapper = await mount()
    const list = wrapper.find('[role="listbox"]')

    expect(list.attributes('tabindex')).toBe('0')
    expect(wrapper.findAll('[role="option"]').every(option => option.attributes('tabindex') === undefined)).toBe(true)

    await list.trigger('focus')
    await list.trigger('keydown', { key: 'ArrowRight' })
    await list.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(list.attributes('aria-activedescendant')).toBe(wrapper.findAll('[role="option"]')[1]!.attributes('id'))
    expect(model.value).toBe('#00ff00')
  })

  it('keeps two equal swatches as two options', async () => {
    const { mount } = mountPicker({ swatches: ['#ff0000', '#ff0000'] })
    const wrapper = await mount()

    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
  })

  it('reads the 2-D field as two sliders with values in percent', async () => {
    const { mount } = mountPicker({
      modelValue: '#ff0000',
      messages: { saturation: 'Saturation', brightness: 'Brightness' },
    })
    const wrapper = await mount()
    const [saturation, brightness] = wrapper.findAll('.ui-color-canvas [role="slider"]')

    expect(saturation!.attributes()).toMatchObject({ 'aria-label': 'Saturation', 'aria-valuenow': '100', 'aria-valuetext': '100%', 'tabindex': '0' })
    expect(brightness!.attributes()).toMatchObject({ 'aria-label': 'Brightness', 'aria-orientation': 'vertical' })
  })

  it('moves an axis of the 2-D field with the keyboard', async () => {
    const { model, mount } = mountPicker({ modelValue: '#ff0000' })
    const wrapper = await mount()
    const brightness = wrapper.findAll('.ui-color-canvas [role="slider"]')[1]!

    await brightness.trigger('keydown', { key: 'End' })
    await brightness.trigger('keydown', { key: 'PageDown' })
    await nextTick()

    expect(brightness.attributes('aria-valuenow')).toBe('90')
    expect(model.value).not.toBe('#ff0000')
  })

  it('says the hue and alpha values in degrees and percent', async () => {
    const { mount } = mountPicker({ modelValue: '#00ff0080', format: 'hexa' })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-picker__hue').attributes('aria-valuetext')).toBe('120°')
    expect(wrapper.find('.ui-color-picker__alpha').attributes('aria-valuetext')).toBe('50%')
  })

  it('keeps an unreadable value in the field with the format hint, and Escape puts the last good one back', async () => {
    const { model, mount } = mountPicker({ modelValue: '#ff0000', messages: { formatHint: 'Use #RRGGBB' } })
    const wrapper = await mount()
    const field = wrapper.find('.ui-color-edit input')

    await field.setValue('#zz')
    await field.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect((field.element as HTMLInputElement).value).toBe('#zz')
    expect(wrapper.find('.ui-color-edit [role="alert"]').text()).toBe('Use #RRGGBB')
    expect(model.value).toBe('#ff0000')

    await field.trigger('keydown', { key: 'Escape' })
    await nextTick()

    expect((field.element as HTMLInputElement).value).toBe('#ff0000')
    // A readable value has nothing to say: the line goes with the error (decision 2026-10-19).
    expect(wrapper.find('.ui-color-edit [role="alert"]').exists()).toBe(false)
  })

  it('takes no change while read-only', async () => {
    const { model, mount } = mountPicker({ modelValue: '#ff0000', readonly: true, swatches: ['#00ff00'] })
    const wrapper = await mount()

    await wrapper.find('.ui-color-swatches__item').trigger('click')
    const hue = wrapper.find('.ui-color-picker__hue')
    ;(hue.element as HTMLInputElement).value = '200'
    await hue.trigger('input')
    await nextTick()

    expect(model.value).toBe('#ff0000')
    expect(wrapper.find('.ui-color-canvas [role="slider"]').attributes('aria-readonly')).toBe('true')
  })

  it('is a named group, and offers the formats as a compact list', async () => {
    const { mount } = mountPicker({ label: 'Brand colour', messages: { format: 'Format' } })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-picker').attributes()).toMatchObject({ 'role': 'group', 'aria-label': 'Brand colour' })
    expect(wrapper.find('.ui-color-picker__format [role="combobox"]').exists()).toBe(true)
  })

  it('names the channel fields as a group', async () => {
    const { mount } = mountPicker({ modelValue: 'rgb(1, 2, 3)', format: 'rgb', messages: { channels: 'Channels' } })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-edit__channels').attributes()).toMatchObject({ 'role': 'group', 'aria-label': 'Channels' })
  })

  it('renders precise number channels for rgb formats', async () => {
    const { mount } = mountPicker({ modelValue: 'rgb(103, 80, 164)', format: 'rgb' })
    const wrapper = await mount()

    const channels = wrapper.findAll('.ui-color-edit__channel')
    expect(channels).toHaveLength(3)
    expect(channels.map(channel => channel.find('label').text())).toEqual(['R', 'G', 'B'])
  })

  it('sets the preview, the format and a hex value in one row, with no value said twice', async () => {
    const { mount } = mountPicker({ modelValue: '#6750a4', format: 'hex' })
    const wrapper = await mount()
    const row = wrapper.find('.ui-color-picker__value-row')

    expect(row.find('.ui-color-preview').exists()).toBe(true)
    expect(row.find('.ui-color-picker__format').exists()).toBe(true)
    expect(row.find('.ui-color-edit').classes()).not.toContain('ui-color-edit--channels')
    expect(row.find('.ui-color-preview').text()).toBe('')
  })

  it('puts four channels in two pairs, so no value is cut short', async () => {
    const { mount } = mountPicker({ modelValue: 'rgba(103, 80, 164, 1)', format: 'rgba' })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-edit').classes()).toContain('ui-color-edit--channels')
    expect(wrapper.find('.ui-color-edit__channels').classes()).toContain('ui-color-edit__channels--pairs')
  })

  it('takes a preview, swatch content and actions from slots', async () => {
    const { mount } = mountPicker({ modelValue: '#6750a4', swatches: ['#6750a4', '#ffffff'] }, {
      preview: ({ value }: { value: string }) => h('i', { class: 'own-preview' }, value),
      swatch: ({ selected }: { selected: boolean }) => h('b', { class: 'own-swatch' }, selected ? 'yes' : 'no'),
      actions: () => h('button', { class: 'own-action' }, 'Apply'),
    })
    const wrapper = await mount()

    expect(wrapper.find('.own-preview').text()).toBe('#6750a4')
    expect(wrapper.findAll('.own-swatch').map(item => item.text())).toEqual(['yes', 'no'])
    expect(wrapper.find('.ui-color-picker__actions .own-action').exists()).toBe(true)
  })
})
