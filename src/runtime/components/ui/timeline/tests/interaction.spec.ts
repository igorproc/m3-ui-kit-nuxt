import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import type { Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MTimeline from '../index.vue'
import MTimelineItem from '../item/index.vue'
import { useTimelineContext } from '../context'
import type { MTimelineSide } from '../props'

let current: { unmount: () => void } | null = null

async function mount(component: Component) {
  if (current) current.unmount()
  current = await mountSuspended(component)

  return current as VueWrapper
}

const sidesOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-timeline-item').map(item =>
  (item.classes().includes('ui-timeline-item--start') ? 'start' : 'end'))

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-timeline · interaction', () => {
  describe('registration order', () => {
    it('keeps alternate sides in document order when an item is inserted in the middle', async () => {
      const keys = ref(['a', 'c'])
      const wrapper = await mount(defineComponent({
        setup: () => () => h(MTimeline, { side: 'alternate' }, {
          default: () => keys.value.map(key => h(MTimelineItem, { key, title: key }, { default: () => key })),
        }),
      }))

      expect(sidesOf(wrapper)).toEqual(['start', 'end'])

      keys.value = ['a', 'b', 'c']
      await nextTick()
      await nextTick()

      // The new item registers last but stands second in the DOM.
      expect(sidesOf(wrapper)).toEqual(['start', 'end', 'start'])
    })

    it('re-resolves the remaining items when one is removed', async () => {
      const keys = ref(['a', 'b', 'c'])
      const wrapper = await mount(defineComponent({
        setup: () => () => h(MTimeline, { side: 'alternate' }, {
          default: () => keys.value.map(key => h(MTimelineItem, { key, title: key })),
        }),
      }))

      keys.value = ['b', 'c']
      await nextTick()
      await nextTick()

      expect(sidesOf(wrapper)).toEqual(['start', 'end'])
    })
  })

  describe('reactive axes', () => {
    it('re-sides every item when the timeline side changes', async () => {
      const side = ref<MTimelineSide>('end')
      const wrapper = await mount(defineComponent({
        setup: () => () => h(MTimeline, { side: side.value }, {
          default: () => ['a', 'b'].map(key => h(MTimelineItem, { key, title: key })),
        }),
      }))

      side.value = 'alternate'
      await nextTick()

      expect(sidesOf(wrapper)).toEqual(['start', 'end'])
      expect(wrapper.findAll('.ui-timeline-item--alternate')).toHaveLength(2)
    })
  })

  describe('context', () => {
    it('throws when an item has no timeline around it', async () => {
      // The item relies on this guard; exercising the composable directly
      // avoids a second render error from the half-constructed component.
      const Orphan = defineComponent({ setup: () => (useTimelineContext(), () => null) })

      await expect(mountSuspended(Orphan)).rejects.toThrow('<MTimelineItem> must be used inside <MTimeline>')
    })
  })

  describe('server render', () => {
    it('resolves alternate sides in the first paint, by order', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MTimeline, { side: 'alternate' }, () => ['a', 'b', 'c'].map(key => h(MTimelineItem, { key, title: key }))),
      }))

      expect(html.match(/ui-timeline-item--(start|end)/g)).toEqual([
        'ui-timeline-item--start',
        'ui-timeline-item--end',
        'ui-timeline-item--start',
      ])
    })
  })

  // The time-without-datetime warning is guarded by `import.meta.dev`, which
  // Vitest resolves to `false`; it cannot be asserted here.
})
