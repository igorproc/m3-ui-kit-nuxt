import { defineComponent, h } from 'vue'
import MTimeline from '../index.vue'
import MTimelineItem from '../item/index.vue'

/** A timeline of plain items: each record is one item's props, `body` its default slot. */
export function timeline(timelineProps: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  return defineComponent({
    setup: () => () => h(MTimeline, timelineProps, {
      default: () => items.map((item, index) =>
        h(MTimelineItem, { key: (item.key as PropertyKey | undefined) ?? index, ...item }, {
          default: () => item.body ?? `Event ${index}`,
        })),
    }),
  })
}

/** A timeline of one item with its own slots. */
export function single(itemProps: Record<string, unknown>, slots: Record<string, () => unknown>) {
  return defineComponent({
    setup: () => () => h(MTimeline, null, { default: () => h(MTimelineItem, itemProps, slots) }),
  })
}
