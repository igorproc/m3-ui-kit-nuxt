/**
 * @module utils/motion/shared/resolve
 *
 * @remarks
 * Turns whatever a component received — a name, partial options, or nothing —
 * into a runnable transition. Every named transition is a spring, so resolving
 * by name never reaches for the cubic-bezier solver; a caller who wants a CSS
 * curve imports {@link cubicBezier} and passes the result as `easing`, and only
 * then does that solver enter the bundle.
 */

// Constants
import { bouncy, expressive } from '../expressive/transitions'
import { calm, standard } from '../standard/transitions'

// Utilities
import { defineTransition } from './define'

// Types
import type {
  MorphTransition,
  MorphTransitionInput,
  MorphTransitionName,
} from './types'

/** Every transition shipped with the kit, by name. */
export const MORPH_TRANSITIONS: Record<MorphTransitionName, MorphTransition> = {
  calm,
  standard,
  expressive,
  bouncy,
}

/**
 * Resolve a transition input.
 *
 * @param input Name, partial options, or `undefined` for {@link expressive}.
 * @returns The resolved transition.
 */
export function resolveTransition(input?: MorphTransitionInput): MorphTransition {
  if (!input) return expressive
  if (typeof input === 'string') return MORPH_TRANSITIONS[input] ?? expressive
  return defineTransition(input)
}
