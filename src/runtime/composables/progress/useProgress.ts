/**
 * @module useProgress
 *
 * @remarks
 * Pure geometry composable for the MD3 progress indicators: the value as a
 * share of `max`, and for the circular one the SVG path (plain circle or the
 * wavy ring) with its dash maths, track gap included. Holds no DOM references
 * and renders nothing.
 *
 * The linear indicator needs no path here: its wave is one tileable period
 * drawn by CSS (`progress/_index.scss`), which fills any width.
 *
 * @example
 * ```ts
 * import { useProgress } from '#kit/composables/progress/useProgress'
 *
 * const geometry = useProgress(props)
 * // bind :d="geometry.circularPath.value" etc.
 * ```
 */
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'
import { CIRCULAR_PROGRESS } from './circularTokens'

export type ProgressVariant = 'linear' | 'circular'
export type ProgressDensity = MFieldDensity
export type ProgressShape = 'flat' | 'wavy'

export interface UseProgressProps {
  value: number
  max: number
  indeterminate: boolean
  density: ProgressDensity
  shape: ProgressShape
}

export interface UseProgressContext {
  /** Value clamped to `[0, max]`; `NaN` reads as `0`. */
  clampedValue: ComputedRef<number>
  /** The clamped value as assistive tech reads it: rounded to 1% of `max`'s order of magnitude, never coarser than a whole number. */
  valueNow: ComputedRef<number>
  /** Share of `max` done, `0…100`. */
  percent: ComputedRef<number>
  /** The circular ring's `viewBox`. */
  viewBox: string
  /** Stroke width of the ring, in viewBox units. */
  strokeWidth: ComputedRef<number>
  /** Circular `d` path — plain circle or wavy ring. */
  circularPath: ComputedRef<string>
  /** Length of the circular path, for the dash array. */
  totalPathLength: ComputedRef<number>
  /** Circular dash offset reflecting the current value. */
  dashOffset: ComputedRef<number>
  /** Length of the track arc: what the value leaves, less a gap at each end. */
  trackLength: ComputedRef<number>
  trackDashArray: ComputedRef<string>
  trackDashOffset: ComputedRef<number>
}

const { box, radius, thickness, trackGap, wave } = CIRCULAR_PROGRESS
const center = box / 2

/**
 * Coordinates rounded to three decimals: the server and the browser compute
 * the trigonometry to different last digits, and an unrounded `d` breaks
 * hydration.
 */
const round = (value: number) => Math.round(value * 1000) / 1000

const flatRing = `M ${center + radius} ${center} a ${radius} ${radius} 0 1 1 ${-2 * radius} 0 a ${radius} ${radius} 0 1 1 ${2 * radius} 0`

function wavyRingPoints(): Array<[number, number]> {
  const waves = Math.round((2 * Math.PI * radius) / wave.wavelength)
  return Array.from({ length: wave.samples + 1 }, (_, index) => {
    const angle = (index / wave.samples) * Math.PI * 2
    const r = radius + Math.sin(angle * waves) * wave.amplitude
    return [round(center + r * Math.cos(angle)), round(center + r * Math.sin(angle))]
  })
}

const wavyPoints = wavyRingPoints()
const wavyRing = wavyPoints.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ')
const wavyRingLength = wavyPoints.slice(1).reduce((length, [x, y], index) => {
  const [px, py] = wavyPoints[index]!
  return length + Math.hypot(x - px, y - py)
}, 0)

/**
 * Compute reactive progress geometry from component props.
 *
 * @param props Reactive progress props (pass the component `props` object).
 * @returns Reactive geometry values for the renderers.
 */
export function useProgress(props: UseProgressProps): UseProgressContext {
  const max = computed(() => (props.max > 0 ? props.max : 100))
  const isWavy = computed(() => props.shape === 'wavy')

  const clampedValue = computed(() => {
    const value = Number.isNaN(props.value) ? 0 : (props.value ?? 0)
    return Math.min(max.value, Math.max(0, value))
  })

  const percent = computed(() => (clampedValue.value / max.value) * 100)

  const valueStep = computed(() => Math.min(1, 10 ** (Math.floor(Math.log10(max.value)) - 2)))
  const valueNow = computed(() => Number((Math.round(clampedValue.value / valueStep.value) * valueStep.value).toPrecision(12)))

  const strokeWidth = computed(() => thickness[props.density] ?? thickness.default)

  const circularPath = computed(() => (isWavy.value ? wavyRing : flatRing))

  const totalPathLength = computed(() => (isWavy.value ? wavyRingLength : 2 * Math.PI * radius))

  const dashOffset = computed(() => {
    if (props.indeterminate) return totalPathLength.value * 0.25
    return totalPathLength.value * (1 - percent.value / 100)
  })

  const valueLength = computed(() => totalPathLength.value * (percent.value / 100))

  const gap = computed(() => {
    if (props.indeterminate) return 0
    return Math.min(valueLength.value, trackGap + strokeWidth.value)
  })

  const trackLength = computed(() => {
    if (props.indeterminate) return totalPathLength.value
    return Math.max(0, totalPathLength.value - valueLength.value - gap.value * 2)
  })

  const trackDashArray = computed(() => `${trackLength.value} ${totalPathLength.value}`)

  const trackDashOffset = computed(() => {
    if (props.indeterminate) return 0
    return -(valueLength.value + gap.value)
  })

  return {
    clampedValue,
    valueNow,
    percent,
    viewBox: `0 0 ${box} ${box}`,
    strokeWidth,
    circularPath,
    totalPathLength,
    dashOffset,
    trackLength,
    trackDashArray,
    trackDashOffset,
  }
}
