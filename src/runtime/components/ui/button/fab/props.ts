/**
 * Public prop surface for `<MButtonFab>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical `propsFactory` pattern. FAB exposes the shared MD3
 * color role, its two M3 colour sets, the family's `density` and the shared
 * state props.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeStateProps } from '#kit/shared/utils/props'
import type { MSize, MVariant } from '#kit/shared/types/props'
import type { MButtonDensity } from '../props'

/** `tonal`: the role's container (M3 default FAB); `filled`: the role itself. */
export type MFabVariant = Extract<MVariant, 'tonal' | 'filled'>

/** Retired `size` → the `density` step that replaced it. */
export const FAB_SIZE_TO_DENSITY: Record<MSize, MButtonDensity> = {
  sm: 'compact',
  md: 'default',
  lg: 'comfortable',
}

/** Props shared by the FAB and the extended FAB. */
export const makeFabProps = () => ({
  ...makeColorProps(),
  /** M3 colour set. */
  variant: { type: String as PropType<MFabVariant>, default: 'tonal' },
  /** Container step: 40 / 56 / 96. */
  density: { type: String as PropType<MButtonDensity>, default: 'default' },
  /**
   * @deprecated Use `density`: `sm` → `compact`, `md` → `default`,
   * `lg` → `comfortable`. Still honoured for one release.
   */
  size: { type: String as PropType<MSize>, default: undefined },
  ...makeStateProps(),
})

/** FAB props — defaults to the tonal (role-container) set. */
export const mFabProps = {
  ...makeFabProps(),
  /** Accessible name required by the icon-only FAB. */
  ariaLabel: { type: String as PropType<string>, default: undefined },
}

export type MFabProps = ExtractPublicPropTypes<typeof mFabProps>
