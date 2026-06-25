/**
 * Public prop surface for `<MTimePicker>` and its dial leaf.
 *
 * Resolved here so `defineProps` receives a plain imported object. The picker
 * exposes no shared color/variant/state surface; `mode` (dial vs keyboard) and
 * `layout` are component-specific taxonomies, NOT the MD3 surface `variant`,
 * so they keep their own names. The `makeMTimePickerProps` generator lets the
 * dial leaf reuse the shared subset without the root-only `mode` prop.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { propsFactory } from '#shared/utils/propsFactory'

export type MTimePickerMode = 'dial' | 'keyboard'
export type MTimePickerLayout = 'vertical' | 'horizontal'

/** Shared subset between the root picker and the dial leaf. */
export const makeMTimePickerProps = propsFactory({
  label: { type: String, default: undefined },
  helperText: { type: String, default: undefined },
  is24h: { type: Boolean, default: true },
  layout: { type: String as PropType<MTimePickerLayout>, default: 'vertical' },
})

/** Root `<MTimePicker>` props (adds `mode`). */
export const mTimePickerProps = {
  ...makeMTimePickerProps(),
  mode: { type: String as PropType<MTimePickerMode>, default: 'dial' },
}

/** Dial leaf props — the shared subset only. */
export const mTimePickerDialProps = makeMTimePickerProps()

export type MTimePickerProps = ExtractPublicPropTypes<typeof mTimePickerProps>
export type MTimePickerDialProps = ExtractPublicPropTypes<typeof mTimePickerDialProps>
