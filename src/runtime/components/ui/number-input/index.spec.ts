import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MNumberInput from './index.vue'

describe('m-number-input', () => {
  it('keeps a numeric model and accepts incomplete drafts', async () => {
    const wrapper = await mountSuspended(MNumberInput, { props: { modelValue: 12 } })
    const input = wrapper.find('input')

    await input.trigger('focus')
    await input.setValue('-')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).not.toEqual([Number.NaN])
    expect(input.element.value).toBe('-')
  })

  it('commits locale-aware input and clamps on blur', async () => {
    const wrapper = await mountSuspended(MNumberInput, {
      props: { locale: 'de-DE', min: 0, max: 10, modelValue: 1 },
    })
    const input = wrapper.find('input')

    await input.trigger('focus')
    await input.setValue('12,5')
    await input.trigger('blur')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([10])
  })

  it('steps with controls and avoids decimal drift', async () => {
    const wrapper = await mountSuspended(MNumberInput, {
      props: { modelValue: 0.1, step: 0.1, precision: 1 },
    })

    await wrapper.find('[aria-label="Increase value"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0.2])
    expect(wrapper.emitted('increment')?.at(-1)).toEqual([0.2])
  })

  it('renders distinct stacked increment and decrement controls', async () => {
    const wrapper = await mountSuspended(MNumberInput, {
      props: { modelValue: 1, controls: 'stacked' },
    })

    expect(wrapper.find('.ui-number-input__stacked').exists()).toBe(true)
    await wrapper.find('[aria-label="Increase value"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([2])
  })

  it('supports keyboard stepping and range aria', async () => {
    const wrapper = await mountSuspended(MNumberInput, {
      props: { modelValue: 5, min: 0, max: 10 },
    })
    const input = wrapper.find('input')

    expect(input.attributes('role')).toBe('spinbutton')
    expect(input.attributes('aria-valuemin')).toBe('0')
    expect(input.attributes('aria-valuemax')).toBe('10')

    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([6])
  })

  it('clears to null and restores invalid text', async () => {
    const wrapper = await mountSuspended(MNumberInput, { props: { modelValue: 3 } })
    const input = wrapper.find('input')

    await input.trigger('focus')
    await input.setValue('')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])

    await input.trigger('focus')
    await input.setValue('invalid')
    await input.trigger('blur')
    expect(wrapper.emitted('invalid')?.at(-1)).toEqual(['invalid', 'invalid'])
  })
})
