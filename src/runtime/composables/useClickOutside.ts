/**
 * @module useClickOutside
 *
 * @remarks
 * Detects clicks outside the specified element(s), ported from `@vuetify/v0`.
 * Replaces the kit's ad-hoc `v-click-outside` directive and hand-rolled
 * outside-click handling in menus/dropdowns/sheets.
 *
 * Key features:
 * - two-phase detection (`pointerdown` → `pointerup`) avoids drag-out false positives
 * - `bounds` mode: coordinate-based detection for native `<dialog>` backdrop clicks
 * - touch-scroll threshold ignores swipes/scrolls on mobile
 * - capture-phase listeners cooperate with `stopPropagation`
 * - `pause`/`resume`/`stop`
 * - SSR-safe (no-op outside the browser)
 *
 * Pointer interactions only — pair with an Escape-key handler for full
 * dialog/popover accessibility.
 *
 * @example
 * ```ts
 * const panel = useTemplateRef<HTMLElement>('panel')
 * useClickOutside(panel, () => (isOpen.value = false))
 * ```
 */
import { onScopeDispose, shallowReadonly, shallowRef, toRef, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { toArray } from '#kit/shared/utils/toArray'
import type { MaybeArray } from '#kit/shared/utils/toArray'
import { isElement, isFunction, isNull, isNullOrUndefined, isString } from '#kit/shared/utils/guards/guards'
import { useDocumentEventListener, useWindowEventListener } from './useEventListener'

export type ClickOutsideElement = HTMLElement | null | undefined
export type ClickOutsideTarget = MaybeRefOrGetter<ClickOutsideElement>
export type ClickOutsideIgnoreTarget = ClickOutsideTarget | string

export interface UseClickOutsideOptions {
  /** Use capture phase so detection survives inner `stopPropagation`. @default true */
  capture?: boolean
  /** Touch movement (px) above which the gesture is treated as a scroll, not a tap. @default 30 */
  touchScrollThreshold?: number
  /** Treat focus moving to an iframe as an outside click. @default false */
  detectIframe?: boolean
  /** Elements (refs/getters or CSS selectors) whose clicks should be ignored. */
  ignore?: MaybeRefOrGetter<ClickOutsideIgnoreTarget[]>
  /** Use bounding-rect math instead of DOM containment (for native `<dialog>`). @default false */
  bounds?: boolean
}

export interface UseClickOutsideReturn {
  readonly isActive: Readonly<Ref<boolean>>
  readonly isPaused: Readonly<Ref<boolean>>
  pause: () => void
  resume: () => void
  stop: () => void
}

const NOOP_RETURN: UseClickOutsideReturn = {
  isActive: shallowReadonly(shallowRef(false)),
  isPaused: shallowReadonly(shallowRef(true)),
  pause: () => {},
  resume: () => {},
  stop: () => {},
}

/**
 * Detects clicks outside of the specified element(s).
 *
 * @param target Element ref(s)/getter(s) to detect clicks outside of.
 * @param handler Invoked when an outside click is detected.
 * @param options Configuration.
 */
export function useClickOutside(
  target: MaybeArray<ClickOutsideTarget>,
  handler: (event: PointerEvent | FocusEvent) => void,
  options: UseClickOutsideOptions = {},
): UseClickOutsideReturn {
  if (!IN_BROWSER) return NOOP_RETURN

  const {
    capture = true,
    touchScrollThreshold = 30,
    detectIframe = false,
    ignore = [],
    bounds = false,
  } = options

  const isPaused = shallowRef(false)
  const isActive = toRef(() => !isPaused.value)

  let initialTarget: EventTarget | null = null
  let startPosition = { x: 0, y: 0 }
  let startedOutsideBounds = false
  let cleanupPointerDown: (() => void) | undefined
  let cleanupPointerUp: (() => void) | undefined
  let cleanupBlur: (() => void) | undefined

  function getTargets(): HTMLElement[] {
    const sources = toArray(target)
    return sources
      .map(source => toValue(source))
      .filter((el): el is HTMLElement => !!el && isFunction(el.contains))
  }

  function resolveIgnoreTargets(): [string[], Element[]] {
    const ignoreTargets = toValue(ignore)
    if (ignoreTargets.length === 0) return [[], []]

    const selectors: string[] = []
    const elements: Element[] = []

    for (const ignoreTarget of ignoreTargets) {
      if (isString(ignoreTarget)) {
        selectors.push(ignoreTarget)
      } else {
        const ignoreEl = toValue(ignoreTarget)
        if (ignoreEl) elements.push(ignoreEl)
      }
    }

    return [selectors, elements]
  }

  function isIgnored(el: Element | null, selectors: string[], elements: Element[]): boolean {
    if (!el) return false

    for (const selector of selectors) {
      try {
        if (el.matches(selector) || !isNull(el.closest(selector))) return true
      } catch {
        // Invalid selector — silently ignore.
      }
    }

    for (const ignoreEl of elements) {
      if (ignoreEl === el || ignoreEl.contains(el)) return true
    }

    return false
  }

  function shouldIgnore(path: EventTarget[]): boolean {
    const [selectors, elements] = resolveIgnoreTargets()
    if (selectors.length === 0 && elements.length === 0) return false

    return path.some(node => isElement(node) && isIgnored(node, selectors, elements))
  }

  function isOutside(eventTarget: EventTarget | null): boolean {
    if (!eventTarget) return false
    if (!(eventTarget instanceof Node)) return false

    const targets = getTargets()
    if (targets.length === 0) return false

    return targets.every((el) => {
      if (isNullOrUndefined(el) || !isFunction(el.contains)) return false
      return el !== eventTarget && !el.contains(eventTarget)
    })
  }

  function isOutsideBounds(x: number, y: number): boolean {
    const targets = getTargets()
    if (targets.length === 0) return false

    return targets.every((el) => {
      const { left, right, top, bottom } = el.getBoundingClientRect()
      return x < left || x > right || y < top || y > bottom
    })
  }

  function isValidTarget(eventTarget: EventTarget | null): eventTarget is Element {
    if (!isElement(eventTarget)) return false
    if (!eventTarget.isConnected) return false
    return true
  }

  function onPointerDown(event: PointerEvent) {
    if (isPaused.value) return
    if (event.defaultPrevented) return

    initialTarget = event.composedPath()[0] ?? event.target
    startPosition = { x: event.clientX, y: event.clientY }
    startedOutsideBounds = bounds ? isOutsideBounds(event.clientX, event.clientY) : false
  }

  function onPointerUp(event: PointerEvent) {
    if (isPaused.value) return
    if (event.defaultPrevented) return
    if (!initialTarget) return

    const pointerdownTarget = initialTarget
    initialTarget = null

    if (!isValidTarget(pointerdownTarget)) return

    const path = event.composedPath()
    const pointerupTarget = path[0] ?? event.target

    if (event.pointerType === 'touch') {
      const dx = Math.abs(event.clientX - startPosition.x)
      const dy = Math.abs(event.clientY - startPosition.y)
      if (dx >= touchScrollThreshold || dy >= touchScrollThreshold) return
    }

    const clickIsOutside = bounds
      ? startedOutsideBounds && isOutsideBounds(event.clientX, event.clientY)
      : isOutside(pointerdownTarget) && isOutside(pointerupTarget)

    if (clickIsOutside && !shouldIgnore(path)) {
      handler(event)
    }
  }

  function onBlur(event: FocusEvent) {
    if (isPaused.value) return
    if (event.defaultPrevented) return

    if (document.activeElement instanceof HTMLIFrameElement) {
      const iframeIsOutside = getTargets().every(el => !el.contains(document.activeElement))
      const [selectors, elements] = resolveIgnoreTargets()

      if (iframeIsOutside && !isIgnored(document.activeElement, selectors, elements)) {
        handler(event)
      }
    }
  }

  function setup() {
    cleanupPointerDown = useDocumentEventListener('pointerdown', onPointerDown, capture)
    cleanupPointerUp = useDocumentEventListener('pointerup', onPointerUp, capture)

    if (!detectIframe) return

    cleanupBlur = useWindowEventListener('blur', onBlur, capture)
  }

  function cleanup() {
    cleanupPointerDown?.()
    cleanupPointerUp?.()
    cleanupBlur?.()
    cleanupPointerDown = undefined
    cleanupPointerUp = undefined
    cleanupBlur = undefined
  }

  function pause() {
    if (isPaused.value) return
    isPaused.value = true
    initialTarget = null
    cleanup()
  }

  function resume() {
    if (!isPaused.value) return
    isPaused.value = false
    setup()
  }

  function stop() {
    isPaused.value = true
    initialTarget = null
    cleanup()
  }

  setup()

  onScopeDispose(stop, true)

  return {
    isActive: shallowReadonly(isActive),
    isPaused: shallowReadonly(isPaused),
    pause,
    resume,
    stop,
  }
}
