/**
 * Public prop surface for `<MListItem>`.
 *
 * `disabled`/`loading` come from the shared state factory; the remaining props
 * are list-item-specific content/behaviour fields.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import { makeStateProps } from '#kit/shared/utils/props'
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

/** `<MListItem>` props. */
export const mListItemProps = {
  ...makeStateProps(),
  headline: { type: String, default: '' },
  supportingText: { type: String, default: '' },
  overline: { type: String, default: '' },
  leadingIcon: { type: String, default: '' },
  trailingIcon: { type: String, default: '' },
  trailingSupportingText: { type: String, default: '' },
  tag: { type: String, default: 'div' },
  to: { type: [String, Object] as PropType<NuxtLinkProps['to']>, default: undefined },
  interactive: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  lines: { type: [Number, String] as PropType<MListItemLines>, default: 'auto' },
  /**
   * Vertical scale. Left `undefined` on purpose: absence means "inherit from
   * the enclosing `<MList>`", which is the only way a list can set the scale
   * for its rows without every row repeating it.
   */
  density: { type: String as PropType<MListItemDensity>, default: undefined },
}

export type MListItemProps = ExtractPublicPropTypes<typeof mListItemProps>
