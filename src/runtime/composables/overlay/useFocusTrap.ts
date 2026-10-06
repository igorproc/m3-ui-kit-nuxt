/**
 * @module overlay/useFocusTrap
 *
 * @remarks
 * Keeps keyboard focus inside an element while active.
 *
 * `showModal()` already makes the rest of the page `inert`, but Tab from the
 * last focusable still leaves the dialog for the browser chrome instead of
 * wrapping to the first one, and a non-modal surface (`background:
 * 'interactive'`) has no `inert` at all. This composable covers both: it loops
 * Tab / Shift+Tab, moves focus in on activation and returns it on deactivation.
 *
 * @example
 * ```ts
 * const trap = useFocusTrap(panel, { initialFocus: '[autofocus]' })
 * trap.activate()
 * // …
 * trap.deactivate()
 * ```
 */
import { nextTick, onScopeDispose, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'

export interface UseFocusTrapOptions {
  /** Where focus goes on activation: a selector inside the target, an element, or `false` to leave it. @default first focusable, else the target */
  initialFocus?: MaybeRefOrGetter<string | HTMLElement | false | undefined>
  /** Return focus to the element that had it before activation. @default true */
  returnFocus?: MaybeRefOrGetter<boolean>
  /** Wrap Tab from the last focusable to the first (and back with Shift). @default true */
  loop?: MaybeRefOrGetter<boolean>
  /** Activate as soon as the target element exists. @default false */
  immediate?: boolean
}

export interface UseFocusTrapReturn {
  isActive: Readonly<Ref<boolean>>
  activate: () => void
  deactivate: () => void
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Tab stops in DOM order. `tabindex="-1"` is skipped — a roving-tabindex widget
 * (menu, listbox) exposes one stop and moves focus among its items itself.
 */
export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter(el => el.getAttribute('tabindex') !== '-1' && !el.closest('[inert]'))
}

function resolveInitialFocus(root: HTMLElement, initial: string | HTMLElement | false | undefined): HTMLElement | null {
  if (initial === false) return null
  if (initial instanceof HTMLElement) return initial
  if (typeof initial === 'string') return root.querySelector<HTMLElement>(initial)
  return getFocusableElements(root)[0] ?? root
}

export function useFocusTrap(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseFocusTrapOptions = {},
): UseFocusTrapReturn {
  const isActive = shallowRef(false)
  let previouslyFocused: HTMLElement | null = null
  let boundRoot: HTMLElement | null = null

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !boundRoot || !(toValue(options.loop) ?? true)) return

    const focusables = getFocusableElements(boundRoot)
    if (!focusables.length) {
      event.preventDefault()
      return
    }

    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    const active = document.activeElement

    if (event.shiftKey && (active === first || active === boundRoot)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function activate() {
    const root = toValue(target)
    if (!IN_BROWSER || !root || isActive.value) return

    previouslyFocused = document.activeElement as HTMLElement | null
    boundRoot = root
    root.addEventListener('keydown', onKeydown)
    isActive.value = true

    if (!root.contains(document.activeElement)) {
      const initial = resolveInitialFocus(root, toValue(options.initialFocus))
      if (initial === root && !root.hasAttribute('tabindex')) root.tabIndex = -1
      initial?.focus()
    }
  }

  function deactivate() {
    if (!isActive.value) return

    boundRoot?.removeEventListener('keydown', onKeydown)
    boundRoot = null
    isActive.value = false

    if (toValue(options.returnFocus) ?? true) {
      const returnTo = previouslyFocused
      nextTick(() => returnTo?.focus?.())
    }
    previouslyFocused = null
  }

  if (options.immediate) {
    watch(() => toValue(target), (el) => {
      if (el) activate()
    }, { immediate: true, flush: 'post' })
  }

  onScopeDispose(deactivate)

  return { isActive, activate, deactivate }
}
