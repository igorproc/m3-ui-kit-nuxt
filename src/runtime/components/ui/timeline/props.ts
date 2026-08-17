/**
 * Public prop surface for the `<MTimeline>` family.
 *
 * V1 is vertical and explicit-composition-first: consumers place
 * `<MTimelineItem>` children directly (a normal `v-for` covers homogeneous
 * data). There is no items/data prop, date formatting, selection or workflow
 * state — the timeline displays history, it never controls a process like a
 * stepper.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MColor } from '#kit/shared/types/props'
import type { MSurfaceVariant } from '#kit/components/ui/surface/props'
import type {
  MTimelineDensity,
  MTimelineLine,
  MTimelineResolvedSide,
  MTimelineSide,
} from '#kit/composables/timeline/context'

export const mTimelineProps = {
  /** Which side content sits on. `alternate` zig-zags by registration order. */
  side: { type: String as PropType<MTimelineSide>, default: 'end' },
  /** Vertical rhythm between items. */
  density: { type: String as PropType<MTimelineDensity>, default: 'default' },
  /** Connector line style. */
  line: { type: String as PropType<MTimelineLine>, default: 'solid' },
}

export type MTimelineProps = ExtractPublicPropTypes<typeof mTimelineProps>

export const mTimelineItemProps = {
  /** Plain-text title; the `title` slot takes precedence. */
  title: { type: String, default: undefined },
  /** Plain-text body; the default slot takes precedence. */
  text: { type: String, default: undefined },
  /** Human-readable time; the `opposite` slot takes precedence. */
  time: { type: String, default: undefined },
  /** Machine-readable timestamp rendered through `<time datetime>`. */
  datetime: { type: String, default: undefined },
  /** Decorative marker icon. */
  icon: { type: String, default: undefined },
  /** Semantic color of the marker (and outlined content accent). */
  color: { type: String as PropType<MColor>, default: 'primary' },
  /** MD3 surface preset for the content container. */
  variant: { type: String as PropType<MSurfaceVariant>, default: 'plain' },
  /** Side override; wins over the parent's alternate resolution. */
  side: { type: String as PropType<MTimelineResolvedSide>, default: undefined },
  /** Hides the opposite (time) column while keeping the rail. */
  hideOpposite: { type: Boolean, default: false },
  /** Hides the marker dot while preserving connector geometry. */
  hideDot: { type: Boolean, default: false },
  /** Content element tag. */
  contentTag: { type: String as PropType<'div' | 'article'>, default: 'div' },
}

export type MTimelineItemProps = ExtractPublicPropTypes<typeof mTimelineItemProps>
