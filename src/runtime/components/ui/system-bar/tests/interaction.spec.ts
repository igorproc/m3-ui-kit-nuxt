import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNodeChild } from 'vue'
import MSystemBar from '../index.vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutHeader from '#kit/components/ui/layout/header.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import { Probe, probeItems } from '#kit/components/ui/layout/tests/helpers'

let current: { unmount: () => void } | null = null

async function mount(render: () => VNodeChild) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }))

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const MAIN = { kind: 'main', size: null, sticky: false }
const BAR = 'var(--ui-system-bar-height)'

describe('m-system-bar · interaction', () => {
  describe('in m-layout', () => {
    it('registers as a sticky top zone sized by its height token', async () => {
      const wrapper = await mount(() => h(MLayout, () => [h(MSystemBar), h(MLayoutMain, () => h(Probe))]))
      const bar = wrapper.find('.ui-system-bar')
      const el = bar.element as HTMLElement

      expect(bar.classes()).toContain('ui-system-bar--anchored')
      expect(el.style.gridArea).toBeTruthy()
      expect(bar.attributes('data-m3-zone')).toBe(el.style.gridArea)
      expect(probeItems(wrapper)).toEqual([{ kind: 'top', size: BAR, sticky: true }, MAIN])
    })

    it('registers an in-flow zone when sticky is false', async () => {
      const wrapper = await mount(() => h(MLayout, () => [h(MSystemBar, { sticky: false }), h(MLayoutMain, () => h(Probe))]))

      expect(wrapper.find('.ui-system-bar').classes()).toContain('ui-system-bar--anchored')
      expect(probeItems(wrapper)).toEqual([{ kind: 'top', size: BAR, sticky: false }, MAIN])
    })

    it('follows a sticky change without re-registering a second zone', async () => {
      const sticky = ref(true)
      const wrapper = await mount(() => h(MLayout, () => [h(MSystemBar, { sticky: sticky.value }), h(MLayoutMain, () => h(Probe))]))

      sticky.value = false
      await nextTick()
      await nextTick()

      expect(probeItems(wrapper)).toEqual([{ kind: 'top', size: BAR, sticky: false }, MAIN])
    })

    it('carves its row above an app bar that follows it', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MSystemBar),
        h(MAppBar, { title: 'Title' }),
        h(MLayoutMain, () => h(Probe)),
      ]))

      expect(probeItems(wrapper)).toEqual([
        { kind: 'top', size: BAR, sticky: true },
        { kind: 'top', size: 'var(--ui-app-bar-height-small)', sticky: true },
        MAIN,
      ])
    })

    it('inside m-layout-header adds its height to the app bar instead of registering', async () => {
      const wrapper = await mount(() => h(MLayout, () => [
        h(MLayoutHeader, () => [h(MSystemBar), h(MAppBar, { title: 'Title' })]),
        h(MLayoutMain, () => h(Probe)),
      ]))
      const bar = wrapper.find('.ui-system-bar')

      expect(bar.classes()).not.toContain('ui-system-bar--anchored')
      expect(bar.attributes('data-m3-zone')).toBeUndefined()
      expect((bar.element as HTMLElement).style.gridArea).toBeFalsy()
      expect(wrapper.find('header').attributes('data-m3-zone')).toBeTruthy()
      expect(probeItems(wrapper)).toEqual([
        { kind: 'top', size: `calc(${BAR} + var(--ui-app-bar-height-small))`, sticky: true },
        MAIN,
      ])
    })

    it('inside main is ordinary content: no zone of its own', async () => {
      const wrapper = await mount(() => h(MLayout, () => h(MLayoutMain, () => [h(MSystemBar), h(Probe)])))

      expect(wrapper.find('.ui-system-bar').classes()).not.toContain('ui-system-bar--anchored')
      expect(wrapper.find('.ui-system-bar').attributes('data-m3-zone')).toBeUndefined()
      expect(probeItems(wrapper).map(item => item.kind)).toEqual(['main'])
    })

    it('inside main contributes no size to the main zone', async () => {
      const wrapper = await mount(() => h(MLayout, () => h(MLayoutMain, () => [h(MSystemBar), h(Probe)])))

      expect(probeItems(wrapper)).toEqual([MAIN])
    })
  })
})
