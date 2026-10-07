/**
 * @module useShapeMorph
 *
 * @remarks
 * Reactive SVG path morphing built on {@link useRaf}, the deterministic
 * path-morph core in `#kit/utils/morph`, and the transitions in
 * `#kit/utils/motion`.
 *
 * Smoothly interpolates the `d` attribute of an SVG `<path>` from its current
 * value toward a reactive target path. Designed to serve two consumers:
 * - **shape** — morph between an explicit `from` -> `to` path when the target
 *   ref changes.
 * - **loading** — cycle a list of shapes on an interval, morphing each
 *   transition (drive the target ref externally, e.g. from {@link useTimer}).
 *
 * Key features:
 * - Motion comes from a {@link MorphTransition}: a spring or curve that derives
 *   its own duration, plus the rotation and area conservation that ride along.
 * - Reactive target: morphs whenever the resolved target path changes.
 * - Exposes the live interpolated `d` and the live rotation as readonly refs.
 * - Manual `start` / `stop` / `cancel` controls.
 * - Automatic cleanup on scope disposal (via `useRaf`).
 * - SSR-safe; when the viewer prefers reduced motion the morph shortens and does not bank.
 *
 * @remarks Rotation
 * The rotation is reported in degrees for the *element*, never baked into the
 * path: the morph still lands on the canonical target `d`, and the caller
 * applies the angle with a transform. That keeps the turn — the thing that
 * reads as a vortex rather than points sliding down straight chords — from
 * disturbing the target geometry.
 *
 * It is a *swing*, not an accumulating spin: the angle tracks the curve's own
 * speed, so it peaks where the deformation is most violent and unwinds to zero
 * as the curve settles. Every shape therefore comes to rest square, however
 * many morphs it has been through.
 *
 * @remarks Performance
 * The morph core samples each endpoint to a fixed point count, so an
 * interpolator's cost is bounded regardless of path complexity. Interpolating
 * from the **live** (already-sampled) `d` still compounds error across a
 * cycle, so two mitigations remain:
 * - Pass `sequence` (the ordered list of canonical target paths) so the
 *   interpolators for every adjacent pair — including the loop wrap — are
 *   built **once** from clean canonical geometry and memoized.
 * - Interpolators are memoized per canonical `(from, to)` pair regardless, so
 *   a repeating cycle never rebuilds them.
 *
 * @example
 * ```ts
 * import { useShapeMorph } from '#kit/composables/useShapeMorph'
 *
 * const target = computed(() => M3_SHAPES[props.name])
 * const { d, rotate } = useShapeMorph(target, { transition: 'expressive' })
 * // bind :d="d" on the <path>, and rotate on the <svg>
 * ```
 */

// Composables
import { useRaf } from '#kit/composables/useRaf'

// Constants
import { IN_BROWSER } from '#kit/shared/constants/globals'

// Utilities
import { createPathInterpolator } from '#kit/utils/morph'
import { createVelocityProfile, prefersReducedMotion, reduceTransition, resolveTransition } from '#kit/utils/motion'
import { computed, readonly, shallowRef, toValue, watch } from 'vue'

// Types
import type { MorphTransition, MorphTransitionInput } from '#kit/utils/motion'
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from 'vue'

/** Easing function mapping linear progress `[0, 1]` to eased progress. */
export type ShapeMorphEasing = (progress: number) => number

type PathInterpolator = (t: number) => string

const INTERPOLATOR_LIMIT = 64

const interpolators: Map<string, PathInterpolator> | undefined = IN_BROWSER ? new Map() : undefined

/**
 * M3 standard (emphasized-decelerate) easing approximation.
 *
 * @deprecated Pass a transition instead — `{ transition: 'standard' }`, or
 *   `{ transition: { easing } }` for a curve of your own.
 * @param t Linear progress in `[0, 1]`.
 * @returns Eased progress in `[0, 1]`.
 */
export const easeM3Standard: ShapeMorphEasing = t => 1 - Math.pow(1 - t, 4)

export interface ShapeMorphOptions {
  /**
   * How the morph moves: a transition name, partial options, or nothing for
   * the `expressive` default.
   * @default 'expressive'
   */
  transition?: MaybeRefOrGetter<MorphTransitionInput | undefined>
  /**
   * Override the transition's own duration, in milliseconds. Leave unset to
   * let a spring derive it from its settling time.
   */
  duration?: MaybeRefOrGetter<number | undefined>
  /**
   * Arc-length samples per endpoint. Higher is smoother but heavier.
   * @default 96
   */
  samples?: number
  /**
   * Ordered list of every canonical target path the morph will cycle through.
   *
   * When provided, interpolators for each adjacent pair — and the wrap from the
   * last entry back to the first — are pre-built once from these clean canonical
   * paths and memoized, so a repeating cycle never densifies the live `d` nor
   * rebuilds an interpolator on the critical path. Morphs always interpolate
   * between the two canonical entries surrounding the current target, keeping
   * each interpolator built from clean source geometry.
   */
  sequence?: MaybeRefOrGetter<readonly string[] | undefined>
}

export interface ShapeMorphContext {
  /** Live interpolated `d` string (readonly). */
  d: Readonly<ShallowRef<string>>
  /** Live bank angle in degrees; zero at rest (readonly). */
  rotate: Readonly<ShallowRef<number>>
  /** The resolved transition currently driving the morph. */
  transition: ComputedRef<MorphTransition>
  /** Manually morph toward the current resolved target. */
  start: () => void
  /** Cancel the in-flight morph, leaving `d` at its current value. */
  stop: () => void
  /** Alias of {@link stop}. */
  cancel: () => void
}

/**
 * Morph an SVG path toward a reactive target.
 *
 * @param target Reactive target `d` string (ref, getter, or plain string).
 * @param options Morph configuration.
 * @returns The live `d` and `rotate` refs, the resolved transition, and controls.
 */
export function useShapeMorph(
  target: MaybeRefOrGetter<string>,
  options: ShapeMorphOptions = {},
): ShapeMorphContext {
  const { samples = 96, sequence } = options

  const transition = computed<MorphTransition>(() => {
    const resolved = resolveTransition(toValue(options.transition))
    const override = toValue(options.duration)
    return override === undefined || override === resolved.duration
      ? resolved
      : { ...resolved, duration: override }
  })

  const d = shallowRef(toValue(target))
  const rotate = shallowRef(0)

  /** Normalized speed of the active curve — the shape of the bank angle. */
  const velocity = computed(() =>
    transition.value.rotate ? createVelocityProfile(transition.value.easing) : undefined,
  )

  let interpolator: PathInterpolator | undefined
  let motion: MorphTransition = transition.value
  let startTime: number | undefined

  /** Canonical path that `d` is currently anchored to (the last morph target). */
  let canonicalFrom = toValue(target)

  function buildInterpolator(from: string, to: string): PathInterpolator {
    const { preserveArea, overshoots } = transition.value
    return createPathInterpolator(from, to, {
      samples,
      preserveArea,
      snapEnd: !overshoots,
    })
  }

  function getInterpolator(from: string, to: string): PathInterpolator {
    if (!interpolators) return buildInterpolator(from, to)

    const { preserveArea, overshoots } = transition.value
    const key = `${samples} ${preserveArea ? 1 : 0}${overshoots ? 1 : 0} ${from} ${to}`
    const cached = interpolators.get(key)
    if (cached) return cached

    const built = buildInterpolator(from, to)
    if (interpolators.size >= INTERPOLATOR_LIMIT) {
      const oldest = interpolators.keys().next().value
      if (oldest !== undefined) interpolators.delete(oldest)
    }
    interpolators.set(key, built)
    return built
  }

  function stop(): void {
    tick.cancel()
    interpolator = undefined
    startTime = undefined
  }

  /** Land on the canonical target: clean geometry, square orientation. */
  function settle(to: string): void {
    stop()
    d.value = to
    rotate.value = 0
  }

  const tick = useRaf((timestamp) => {
    if (!interpolator) return

    if (startTime === undefined) startTime = timestamp

    const { duration, easing, rotate: amplitude } = motion
    const progress = duration <= 0 ? 1 : Math.min((timestamp - startTime) / duration, 1)
    const eased = easing(progress)

    d.value = interpolator(eased)
    rotate.value = amplitude ? amplitude * (velocity.value?.(progress) ?? 0) : 0

    if (progress < 1) {
      tick()
    } else {
      // Settle exactly on the canonical target geometry so the next morph
      // starts from clean source, not a densified approximation.
      settle(canonicalFrom)
    }
  })

  function start(): void {
    const to = toValue(target)
    // Anchor the morph's `from` on the previous canonical target (clean
    // geometry) when a sequence is supplied, falling back to the live `d`
    // for the generic single-target use case.
    const hasSequence = (toValue(sequence)?.length ?? 0) >= 2
    const from = hasSequence ? canonicalFrom : d.value
    const canonical = from === canonicalFrom

    canonicalFrom = to

    if (from === to || !IN_BROWSER) {
      settle(to)
      return
    }

    tick.cancel()
    motion = prefersReducedMotion() ? reduceTransition(transition.value) : transition.value
    interpolator = canonical ? getInterpolator(from, to) : buildInterpolator(from, to)
    startTime = undefined
    tick()
  }

  // Pre-warm every adjacent canonical pair (including the loop wrap) so no
  // interpolator is built on the critical path of a running cycle.
  if (IN_BROWSER && sequence) {
    watch(
      () => [toValue(sequence), transition.value] as const,
      ([paths]) => {
        if (!paths || paths.length < 2) return
        for (let i = 0; i < paths.length; i++) {
          const a = paths[i]
          const b = paths[(i + 1) % paths.length]
          if (a !== undefined && b !== undefined && a !== b) getInterpolator(a, b)
        }
      },
      { immediate: true },
    )
  }

  watch(() => toValue(target), start)

  return {
    d: readonly(d),
    rotate: readonly(rotate),
    transition,
    start,
    stop,
    cancel: stop,
  }
}
