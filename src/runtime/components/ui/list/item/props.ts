/**
 * Public prop surface for `<MListItem>`.
 *
 * `disabled` is the only state: a row has no loading state — progress goes in
 * the `#trailing` slot. The remaining props are list-item-specific content and
 * behaviour fields.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'

export type MListItemLines = 1 | 2 | 3 | 'auto'

/**
 * Vertical scale. Not a re-declared union: this *is* the field family's axis,
 * taken whole, because a list row has to line up with a field of the same
 * density (a dropdown panel under its own trigger is the case that forced it).
 *
 * Orthogonal to {@link MListItemLines}: `lines` is the shape of the content
 * (one, two or three lines), `density` is how tall that shape is drawn.
 */
export type MListItemDensity = MFieldDensity

/**
 * Element of the row. `button` and `a` are interactive by themselves; any
 * other element (a `label` around a checkbox, say) is accepted as is.
 */
export type MListItemTag = 'div' | 'li' | 'button' | 'a' | 'label' | (string & {})

/** `<MListItem>` props. */
export const mListItemProps = {
  /** Prevents interaction and dims every part of the row. */
  disabled: { type: Boolean, default: false },
  headline: { type: String, default: '' },
  supportingText: { type: String, default: '' },
  overline: { type: String, default: '' },
  leadingIcon: { type: String, default: '' },
  trailingIcon: { type: String, default: '' },
  trailingSupportingText: { type: String, default: '' },
  tag: { type: String as PropType<MListItemTag>, default: 'div' },
  to: { type: [String, Object] as PropType<NuxtLinkProps['to']>, default: undefined },
  interactive: { type: Boolean, default: false },
  /**
   * Selection state. Left `undefined` for a plain row; a boolean makes the row
   * part of a selection, which an interactive row announces — a link as the
   * current page, a button as pressed.
   */
  selected: { type: Boolean, default: undefined },
  /**
   * `auto` lets the text wrap and the row grow. A number keeps the row at that
   * many lines: the headline takes one, supporting text the rest, and a cut
   * line keeps its full text as a tooltip.
   */
  lines: { type: [Number, String] as PropType<MListItemLines>, default: 'auto' },
  /**
   * Vertical scale. Left `undefined` on purpose: absence means "inherit from
   * the enclosing `<MList>`", which is the only way a list can set the scale
   * for its rows without every row repeating it.
   */
  density: { type: String as PropType<MListItemDensity>, default: undefined },
}

export type MListItemProps = ExtractPublicPropTypes<typeof mListItemProps>

/** Slots of `<MListItem>`. */
export interface MListItemSlots {
  /** Leading media: an icon, an `MAvatar`, an image (56) or a video (100 × 56). */
  'leading'?: () => unknown
  'overline'?: () => unknown
  'headline'?: () => unknown
  /** Content between the headline and the supporting text. */
  'default'?: () => unknown
  'supporting'?: () => unknown
  /** Short trailing text — a count or a time — before `#trailing`. */
  'trailing-supporting'?: () => unknown
  /** Trailing icon or control (a checkbox, a switch, a progress indicator). */
  'trailing'?: () => unknown
}
