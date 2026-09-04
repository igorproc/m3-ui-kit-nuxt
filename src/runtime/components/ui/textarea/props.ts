/**
 * Public prop surface for `<MTextarea>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object, matching the rest of the kit.
 *
 * A textarea is not a tall text field: it has a length relationship, a growth
 * behaviour and often a toolbar, and those three generate its variants. The
 * shape axis is therefore narrower than `<MTextField>`'s — `underline` reads as
 * a single rule under a multi-line block and was dropped along with the former
 * `code` mode.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mFieldProps } from '#kit/components/ui/text-field/props'
import type { MFieldLabelPlacement } from '#kit/components/ui/text-field/props'
import type { MTextareaWrap } from '#kit/composables/textarea/useTextareaControl'

export type { MTextareaWrap }

export type MTextareaVariant = 'filled' | 'outlined'

export const mTextareaProps = {
  ...mFieldProps,
  variant: { type: String as PropType<MTextareaVariant>, default: 'filled' },
  /**
   * Where the label sits. Defaults to `top` rather than the family's `float`:
   * a multi-line box has no free first line to float into, which is what made
   * the label land in the middle of the box before this was an axis.
   */
  labelPlacement: { type: String as PropType<MFieldLabelPlacement>, default: 'top' },
  /** Minimum and initial height, in rows. */
  rows: { type: Number, default: 3 },
  /** Growth ceiling in rows; beyond it the value scrolls. */
  maxRows: { type: Number, default: undefined },
  /** Grow with the content instead of staying at `rows`. */
  autoGrow: { type: Boolean, default: false },
  /**
   * Render a corner grip the user can drag — or arrow-key — to set the height.
   * A height set by hand outranks `autoGrow` until Escape resets it.
   */
  resizable: { type: Boolean, default: false },
  /** Accessible name of the resize grip. */
  resizeLabel: { type: String, default: 'Resize' },
  maxlength: { type: Number, default: undefined },
  /** `true` counts against `maxlength`; a number sets a display-only limit. */
  counter: { type: [Boolean, Number] as PropType<boolean | number>, default: false },
  spellcheck: { type: Boolean, default: undefined },
  wrap: { type: String as PropType<MTextareaWrap>, default: 'soft' },
}

export type MTextareaProps = ExtractPublicPropTypes<typeof mTextareaProps>
