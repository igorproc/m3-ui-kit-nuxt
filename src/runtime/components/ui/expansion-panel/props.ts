/**
 * Public prop surface for `<MExpansionPanel>`.
 *
 * `disabled` comes from the shared `makeStateProps` so the action-state
 * contract stays uniform across the library.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '#kit/shared/utils/props'
import type { PanelValue } from '#kit/composables/expansion-panel/useExpansionPanelGroup'

export const mExpansionPanelProps = {
  ...makeStateProps(),
  value: { type: [String, Number] as PropType<PanelValue>, default: undefined },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
}

export type MExpansionPanelProps = ExtractPublicPropTypes<typeof mExpansionPanelProps>
