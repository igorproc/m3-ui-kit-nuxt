import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MResponsive from './index.vue'

describe('m-responsive', () => {
  it('applies the aspect-ratio inline', async () => {
    const wrapper = await mountSuspended(MResponsive, {
      props: { aspectRatio: '16 / 9' },
    })

    expect(wrapper.attributes('style')).toContain('aspect-ratio: 16 / 9')
  })
})
