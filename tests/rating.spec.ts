import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MRating from '../app/components/ui/rating/index.vue'

describe('m-rating', () => {
  it('is one slider tab stop and supports fractional keyboard updates', async () => {
    const wrapper = await mountSuspended(MRating, { props: { step: 0.5, modelValue: 2.5 } })
    expect(wrapper.attributes('role')).toBe('slider')
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.findAll('[tabindex="0"]')).toHaveLength(1)
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
  })

  it('renders fractional clipping and readonly aggregate semantics', async () => {
    const wrapper = await mountSuspended(MRating, { props: { modelValue: 2.5, step: 0.5, readonly: true } })
    expect(wrapper.attributes('aria-valuenow')).toBe('2.5')
    expect(wrapper.attributes('aria-readonly')).toBe('true')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.findAll('.ui-rating__fill')[2]?.attributes('style')).toContain('50%')
  })
})
