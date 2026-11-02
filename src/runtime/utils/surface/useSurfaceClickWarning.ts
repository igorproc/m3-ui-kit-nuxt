import { useAttrs, watchEffect } from 'vue'

export function useSurfaceClickWarning(tag: () => string): void {
  if (!import.meta.dev) return

  const attrs = useAttrs()

  watchEffect(() => {
    if (!attrs.onClick || attrs.role) return
    if (tag() === 'button' || (tag() === 'a' && attrs.href)) return

    console.warn('[m-surface] has a click handler but no role. MSurface is passive: use MCard, MListItem or MButton for an interactive container, or pass `role`, `tabindex` and keyboard handling yourself.')
  })
}
