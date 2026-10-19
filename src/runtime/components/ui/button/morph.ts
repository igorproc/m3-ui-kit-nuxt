/**
 * Transition of a toggle button — an `MButton` / `MButtonIcon` with `selected`,
 * or a connected `MButtonGroup` button. Its selected shape and colours move on
 * M3 Expressive springs as in Compose's `ToggleButton` (shape: fast spatial,
 * colour: default effects), sampled to CSS `linear()` so no frame loop ships
 * (owner's decision, docs/system decisions). A plain button never gets it: its
 * shape does not change, and its transitions stay on the stylesheet tokens.
 */
import { M3_SPRING, springTiming, transitionList } from '#kit/utils/motion'

const SHAPE = springTiming(M3_SPRING.spatial.fast)
const COLOR = springTiming(M3_SPRING.effects.default)
const STANDARD = 'var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard)'
// Reduced motion shortens the morph to a plain system transition.
const CALM = 'var(--sys-motion-duration-short-4) var(--sys-motion-easing-standard)'

/** Inline `transition` of a toggle button; replaces the stylesheet's whole list. */
export function toggleTransition(reduced: boolean): string {
  return transitionList([
    ['border-radius', reduced ? CALM : SHAPE],
    ['background-color', reduced ? CALM : COLOR],
    ['color', reduced ? CALM : COLOR],
    ['box-shadow', STANDARD],
    ['border-color', STANDARD],
  ])
}
