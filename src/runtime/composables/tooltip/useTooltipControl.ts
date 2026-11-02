/**
 * @module tooltip/useTooltipControl
 *
 * @remarks
 * Behaviour of a tooltip, apart from its look: when it shows and hides, and
 * how the trigger is described by it.
 *
 * - Shows on hover and on keyboard focus (`:focus-visible`); a click focuses a
 *   button too, and a tooltip opened by it would outstay the pointer. On
 *   touch, a long press shows it for a moment; the click and the context menu
 *   that follow the press are swallowed.
 * - Hides on focus leaving at once, on the pointer leaving after a grace
 *   period long enough to reach the tooltip (WCAG 1.4.13, hoverable), and on
 *   Escape without moving focus. One tooltip shows at a time.
 * - Never shows without content or while disabled.
 * - The trigger is described by the tooltip from mount on, not only while it
 *   shows: a screen reader reads the description with the focused control.
 *   `triggerProps` carries the link for the consumer to bind; a trigger that
 *   does not take it is linked on its first focusable element. Nothing links
 *   before mount (the server renders no surface) or while there is no content.
 *
 * Window listeners exist only while the tooltip shows.
 */
import { computed, onMounted, onScopeDispose, onUpdated, shallowRef, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { useTimer } from '#kit/composables/useTimer'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { getFocusableElements } from '#kit/composables/overlay/useFocusTrap'
import { IN_BROWSER } from '#kit/shared/constants/globals'

/** M3 (`TooltipBox`): a long press that shows a tooltip lasts this long. */
const LONG_PRESS_MS = 500
/** M3 (`BasicTooltipDefaults.TooltipDuration`): how long a touch-shown tooltip stays. */
const TOUCH_SHOW_MS = 1500
/** Announces a tooltip that shows, so the one showing before hides. */
const SHOW_EVENT = 'ui-tooltip-show'

export interface UseTooltipControlOptions {
  /** Id of the tooltip surface. */
  id: string
  /** Whether the tooltip shows (`v-model:open`). */
  open: Ref<boolean>
  /** Element holding the trigger slot. */
  trigger: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** Pointer grace period before hiding, in milliseconds. */
  hideDelay: number
  disabled: () => boolean
  hasContent: () => boolean
}

export interface UseTooltipControlReturn {
  show: () => void
  hide: () => void
  scheduleHide: () => void
  cancelHide: () => void
  onFocusIn: (event: FocusEvent) => void
  onPointerEnter: (event: PointerEvent) => void
  /** Shows on hover; the compatibility mouse events a tap leaves behind do not count. */
  onMouseEnter: () => void
  onPointerDown: (event: PointerEvent) => void
  onPointerEnd: () => void
  /** Bound in the capture phase: the click and context menu after a long press. */
  onAfterLongPress: (event: Event) => void
  /** Bound by the consumer on the focusable trigger; empty until the surface exists and has content. */
  triggerProps: ComputedRef<{ 'aria-describedby'?: string }>
}

function isKeyboardFocus(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  try {
    return target.matches(':focus-visible')
  } catch {
    // An engine without `:focus-visible` cannot tell keyboard from pointer focus.
    return true
  }
}

const describedBy = (el: HTMLElement) => (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)

function describe(el: HTMLElement, id: string) {
  const ids = describedBy(el)
  if (!ids.includes(id)) el.setAttribute('aria-describedby', [...ids, id].join(' '))
}

function undescribe(el: HTMLElement, id: string) {
  const ids = describedBy(el).filter(other => other !== id)
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '))
  else el.removeAttribute('aria-describedby')
}

export function useTooltipControl(options: UseTooltipControlOptions): UseTooltipControlReturn {
  const { open } = options
  const hideTimer = useTimer(() => hide(), { duration: options.hideDelay })
  const pressTimer = useTimer(() => showByPress(), { duration: LONG_PRESS_MS })
  const touchTimer = useTimer(() => hide(), { duration: TOUCH_SHOW_MS })
  let pressed = false
  let lastPointerType = ''

  function show() {
    hideTimer.stop()
    if (options.disabled() || !options.hasContent()) return
    open.value = true
  }

  function hide() {
    hideTimer.stop()
    touchTimer.stop()
    open.value = false
  }

  function showByPress() {
    pressed = true
    show()
    touchTimer.start()
  }

  function onFocusIn(event: FocusEvent) {
    if (isKeyboardFocus(event.target)) show()
  }

  function onPointerEnter(event: PointerEvent) {
    lastPointerType = event.pointerType
  }

  function onMouseEnter() {
    if (lastPointerType !== 'touch') show()
  }

  function onPointerDown(event: PointerEvent) {
    lastPointerType = event.pointerType
    pressed = false
    if (event.pointerType === 'touch') pressTimer.start()
  }

  function onPointerEnd() {
    pressTimer.stop()
  }

  function onAfterLongPress(event: Event) {
    if (!pressed) return
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'click') pressed = false
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') hide()
  }

  function onOtherShown(event: Event) {
    if ((event as CustomEvent<string>).detail !== options.id) hide()
  }

  let stopListening: Array<() => void> = []

  function listen(active: boolean) {
    stopListening.forEach(stop => stop())
    stopListening = active
      ? [
          useGlobalListener('window', 'keydown', event => onKeydown(event as KeyboardEvent)),
          useGlobalListener('window', SHOW_EVENT, onOtherShown),
        ]
      : []
  }

  watch(open, (value) => {
    listen(value)
    if (value && IN_BROWSER) window.dispatchEvent(new CustomEvent(SHOW_EVENT, { detail: options.id }))
  })

  watch(options.disabled, (disabled) => {
    if (disabled) hide()
  })

  onScopeDispose(() => listen(false))

  const isMounted = shallowRef(false)
  const isLinked = computed(() => isMounted.value && options.hasContent())

  const triggerProps = computed(() => (isLinked.value ? { 'aria-describedby': options.id } : {}))

  function linkTrigger() {
    const root = toValue(options.trigger)
    if (!root) return
    if (!isLinked.value) {
      root.querySelectorAll<HTMLElement>('[aria-describedby]').forEach(el => undescribe(el, options.id))
      return
    }
    const target = getFocusableElements(root)[0]
    if (target) describe(target, options.id)
  }

  onMounted(() => {
    isMounted.value = true
    linkTrigger()
  })
  onUpdated(linkTrigger)

  return {
    show,
    hide,
    scheduleHide: hideTimer.start,
    cancelHide: hideTimer.stop,
    onFocusIn,
    onPointerEnter,
    onMouseEnter,
    onPointerDown,
    onPointerEnd,
    onAfterLongPress,
    triggerProps,
  }
}
