import { describe, expect, it } from 'vitest'
import { nextTick, ref, watchEffect } from 'vue'
import { createLayoutRegistry } from '../app/composables/layout/registry'
import type { LayoutItem } from '../app/composables/layout/registry'

const noEl = () => null

const item = (id: string, size?: string): LayoutItem => ({ id, kind: 'top', size })

describe('createLayoutRegistry', () => {
  it('keeps registration order and replaces by id in place', () => {
    const registry = createLayoutRegistry()

    registry.register(item('a'), noEl)
    registry.register(item('b'), noEl)
    registry.register({ ...item('a'), kind: 'bottom' }, noEl)

    expect(registry.items.map(i => i.id)).toEqual(['a', 'b'])
    expect(registry.items[0]?.kind).toBe('bottom')
  })

  it('unregister removes the item', () => {
    const registry = createLayoutRegistry()

    registry.register(item('a'), noEl)
    registry.register(item('b'), noEl)
    registry.unregister('a')

    expect(registry.items.map(i => i.id)).toEqual(['b'])
  })

  it('mutual registrations from watchEffects do not ping-pong (no array tracking inside register)', async () => {
    const registry = createLayoutRegistry()
    const sizeA = ref<string | undefined>('var(--a)')
    const sizeB = ref<string | undefined>('var(--b)')
    let runsA = 0
    let runsB = 0

    watchEffect(() => {
      runsA++
      registry.register({ id: 'a', kind: 'top', size: sizeA.value }, noEl)
    })

    watchEffect(() => {
      runsB++
      registry.register({ id: 'b', kind: 'top', size: sizeB.value }, noEl)
    })

    await nextTick()
    expect(runsA).toBe(1)
    expect(runsB).toBe(1)

    // Updating one item must not re-run the other item's effect
    sizeA.value = 'var(--a2)'
    await nextTick()

    expect(runsA).toBe(2)
    expect(runsB).toBe(1)
    expect(registry.items.find(i => i.id === 'a')?.size).toBe('var(--a2)')
  })

  it('re-register with an identical snapshot does not touch the reactive array', async () => {
    const registry = createLayoutRegistry()
    let consumerRuns = 0

    watchEffect(() => {
      consumerRuns++
      void registry.items.map(i => i.size)
    })

    registry.register(item('a', 'var(--a)'), noEl)
    await nextTick()
    expect(consumerRuns).toBe(2)

    registry.register(item('a', 'var(--a)'), noEl)
    await nextTick()
    expect(consumerRuns).toBe(2)
  })

  it('reorder inserts a late-mounted item at its DOM position', () => {
    const registry = createLayoutRegistry()

    const host = document.createElement('div')
    const elA = document.createElement('header')
    const elB = document.createElement('footer')
    const elLate = document.createElement('aside')
    host.append(elA, elLate, elB)

    registry.register(item('a'), () => elA)
    registry.register(item('b'), () => elB)
    registry.markHydrated()

    // late v-if mount lands at the end of the registry, but sits between a and b in DOM
    registry.register(item('late'), () => elLate)
    registry.reorder('late')

    expect(registry.items.map(i => i.id)).toEqual(['a', 'late', 'b'])
  })

  it('reorder is a no-op before hydration (setup order is already DOM order)', () => {
    const registry = createLayoutRegistry()

    const elA = document.createElement('header')
    const elB = document.createElement('footer')
    document.createElement('div').append(elA, elB)

    registry.register(item('a'), () => elA)
    registry.register(item('b'), () => elB)
    registry.reorder('b')

    expect(registry.items.map(i => i.id)).toEqual(['a', 'b'])
  })
})
