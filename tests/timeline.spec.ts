import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTimeline from '../app/components/ui/timeline/index.vue'
import MTimelineItem from '../app/components/ui/timeline/item/index.vue'
import { useTimelineContext } from '../app/composables/timeline/context'

function timeline(timelineProps: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  return defineComponent({
    setup() {
      return () =>
        h(MTimeline, timelineProps, {
          default: () => items.map((item, index) =>
            h(MTimelineItem, { key: item.key ?? index, ...item }, {
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
    expect(wrapper.findAll('li.ui-timeline-item')).toHaveLength(3)
  })

  it('applies side, density and line modifiers', async () => {
    const wrapper = await mountSuspended(timeline({ side: 'alternate', density: 'compact', line: 'dashed' }, [{ title: 'A' }]))
    const root = wrapper.find('.ui-timeline')
    expect(root.classes()).toContain('ui-timeline--density-compact')
    expect(root.attributes('data-side')).toBe('alternate')
    expect(root.attributes('data-line')).toBe('dashed')
    expect(wrapper.find('.ui-timeline-divider--line-dashed').exists()).toBe(true)
  })

  it('resolves all items to the end side by default', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A' }, { title: 'B' }]))
    expect(wrapper.findAll('.ui-timeline-item--end')).toHaveLength(2)
    expect(wrapper.findAll('.ui-timeline-item--start')).toHaveLength(0)
  })

  it('alternates sides by registration order', async () => {
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

  it('hides the leading connector on the first item and the trailing on the last', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A' }, { title: 'B' }, { title: 'C' }]))
    const dividers = wrapper.findAll('.ui-timeline-item__divider')

    expect(dividers[0]!.find('.ui-timeline-divider__line--before').classes()).toContain('is-hidden')
    expect(dividers[0]!.find('.ui-timeline-divider__line--after').classes()).not.toContain('is-hidden')

    expect(dividers[2]!.find('.ui-timeline-divider__line--before').classes()).not.toContain('is-hidden')
    expect(dividers[2]!.find('.ui-timeline-divider__line--after').classes()).toContain('is-hidden')
  })

  it('recomputes first/last as items are added and removed', async () => {
    const count = ref(2)
    const host = defineComponent({
      setup() {
        return () =>
          h(MTimeline, {}, {
            default: () => Array.from({ length: count.value }, (_, index) =>
              h(MTimelineItem, { key: index, title: `E${index}` }, { default: () => `E${index}` })),
          })
      },
    })
    const wrapper = await mountSuspended(host)
    const lastAfter = () => wrapper.findAll('.ui-timeline-item__divider .ui-timeline-divider__line--after')

    expect(lastAfter()[1]!.classes()).toContain('is-hidden')

    count.value = 3
    await nextTick()
    // The old last item is no longer last; the new one is.
    expect(lastAfter()[1]!.classes()).not.toContain('is-hidden')
    expect(lastAfter()[2]!.classes()).toContain('is-hidden')
  })

  it('marks the divider decorative and keeps content readable', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'Order placed', body: 'Order 1248 created.' }]))
    expect(wrapper.find('.ui-timeline-divider').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ui-timeline-item__title').text()).toBe('Order placed')
    expect(wrapper.find('.ui-timeline-item__body').text()).toBe('Order 1248 created.')
  })

  it('renders machine-readable time through the time element', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', time: '09:00', datetime: '2026-07-12T09:00:00+04:00' }]))
    const time = wrapper.find('.ui-timeline-item__time')
    expect(time.element.tagName).toBe('TIME')
    expect(time.attributes('datetime')).toBe('2026-07-12T09:00:00+04:00')
    expect(time.text()).toBe('09:00')
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

  it('drops the opposite column when hideOpposite is set', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', time: '09:00', hideOpposite: true }]))
    expect(wrapper.find('.ui-timeline-item--no-opposite').exists()).toBe(true)
    expect(wrapper.find('.ui-timeline-item__opposite').exists()).toBe(false)
  })

  it('keeps the dot space but no marker when hideDot is set', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', hideDot: true }]))
    expect(wrapper.find('.ui-timeline-divider__dot--empty').exists()).toBe(true)
  })

  it('applies the color role to the marker', async () => {
    const wrapper = await mountSuspended(timeline({}, [{ title: 'A', color: 'tertiary', icon: 'round-check' }]))
    expect(wrapper.find('.ui-timeline-divider').classes()).toContain('ui-timeline-divider--tertiary')
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
