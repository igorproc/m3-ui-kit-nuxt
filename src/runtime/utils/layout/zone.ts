/**
 * @module layout/zone
 *
 * @remarks
 * State behind the public layout context zone (`useLayoutZone()`): the
 * cumulative edges, the offset of the active scroller and the scroll lock.
 */
import { onMounted, readonly, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { useEventListener } from '#kit/composables/useEventListener'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import type { LayoutItem, LayoutRegistry } from './registry'
import { createScrollLock } from './scroll'
import type { ScrollLock } from './scroll'

/** CSS-выражения суммарных краёв; значения живут в `--m3-layout-inset-*` (генерирует carve). */
export const LAYOUT_INSETS = {
  top: 'var(--m3-layout-inset-top, 0px)',
  bottom: 'var(--m3-layout-inset-bottom, 0px)',
  start: 'var(--m3-layout-inset-inline-start, 0px)',
  end: 'var(--m3-layout-inset-inline-end, 0px)',
} as const

/**
 * Контекстная зона лейаута (layoutContextZone) — публичный rich-контекст,
 * доступный любому потомку `<m-layout>`; `null` вне лейаута.
 */
export interface LayoutZone {
  layoutId: string
  /** Реестр зон (read-only, в DOM-порядке). */
  items: Readonly<LayoutItem[]>
  /** Суммарные края лейаута как CSS-выражения; боковые — логические (`start`/`end`). */
  insets: typeof LAYOUT_INSETS
  /** Скролл активного скроллера: документ или `m-layout-main` в `full-height`. */
  windowY: Readonly<Ref<number>>
  /** Реф-счётный лок скролла: два потребителя → один физический лок. */
  scrollLock: ScrollLock
  /** Готовые офсеты для `position: sticky` внутри лейаута. */
  sticky: { top: string, bottom: string }
}

/** Builds the zone of one `<m-layout>`; `fullHeight` says `main` is the scroller. */
export function createLayoutZone(layoutId: string, registry: LayoutRegistry, fullHeight: Readonly<Ref<boolean>>): LayoutZone {
  const { items } = registry
  const mainEl = ref<HTMLElement | null>(null)

  const syncMainEl = () => {
    const main = items.find(item => item.kind === 'main')
    const el = main ? registry.getEl(main.id) : null
    mainEl.value = el instanceof HTMLElement ? el : null
  }

  const windowY = ref(0)

  // A page restored or opened at an anchor is scrolled before any event fires.
  const readScroll = () => {
    windowY.value = fullHeight.value ? mainEl.value?.scrollTop ?? 0 : window.scrollY
  }

  onMounted(() => {
    syncMainEl()
    readScroll()
  })
  watch(items, syncMainEl, { flush: 'post' })
  watch([mainEl, fullHeight], readScroll, { flush: 'post' })

  // Слушаем оба источника: события шлёт только реально скроллящийся,
  // поэтому режим различать не нужно
  if (IN_BROWSER) {
    useGlobalListener('window', 'scroll', () => {
      windowY.value = window.scrollY
    }, { passive: true })

    useEventListener(() => mainEl.value, 'scroll', (event) => {
      windowY.value = (event.target as HTMLElement).scrollTop
    }, { passive: true })
  }

  // Only the active scroller is frozen. In page-scroll mode main is no scroll
  // container, and `overflow: hidden` would make it one: every sticky element
  // inside it would re-anchor to main and jump while the lock holds.
  const scrollLock = createScrollLock(() => [
    IN_BROWSER ? document.documentElement : null,
    fullHeight.value ? mainEl.value : null,
  ])

  return {
    layoutId,
    items,
    insets: LAYOUT_INSETS,
    windowY: readonly(windowY),
    scrollLock,
    sticky: { top: LAYOUT_INSETS.top, bottom: LAYOUT_INSETS.bottom },
  }
}
