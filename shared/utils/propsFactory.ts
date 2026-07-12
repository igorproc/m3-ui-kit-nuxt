/**
 * @module propsFactory
 *
 * @remarks
 * Vuetify-style props factory. Defines a set of prop NAMES/TYPES once and
 * returns a generator that lets each consuming component override only the
 * DEFAULTS (e.g. base `MButton` defaults `variant: 'filled'`, while
 * `MIconButton` defaults `'text'`). Resolve the generator into a plain props
 * object in a co-located `props.ts`, then pass that object to `defineProps`.
 *
 * This is purely a props-composition layer: it injects NO runtime CSS variables
 * and resolves NO colors. Color/state resolution stays build-time in SCSS via
 * `g($t, …)`; the factory only keeps the public prop surface uniform across the
 * library (the "Zero-Runtime M3" rule is preserved).
 */
import type { ComponentObjectPropsOptions } from 'vue'

/** A Vue runtime props definition in object form (`{ color: { type, default } }`). */
export type PropsDefinition = ComponentObjectPropsOptions

/** Per-prop default overrides keyed by prop name. */
type DefaultOverrides<P> = Partial<Record<keyof P, unknown>>

/**
 * Creates a props generator from a shared definition.
 *
 * @param props - the canonical prop definitions (names + types + base defaults)
 * @returns a function that returns the props, optionally with overridden defaults
 */
export function propsFactory<P extends PropsDefinition>(props: P) {
  return function generate<D extends DefaultOverrides<P>>(defaults?: D): P {
    if (!defaults) return props

    const result = {} as Record<keyof P, unknown>

    for (const key of Object.keys(props) as Array<keyof P>) {
      const definition = props[key] as Record<string, unknown>

      result[key] = key in defaults
        ? { ...definition, default: defaults[key] }
        : definition
    }

    return result as P
  }
}
