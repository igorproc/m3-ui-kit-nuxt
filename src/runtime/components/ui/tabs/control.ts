import { computed, nextTick, onMounted, shallowRef, toValue, watch } from 'vue'
import type { Ref } from 'vue'
import { createSingle } from '#kit/composables/registry/createSingle'
import type { SingleTicketInput } from '#kit/composables/registry/createSingle'
import type { TabValue } from '#kit/composables/tabs/useTabs'

type Target = 'next' | 'prev' | 'first' | 'last'

const EDGE_KEYS: Record<string, 'first' | 'last'> = { Home: 'first', End: 'last' }

/**
 * Selection and keyboard of a tablist: one mandatory selected tab bound to the
 * model, arrows with automatic activation, Home / End, focus moved straight to
 * the tab element (a remembered focus target would ignore a repeated one).
 */
export function useTabsControl(modelValue: Ref<TabValue | null>) {
  const sel = createSingle<SingleTicketInput<TabValue>>({ mandatory: true })
  const selectedValue = computed(() => sel.selectedValue.value ?? null)
  const elements = new Map<TabValue, () => HTMLElement | null>()

  // Tabs register in their own setup, before they render, so a preset selected
  // right there is already in the server HTML. Until the tabs of the first
  // render have mounted, the preset may still be on its way, so no earlier tab
  // is forced in its place; after that, a model no tab matches falls back to the
  // first enabled one.
  const mounted = shallowRef(false)

  function register(input?: Partial<SingleTicketInput<TabValue>>) {
    const ticket = sel.register(input)
    if (modelValue.value !== null && ticket.value === modelValue.value) sel.select(ticket.id)
    if (modelValue.value === null || mounted.value) sel.mandate()
    return ticket
  }

  onMounted(() => {
    mounted.value = true
    sel.mandate()
  })

  watch(modelValue, (value) => {
    if (value !== null && value !== sel.selectedValue.value) sel.apply([value])
  })

  watch(sel.selectedValue, (value) => {
    if (value !== undefined && value !== modelValue.value) modelValue.value = value
  })

  function registerElement(value: TabValue, element: () => HTMLElement | null) {
    elements.set(value, element)
    return () => {
      if (elements.get(value) === element) elements.delete(value)
    }
  }

  function move(target: Target) {
    const tickets = sel.values().filter(ticket => !toValue(ticket.disabled))
    if (tickets.length === 0) return

    const index = tickets.findIndex(ticket => ticket.id === sel.selectedId.value)
    const last = tickets.length - 1
    const next = target === 'first'
      ? 0
      : target === 'last'
        ? last
        : target === 'next'
          ? (index < 0 ? 0 : (index + 1) % tickets.length)
          : (index <= 0 ? last : index - 1)

    const ticket = tickets[next]
    if (!ticket) return

    sel.select(ticket.id)
    const value = ticket.value as TabValue
    nextTick(() => elements.get(value)?.()?.focus())
  }

  // The next tab follows the reading direction: in RTL it lies to the left.
  function keyTarget(event: KeyboardEvent): Target | undefined {
    if (EDGE_KEYS[event.key]) return EDGE_KEYS[event.key]
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return undefined

    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl'
    return (event.key === 'ArrowRight') !== rtl ? 'next' : 'prev'
  }

  function onKeydown(event: KeyboardEvent) {
    const target = keyTarget(event)
    if (!target) return

    event.preventDefault()
    move(target)
  }

  return { sel, selectedValue, register, registerElement, onKeydown }
}
