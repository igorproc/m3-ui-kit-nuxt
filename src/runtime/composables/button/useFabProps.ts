import { reactiveComputed } from '@vueuse/core'
import { FAB_SIZE_TO_DENSITY } from '#kit/components/ui/button/fab/props'
import type { MButtonDensity } from '#kit/components/ui/button/props'
import type { MSize } from '#kit/shared/types/props'
import { useRetiredValueWarning } from './useRetiredValueWarning'

interface FabProps {
  density?: MButtonDensity
  size?: MSize
  variant?: string
}

/**
 * Resolves the FAB family's props for `useButton`: a retired `size` still
 * picks its `density` step for one release, and every retired value warns in
 * dev with its replacement.
 *
 * @param component Tag shown in the warnings, e.g. `'m-button-fab'`.
 * @param props The component's props.
 * @returns Reactive props with `density` resolved and `size` dropped.
 */
export function useFabProps<P extends FabProps>(component: string, props: P) {
  useRetiredValueWarning(component, 'size', () => props.size, {
    sm: '`density="compact"`',
    md: '`density="default"`',
    lg: '`density="comfortable"`',
  })
  useRetiredValueWarning(component, 'variant', () => props.variant, {
    elevated: '`tonal` or `filled`',
    outlined: '`tonal` or `filled`',
    text: '`tonal` or `filled`',
  })

  return reactiveComputed(() => ({
    ...props,
    size: undefined,
    density: props.size ? FAB_SIZE_TO_DENSITY[props.size] : props.density,
  }))
}
