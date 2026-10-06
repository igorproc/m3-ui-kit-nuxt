import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MRow from './index.vue'

describe('m-row', () => {
  it('maps align and no-gutters to classes', async () => {
    const wrapper = await mountSuspended(MRow, {
      props: { align: 'center', noGutters: true },
    })

    expect(wrapper.classes()).toContain('m-row--align-center')
    expect(wrapper.classes()).toContain('m-row--no-gutters')
  })
})
