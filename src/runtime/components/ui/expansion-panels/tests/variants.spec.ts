import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import MExpansionPanels from '../index.vue'
import { expanded, group } from './helpers'
import type { Model } from './helpers'

let current: { unmount: () => void } | null = null

async function mount(component: ReturnType<typeof group>) {
  if (current) current.unmount()
  current = await mountSuspended(component)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-expansion-panels · variants', () => {
  it('renders the group container with its panels, all collapsed by default', async () => {
    const wrapper = await mount(group())

    expect(wrapper.find('.ui-expansion-panels').classes()).toEqual(['ui-expansion-panels'])
    expect(wrapper.findAll('.ui-expansion-panel')).toHaveLength(3)
    expect(expanded(wrapper)).toEqual([false, false, false])
  })

  it('renders a bare container for a slot without panels', async () => {
    const wrapper = await mountSuspended(MExpansionPanels, { slots: { default: () => 'Nothing' } })

    expect(wrapper.text()).toBe('Nothing')
    wrapper.unmount()
  })

  describe('preset model', () => {
    it('opens the panel matching a preset exclusive model at mount', async () => {
      const wrapper = await mount(group({ model: ref<Model>('b') }))

      expect(expanded(wrapper)).toEqual([false, true, false])
    })

    it('opens every panel of a preset multiple model at mount', async () => {
      const wrapper = await mount(group({ multiple: ref(true), model: ref<Model>(['a', 'c']) }))

      expect(expanded(wrapper)).toEqual([true, false, true])
    })

    it('opens nothing for a model no panel holds', async () => {
      const wrapper = await mount(group({ model: ref<Model>('z') }))

      expect(expanded(wrapper)).toEqual([false, false, false])
    })
  })

  describe('mandatory', () => {
    it('locks only the open panel of an exclusive group', async () => {
      const wrapper = await mount(group({ mandatory: ref(true), model: ref<Model>('a') }))
      const headers = wrapper.findAll('.ui-expansion-panel__header')

      expect(headers.map(header => header.classes().includes('ui-expansion-panel__header--locked'))).toEqual([true, false, false])
    })

    it('locks nothing in a multiple group — mandatory is exclusive-only', async () => {
      const wrapper = await mount(group({ multiple: ref(true), mandatory: ref(true), model: ref<Model>(['a']) }))

      expect(wrapper.find('.ui-expansion-panel__header--locked').exists()).toBe(false)
    })
  })
})
