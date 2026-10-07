import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  createVelocityProfile,
  cubicBezier,
  defineTransition,
  M3_DURATION,
  M3_SPRING,
  reduceTransition,
  resolveTransition,
  springDuration,
  springEasing,
  springOvershoot,
} from '#kit/utils/motion'
import { bouncy, expressive } from '#kit/utils/motion/expressive/transitions'
import { calm, standard } from '#kit/utils/motion/standard/transitions'

/** Sample an easing on a uniform grid. */
const sample = (fn: (t: number) => number, steps = 200): number[] =>
  Array.from({ length: steps + 1 }, (_, i) => fn(i / steps))

describe('springEasing', () => {
  it('starts at 0 and lands exactly on 1', () => {
    const at = springEasing({ damping: 0.6, stiffness: 380 })
    expect(at(0)).toBe(0)
    expect(at(1)).toBe(1)
  })

  it('never passes its target when critically damped', () => {
    const at = springEasing(M3_SPRING.effects.default)
    for (const v of sample(at)) expect(v).toBeLessThanOrEqual(1)
  })

  it('rises monotonically when critically damped', () => {
    const values = sample(springEasing(M3_SPRING.effects.default))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]! - 1e-12)
    }
  })

  it('overshoots by the amount the closed form predicts', () => {
    const spring = { damping: 0.6, stiffness: 380 }
    const peak = Math.max(...sample(springEasing(spring), 2000))
    // Sampling the settle-time window catches the first peak; allow the grid's
    // own error rather than demanding the analytic maximum exactly.
    expect(peak - 1).toBeCloseTo(springOvershoot(spring), 2)
  })

  it('reaches its first peak before the halfway mark', () => {
    const values = sample(springEasing({ damping: 0.6, stiffness: 380 }), 1000)
    const peakAt = values.indexOf(Math.max(...values)) / 1000
    expect(peakAt).toBeGreaterThan(0.2)
    expect(peakAt).toBeLessThan(0.5)
  })

  it('handles an overdamped spring without overshoot', () => {
    const at = springEasing({ damping: 1.6, stiffness: 400 })
    const values = sample(at)
    for (const v of values) expect(v).toBeLessThanOrEqual(1)
    expect(values.at(-2)!).toBeGreaterThan(0.99)
  })
})

describe('springDuration', () => {
  it('matches the settling times of the M3 spatial springs', () => {
    expect(springDuration(M3_SPRING.spatial.fast)).toBe(230)
    expect(springDuration(M3_SPRING.spatial.default)).toBe(325)
    expect(springDuration(M3_SPRING.spatial.slow)).toBe(496)
  })

  it('shortens as stiffness rises', () => {
    const soft = springDuration({ damping: 0.6, stiffness: 200 })
    const stiff = springDuration({ damping: 0.6, stiffness: 2000 })
    expect(stiff).toBeLessThan(soft)
  })

  it('is settled at the duration it reports', () => {
    const spring = { damping: 0.6, stiffness: 380 }
    const at = springEasing(spring)
    expect(Math.abs(at(0.999) - 1)).toBeLessThan(0.01)
  })
})

describe('springOvershoot', () => {
  it('is zero at or above critical damping', () => {
    expect(springOvershoot({ damping: 1, stiffness: 700 })).toBe(0)
    expect(springOvershoot({ damping: 1.4, stiffness: 700 })).toBe(0)
  })

  it('grows as damping falls, and is invisible at the M3 spatial ratio', () => {
    expect(springOvershoot({ damping: 0.9, stiffness: 700 })).toBeLessThan(0.005)
    expect(springOvershoot({ damping: 0.6, stiffness: 700 })).toBeCloseTo(0.0948, 3)
    expect(springOvershoot({ damping: 0.45, stiffness: 700 })).toBeCloseTo(0.2054, 3)
  })

  it('does not depend on stiffness', () => {
    expect(springOvershoot({ damping: 0.6, stiffness: 100 }))
      .toBe(springOvershoot({ damping: 0.6, stiffness: 5000 }))
  })
})

describe('cubicBezier', () => {
  it('pins both endpoints', () => {
    const at = cubicBezier(0.2, 0, 0, 1)
    expect(at(0)).toBe(0)
    expect(at(1)).toBe(1)
  })

  it('is the identity for the linear curve', () => {
    const at = cubicBezier(0, 0, 1, 1)
    for (const t of [0.1, 0.37, 0.5, 0.9]) expect(at(t)).toBeCloseTo(t, 6)
  })

  it('rises monotonically for the M3 standard curve', () => {
    const values = sample(cubicBezier(0.2, 0, 0, 1))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!)
    }
  })

  it('front-loads emphasized-decelerate more than standard', () => {
    const decelerate = cubicBezier(0.05, 0.7, 0.1, 1)
    const standard = cubicBezier(0.2, 0, 0, 1)
    expect(decelerate(0.25)).toBeGreaterThan(standard(0.25))
    expect(decelerate(0.25)).toBeCloseTo(0.8315, 3)
    expect(standard(0.25)).toBeCloseTo(0.6072, 3)
  })

  it('inverts the parametric curve accurately at the extremes', () => {
    const at = cubicBezier(0.3, 0, 0.8, 0.15)
    expect(at(0.001)).toBeGreaterThanOrEqual(0)
    expect(at(0.999)).toBeLessThanOrEqual(1)
  })
})

describe('createVelocityProfile', () => {
  it('rests at both ends, so a shape never accumulates a turn', () => {
    const profile = createVelocityProfile(springEasing({ damping: 0.6, stiffness: 380 }))
    expect(profile(0)).toBe(0)
    expect(profile(1)).toBe(0)
  })

  it('normalizes its peak to 1', () => {
    const profile = createVelocityProfile(cubicBezier(0.2, 0, 0, 1))
    const peak = Math.max(...sample(profile, 400).map(Math.abs))
    expect(peak).toBeCloseTo(1, 2)
  })

  it('is flat for a linear curve', () => {
    const profile = createVelocityProfile(t => t)
    for (const t of [0.2, 0.5, 0.8]) expect(profile(t)).toBeCloseTo(1, 6)
  })

  it('peaks early for a spring, so the bank leads the rebound', () => {
    const values = sample(createVelocityProfile(springEasing({ damping: 0.6, stiffness: 380 })), 1000)
    const peakAt = values.indexOf(Math.max(...values)) / 1000
    expect(peakAt).toBeLessThan(0.2)
  })

  it('reverses while a spring springs back', () => {
    const values = sample(createVelocityProfile(springEasing({ damping: 0.6, stiffness: 380 })), 400)
    expect(Math.min(...values)).toBeLessThan(0)
  })

  it('is silent for a curve that never moves', () => {
    const profile = createVelocityProfile(() => 0.5)
    for (const t of [0, 0.3, 0.7, 1]) expect(profile(t)).toBe(0)
  })
})

describe('defineTransition', () => {
  it('derives duration from the spring when none is given', () => {
    const t = defineTransition({ spring: { damping: 0.6, stiffness: 380 } })
    expect(t.duration).toBe(springDuration({ damping: 0.6, stiffness: 380 }))
    expect(t.overshoots).toBe(true)
  })

  it('lets an explicit duration win over the spring', () => {
    const t = defineTransition({ spring: { damping: 0.6, stiffness: 380 }, duration: 900 })
    expect(t.duration).toBe(900)
    expect(t.easing(1)).toBe(1)
  })

  it('accepts a bare easing and does not assume overshoot', () => {
    const t = defineTransition({ easing: cubicBezier(0.2, 0, 0, 1), duration: 400 })
    expect(t.overshoots).toBe(false)
    expect(t.easing(0.5)).toBeGreaterThan(0)
  })

  it('defaults the side channels to off', () => {
    const t = defineTransition()
    expect(t.rotate).toBe(0)
    expect(t.preserveArea).toBe(false)
    expect(t.hold).toBe(0)
  })
})

describe('resolveTransition', () => {
  it('falls back to expressive', () => {
    expect(resolveTransition()).toBe(expressive)
    expect(resolveTransition('nope' as 'calm')).toBe(expressive)
  })

  it('resolves shipped transitions by name', () => {
    expect(resolveTransition('calm').overshoots).toBe(false)
    expect(resolveTransition('expressive').rotate).toBe(60)
    expect(resolveTransition('bouncy').preserveArea).toBe(true)
  })

  it('builds a transition from options', () => {
    const t = resolveTransition({ spring: { damping: 0.5, stiffness: 300 }, rotate: 45 })
    expect(t.rotate).toBe(45)
    expect(t.overshoots).toBe(true)
  })
})

describe('M3_DURATION', () => {
  it('matches the duration tokens of the stylesheet', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/runtime/assets/stylesheet/base/_animations.scss'), 'utf8')
    const declared = Object.fromEntries(
      [...source.matchAll(/--sys-motion-duration-([a-z-]+)-(\d):\s*(\d+)ms/g)].map(([, step, index, ms]) => [
        `${step!.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}${index}`,
        Number(ms),
      ]),
    )

    expect(declared).toEqual(M3_DURATION)
  })
})

describe('reduceTransition', () => {
  it('collapses a long transition to short2 and keeps its curve', () => {
    const reduced = reduceTransition(expressive)

    expect(reduced.duration).toBe(M3_DURATION.short2)
    expect(reduced.easing).toBe(expressive.easing)
    expect(reduced.preserveArea).toBe(expressive.preserveArea)
    expect(reduced.overshoots).toBe(expressive.overshoots)
    expect(reduced.hold).toBe(expressive.hold)
  })

  it.each([
    [50, 50],
    [150, 150],
    [200, 200],
    [201, 100],
    [610, 100],
    [2000, 100],
  ])('turns %i ms into %i ms', (duration, expected) => {
    const reduced = reduceTransition(defineTransition({ easing: t => t, duration }))
    expect(reduced.duration).toBe(expected)
  })

  it('stops the bank and leaves the source transition untouched', () => {
    const reduced = reduceTransition(bouncy)

    expect(reduced.rotate).toBe(0)
    expect(bouncy.rotate).toBe(90)
    expect(bouncy.duration).toBeGreaterThan(M3_DURATION.short4)
  })
})

describe('M3_SPRING against StandardMotionTokens (kit constants, not verified against Compose)', () => {
  it.each([
    ['SpringFastSpatial', M3_SPRING.spatial.fast, 0.9, 1400],
    ['SpringDefaultSpatial', M3_SPRING.spatial.default, 0.9, 700],
    ['SpringSlowSpatial', M3_SPRING.spatial.slow, 0.9, 300],
    ['SpringFastEffects', M3_SPRING.effects.fast, 1, 3800],
    ['SpringDefaultEffects', M3_SPRING.effects.default, 1, 1600],
    ['SpringSlowEffects', M3_SPRING.effects.slow, 1, 800],
  ] as const)('%s', (_token, spring, damping, stiffness) => {
    expect(spring).toEqual({ damping, stiffness })
  })

  it('builds the standard and calm transitions on those springs', () => {
    expect(standard.duration).toBe(springDuration(M3_SPRING.spatial.default))
    expect(calm.duration).toBe(springDuration(M3_SPRING.effects.default))
    expect(calm.overshoots).toBe(false)
  })

  it.todo('reconcile the expressive scheme with ExpressiveMotionTokens once the Compose sources are available')
})
