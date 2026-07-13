import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MOtpInput from '../app/components/ui/otp-input/index.vue'

describe('m-otp-input', () => {
  it('uses one autofill-friendly native input and emits complete once', async () => {
    const wrapper = await mountSuspended(MOtpInput, { props: { length: 4 } })
    const input = wrapper.find('input')
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(input.attributes('autocomplete')).toBe('one-time-code')
    await input.setValue('1234')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['1234'])
    expect(wrapper.emitted('complete')).toEqual([['1234']])
  })

  it('normalizes numeric unicode, rejects invalid input and groups visually', async () => {
    const wrapper = await mountSuspended(MOtpInput, { props: { length: 4, groups: [2, 2] } })
    await wrapper.find('input').setValue('١2x3')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['123'])
    expect(wrapper.emitted('invalid')?.at(-1)).toEqual(['١2x3', ['x']])
    expect(wrapper.findAll('.ui-otp-input__group')).toHaveLength(2)
    expect(wrapper.findAll('.ui-otp-input__separator')).toHaveLength(1)
    expect(wrapper.find('.ui-otp-input__separator').text()).toBe('–')
  })
})
