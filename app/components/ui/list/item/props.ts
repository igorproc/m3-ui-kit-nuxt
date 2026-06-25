/**
 * Public prop surface for `<MListItem>`.
 *
 * `disabled`/`loading` come from the shared state factory; the remaining props
 * are list-item-specific content/behaviour fields.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import { makeStateProps } from '~~/shared/utils/props'

export type MListItemLines = 1 | 2 | 3 | 'auto'

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
}

export type MListItemProps = ExtractPublicPropTypes<typeof mListItemProps>
