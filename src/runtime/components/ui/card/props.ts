/**
 * Public prop surface for `<MCard>`.
 *
 * `variant` is an MD3 surface-style subset (`elevated | filled | outlined`);
 * resolved here so the SFC receives a plain imported props object.
 */
import type { ExtractPublicPropTypes } from 'vue'
import { makeVariantProps } from '#kit/shared/utils/props'

/** `<MCard>` props — defaults to the MD3 `elevated` surface style. */
export const mCardProps = {
  ...makeVariantProps({ variant: 'elevated' }),
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
}

export type MCardProps = ExtractPublicPropTypes<typeof mCardProps>
