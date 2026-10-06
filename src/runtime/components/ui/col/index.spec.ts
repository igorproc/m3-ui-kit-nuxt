import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MCol from './index.vue'

describe('m-col', () => {
  it('maps span and offset props to mobile-first classes', async () => {
    const wrapper = await mountSuspended(MCol, {
      props: {
        cols: 2,
        tabletXs: 4,
        desktop: 3,
        offset: 1,
        offsetDesktop: 0,
      },
    })

    expect(wrapper.classes()).toEqual([
      'm-col',
      'm-col--span-2',
      'm-col--offset-1',
      'm-col--tablet-xs-span-4',
      'm-col--desktop-span-3',
      'm-col--desktop-offset-0',
    ])
  })

  it('full-width by default (no span classes)', async () => {
    const wrapper = await mountSuspended(MCol)

    expect(wrapper.classes()).toEqual(['m-col'])
  })
})
