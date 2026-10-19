import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { M3_SHAPES } from '#kit/assets/icon/shapes'
import { MORPH_TRANSITIONS } from '#kit/utils/motion'
import { useShapeMorph } from './useShapeMorph'

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

describe('useShapeMorph', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // §6.2.6: reduced motion shortens the morph, it does not switch it off.
  it('keeps morphing under reduced motion, on the calm curve and without a swing', async () => {
    stubReducedMotion(true)
    const { wrapper, target, morph } = await mountMorph()

    expect(morph.transition.value.duration).toBe(MORPH_TRANSITIONS.calm.duration)
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
