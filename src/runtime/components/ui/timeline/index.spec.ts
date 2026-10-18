import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTimeline from './index.vue'
import MTimelineItem from './item/index.vue'
import { useTimelineContext } from '#kit/composables/timeline/context'

function timeline(timelineProps: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  return defineComponent({
    setup() {
      return () =>
        h(MTimeline, timelineProps, {
          default: () => items.map((item, index) =>
            h(MTimelineItem, { key: (item.key as PropertyKey | undefined) ?? index, ...item }, {
              default: () => item.body ?? `Event ${index}`,
            })),
        })
    },
  })
}

describe('MTimeline', () => {
  it('renders a semantic ordered list of items', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A' }, { title: 'B' }, { title: 'C' }]))
    expect(wrapper.find('ol.ui-timeline').exists()).toBe(true)
    expect(wrapper.findAll('ol.ui-timeline > li.ui-timeline-item')).toHaveLength(3)
  })

  it('expresses side, density and line as modifiers, never data attributes', async () => {
    const wrapper = await mountSuspended(timeline({ side: 'alternate', density: 'compact', line: 'dashed' }, [{ title: 'A' }]))
    const root = wrapper.find('.ui-timeline')
    expect(root.classes()).toEqual(expect.arrayContaining([
      'ui-timeline--side-alternate',
      'ui-timeline--density-compact',
      'ui-timeline--line-dashed',
    ]))
    expect(Object.keys(root.attributes()).filter(key => key.startsWith('data-'))).toEqual([])
  })

  it('resolves all items to the end side by default', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A' }, { title: 'B' }]))
    expect(wrapper.findAll('.ui-timeline-item--end')).toHaveLength(2)
    expect(wrapper.findAll('.ui-timeline-item--start')).toHaveLength(0)
  })

  it('alternates sides by order', async () => {
    const wrapper = await mountSuspended(timeline({ side: 'alternate' }, [{ title: 'A' }, { title: 'B' }, { title: 'C' }]))
    const items = wrapper.findAll('.ui-timeline-item')
    expect(items[0]!.classes()).toContain('ui-timeline-item--start')
    expect(items[1]!.classes()).toContain('ui-timeline-item--end')
    expect(items[2]!.classes()).toContain('ui-timeline-item--start')
  })

  it('lets an item override its resolved side under alternate', async () => {
    const wrapper = await mountSuspended(timeline({ side: 'alternate' }, [{ title: 'A' }, { title: 'B', side: 'start' }]))
    const items = wrapper.findAll('.ui-timeline-item')
    // Without the override B would be 'end'; the explicit side wins.
    expect(items[1]!.classes()).toContain('ui-timeline-item--start')
  })

  it('keeps alternate sides in document order when an item is inserted in the middle', async () => {
    const keys = ref(['a', 'c'])
    const host = defineComponent({
      setup() {
        return () =>
          h(MTimeline, { side: 'alternate' }, {
            default: () => keys.value.map(key =>
              h(MTimelineItem, { key, title: key }, { default: () => key })),
          })
      },
    })
    const wrapper = await mountSuspended(host)
    const sides = () => wrapper.findAll('.ui-timeline-item').map(item =>
      item.classes().includes('ui-timeline-item--start') ? 'start' : 'end')

    expect(sides()).toEqual(['start', 'end'])

    keys.value = ['a', 'b', 'c']
    await nextTick()
    await nextTick()
    // The new item is registered last but stands second in the DOM.
    expect(sides()).toEqual(['start', 'end', 'start'])
  })

  it('marks the rail decorative and keeps content readable', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'Order placed', body: 'Order 1248 created.' }]))
    expect(wrapper.find('.ui-timeline-divider').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ui-timeline-item__title').text()).toBe('Order placed')
    expect(wrapper.find('.ui-timeline-item__body').text()).toBe('Order 1248 created.')
  })

  it('states the outcome in a visually hidden word read before the title', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'Delivery', status: 'Failed', color: 'error', icon: 'ic:outline-close' }]))
    const content = wrapper.find('.ui-timeline-item__content')
    const status = content.find('.ui-timeline-item__status')

    expect(status.text()).toBe('Failed')
    expect(content.element.firstElementChild).toBe(status.element)
    expect(wrapper.find('.ui-timeline-divider__dot--error').exists()).toBe(true)
  })

  it('renders no status word without a status', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A' }]))
    expect(wrapper.find('.ui-timeline-item__status').exists()).toBe(false)
  })

  it('renders machine-readable time through the time element', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', time: '09:00', datetime: '2026-07-12T09:00:00+04:00' }]))
    const time = wrapper.find('.ui-timeline-item__time')
    expect(time.element.tagName).toBe('TIME')
    expect(time.attributes('datetime')).toBe('2026-07-12T09:00:00+04:00')
    expect(time.text()).toBe('09:00')
  })

  it('renders the time column only for an item that has a time', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', time: '09:00', datetime: '2026-07-12T09:00' }, { title: 'B' }]))
    const items = wrapper.findAll('.ui-timeline-item')
    expect(items[0]!.find('.ui-timeline-item__opposite').exists()).toBe(true)
    expect(items[1]!.find('.ui-timeline-item__opposite').exists()).toBe(false)
  })

  it('prefers slots over the title/text/opposite props', async () => {
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () =>
        h(MTimeline, {}, {
          default: () => h(MTimelineItem, { title: 'prop', text: 'propbody', time: '09:00' }, {
            title: () => 'slot title',
            default: () => 'slot body',
            opposite: () => h('span', { class: 'op' }, 'custom time'),
          }),
        }),
    }))
    expect(wrapper.find('.ui-timeline-item__title').text()).toBe('slot title')
    expect(wrapper.find('.ui-timeline-item__body').text()).toBe('slot body')
    expect(wrapper.find('.op').text()).toBe('custom time')
    expect(wrapper.find('.ui-timeline-item__time').exists()).toBe(false)
  })

  it('renders an opposite slot without a time', async () => {
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () =>
        h(MTimeline, {}, {
          default: () => h(MTimelineItem, { title: 'A' }, { opposite: () => h('span', { class: 'op' }, 'Now') }),
        }),
    }))
    expect(wrapper.find('.ui-timeline-item__opposite .op').text()).toBe('Now')
  })

  it('renders no time for an item with hideOpposite', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', time: '09:00', hideOpposite: true }]))
    expect(wrapper.find('.ui-timeline-item__opposite').exists()).toBe(false)
  })

  it('drops the dot but keeps the rail cell when hideDot is set', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', hideDot: true }]))
    expect(wrapper.find('.ui-timeline-item').classes()).toContain('ui-timeline-item--no-dot')
    expect(wrapper.find('.ui-timeline-item__divider').exists()).toBe(true)
    expect(wrapper.find('.ui-timeline-divider__dot').exists()).toBe(false)
  })

  it('applies the color role to the marker', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', color: 'tertiary', icon: 'round-check' }]))
    expect(wrapper.find('.ui-timeline-divider__dot').classes()).toContain('ui-timeline-divider__dot--tertiary')
    expect(wrapper.html()).toContain('round-check')
  })

  it('renders the content as an article when requested', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', contentTag: 'article' }]))
    expect(wrapper.find('.ui-timeline-item__content').element.tagName).toBe('ARTICLE')
  })

  it('throws when the timeline context is missing', async () => {
    // The item relies on this guard; exercising the composable directly avoids
    // a second render error from the half-constructed component.
    const Orphan = defineComponent({ setup: () => (useTimelineContext(), () => null) })
    await expect(mountSuspended(Orphan)).rejects.toThrow('<MTimelineItem> must be used inside <MTimeline>')
  })
})
