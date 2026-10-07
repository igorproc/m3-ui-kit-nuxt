import type { MLazyStatus } from '#kit/components/ui/lazy/props'

export type LazyEvent
  = | 'activate'
    | 'suspend'
    | 'resolve'
    | 'fail'
    | 'retry'
    | 'deactivate'
    | 'reset'
    | 'hold'
    | 'release'

export type LazyView = 'placeholder' | 'fallback' | 'content' | 'error'

export interface LazyState {
  status: MLazyStatus
  attempt: number
  held: boolean
  deferred: boolean
}

export function createLazyState(status: MLazyStatus = 'idle'): LazyState {
  return { status, attempt: 0, held: false, deferred: false }
}

export function isLazyMounted(status: MLazyStatus): boolean {
  return status === 'pending' || status === 'active'
}

function patch(state: LazyState, changes: Partial<LazyState>): LazyState {
  const next = { ...state, ...changes }
  const keys = Object.keys(next) as Array<keyof LazyState>

  return keys.every(key => next[key] === state[key]) ? state : next
}

export function transitionLazy(state: LazyState, event: LazyEvent): LazyState {
  switch (event) {
    case 'activate':
      if (state.status === 'idle') return patch(state, { status: 'pending', deferred: false })
      return isLazyMounted(state.status) ? patch(state, { deferred: false }) : state
    case 'suspend':
      return state.status === 'active' ? patch(state, { status: 'pending' }) : state
    case 'resolve':
      return state.status === 'pending' ? patch(state, { status: 'active' }) : state
    case 'fail':
      return patch(state, { status: 'error', deferred: false })
    case 'retry':
      return patch(state, { status: 'pending', attempt: state.attempt + 1, deferred: false })
    case 'deactivate':
      if (state.status === 'idle') return state
      return state.held ? patch(state, { deferred: true }) : patch(state, { status: 'idle', deferred: false })
    case 'reset':
      return patch(state, { status: 'idle', deferred: false })
    case 'hold':
      return patch(state, { held: true })
    case 'release':
      return state.deferred
        ? patch(state, { status: 'idle', held: false, deferred: false })
        : patch(state, { held: false })
  }
}

export function resolveLazyView(status: MLazyStatus, fallbackDue: boolean): LazyView {
  if (status === 'error') return 'error'
  if (status === 'active') return 'content'
  return status === 'pending' && fallbackDue ? 'fallback' : 'placeholder'
}
