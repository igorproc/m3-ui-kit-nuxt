/**
 * @module useProgress
 *
 * @remarks
 * Pure geometry composable for MD3 progress indicators (linear + circular).
 *
 * Encapsulates all the SVG path / dash-array / wave math shared by the
 * `progress` leaf renderers, reactive to the component props (value,
 * indeterminate, variant, size, expressive). Holds no DOM references and
 * renders nothing — the consuming `.vue` binds the exposed computed values.
 *
 * Key features:
 * - Clamped determinate value.
 * - Stroke width resolution per size + expressive scaling.
 * - Circular path (plain or "wavy" expressive) + dash-array math.
 * - Linear "wavy" active-indicator path.
 *
 * @example
 * ```ts
 * import { useProgress } from '#kit/composables/progress/useProgress'
 *
 * const geometry = useProgress(props)
 * // bind :d="geometry.circularPath.value" etc.
 * ```
 */

// Utilities
import { computed } from 'vue'

// Types
import type { ComputedRef } from 'vue'

export type ProgressVariant = 'linear' | 'circular'
export type ProgressSize = 'small' | 'medium' | 'large'

export interface UseProgressProps {
  variant: ProgressVariant
  value: number
  indeterminate: boolean
  size: ProgressSize
  expressive: boolean
}

export interface UseProgressContext {
  /** Value clamped to the `[0, 100]` range. */
  clampedValue: ComputedRef<number>
  /** Resolved stroke width (px), scaled for expressive mode. */
  strokeWidth: ComputedRef<number>
  /** Circular `d` path — plain circle or wavy expressive ring. */
  circularPath: ComputedRef<string>
  /** Approximate circular path length for the dash array. */
  totalPathLength: ComputedRef<number>
  /** Circular dash offset reflecting the current value. */
  dashOffset: ComputedRef<number>
  /** Linear wavy active-indicator `d` path. */
  linearWavePath: ComputedRef<string>
}

const RADIUS = 18

/**
 * Compute reactive progress geometry from component props.
 *
 * @param props Reactive progress props (pass the component `props` object).
 * @returns Reactive geometry values for the renderers.
 */
export function useProgress(props: UseProgressProps): UseProgressContext {
  const clampedValue = computed(() =>
    Math.min(100, Math.max(0, props.value ?? 0)),
  )

  const strokeWidth = computed(() => {
    const base = props.size === 'small' ? 3 : 4
    return props.expressive ? base * 1.5 : base
  })

  const circularPath = computed(() => {
    if (!props.expressive) {
      // Standard circle path (easier for dasharray than <circle>).
      return `M 24, 24 m -${RADIUS}, 0 a ${RADIUS},${RADIUS} 0 1,1 ${RADIUS * 2},0 a ${RADIUS},${RADIUS} 0 1,1 -${RADIUS * 2},0`
    }

    // Wavy circle path.
    const waves = 10
    const amplitude = props.size === 'small' ? 1.5 : 2
    const points = 120
    let d = ''
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = RADIUS + Math.sin(angle * waves) * amplitude
      const x = 24 + r * Math.cos(angle)
      const y = 24 + r * Math.sin(angle)
      d += (i === 0 ? 'M ' : 'L ') + x + ' ' + y
    }
    return d
  })

  const totalPathLength = computed(() => {
    if (!props.expressive) return 2 * Math.PI * RADIUS
    // Wavy path is longer — rough correction factor for amplitude/waves.
    return 2 * Math.PI * RADIUS * 1.15
  })

  const dashOffset = computed(() => {
    if (props.indeterminate) return totalPathLength.value * 0.25
    return totalPathLength.value * (1 - clampedValue.value / 100)
  })

  const linearWavePath = computed(() => {
    const width = 1000 // Large enough to cover the container.
    const waveLength = 20
    const amplitude = props.size === 'small' ? 2 : 4
    let d = `M 0 ${amplitude}`
    for (let x = 0; x <= width; x += waveLength) {
      d += ` Q ${x + waveLength / 4} ${0}, ${x + waveLength / 2} ${amplitude}`
      d += ` Q ${x + (3 * waveLength) / 4} ${amplitude * 2}, ${x + waveLength} ${amplitude}`
    }
    return d
  })

  return {
    clampedValue,
    strokeWidth,
    circularPath,
    totalPathLength,
    dashOffset,
    linearWavePath,
  }
}
