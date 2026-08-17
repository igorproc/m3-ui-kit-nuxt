import type {
  ComponentObjectPropsOptions,
  ExtractPropTypes,
  ExtractPublicPropTypes,
} from 'vue'

/**
 * @module props
 *
 * @remarks
 * Single source of truth for the kit's cross-cutting public prop *types*
 * (color role, surface variant, size). The runtime prop *definitions* (with
 * defaults) live in `shared/utils/props` and are composed per component via
 * `propsFactory`. Kept type-only so consumers can import the unions without
 * pulling any runtime code, and so docs can reference one canonical taxonomy.
 *
 * These follow Material Design 3 naming: color roles are `primary | secondary
 * | tertiary | error` (NOT the legacy `accent`/`warn`), and surface variants
 * are the five MD3 button/surface styles.
 */

/** Flattens Vue's mapped prop types into a conventional object shape. */
export type InferType<T extends ComponentObjectPropsOptions> = {
  [K in keyof ExtractPublicPropTypes<T>]: ExtractPublicPropTypes<T>[K]
}

/** Resolved component-side props, including values supplied by defaults. */
export type InferResolvedType<T extends ComponentObjectPropsOptions> = {
  [K in keyof ExtractPropTypes<T>]: ExtractPropTypes<T>[K]
}

/** MD3 color role. Replaces the legacy `primary | accent | warn` naming. */
export type MColor = 'primary' | 'secondary' | 'tertiary' | 'error'

/** MD3 surface-style variant (button family, card, fields, …). */
export type MVariant = 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text'

/** Component size scale. */
export type MSize = 'sm' | 'md' | 'lg'

/**
 * MD3 corner-shape scale. Mirrors the `$theme-shape-link` SCSS map
 * (`--sys-shape-corner-*`); used by passive surfaces like `<MSurface>`.
 */
export type MShape
  = 'none'
    | 'extra-small'
    | 'small'
    | 'medium'
    | 'large'
    | 'extra-large'
    | 'extra-large-top'
    | 'full'

/** `color` prop contract. */
export interface ColorProps {
  color?: MColor
}

/** `variant` prop contract. */
export interface VariantProps {
  variant?: MVariant
}

/** `size` prop contract. */
export interface SizeProps {
  size?: MSize
}

/** Shared action-state contract (`disabled` everywhere, `loading` for async actions). */
export interface StateProps {
  disabled?: boolean
  loading?: boolean
}

/** `readonly` contract for input-like components. */
export interface ReadonlyProps {
  readonly?: boolean
}
