/**
 * @module menu/useMenuControl
 *
 * @remarks
 * Keyboard, focus and ARIA of a menu button and its menu (APG Menu Button +
 * Menu), handed out as attribute bags: `triggerAttrs` for the button that
 * opens the menu, `menuAttrs` for the `role="menu"` element, `getItemAttrs()`
 * for each item. The bags carry roles, ids, `aria-*` and handlers — never a
 * class or a `data-*` — so any markup that binds them behaves as `<MMenu>`.
 *
 * - Trigger: a click toggles; ArrowDown opens on the first item, ArrowUp on
 *   the last. Enter and Space reach a native button as a click.
 * - Focus: on open the first item takes it; Escape and choosing an item give
 *   it back to where it was before the menu opened (the trigger). A press
 *   outside leaves it where the press put it.
 * - Keys: arrows wrap, Home / End jump, a printable key jumps to the next item
 *   whose text starts with it. Tab closes the menu and lets focus move on
 *   from the trigger, as if the menu sat right after it; Shift+Tab lands on
 *   the trigger.
 * - Items are found by their role and are all out of the Tab order: focus
 *   moves between them by script, and Tab leaves the menu. A disabled item
 *   (`aria-disabled`) stays in the arrow order but does nothing.
 *
 * A menu that hosts another composite (a listbox) leaves its focus and keys
 * to that widget.
 */
import { computed, nextTick, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { isPrintableKey, useTypeahead } from '#kit/composables/dropdown/useTypeahead'

export type MenuItemRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'

export interface MenuItemState {
  /** @default 'menuitem' */
  role?: MenuItemRole
  /** Checked state of a `menuitemcheckbox` / `menuitemradio`; a `menuitem` has none. */
  checked?: boolean
  /** Stays in the arrow order, does nothing. */
  disabled?: boolean
}

export interface MenuTriggerAttrs {
  'id': string
  'aria-haspopup': 'menu'
  'aria-expanded': 'true' | 'false'
  'aria-controls': string | undefined
  'onClick': () => void
  'onKeydown': (event: KeyboardEvent) => void
}

export interface MenuAttrs {
  'id': string
  'role': 'menu'
  'tabindex': -1
  'aria-labelledby': string | undefined
  'onKeydown': (event: KeyboardEvent) => void
  /** Capture phase: a disabled item's click never reaches the consumer. */
  'onClickCapture': (event: MouseEvent) => void
}

export interface MenuItemAttrs {
  'role': MenuItemRole
  'tabindex': -1
  'aria-checked': 'true' | 'false' | undefined
  'aria-disabled': 'true' | undefined
}

export interface UseMenuControlOptions {
  /** Open state: the trigger toggles it, Escape, Tab and Shift+Tab close it. */
  open: Ref<boolean>
  /** id of the trigger, which names the menu. */
  triggerId: string
  /** id of the `role="menu"` element, which the trigger controls. */
  menuId: () => string
  /** The `role="menu"` element, once rendered. */
  surface: () => HTMLElement | null
  /** Where focus returns when nothing focusable had it before opening (Safari does not focus a clicked button). */
  fallbackReturn: () => HTMLElement | null
  /** Whether the menu is in the document: `aria-controls` names only an element that exists. @default the open state */
  rendered?: () => boolean
  /** What names the menu; `undefined` leaves it to the consumer. @default the trigger's id */
  labelledBy?: () => string | undefined
}

export interface UseMenuControlReturn {
  triggerAttrs: ComputedRef<MenuTriggerAttrs>
  menuAttrs: ComputedRef<MenuAttrs>
  getItemAttrs: (item?: MenuItemState) => MenuItemAttrs
  /** The menu holds another composite (a listbox), which keeps its own focus and keys. */
  hostsForeignWidget: () => boolean
}

const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'

type Edge = 'first' | 'last'

const TRIGGER_KEYS: Record<string, Edge> = { ArrowDown: 'first', ArrowUp: 'last' }

const isDisabled = (el: Element) => el.getAttribute('aria-disabled') === 'true'

/** The bag of one menu item. Pure: an item outside a menu gets the same. */
export function menuItemAttrs({ role = 'menuitem', checked = false, disabled = false }: MenuItemState = {}): MenuItemAttrs {
  return {
    'role': role,
    'tabindex': -1,
    'aria-checked': role === 'menuitem' ? undefined : String(checked) as 'true' | 'false',
    'aria-disabled': disabled ? 'true' : undefined,
  }
}

export function useMenuControl(options: UseMenuControlOptions): UseMenuControlReturn {
  const typeahead = useTypeahead()
  let returnTarget: HTMLElement | null = null
  let openingEdge: Edge = 'first'

  function hostsForeignWidget(): boolean {
    return !!options.surface()?.querySelector('[role="listbox"], [role="option"]')
  }

  function items(): HTMLElement[] {
    const surface = options.surface()
    if (!surface || hostsForeignWidget()) return []
    return Array.from(surface.querySelectorAll<HTMLElement>(ITEMS))
  }

  function focusAt(list: HTMLElement[], index: number) {
    list[index]?.focus()
  }

  function focusEdge(edge: Edge) {
    const list = items()
    focusAt(list, edge === 'last' ? list.length - 1 : 0)
  }

  function currentIndex(list: HTMLElement[]): number {
    return list.findIndex(el => el === document.activeElement)
  }

  function rememberFocus() {
    const active = document.activeElement as HTMLElement | null
    returnTarget = active && active !== document.body ? active : null
  }

  function returnFocus() {
    const target = returnTarget ?? options.fallbackReturn()
    target?.focus()
  }

  function close() {
    options.open.value = false
  }

  function toggle() {
    options.open.value = !options.open.value
  }

  function onClosing() {
    const surface = options.surface()
    const active = document.activeElement
    const focusInside = !!surface && !!active && surface.contains(active)
    if (focusInside || active === document.body) returnFocus()
  }

  watch(options.open, async (open) => {
    if (!open) {
      onClosing()
      return
    }
    rememberFocus()
    await nextTick()
    const edge = openingEdge
    openingEdge = 'first'
    if (options.open.value && !hostsForeignWidget()) focusEdge(edge)
  }, { flush: 'sync' })

  function onTriggerKeydown(event: KeyboardEvent) {
    const edge = TRIGGER_KEYS[event.key]
    if (!edge) return
    event.preventDefault()
    if (options.open.value) {
      focusEdge(edge)
      return
    }
    openingEdge = edge
    options.open.value = true
  }

  function onTab(event: KeyboardEvent) {
    // Shift+Tab lands on the trigger itself; Tab moves on from it with the
    // browser's own step, so the menu behaves as if it followed the trigger.
    if (event.shiftKey) event.preventDefault()
    returnFocus()
    close()
  }

  function typeTo(list: HTMLElement[], character: string) {
    const rows = list.map(el => ({ title: el.textContent?.trim() ?? '', disabled: false }))
    const index = typeahead.find(character, rows, currentIndex(list))
    if (index !== -1) focusAt(list, index)
  }

  const NAVIGATION: Record<string, (list: HTMLElement[]) => void> = {
    ArrowDown: (list) => {
      const current = currentIndex(list)
      focusAt(list, current < 0 ? 0 : (current + 1) % list.length)
    },
    ArrowUp: (list) => {
      const current = currentIndex(list)
      focusAt(list, current <= 0 ? list.length - 1 : current - 1)
    },
    Home: list => focusAt(list, 0),
    End: list => focusAt(list, list.length - 1),
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      returnFocus()
      close()
      return
    }
    if (event.key === 'Tab') {
      onTab(event)
      return
    }

    const list = items()
    if (!list.length) return

    const navigate = NAVIGATION[event.key]
    if (navigate) {
      event.preventDefault()
      navigate(list)
    } else if (isPrintableKey(event) && !(event.key === ' ' && !typeahead.isTyping())) {
      event.preventDefault()
      typeTo(list, event.key)
    }
  }

  function onClickCapture(event: MouseEvent) {
    const item = (event.target as Element | null)?.closest(ITEMS)
    if (!item || !isDisabled(item)) return
    event.preventDefault()
    event.stopPropagation()
  }

  const triggerAttrs = computed<MenuTriggerAttrs>(() => ({
    'id': options.triggerId,
    'aria-haspopup': 'menu',
    'aria-expanded': options.open.value ? 'true' : 'false',
    'aria-controls': (options.rendered?.() ?? options.open.value) ? options.menuId() : undefined,
    'onClick': toggle,
    'onKeydown': onTriggerKeydown,
  }))

  const menuAttrs = computed<MenuAttrs>(() => ({
    'id': options.menuId(),
    'role': 'menu',
    'tabindex': -1,
    'aria-labelledby': options.labelledBy ? options.labelledBy() : options.triggerId,
    'onKeydown': onKeydown,
    'onClickCapture': onClickCapture,
  }))

  return { triggerAttrs, menuAttrs, getItemAttrs: menuItemAttrs, hostsForeignWidget }
}
