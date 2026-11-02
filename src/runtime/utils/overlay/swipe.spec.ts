import { describe, expect, it } from 'vitest'
import { SWIPE_VELOCITY_WINDOW_MS, addSwipeSample, releaseVelocity, resolveSwipe } from './swipe'
import type { SwipeSample } from './swipe'

const LIMITS = { threshold: 56, velocityThreshold: 125, slop: 8 }

describe('overlay/swipe', () => {
  describe('resolveSwipe', () => {
    it.each([
      ['a slow release past the threshold', 60, 0, 'dismiss'],
      ['a slow release short of the threshold', 40, 0, 'restore'],
      ['a fling towards the edge, however short', 20, 400, 'dismiss'],
      ['a fling back towards the anchor, however far', 120, -400, 'restore'],
      ['a fling no longer than the touch slop', 6, 900, 'restore'],
      ['a release exactly at the threshold', 56, 0, 'restore'],
      ['a release exactly at the velocity threshold', 20, 125, 'dismiss'],
    ] as const)('%s → %s', (_, travel, velocity, outcome) => {
      expect(resolveSwipe(travel, velocity, LIMITS)).toBe(outcome)
    })
  })

  describe('releaseVelocity', () => {
    it('is zero without samples or without elapsed time', () => {
      expect(releaseVelocity([])).toBe(0)
      expect(releaseVelocity([{ time: 10, travel: 40 }, { time: 10, travel: 40 }])).toBe(0)
    })

    it('measures travel per second over the recent window', () => {
      const samples: SwipeSample[] = [{ time: 0, travel: 0 }, { time: 50, travel: 30 }, { time: 100, travel: 60 }]

      expect(releaseVelocity(samples)).toBe(600)
    })

    it('ignores movement older than the window: a held finger has no speed', () => {
      const samples: SwipeSample[] = [{ time: 0, travel: 0 }, { time: 20, travel: 80 }, { time: 20 + SWIPE_VELOCITY_WINDOW_MS + 200, travel: 80 }]

      expect(releaseVelocity(samples)).toBe(0)
    })

    it('is negative when the release moves back towards the anchor', () => {
      expect(releaseVelocity([{ time: 0, travel: 80 }, { time: 40, travel: 60 }])).toBe(-500)
    })
  })

  describe('addSwipeSample', () => {
    it('keeps only the samples of the velocity window', () => {
      let samples: SwipeSample[] = []
      for (const time of [0, 40, 80, 120, 160]) samples = addSwipeSample(samples, { time, travel: time })

      expect(samples.map(sample => sample.time)).toEqual([80, 120, 160])
    })
  })
})
