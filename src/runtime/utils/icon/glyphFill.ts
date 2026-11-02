import { computed, inject, provide } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'

const GLYPH_FILL: InjectionKey<ComputedRef<boolean>> = Symbol('m-icon-glyph-fill')

/**
 * Asks every `MIcon` in the caller's slot to draw its filled pair while
 * `filled()` is true — a selected toggle icon button fills its glyph. An owner
 * that passes `false` also stops a fill provided further up.
 */
export function provideGlyphFill(filled: () => boolean): void {
  provide(GLYPH_FILL, computed(filled))
}

/** Whether an enclosing owner asks the glyph to be filled; `false` without one. */
export function useGlyphFill(): ComputedRef<boolean> {
  const inherited = inject(GLYPH_FILL, undefined)

  return computed(() => inherited?.value === true)
}
