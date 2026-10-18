import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useRetiredPropWarning } from '#kit/composables/button/useRetiredValueWarning'
import { RETIRED_ROUNDED_TO_SHAPE } from './props'
import type { MFieldShape, MTextFieldRounded } from './props'

interface FieldShapeProps {
  shape: MFieldShape
  rounded?: MTextFieldRounded
}

/**
 * Resolves the corner a field draws. `rounded` is the retired name of the
 * `shape` axis: for one release it still wins when given, mapped onto the
 * shape scale, and warns in dev with the replacement.
 *
 * @param component Tag shown in the warning, e.g. `'m-text-field'`.
 * @param props The field's props.
 * @returns The shape step the field renders.
 */
export function useFieldShape(component: string, props: FieldShapeProps): ComputedRef<MFieldShape> {
  useRetiredPropWarning(component, 'rounded', () => props.rounded, '`shape` (`sharp` → `none`, `small` → `extra-small`, `pill` → `full`)')

  return computed(() => props.rounded ? RETIRED_ROUNDED_TO_SHAPE[props.rounded] : props.shape)
}
