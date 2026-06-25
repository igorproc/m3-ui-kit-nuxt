/**
 * Public prop surface for `<MDropdown>`.
 *
 * `disabled` comes from the shared state contract. `variant` is the constrained
 * field surface style (filled | outlined) forwarded to the inner text field —
 * a genuine MD3 surface subset, so it keeps the `variant` name.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '#shared/utils/props'
import type { UiMenuOrigin } from '~/components/ui/menu/types'
import type { DropdownItem, DropdownOption } from './types'

export type MDropdownVariant = 'filled' | 'outlined'

const { disabled } = makeStateProps()

export const mDropdownProps = {
  disabled,
  path: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  options: { type: Array as PropType<DropdownOption[]>, default: () => [] },
  items: { type: Array as PropType<DropdownItem[]>, default: () => [] },
  variant: { type: String as PropType<MDropdownVariant>, default: 'filled' },
  menuOrigin: { type: String as PropType<UiMenuOrigin>, default: 'top left' },
  multiple: { type: Boolean, default: false },
}

export type MDropdownProps = ExtractPublicPropTypes<typeof mDropdownProps>
