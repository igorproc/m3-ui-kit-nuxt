import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MContainer from '../app/components/ui/container/index.vue'
import MRow from '../app/components/ui/row/index.vue'
import MCol from '../app/components/ui/col/index.vue'
import MResponsive from '../app/components/ui/responsive/index.vue'

describe('m-container', () => {
  it('renders the bare grid by default', async () => {
    const wrapper = await mountSuspended(MContainer)

    expect(wrapper.classes()).toEqual(['m-container'])
  })

  it('maps fluid and per-breakpoint cols props to static classes', async () => {
    const wrapper = await mountSuspended(MContainer, {
      props: { fluid: true, cols: 6, colsTablet: 8, colsDesktop: 12 },
    })

    expect(wrapper.classes()).toContain('m-container--fluid')
    expect(wrapper.classes()).toContain('m-container--cols-6')
    expect(wrapper.classes()).toContain('m-container--tablet-cols-8')
    expect(wrapper.classes()).toContain('m-container--desktop-cols-12')
  })
})

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

describe('m-row', () => {
  it('maps align and no-gutters to classes', async () => {
    const wrapper = await mountSuspended(MRow, {
      props: { align: 'center', noGutters: true },
    })

    expect(wrapper.classes()).toContain('m-row--align-center')
    expect(wrapper.classes()).toContain('m-row--no-gutters')
  })
})

describe('m-responsive', () => {
  it('applies the aspect-ratio inline', async () => {
    const wrapper = await mountSuspended(MResponsive, {
      props: { aspectRatio: '16 / 9' },
    })

    expect(wrapper.attributes('style')).toContain('aspect-ratio: 16 / 9')
  })
})

describe('composition', () => {
  it('container → row → cols renders the expected tree', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MContainer, { colsDesktop: 12 }, () => [
        h(MRow, { align: 'center' }, () => [
          h(MCol, { cols: 2 }),
          h(MCol, { cols: 2, offset: 1 }),
        ]),
      ]),
    }))

    expect(wrapper.findAll('.m-col')).toHaveLength(2)
    expect(wrapper.find('.m-row').exists()).toBe(true)
    expect(wrapper.findAll('.m-col')[1]!.classes()).toContain('m-col--offset-1')
  })
})
