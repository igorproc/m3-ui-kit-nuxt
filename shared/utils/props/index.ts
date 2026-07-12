/**
 * @module props
 *
 * @remarks
 * Shared, reusable prop definitions for the kit's M3 components. Each `makeX`
 * is a {@link propsFactory} generator: call it (optionally with per-component
 * default overrides) inside a co-located `props.ts` and spread the result into
 * the component's resolved props object.
 *
 * No runtime CSS variables are emitted here — these only standardize the public
 * prop surface (names/types/defaults). Color/state resolution stays in SCSS.
 */
import type { PropType } from 'vue'
import { propsFactory } from '../propsFactory'
import type { MColor, MSize, MVariant } from '../../types/props'

/** `color` — MD3 color role (`primary | secondary | tertiary | error`). */
export const makeColorProps = propsFactory({
  /** Semantic Material color role used by the component scheme. */
  color: { type: String as PropType<MColor>, default: 'primary' },
})

/** `variant` — MD3 surface style. Override the default per family (e.g. `'text'`). */
export const makeVariantProps = propsFactory({
  /** Material surface treatment that controls the component emphasis. */
  variant: { type: String as PropType<MVariant>, default: 'filled' },
})

/** `size` — component size scale. */
export const makeSizeProps = propsFactory({
  /** Component size on the shared small, medium, and large scale. */
  size: { type: String as PropType<MSize>, default: 'md' },
})

/** `disabled` + `loading` — shared action states. */
export const makeStateProps = propsFactory({
  /** Prevents interaction and applies the disabled visual state. */
  disabled: { type: Boolean, default: false },
  /** Replaces content with progress feedback and prevents interaction. */
  loading: { type: Boolean, default: false },
})

/** `readonly` — for input-like components. */
export const makeReadonlyProps = propsFactory({
  readonly: { type: Boolean, default: false },
})
