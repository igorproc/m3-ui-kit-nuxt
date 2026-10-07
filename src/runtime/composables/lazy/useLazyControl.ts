import { computed, nextTick, onErrorCaptured, onMounted, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useTimer } from '#kit/composables/useTimer'
import { getFocusableElements } from '#kit/composables/overlay/useFocusTrap'
import { useLazyIntersection } from '#kit/composables/lazy/useLazyIntersection'
import { createLazyState, isLazyMounted, resolveLazyView, transitionLazy } from '#kit/composables/lazy/lazyMachine'
import type { LazyEvent, LazyView } from '#kit/composables/lazy/lazyMachine'
import type {
  MLazyActivation,
  MLazyActivationReason,
  MLazyInteraction,
  MLazyMode,
  MLazyStatus,
} from '#kit/components/ui/lazy/props'

export interface LazyControlProps {
  mode: MLazyMode
  once: boolean
  timeout: number
  rootMargin: string
  threshold: number | number[]
  interactions: MLazyInteraction[]
  disabled: boolean
  fallbackDelay: number
}

export interface LazyControlHooks {
  onActivate?: (activation: MLazyActivation) => void
  onVisible?: () => void
  onPending?: () => void
  onResolve?: () => void
  onError?: (error: unknown) => void
}

export interface LazyControlOptions {
  hasFallback?: () => boolean
}

export interface LazyRootAttrs {
  'role': 'button' | undefined
  'tabindex': 0 | -1 | undefined
  'aria-busy': 'true' | undefined
  'onPointerenter': (event: PointerEvent) => void
  'onPointerdown': (event: PointerEvent) => void
  'onClick': (event: MouseEvent) => void
  'onKeydown': (event: KeyboardEvent) => void
  'onFocusin': (event: FocusEvent) => void
  'onFocusout': (event: FocusEvent) => void
}

export interface LazySuspenseAttrs {
  onPending: () => void
  onResolve: () => void
}

export interface LazyAlertAttrs {
  role: 'alert'
}

export interface UseLazyControlReturn {
  root: ShallowRef<HTMLElement | null>
  status: ComputedRef<MLazyStatus>
  view: ComputedRef<LazyView>
  attempt: ComputedRef<number>
  isMounted: ComputedRef<boolean>
  isActivator: ComputedRef<boolean>
  activation: ShallowRef<MLazyActivation | null>
  error: ShallowRef<unknown>
  activate: () => void
  retry: () => void
  rootAttrs: ComputedRef<LazyRootAttrs>
  suspenseAttrs: LazySuspenseAttrs
  alertAttrs: LazyAlertAttrs
}

const ACTIVATION_KEYS = new Set(['Enter', ' '])

function scheduleIdle(callback: () => void, timeout: number): () => void {
  const idleWindow: Partial<Pick<Window, 'requestIdleCallback' | 'cancelIdleCallback'>> = window

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout })
    return () => idleWindow.cancelIdleCallback?.(handle)
  }

  const handle = window.setTimeout(callback, timeout)
  return () => window.clearTimeout(handle)
}

export function useLazyControl(
  active: Ref<boolean | undefined>,
  props: LazyControlProps,
  hooks: LazyControlHooks = {},
  options: LazyControlOptions = {},
): UseLazyControlReturn {
  const root = shallowRef<HTMLElement | null>(null)
  const forced = props.disabled || props.mode === 'eager'
  const startsActive = forced || active.value === true

  const state = shallowRef(createLazyState(startsActive ? 'active' : 'idle'))
  const activation = shallowRef<MLazyActivation | null>(startsActive ? { reason: forced ? 'eager' : 'manual' } : null)
  const error = shallowRef<unknown>()
  const everActivated = shallowRef(startsActive)
  const isClient = shallowRef(false)
  const fallbackShown = shallowRef(false)
  const placeholderFocusable = shallowRef(false)
  const parked = shallowRef(false)
  let parking = false
  let focusWasInside = false

  const status = computed(() => state.value.status)
  const attempt = computed(() => state.value.attempt)
  const isMounted = computed(() => isLazyMounted(status.value))
  const armed = computed(() => !props.once || !everActivated.value)
  const view = computed(() => resolveLazyView(status.value, fallbackShown.value && Boolean(options.hasFallback?.())))
  const isActivator = computed(() =>
    props.mode === 'on-interaction'
    && !props.disabled
    && status.value === 'idle'
    && !placeholderFocusable.value,
  )

  function send(event: LazyEvent) {
    state.value = transitionLazy(state.value, event)
  }

  function containsFocus(withRoot: boolean): boolean {
    const element = root.value
    const focused = document.activeElement
    if (!element || !focused || (!withRoot && focused === element)) return false

    return element.contains(focused)
  }

  function settleIdle() {
    if (status.value !== 'idle') return

    activation.value = null
    error.value = undefined
  }

  function activate(reason: MLazyActivationReason, event?: Event) {
    if (status.value !== 'idle') {
      send('activate')
      return
    }

    const next: MLazyActivation = { reason, event }
    activation.value = next
    error.value = undefined
    everActivated.value = true
    send('activate')
    hooks.onActivate?.(next)
  }

  function deactivate() {
    send(containsFocus(true) ? 'hold' : 'release')
    send('deactivate')
    settleIdle()
  }

  function release() {
    send('release')
    settleIdle()
  }

  function reset() {
    send('reset')
    settleIdle()
  }

  function retry() {
    if (status.value === 'idle') {
      activate('manual')
      return
    }

    error.value = undefined
    send('retry')
  }

  function interact(kind: MLazyInteraction, event: Event) {
    if (props.mode !== 'on-interaction' || props.disabled || status.value !== 'idle') return
    if (props.interactions.includes(kind)) activate('interaction', event)
  }

  function syncPlaceholder() {
    const element = root.value
    if (!element || status.value !== 'idle') return

    placeholderFocusable.value = getFocusableElements(element).length > 0
  }

  function park() {
    parked.value = true

    void nextTick(() => {
      parking = true
      root.value?.focus({ preventScroll: true })
      parking = false
    })
  }

  const viewKey = computed(() => `${view.value}:${attempt.value}`)

  watch(viewKey, () => {
    focusWasInside = containsFocus(false)
  }, { flush: 'pre' })

  watch(viewKey, () => {
    syncPlaceholder()

    const focused = document.activeElement
    const lost = !focused || focused === document.body
    if (focusWasInside && lost) park()
    focusWasInside = false
  }, { flush: 'post' })

  watch(active, (value) => {
    if (value === true && status.value === 'idle') activate('manual')
    else if (value === false && status.value !== 'idle') reset()
  })

  watch(() => status.value !== 'idle', (activated) => {
    if (active.value !== activated) active.value = activated
  })

  watch(
    () => isClient.value && armed.value && status.value === 'idle' && (props.disabled || props.mode === 'eager'),
    (due) => {
      if (due) activate('eager')
    },
  )

  watch(
    () => isClient.value && armed.value && status.value === 'idle' && !props.disabled && props.mode === 'on-idle',
    (due, _, onCleanup) => {
      if (due) onCleanup(scheduleIdle(() => activate('idle'), props.timeout))
    },
  )

  useLazyIntersection(
    root,
    () => ({ rootMargin: props.rootMargin, threshold: props.threshold }),
    (entry) => {
      if (entry.isIntersecting) {
        hooks.onVisible?.()
        activate('view')
      } else if (!props.once) {
        deactivate()
      }
    },
    () => !props.disabled && props.mode === 'on-view' && (!props.once || (armed.value && status.value === 'idle')),
  )

  const fallbackTimer = useTimer(() => {
    fallbackShown.value = true
  }, { duration: () => props.fallbackDelay })

  watch(
    () => (status.value === 'pending' ? attempt.value : -1),
    (pendingAttempt) => {
      fallbackTimer.stop()
      fallbackShown.value = false
      if (pendingAttempt < 0) return

      if (props.fallbackDelay > 0) fallbackTimer.start()
      else fallbackShown.value = true
    },
    { immediate: true },
  )

  onErrorCaptured((captured) => {
    error.value = captured
    send('fail')
    hooks.onError?.(captured)
    return false
  })

  onMounted(() => {
    isClient.value = true
    syncPlaceholder()
  })

  const rootAttrs = computed<LazyRootAttrs>(() => ({
    'role': isActivator.value ? 'button' : undefined,
    'tabindex': isActivator.value ? 0 : parked.value ? -1 : undefined,
    'aria-busy': status.value === 'pending' ? 'true' : undefined,
    'onPointerenter': event => interact('pointerenter', event),
    'onPointerdown': event => interact('pointerdown', event),
    'onClick': event => interact('click', event),
    'onKeydown': (event) => {
      if (!isActivator.value || event.target !== root.value || !ACTIVATION_KEYS.has(event.key)) return

      event.preventDefault()
      activate('interaction', event)
    },
    'onFocusin': (event) => {
      send('hold')
      if (event.target === root.value) parked.value = true
      if (!parking) interact('focus', event)
    },
    'onFocusout': (event) => {
      if (event.target === root.value) parked.value = false

      const next = event.relatedTarget
      if (next instanceof Node && root.value?.contains(next)) return
      if (!next && !document.hasFocus()) return

      release()
    },
  }))

  const suspenseAttrs: LazySuspenseAttrs = {
    onPending: () => {
      if (!isMounted.value) return

      send('suspend')
      hooks.onPending?.()
    },
    onResolve: () => {
      if (!isMounted.value) return

      send('resolve')
      hooks.onResolve?.()
    },
  }

  return {
    root,
    status,
    view,
    attempt,
    isMounted,
    isActivator,
    activation,
    error,
    activate: () => activate('manual'),
    retry,
    rootAttrs,
    suspenseAttrs,
    alertAttrs: { role: 'alert' },
  }
}
