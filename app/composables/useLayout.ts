/**
 * @module useLayout
 *
 * @remarks
 * Auto-layout engine v2 (carving). `m-layout` owns a registry of first-level
 * zones in DOM order; the pure carving module (`./layout/carve`) turns it into
 * `grid-template-*` per device range, injected via `useHead` — SSR-first,
 * zero CLS, no measurements.
 *
 * Registration rules (план: `.cursor/plans/auto-layout.md`):
 * - Only direct children of `m-layout` register (parent-component check —
 *   provide pierces wrappers, `instance.parent` does not).
 * - Deeper layout-aware components (e.g. `m-app-bar` inside `m-layout-header`)
 *   contribute their size to the hosting zone instead.
 * - DOM order drives carving priority — no manual `order`.
 */
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  readonly,
  ref,
  shallowReactive,
  unref,
  useId,
  watch,
  watchEffect,
  type Ref,
} from 'vue'
import { useRuntimeConfig } from '#app'
import { IN_BROWSER } from '~~/shared/constants/globals'
import { createContext } from '~~/shared/utils/createContext'
import { resolveBreakpoints } from '~~/shared/utils/resolveBreakpoints'
import { useEventListener } from './useEventListener'
import { useGlobalListener } from './useGlobalListener'
import {
  KIND_BY_AREA,
  ZONE_ATTR,
  buildLayoutCss,
  sanitizeAreaName,
} from './layout/carve'
import type { CarveItem, LayoutKind } from './layout/carve'
import { createLayoutRegistry } from './layout/registry'
import type { LayoutItem, LayoutRegistry } from './layout/registry'
import { createScrollLock, type ScrollLock } from './layout/scroll'

/** @deprecated v1 naming — use `LayoutKind` ('header'→'top', 'left'→'start', …). */
export type LayoutArea = 'header' | 'left' | 'main' | 'right' | 'footer' | string

interface LayoutProvide {
  /** uid of the owning `m-layout` instance — the parent-component check. */
  uid: number
  register: LayoutRegistry['register']
  unregister: LayoutRegistry['unregister']
  /** Re-inserts a late-mounted item at its real DOM position. */
  reorder: LayoutRegistry['reorder']
  items: LayoutItem[]
}

interface LayoutHostProvide {
  /** A nested component donates its size to the hosting zone; returns dispose. */
  contribute: (size: Ref<string | undefined>) => () => void
}

/** CSS-выражения суммарных краёв; значения живут в `--m3-layout-inset-*` (генерирует carve). */
const INSET_VARS = {
  top: 'var(--m3-layout-inset-top, 0px)',
  right: 'var(--m3-layout-inset-right, 0px)',
  bottom: 'var(--m3-layout-inset-bottom, 0px)',
  left: 'var(--m3-layout-inset-left, 0px)',
} as const

/**
 * Контекстная зона лейаута (layoutContextZone) — публичный rich-контекст,
 * доступный любому потомку `<m-layout>`; `null` вне лейаута.
 */
export interface LayoutZone {
  layoutId: string
  /** Реестр зон (read-only, в DOM-порядке). */
  items: Readonly<LayoutItem[]>
  /** Суммарные края лейаута как CSS-выражения (для FAB, snackbar, отступов). */
  insets: typeof INSET_VARS
  /** Скролл активного скроллера: документ или `m-layout-main` в `full-height`. */
  windowY: Readonly<Ref<number>>
  /** Реф-счётный лок скролла: два потребителя → один физический лок. */
  scrollLock: ScrollLock
  /** Готовые офсеты для `position: sticky` внутри лейаута. */
  sticky: { top: string, bottom: string }
}

// Nullable defaults: layout-aware components degrade to a no-op when used
// outside an `<m-layout>` (no throw).
const [useLayoutContext, provideLayoutContext] = createContext<LayoutProvide | null>('m3:layout', null)
const [useLayoutHostContext, provideLayoutHostContext] = createContext<LayoutHostProvide | null>('m3:layout-host', null)
const [useLayoutZoneContext, provideLayoutZoneContext] = createContext<LayoutZone | null>('m3:layout-zone', null)

/** Доступ к контекстной зоне лейаута из любого потомка (`null` вне `<m-layout>`). */
export const useLayoutZone = () => useLayoutZoneContext()

/** Token names (`--x`) become `var(--x)`; ready expressions pass through. */
function normalizeSize(token: string | undefined): string | undefined {
  if (!token) return undefined
  return token.startsWith('--') ? `var(${token})` : token
}

/**
 * Root-level: called inside `<m-layout>` to create the registry and the
 * per-range CSS payload for `useHead`.
 */
export function createLayout(layoutId: string) {
  const instance = getCurrentInstance()
  const registry = createLayoutRegistry()
  const { items } = registry

  onMounted(registry.markHydrated)

  provideLayoutContext({
    uid: instance?.uid ?? -1,
    register: registry.register,
    unregister: registry.unregister,
    reorder: registry.reorder,
    items,
  })

  // ── Контекстная зона (layoutContextZone) ──────────────────────────────────
  // Активный скроллер: в обычном режиме скроллит документ, в full-height —
  // m-layout-main. Слушаем оба источника: события шлёт только реально
  // скроллящийся, поэтому режим различать не нужно.
  const mainEl = ref<HTMLElement | null>(null)

  const syncMainEl = () => {
    const main = items.find(item => item.kind === 'main')
    const el = main ? registry.getEl(main.id) : null
    mainEl.value = el instanceof HTMLElement ? el : null
  }

  onMounted(syncMainEl)
  watch(items, syncMainEl, { flush: 'post' })

  const windowY = ref(0)

  if (IN_BROWSER) {
    useGlobalListener('window', 'scroll', () => {
      windowY.value = window.scrollY
    }, { passive: true })

    useEventListener(() => mainEl.value, 'scroll', (event) => {
      windowY.value = (event.target as HTMLElement).scrollTop
    }, { passive: true })
  }

  // Лочим все потенциальные скроллеры разом — замороженный не-скроллер
  // визуально no-op, зато scrollLock не зависит от режима лейаута
  const scrollLock = createScrollLock(() => [
    IN_BROWSER ? document.documentElement : null,
    mainEl.value,
  ])

  provideLayoutZoneContext({
    layoutId,
    items,
    insets: INSET_VARS,
    windowY: readonly(windowY),
    scrollLock,
    sticky: { top: INSET_VARS.top, bottom: INSET_VARS.bottom },
  })

  const runtimeConfig = useRuntimeConfig()
  const materialKit = runtimeConfig.public?.materialKit as { breakpoints?: Record<string, string | number> } | undefined
  const breakpoints = resolveBreakpoints(materialKit?.breakpoints)
  const tabletMin = breakpoints['tablet-xs']
  const desktopMin = breakpoints['desktop-xs']

  // Резолвится ПОСЛЕ рендера всего дерева (head-payload): размеры из вкладов
  // детей уже собраны — реестр отдаёт их live-геттерами, поэтому SSR-CSS
  // содержит и size-переменные, и sticky-правила без клиентского JS
  const css = computed(() => {
    const carveItems: CarveItem[] = items.map(item => ({
      id: item.id,
      kind: item.kind,
      size: item.size,
      sticky: item.sticky,
    }))

    return buildLayoutCss(layoutId, carveItems, [
      { range: 'mobile', itemsMedia: `only screen and (max-width: ${tabletMin - 1}px)` },
      { range: 'tablet', media: `only screen and (min-width: ${tabletMin}px) and (max-width: ${desktopMin - 1}px)` },
      { range: 'desktop', media: `only screen and (min-width: ${desktopMin}px)` },
    ])
  })

  return { css, items }
}

export interface UseLayoutItemOptions {
  id?: string | Ref<string>
  kind?: LayoutKind | Ref<LayoutKind | undefined>
  /** @deprecated v1 — use `kind` ('header'→'top', 'left'→'start', …). */
  area?: LayoutArea | Ref<LayoutArea>
  /** CSS var name (`--ui-app-bar-height-small`) or a size expression (`360rem`). */
  sizeToken?: string | Ref<string | undefined>
  /** The zone pins to the viewport — feeds sticky insets (план §2.6). */
  sticky?: boolean | Ref<boolean | undefined>
  /** Bypass the first-level parent check (escape hatch for wrapped `m-layout-item`). */
  force?: boolean
  /** @deprecated DOM order drives priority now; ignored. */
  order?: number
}

/**
 * Item-level: layout-aware components self-register when they are direct
 * children of `<m-layout>`; nested ones contribute their size to the hosting
 * zone; outside a layout everything degrades to a no-op.
 */
export function useLayoutItem(options: UseLayoutItemOptions = {}) {
  const layout = useLayoutContext()
  const host = useLayoutHostContext()
  const instance = getCurrentInstance()

  const noStyles = computed<Record<string, string>>(() => ({}))
  const sizeExpr = computed(() => normalizeSize(unref(options.sizeToken)))

  if (!layout) {
    return { layoutItemStyles: noStyles, layoutItemAttrs: noStyles, isLayoutChild: false }
  }

  const isFirstLevel = options.force === true || instance?.parent?.uid === layout.uid

  if (!isFirstLevel) {
    // Глубже первого уровня: отдаём свой размер хост-зоне
    // (например m-app-bar внутри m-layout-header задаёт высоту строки header)
    if (host) {
      onScopeDispose(host.contribute(sizeExpr))
    }
    return { layoutItemStyles: noStyles, layoutItemAttrs: noStyles, isLayoutChild: false }
  }

  const kindRef = computed<LayoutKind>(() => {
    const kind = unref(options.kind)
    if (kind) return kind

    const area = unref(options.area)
    return (area && KIND_BY_AREA[area]) || 'main'
  })

  const autoId = (useId() || 'ssr').replace(/[^\w-]/g, '')
  const idRef = computed(() => sanitizeAreaName(unref(options.id) ?? `${kindRef.value}-${autoId}`))

  // Зона без явного sizeToken суммирует размеры вложенных компонентов
  const contributions = shallowReactive(new Set<Ref<string | undefined>>())

  provideLayoutHostContext({
    contribute: (size) => {
      contributions.add(size)
      return () => {
        contributions.delete(size)
      }
    },
  })

  const effectiveSize = computed(() => {
    if (sizeExpr.value) return sizeExpr.value

    const sizes = [...contributions]
      .map(size => size.value)
      .filter((size): size is string => !!size)

    if (!sizes.length) return undefined
    if (sizes.length === 1) return sizes[0]
    return `calc(${sizes.join(' + ')})`
  })

  const getEl = () => (instance?.proxy?.$el as Element | null) ?? null

  // Live-геттеры: реестр всегда отдаёт АКТУАЛЬНЫЕ kind/size/sticky. Критично
  // для SSR: вклады детей появляются после setup родителя, watchEffect на
  // сервере не отработает — а css-computed резолвится в самом конце и через
  // геттеры видит финальные значения (и реактивно трекает их на клиенте)
  const snapshot = (): LayoutItem => ({
    id: idRef.value,
    get kind() { return kindRef.value },
    get size() { return effectiveSize.value },
    get sticky() { return unref(options.sticky) || undefined },
  })

  // Синхронная регистрация — SSR собирает грид при рендере
  let lastId = idRef.value
  layout.register(snapshot(), getEl)

  // Смена id (явный проп) требует перерегистрации; остальное живёт геттерами
  watchEffect(() => {
    const next = snapshot()

    if (next.id !== lastId) {
      layout.unregister(lastId)
      lastId = next.id
    }

    layout.register(next, getEl)
  })

  onMounted(() => layout.reorder(idRef.value))

  onBeforeUnmount(() => {
    layout.unregister(lastId)
  })

  // Sticky-позиционирование НЕ инлайнится: оно зависит от effectiveSize, а
  // вклады детей на момент рендера элемента родителя ещё не собраны (SSR отдал
  // бы бар без position). Правила эмитит buildLayoutCss в generated-CSS по
  // селектору data-атрибута — инлайн несёт только grid-area
  const layoutItemStyles = computed<Record<string, string>>(() => ({ gridArea: idRef.value }))
  const layoutItemAttrs = computed<Record<string, string>>(() => ({ [ZONE_ATTR]: idRef.value }))

  if (import.meta.dev) {
    let warnedSizelessSticky = false

    // После mount вклады детей точно собраны (дети маунтятся раньше родителя) —
    // безразмерная прибитая зона верха/низа осталась в потоке осознанно
    onMounted(() => watchEffect(() => {
      if (warnedSizelessSticky || !unref(options.sticky)) return

      const kind = kindRef.value
      if (kind !== 'top' && kind !== 'bottom') return
      if (effectiveSize.value) return

      warnedSizelessSticky = true
      console.warn(
        `[m-layout] Sticky ${kind} zone "${idRef.value}" has no size (sizeToken or child contribution) — the grid row cannot reserve space for a fixed bar, rendering in-flow.`,
      )
    }))
  }

  return { layoutItemStyles, layoutItemAttrs, isLayoutChild: true }
}

/**
 * @deprecated v2: зоны провайдят zone-контекст сами через `useLayoutItem`;
 * area-контекст больше не существует. No-op, вызовы удалить в фазе C.
 */
export function provideLayoutArea(_area: LayoutArea | Ref<LayoutArea>) {}
