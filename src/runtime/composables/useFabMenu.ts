/**
 * @module useFabMenu
 *
 * @remarks
 * Behaviour of `<MFabMenu>` (any activator: the default FAB or one supplied
 * through `#activator`): the open state, the disclosure ARIA pattern and the
 * keyboard. It hands out attribute bags and no classes.
 *
 * Disclosure, as in Compose: the activator carries `aria-expanded` and
 * `aria-controls`; the actions stay ordinary buttons in the tab order, the
 * activator first, so Tab (or ArrowDown) leads to the top action. Escape and a
 * chosen action close the menu and put focus back on the activator.
 *
 * @example
 * ```ts
 * const { isOpen, toggle, select, activatorAttrs, listAttrs } = useFabMenu<MFabMenuItem>({
 *   disabled: () => props.disabled,
 *   open: defineModel<boolean>('open', { default: false }),
 *   activator: () => anchor.value?.querySelector('button'),
 *   list: () => list.value,
 * })
 * ```
 */
import { computed, nextTick, ref, toValue, useId } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

export interface FabMenuItemBase {
  action?: () => void
}

export interface UseFabMenuOptions {
  /** When truthy, `open`/`toggle` are no-ops. @default false */
  disabled?: MaybeRefOrGetter<boolean>
  /** The open state to drive (e.g. `v-model:open`); an internal one otherwise. */
  open?: Ref<boolean>
  /** Whether there is anything to show; an empty menu does not open. @default true */
  hasContent?: MaybeRefOrGetter<boolean>
  /** The focusable activator, where focus returns on close. */
  activator?: () => HTMLElement | null | undefined
  /** The element holding the actions, where ArrowDown sends focus. */
  list?: () => HTMLElement | null | undefined
}

export interface UseFabMenuReturn<TItem extends FabMenuItemBase> {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
  toggle: () => void
  /** Run the item's `action`, emit `select`, close and return focus to the activator. */
  select: (item: TItem, emit: (event: 'select', item: TItem) => void) => void
  /** `id` of the element holding the actions. */
  listId: string
  /** Disclosure state and keyboard of the activator. */
  activatorAttrs: ComputedRef<Record<string, unknown>>
  /** `id` and keyboard of the element holding the actions. */
  listAttrs: ComputedRef<Record<string, unknown>>
}

export function useFabMenu<TItem extends FabMenuItemBase>(
  options: UseFabMenuOptions = {},
): UseFabMenuReturn<TItem> {
  const isOpen = options.open ?? ref(false)
  const listId = `fab-menu-${useId()}`

  const canOpen = () => !toValue(options.disabled) && (toValue(options.hasContent) ?? true)

  function open() {
    if (canOpen()) isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    if (isOpen.value) close()
    else open()
  }

  async function closeAndRestoreFocus() {
    close()
    await nextTick()
    options.activator?.()?.focus()
  }

  async function focusTopAction() {
    open()
    if (!isOpen.value) return

    await nextTick()
    options.list?.()?.querySelector<HTMLElement>('button:not(:disabled)')?.focus()
  }

  function select(item: TItem, emit: (event: 'select', item: TItem) => void) {
    item.action?.()
    emit('select', item)
    void closeAndRestoreFocus()
  }

  function onEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !isOpen.value) return

    event.preventDefault()
    void closeAndRestoreFocus()
  }

  const activatorAttrs = computed<Record<string, unknown>>(() => ({
    'aria-expanded': String(isOpen.value),
    'aria-controls': isOpen.value ? listId : undefined,
    'onKeydown': (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        void focusTopAction()
        return
      }
      onEscape(event)
    },
  }))

  const listAttrs = computed<Record<string, unknown>>(() => ({
    id: listId,
    onKeydown: onEscape,
  }))

  return {
    isOpen,
    open,
    close,
    toggle,
    select,
    listId,
    activatorAttrs,
    listAttrs,
  }
}
