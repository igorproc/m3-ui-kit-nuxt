import { onMounted } from 'vue'
import type { Ref } from 'vue'

/**
 * Dev-only: warns when a progress indicator renders without an accessible
 * name. Checked in the DOM after mount, like `MLoading`: a host may hide the
 * indicator through a wrapper (`aria-hidden`), which no prop reveals.
 */
export function useProgressNameWarning(root: Readonly<Ref<Element | null>>, ariaLabel: () => string | undefined) {
  if (!import.meta.dev) return

  onMounted(() => {
    const el = root.value
    if (!el || ariaLabel() || el.hasAttribute('aria-labelledby') || el.closest('[aria-hidden="true"]')) return

    console.warn('[m-progress] has no accessible name: pass `aria-label` or `aria-labelledby`.')
  })
}
