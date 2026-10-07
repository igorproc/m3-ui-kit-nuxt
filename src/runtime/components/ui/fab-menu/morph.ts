/**
 * Transitions of the FAB menu's default FAB as it turns into the close button.
 *
 * Size and corners ride the spatial spring, colour the effects spring, as in
 * Compose — sampled to CSS `linear()`, so the browser runs a plain transition
 * and no frame loop is shipped (owner's decision, docs/system decisions).
 */
import { computed } from 'vue'
import { useReducedMotion } from '#kit/composables/useReducedMotion'
import { M3_SPRING, springTiming, transitionList } from '#kit/utils/motion'

const SPATIAL = springTiming(M3_SPRING.spatial.default)
const EFFECTS = springTiming(M3_SPRING.effects.default)
const SHADOW = 'var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard)'
// Reduced motion shortens the morph to a plain system transition.
const CALM = 'var(--sys-motion-duration-short-4) var(--sys-motion-easing-standard)'

/** Inline `transition` styles for the FAB container and its icon. */
export function useFabMenuMorph() {
  const reduced = useReducedMotion()

  return computed(() => {
    const spatial = reduced.value ? CALM : SPATIAL
    const effects = reduced.value ? CALM : EFFECTS

    return {
      container: {
        transition: transitionList([
          ['width', spatial],
          ['height', spatial],
          ['border-radius', spatial],
          ['background-color', effects],
          ['color', effects],
          ['box-shadow', SHADOW],
        ]),
      },
      icon: { transition: transitionList([['font-size', spatial]]) },
    }
  })
}
