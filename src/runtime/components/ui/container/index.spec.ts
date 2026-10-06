import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MRow from '#kit/components/ui/row/index.vue'
import MCol from '#kit/components/ui/col/index.vue'
import MContainer from './index.vue'

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
