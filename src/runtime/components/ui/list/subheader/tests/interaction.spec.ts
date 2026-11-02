import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MListSubheader from '../index.vue'
import MList from '../../index.vue'
import type { MListSurface } from '../../types'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MListSubheader, { props })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list-subheader · interaction', () => {
  it('pins and unpins with the sticky prop', async () => {
    const wrapper = await mount({ title: 'Pinned' })

    await wrapper.setProps({ sticky: true })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-list-subheader--sticky', 'ui-list-subheader--surface']))

    await wrapper.setProps({ sticky: false })
    expect(wrapper.classes()).toEqual(['ui-list-subheader'])
  })

  it('refills itself when the list declares another surface', async () => {
    const surface = ref<MListSurface>('surface')
    current = await mountSuspended(defineComponent({
      render: () => h(MList, { surface: surface.value }, { default: () => h(MListSubheader, { title: 'Pinned', sticky: true }) }),
    }))
    const wrapper = current as VueWrapper

    surface.value = 'surface-container-low'
    await nextTick()

    const classes = wrapper.find('.ui-list-subheader').classes()
    expect(classes).toContain('ui-list-subheader--surface-container-low')
    expect(classes).not.toContain('ui-list-subheader--surface')
  })

  it('stays out of the tab order — it is a passive label', async () => {
    const wrapper = await mount({ title: 'Recent', sticky: true })

    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })
})
