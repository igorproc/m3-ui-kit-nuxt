import { useAttrs, watchEffect } from 'vue'

/**
 * Dev-only warning for an icon-only control that would ship without an
 * accessible name. The kit supplies no default name: it would be English in an
 * app that may not be, so the omission is reported here instead of reaching a
 * screen reader as an unnamed button.
 *
 * @param component Tag shown in the warning, e.g. `'m-button-fab'`.
 * @param name Reads the name the component was given through its own prop.
 */
export function useButtonNameWarning(component: string, name: () => string | undefined) {
  if (!import.meta.dev) return

  const attrs = useAttrs()

  watchEffect(() => {
    if (name() || attrs['aria-label'] || attrs['aria-labelledby']) return

    console.warn(`[${component}] has no accessible name: pass \`ariaLabel\` (or aria-labelledby).`)
  })
}
