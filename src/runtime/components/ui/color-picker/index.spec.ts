import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import MColorPicker from './index.vue'
import type { ColorFormat } from '#kit/shared/utils/color'

function mountPicker(pickerProps: Record<string, unknown> = {}) {
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
    }),
  })
  return { model, format, changes, mount: () => mountSuspended(Harness) }
}

describe('m-color-picker', () => {
  it('renders canvas, preview and edit for a preset color', async () => {
    const { mount } = mountPicker({ modelValue: '#6750a4' })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-canvas').exists()).toBe(true)
    expect(wrapper.find('.ui-color-preview__value').text()).toBe('#6750a4')
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

  it('reflects disabled state', async () => {
    const { mount } = mountPicker({ modelValue: '#6750a4', disabled: true })
    const wrapper = await mount()

    expect(wrapper.find('.ui-color-picker--disabled').exists()).toBe(true)
  })

  it('renders precise number channels for rgb formats', async () => {
    const { mount } = mountPicker({ modelValue: 'rgb(103, 80, 164)', format: 'rgb' })
    const wrapper = await mount()

    const channels = wrapper.findAll('.ui-color-edit__channel')
    expect(channels).toHaveLength(3)
    expect(channels.map(channel => channel.find('label').text())).toEqual(['R', 'G', 'B'])
  })
})
