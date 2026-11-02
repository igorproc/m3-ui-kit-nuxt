import { watchEffect } from 'vue'
import type { SegmentedItem } from '#kit/composables/button/useSegmentedButton'

/** Values of the choices that would ship without an accessible name: no label and no `ariaLabel`. */
export function unnamedSegments(items: readonly SegmentedItem[]): Array<SegmentedItem['value']> {
  return items.filter(item => !item.label && !item.ariaLabel).map(item => item.value)
}

/**
 * Dev-only warning for the choices of `<MButtonSegmented>` / `<MButtonGroup>`
 * drawn with an icon alone and no `ariaLabel`. The kit supplies no default
 * name (it would be English in an app that may not be).
 *
 * @param component Tag shown in the warning, e.g. `'m-button-group'`.
 * @param items Reads the component's current items.
 */
export function useSegmentNameWarning(component: string, items: () => readonly SegmentedItem[]) {
  if (!import.meta.dev) return

  watchEffect(() => {
    const unnamed = unnamedSegments(items())
    if (!unnamed.length) return

    console.warn(`[${component}] items ${unnamed.join(', ')} have no accessible name: give an icon-only item \`ariaLabel\`.`)
  })
}
