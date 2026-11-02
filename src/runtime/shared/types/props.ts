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
 * (color role, surface variant, shape). The runtime prop *definitions* (with
 * defaults) live in `shared/utils/props` and are composed per component via
 * `propsFactory`. Kept type-only so consumers can import the unions without
 * pulling any runtime code, and so docs can reference one canonical taxonomy.
 *
 * These follow Material Design 3 naming: color roles are `primary | secondary
 * | tertiary | error` (NOT the legacy `accent`/`warn`) plus the theme's
 * `info | success | warning`, and surface variants
 * are the five MD3 button/surface styles plus the kit's `plain`.
 */

/** Flattens Vue's mapped prop types into a conventional object shape. */
export type InferType<T extends ComponentObjectPropsOptions> = {
  [K in keyof ExtractPublicPropTypes<T>]: ExtractPublicPropTypes<T>[K]
}

/** Resolved component-side props, including values supplied by defaults. */
export type InferResolvedType<T extends ComponentObjectPropsOptions> = {
  [K in keyof ExtractPropTypes<T>]: ExtractPropTypes<T>[K]
}

/**
 * Colour role: the four MD3 accent roles plus the theme's semantic roles
 * (`info | success | warning`, harmonized from `theme.semanticColors`). Each
 * component narrows it with `Extract<MColor, …>`. Replaces the legacy
 * `primary | accent | warn` naming.
 */
export type MColor = 'primary' | 'secondary' | 'tertiary' | 'error' | 'info' | 'success' | 'warning'

/** The MD3 accent roles, the colour axis of every component but the status ones (alert). */
export type MAccentColor = Extract<MColor, 'primary' | 'secondary' | 'tertiary' | 'error'>

/**
 * Surface treatment (button family, card, surface, timeline, …). Each component
 * narrows it with `Extract<MVariant, …>`; `plain` is the kit's fifth treatment —
 * no container, no outline — for passive surfaces.
 */
export type MVariant = 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | 'plain'

/**
 * Level of a component's own heading (card title, expansion panel header).
 * No default anywhere: the kit cannot know the document's outline, so a
 * component renders a heading only when the consumer names its level.
 */
export type MHeadingLevel = 2 | 3 | 4 | 5 | 6

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

/** `color` prop contract (the accent roles). */
export interface ColorProps {
  color?: MAccentColor
}

/** `variant` prop contract. */
export interface VariantProps {
  variant?: MVariant
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

/** Reserved breakpoint names in runtime/JS form (camelCase, dot-accessible). */
export type ReservedBreakpointName
  = 'desktop' | 'desktopXs' | 'tablet' | 'tabletXs' | 'mobile' | 'mobileXs'

/**
 * Augmentable registry for consumer-defined breakpoints. A consumer that adds
 * custom breakpoints to `materialKit.breakpoints` can declare them here to get
 * typed autocomplete on the `is`/`more`/`less` maps:
 *
 * ```ts
 * declare module '@pr0s1k/primetime-kit/types' {
 *   interface KitBreakpointRegistry { watch: true, ultrawide: true }
 * }
 * ```
 */
export interface KitBreakpointRegistry {}

export type BreakpointName = ReservedBreakpointName | keyof KitBreakpointRegistry

/**
 * A breakpoint flag map (`is`/`more`/`less`). Closed on purpose: an open index
 * signature would type every typo as `boolean` and silently return `undefined`
 * at runtime. Consumer-defined breakpoints become accessible by declaring them
 * in {@link KitBreakpointRegistry}.
 */
export type BreakpointFlags = Record<BreakpointName, boolean>

export type * from './components'
