/**
 * @module layout/registry
 *
 * @remarks
 * Ordered registry of layout items (DOM order = carving priority).
 *
 * Items register from `watchEffect`s, so every read of the backing reactive
 * array inside `register`/`unregister` goes through `toRaw` — otherwise each
 * item's effect would track the whole array and any registration would
 * re-trigger every other effect (mutual splice ping-pong → infinite loop).
 * Consumers (the css computed) read the reactive `items` and track normally.
 */
import { reactive, toRaw } from 'vue'
import type { LayoutKind } from './carve'

/**
 * `kind`/`size`/`sticky` may be live getters (`useLayoutItem` registers
 * getter-backed snapshots): every read returns the current value, so the css
 * computed sees children contributions even on SSR, where no `watchEffect`
 * re-registration happens.
 */
export interface LayoutItem {
  id: string
  kind: LayoutKind
  /** Resolved CSS size expression (explicit token or children contributions). */
  size?: string
  sticky?: boolean
}

export interface LayoutRegistry {
  /** Reactive, ordered. Mutated only through the methods below. */
  items: LayoutItem[]
  register: (item: LayoutItem, getEl: () => Element | null) => void
  unregister: (id: string) => void
  /** Re-inserts a late-mounted item at its real DOM position. */
  reorder: (id: string) => void
  /** After hydration `reorder` starts doing real DOM lookups. */
  markHydrated: () => void
  /** Root element of a registered item (client, after mount). */
  getEl: (id: string) => Element | null
}

const sameItem = (a: LayoutItem, b: LayoutItem) =>
  a.id === b.id && a.kind === b.kind && a.size === b.size && a.sticky === b.sticky

export function createLayoutRegistry(): LayoutRegistry {
  const items = reactive<LayoutItem[]>([])
  const els = new Map<string, () => Element | null>()
  let hydrated = false

  const register = (item: LayoutItem, getEl: () => Element | null) => {
    const raw = toRaw(items)
    const index = raw.findIndex(existing => existing.id === item.id)

    if (index >= 0) {
      if (import.meta.dev && els.get(item.id) !== getEl) {
        console.warn(
          `[m-layout] Duplicate layout item id "${item.id}" — previous registration is replaced. Pass an explicit unique id.`,
        )
      }
      els.set(item.id, getEl)

      const previous = raw[index]
      if (previous && sameItem(previous, item)) return

      items.splice(index, 1, item)
      return
    }

    els.set(item.id, getEl)
    items.push(item)
  }

  const unregister = (id: string) => {
    const index = toRaw(items).findIndex(item => item.id === id)
    if (index >= 0) items.splice(index, 1)
    els.delete(id)
  }

  // Initial render registers in setup order (= DOM order). Only items mounted
  // after hydration need a real DOM-position lookup.
  const reorder = (id: string) => {
    if (!hydrated) return

    const el = els.get(id)?.()
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return

    const raw = toRaw(items)
    const index = raw.findIndex(item => item.id === id)
    if (index < 0) return

    let insertAt = raw.length

    for (let i = 0; i < raw.length; i++) {
      if (i === index) continue

      const other = els.get(raw[i]?.id ?? '')?.()
      if (!other || other.nodeType !== Node.ELEMENT_NODE) continue

      if (el.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) {
        insertAt = i
        break
      }
    }

    if (insertAt === index || insertAt === index + 1) return

    const removed = items.splice(index, 1)
    const record = removed[0]
    if (!record) return

    items.splice(insertAt > index ? insertAt - 1 : insertAt, 0, record)
  }

  return {
    items,
    register,
    unregister,
    reorder,
    markHydrated: () => {
      hydrated = true
    },
    getEl: id => els.get(id)?.() ?? null,
  }
}
