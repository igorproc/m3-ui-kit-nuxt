import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue'
import type { Ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { M3_SHAPES } from '#kit/assets/icon/shapes'
import { createPathInterpolator } from '#kit/utils/morph'
import { M3_DURATION, MORPH_TRANSITIONS } from '#kit/utils/motion'
import { useShapeMorph } from './useShapeMorph'
import type { ShapeMorphContext, ShapeMorphOptions } from './useShapeMorph'

vi.mock('#kit/utils/morph', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#kit/utils/morph')>()
  return { ...actual, createPathInterpolator: vi.fn(actual.createPathInterpolator) }
})

const build = vi.mocked(createPathInterpolator)
const { circle, square, heart, diamond } = M3_SHAPES
const ALL_SHAPES = Object.values(M3_SHAPES)

const scopes: Array<() => void> = []

function run(target: Ref<string>, options: ShapeMorphOptions = {}): ShapeMorphContext {
  const scope = effectScope()
  const morph = scope.run(() => useShapeMorph(target, options))!
  scopes.push(() => scope.stop())
  return morph
}

function frames(count: number): void {
  for (let i = 0; i < count; i++) vi.advanceTimersToNextFrame()
}

async function morphTo(target: Ref<string>, next: string): Promise<void> {
  target.value = next
  await nextTick()
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  })))
}

async function mountMorph() {
  const target = shallowRef<string>(M3_SHAPES.circle)
  let morph!: ReturnType<typeof useShapeMorph>
  const Probe = defineComponent({
    setup() {
      morph = useShapeMorph(target)
      return () => h('svg', [h('path', { d: morph.d.value })])
    },
  })
  const wrapper = await mountSuspended(Probe)
  return { wrapper, target, morph }
}

describe('useShapeMorph on a frame clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    build.mockClear()
  })

  afterEach(() => {
    scopes.splice(0).forEach(stop => stop())
    vi.useRealTimers()
  })

  describe('motion', () => {
    it('rests on its target until the target changes', () => {
      const morph = run(ref(circle))

      frames(3)

      expect(morph.d.value).toBe(circle)
      expect(morph.rotate.value).toBe(0)
    })

    it('passes through intermediate frames and settles on the canonical target', async () => {
      const target = ref(circle)
      const morph = run(target)

      await morphTo(target, square)
      frames(2)
      expect(morph.d.value).not.toBe(circle)
      expect(morph.d.value).not.toBe(square)

      frames(60)
      expect(morph.d.value).toBe(square)
      expect(morph.rotate.value).toBe(0)
    })

    it('banks while it moves and comes to rest square', async () => {
      const target = ref(circle)
      const morph = run(target)
      const angles: number[] = []

      await morphTo(target, square)
      for (let i = 0; i < 60; i++) {
        frames(1)
        angles.push(morph.rotate.value)
      }

      expect(Math.max(...angles.map(Math.abs))).toBeGreaterThan(0)
      expect(angles.at(-1)).toBe(0)
    })

    it('does not bank on the calm transition', async () => {
      const target = ref(circle)
      const morph = run(target, { transition: 'calm' })

      await morphTo(target, square)
      for (let i = 0; i < 30; i++) {
        frames(1)
        expect(morph.rotate.value).toBe(0)
      }
      expect(morph.d.value).toBe(square)
    })
  })

  describe('interpolator cache', () => {
    it('builds the pairs of a sequence once for every instance on the page', () => {
      const sequence = [circle, square, heart]

      run(ref(circle), { sequence, samples: 97 })
      expect(build).toHaveBeenCalledTimes(3)

      for (let i = 0; i < 9; i++) run(ref(circle), { sequence, samples: 97 })
      expect(build).toHaveBeenCalledTimes(3)
    })

    it('reuses a pair another instance already morphed through', async () => {
      const first = ref(circle)
      const second = ref(circle)
      run(first, { samples: 98 })
      run(second, { samples: 98 })

      await morphTo(first, diamond)
      await morphTo(second, diamond)

      expect(build).toHaveBeenCalledTimes(1)
    })

    it('keys pairs by the geometry options', () => {
      const sequence = [circle, square]

      run(ref(circle), { sequence, samples: 99, transition: 'expressive' })
      run(ref(circle), { sequence, samples: 99, transition: 'calm' })

      expect(build).toHaveBeenCalledTimes(4)
    })

    it('stays bounded and evicts the oldest pairs first', () => {
      const forward = ALL_SHAPES
      const backward = [...ALL_SHAPES].reverse()

      run(ref(circle), { sequence: forward, samples: 100 })
      run(ref(circle), { sequence: backward, samples: 100 })
      const filled = build.mock.calls.length

      run(ref(circle), { sequence: backward, samples: 100 })
      expect(build.mock.calls.length).toBe(filled)

      run(ref(circle), { sequence: forward, samples: 100 })
      expect(build.mock.calls.length).toBeGreaterThan(filled)
    })
  })
})

describe('useShapeMorph under reduced motion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // §6.2.6: reduced motion shortens the morph, it does not switch it off.
  it('keeps morphing under reduced motion, cut to short2 and without a swing', async () => {
    stubReducedMotion(true)
    const { wrapper, target, morph } = await mountMorph()

    expect(MORPH_TRANSITIONS.expressive.duration).toBeGreaterThan(M3_DURATION.short4)
    expect(morph.transition.value.duration).toBe(M3_DURATION.short2)
    expect(morph.transition.value.easing).toBe(MORPH_TRANSITIONS.expressive.easing)
    expect(morph.transition.value.rotate).toBe(0)

    target.value = M3_SHAPES.square
    await nextTick()
    expect(morph.d.value).not.toBe(M3_SHAPES.square)

    wrapper.unmount()
  })

  it('swings with the morph in full motion', async () => {
    stubReducedMotion(false)
    const { wrapper, morph } = await mountMorph()

    expect(morph.transition.value.rotate).toBeGreaterThan(0)
    expect(morph.rotate.value).toBe(0)

    wrapper.unmount()
  })
})

describe('useShapeMorph on the server', () => {
  afterEach(() => {
    vi.doUnmock('#kit/shared/constants/globals')
    vi.resetModules()
  })

  it('builds nothing and lands on the target without animating', async () => {
    vi.resetModules()
    vi.doMock('#kit/shared/constants/globals', () => ({ IN_BROWSER: false }))
    const morph = await import('#kit/utils/morph')
    const server = await import('./useShapeMorph')
    const spy = vi.mocked(morph.createPathInterpolator)
    spy.mockClear()

    const target = ref<string>(circle)
    const scope = effectScope()
    const context = scope.run(() => server.useShapeMorph(target, { sequence: [circle, square, heart] }))!
    target.value = square
    context.start()

    expect(spy).not.toHaveBeenCalled()
    expect(context.d.value).toBe(square)
    expect(context.rotate.value).toBe(0)
    scope.stop()
  })
})
