/**
 * Public prop surface for `<MExpansionPanel>`.
 *
 * Attributes that are not props (`id`, `aria-*`, `data-*`, listeners) land on
 * the header button; `class` and `style` stay on the panel root.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { PanelValue } from '#kit/composables/expansion-panel/useExpansionPanelGroup'
import type { MHeadingLevel } from '#kit/shared/types/props'

/** Level of the heading around the header button; the page outline decides it, not the kit. */
export const mExpansionPanelProps = {
  /** Prevents interaction and applies the disabled visual state. */
  disabled: { type: Boolean, default: false },
  /** Identity inside `<MExpansionPanels>`; generated when absent. */
  value: { type: [String, Number] as PropType<PanelValue>, default: undefined },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  /**
   * Wraps the header button in `h{n}`, as the APG Accordion pattern asks. No
   * default: a fixed level would break the outline of a page the kit cannot see.
   */
  headingLevel: { type: Number as PropType<MHeadingLevel>, default: undefined },
  /**
   * @deprecated Never had an effect. Still accepted for one release, with a dev
   * warning; show progress with your own indicator in `#trailing`.
   */
  loading: { type: Boolean, default: undefined },
}

export type MExpansionPanelProps = ExtractPublicPropTypes<typeof mExpansionPanelProps>
