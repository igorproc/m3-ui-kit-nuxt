import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTimePicker from './index.vue'
import MTimePickerKeyboard from '#kit/components/fragments/time-picker/keyboard/index.vue'
import MTimePickerDial from '#kit/components/fragments/time-picker/dial/index.vue'

describe('m-time-picker', () => {
  it('renders the dial face by default (mode="dial")', async () => {
    const wrapper = await mountSuspended(MTimePicker)

    expect(wrapper.find('.ui-time-picker-dial').exists()).toBe(true)
    expect(wrapper.find('.ui-time-picker-dial__face').exists()).toBe(true)
  })

  it('renders the keyboard variant when mode="keyboard"', async () => {
    const wrapper = await mountSuspended(MTimePicker, {
      props: { mode: 'keyboard' },
    })

    expect(wrapper.find('.ui-time-picker-keyboard').exists()).toBe(true)
    expect(wrapper.find('.ui-time-picker-dial').exists()).toBe(false)
  })

  it('forwards the layout prop to the dial modifier class', async () => {
    const wrapper = await mountSuspended(MTimePicker, {
      props: { layout: 'horizontal' },
    })

    expect(wrapper.find('.ui-time-picker-dial--horizontal').exists()).toBe(true)
  })

  it('passes the model value down into the keyboard inputs', async () => {
    const wrapper = await mountSuspended(MTimePicker, {
      props: { mode: 'keyboard', modelValue: '08:30' },
    })

    // Hours are stored unpadded until blur; minutes keep the raw model string.
    const inputs = wrapper.findAll('.ui-time-picker-keyboard__input')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('8')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('30')
  })
})

describe('m-time-picker keyboard leaf', () => {
  it('renders hour/minute inputs with a11y labels', async () => {
    const wrapper = await mountSuspended(MTimePickerKeyboard, {
      props: { modelValue: '12:00' },
    })

    const inputs = wrapper.findAll('.ui-time-picker-keyboard__input')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]!.attributes('aria-label')).toBe('Hours')
    expect(inputs[1]!.attributes('aria-label')).toBe('Minutes')
  })

  it('renders the AM/PM toggle only in 12h mode', async () => {
    const h24 = await mountSuspended(MTimePickerKeyboard, {
      props: { modelValue: '13:00', is24h: true },
    })
    expect(h24.find('.ui-time-picker-keyboard__ampm').exists()).toBe(false)

    const h12 = await mountSuspended(MTimePickerKeyboard, {
      props: { modelValue: '01:00', is24h: false },
    })
    expect(h12.find('.ui-time-picker-keyboard__ampm').exists()).toBe(true)
    expect(h12.findAll('.ui-time-picker-keyboard__ampm-btn')).toHaveLength(2)
  })

  it('emits an updated model value when an input changes', async () => {
    const wrapper = await mountSuspended(MTimePickerKeyboard, {
      props: { modelValue: '08:30' },
    })

    const hours = wrapper.findAll('.ui-time-picker-keyboard__input')[0]!
    await hours.setValue('09')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted!.at(-1)).toEqual(['09:30'])
  })

  it('renders the label only when not in dial mode', async () => {
    const standalone = await mountSuspended(MTimePickerKeyboard, {
      props: { modelValue: '00:00', label: 'Pick a time' },
    })
    expect(standalone.find('.ui-time-picker-keyboard__label').text()).toBe('Pick a time')

    const dialChild = await mountSuspended(MTimePickerKeyboard, {
      props: { modelValue: '00:00', label: 'Pick a time', isDial: true },
    })
    expect(dialChild.find('.ui-time-picker-keyboard__label').exists()).toBe(false)
  })
})

describe('m-time-picker dial leaf', () => {
  it('renders the clock face and embedded keyboard header', async () => {
    const wrapper = await mountSuspended(MTimePickerDial, {
      props: { modelValue: '10:15' },
    })

    expect(wrapper.find('.ui-time-picker-dial__face').exists()).toBe(true)
    expect(wrapper.find('.ui-time-picker-dial__header .ui-time-picker-keyboard').exists()).toBe(true)
    expect(wrapper.findAll('.ui-time-picker-dial__number').length).toBeGreaterThan(0)
  })
})
