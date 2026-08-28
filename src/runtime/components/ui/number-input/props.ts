import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mFieldProps } from '#kit/components/ui/text-field/props'

export type MNumberInputControls = 'split' | 'stacked' | false

export const mNumberInputProps = {
  ...mFieldProps,
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  precision: { type: Number, default: undefined },
  locale: { type: String, default: 'en-US' },
  useGrouping: { type: Boolean, default: true },
  controls: { type: [String, Boolean] as PropType<MNumberInputControls>, default: 'split' },
  clamp: { type: Boolean, default: true },
  // Unit suffix rendered inside the container (e.g. MiB, %, ms) — one focus ring.
  unit: { type: String, default: undefined },
  // Slider-bound: a range under the field (needs `min` and `max`) — coarse by
  // drag, exact by typing.
  slider: { type: Boolean, default: false },
}

export type MNumberInputProps = ExtractPublicPropTypes<typeof mNumberInputProps>
