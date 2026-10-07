import { describe, expect, it } from 'vitest'
import { createLazyState, isLazyMounted, resolveLazyView, transitionLazy } from './lazyMachine'
import type { LazyEvent, LazyState } from './lazyMachine'

const state = (changes: Partial<LazyState> = {}): LazyState => ({ ...createLazyState(), ...changes })

describe('lazyMachine', () => {
  it('starts idle with no attempt, hold or deferred release', () => {
    expect(createLazyState()).toEqual({ status: 'idle', attempt: 0, held: false, deferred: false })
    expect(createLazyState('active').status).toBe('active')
  })

  const cases: Array<[string, LazyState, LazyEvent, Partial<LazyState>]> = [
    ['idle activates into pending', state(), 'activate', { status: 'pending' }],
    ['activation of mounted content cancels a deferred release', state({ status: 'active', held: true, deferred: true }), 'activate', { status: 'active', deferred: false }],
    ['activation does not clear an error', state({ status: 'error' }), 'activate', { status: 'error' }],
    ['active content suspends again', state({ status: 'active' }), 'suspend', { status: 'pending' }],
    ['idle ignores suspense', state(), 'suspend', { status: 'idle' }],
    ['pending resolves into active', state({ status: 'pending' }), 'resolve', { status: 'active' }],
    ['an error ignores a late resolve', state({ status: 'error' }), 'resolve', { status: 'error' }],
    ['idle ignores resolve', state(), 'resolve', { status: 'idle' }],
    ['pending fails into error', state({ status: 'pending' }), 'fail', { status: 'error' }],
    ['a failure drops a deferred release', state({ status: 'active', held: true, deferred: true }), 'fail', { status: 'error', deferred: false }],
    ['retry remounts with the next attempt', state({ status: 'error', attempt: 1 }), 'retry', { status: 'pending', attempt: 2 }],
    ['unheld content deactivates into idle', state({ status: 'active' }), 'deactivate', { status: 'idle' }],
    ['held content defers its deactivation', state({ status: 'active', held: true }), 'deactivate', { status: 'active', deferred: true }],
    ['an error deactivates into idle', state({ status: 'error' }), 'deactivate', { status: 'idle' }],
    ['reset ignores the hold', state({ status: 'active', held: true, deferred: true }), 'reset', { status: 'idle', held: true, deferred: false }],
    ['hold marks focus inside', state({ status: 'active' }), 'hold', { held: true }],
    ['release completes a deferred deactivation', state({ status: 'active', held: true, deferred: true }), 'release', { status: 'idle', held: false, deferred: false }],
    ['release without a deferred deactivation keeps the content', state({ status: 'active', held: true }), 'release', { status: 'active', held: false }],
  ]

  it.each(cases)('%s', (_, from, event, expected) => {
    expect(transitionLazy(from, event)).toEqual({ ...from, ...expected })
  })

  it('returns the same object when nothing changes', () => {
    const idle = state()

    expect(transitionLazy(idle, 'resolve')).toBe(idle)
    expect(transitionLazy(idle, 'release')).toBe(idle)
    expect(transitionLazy(idle, 'deactivate')).toBe(idle)
  })

  it('mounts the content only while pending or active', () => {
    expect([isLazyMounted('idle'), isLazyMounted('pending'), isLazyMounted('active'), isLazyMounted('error')])
      .toEqual([false, true, true, false])
  })

  const views: Array<[Parameters<typeof resolveLazyView>[0], boolean, ReturnType<typeof resolveLazyView>]> = [
    ['idle', false, 'placeholder'],
    ['idle', true, 'placeholder'],
    ['pending', false, 'placeholder'],
    ['pending', true, 'fallback'],
    ['active', true, 'content'],
    ['error', true, 'error'],
  ]

  it.each(views)('shows %s with a due fallback = %s as %s', (status, fallbackDue, view) => {
    expect(resolveLazyView(status, fallbackDue)).toBe(view)
  })
})
