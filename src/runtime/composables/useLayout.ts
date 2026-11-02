/**
 * @module useLayout
 *
 * @remarks
 * Auto-layout engine v2 (carving). `m-layout` owns a registry of first-level
 * zones in DOM order; the pure carving module (`utils/layout/carve`) turns it into
 * `grid-template-*` per device range, injected via `useHead` — SSR-first,
 * zero CLS, no measurements.
 *
 * Registration rules (план: `.cursor/plans/auto-layout.md`):
 * - Only direct children of `m-layout` register (parent-component check —
 *   provide pierces wrappers, `instance.parent` does not).
 * - Deeper layout-aware components (e.g. `m-app-bar` inside `m-layout-header`)
 *   contribute their size to the hosting zone instead.
 * - DOM order drives carving priority by default; explicit `order` stabilizes
 *   SSR when an async setup registers a visually earlier zone later.
 */
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  shallowReactive,
  toValue,
  unref,
  useId,
  watchEffect,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { useNuxtApp } from '#app'
import { createContext } from '#kit/shared/utils/context/createContext'
import {
  ZONE_ATTR,
  sanitizeAreaName,
} from '#kit/utils/layout/carve'
import type { CarveItem, LayoutKind } from '#kit/utils/layout/carve'
import { buildLayoutCss } from '#kit/utils/layout/css'
import { createLayoutRegistry } from '#kit/utils/layout/registry'
import type { LayoutItem, LayoutRegistry } from '#kit/utils/layout/registry'
import { createLayoutZone } from '#kit/utils/layout/zone'
import type { LayoutZone } from '#kit/utils/layout/zone'

export type { LayoutKind } from '#kit/utils/layout/carve'
export type { LayoutItem } from '#kit/utils/layout/registry'
export type { LayoutZone } from '#kit/utils/layout/zone'

interface LayoutProvide {
  /** uid of the owning `m-layout` instance — the parent-component check. */
  uid: number
  register: LayoutRegistry['register']
  unregister: LayoutRegistry['unregister']
  /** Re-inserts a late-mounted item at its real DOM position. */
  reorder: LayoutRegistry['reorder']
  items: LayoutItem[]
  /** `main` scrolls itself instead of the document (`<m-layout full-height>`). */
  fullHeight: Readonly<Ref<boolean>>
}

interface LayoutHostProvide {
  /** Kind of the hosting zone: what fills an aside is plain content in `main`. */
  kind: Readonly<Ref<LayoutKind>>
  /** The hosting zone scrolls itself (`main` of a `full-height` layout): sticky content inside sticks to it, not to the window. */
  scroller: Readonly<Ref<boolean>>
  /** A nested component donates its size to the hosting zone; returns dispose. */
  contribute: (size: Ref<string | undefined>) => () => void
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
 * per-range CSS payload for `useHead`. `fullHeight` says `main` scrolls
 * instead of the document.
 */
export function createLayout(layoutId: string, fullHeight: MaybeRefOrGetter<boolean> = false) {
  const instance = getCurrentInstance()
  const nested = useLayoutContext() !== null
  const registry = createLayoutRegistry()
  const { items } = registry
  const isFullHeight = computed(() => toValue(fullHeight))

  onMounted(registry.markHydrated)

  provideLayoutContext({
    uid: instance?.uid ?? -1,
    register: registry.register,
    unregister: registry.unregister,
    reorder: registry.reorder,
    items,
    fullHeight: isFullHeight,
  })

  // Вложенный <m-layout> внутри зоны (например m-layout-main): сбрасываем
  // host-контекст родителя, иначе прямые зоны вложенного лейаута увидят чужой
  // host, решат, что они не layout-child, и отдадут размер внешней зоне вместо
  // регистрации в своей сетке — грид не выкроится, зоны лягут в поток.
  provideLayoutHostContext(null)

  // Активный скроллер: в обычном режиме документ, в full-height — m-layout-main
  provideLayoutZoneContext(createLayoutZone(layoutId, registry, isFullHeight))

  // Same resolved map the breakpoint composables read — resolved once by the plugin.
  const { breakpoints } = useNuxtApp().$material.breakpoints
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
      order: item.order,
    }))

    return buildLayoutCss(layoutId, carveItems, [
      { range: 'mobile', itemsMedia: `only screen and (max-width: ${tabletMin - 1}px)` },
      { range: 'tablet', media: `only screen and (min-width: ${tabletMin}px) and (max-width: ${desktopMin - 1}px)` },
      { range: 'desktop', media: `only screen and (min-width: ${desktopMin}px)` },
    ], { fullHeight: isFullHeight.value, nested })
  })

  return { css, items, nested }
}

export interface UseLayoutItemOptions {
  id?: string | Ref<string>
  /** Zone kind. Required: an item without one is no zone (it never falls back to a second `main`). */
  kind: LayoutKind | Ref<LayoutKind>
  /** CSS var name (`--ui-app-bar-height-small`) or a size expression (`360rem`). */
  sizeToken?: string | Ref<string | undefined>
  /** The zone pins to the viewport — feeds sticky insets (план §2.6). */
  sticky?: boolean | Ref<boolean | undefined>
  /** Bypass the first-level parent check (escape hatch for wrapped `m-layout-item`). */
  force?: boolean
  /** Lower values carve first; equal/omitted values preserve registration/DOM order. */
  order?: number | Ref<number | undefined>
}

/**
 * Transparent feature wrappers (for example, a docs header component) should
 * not make a layout-aware child lose its owning `<m-layout>`. The lookup is
 * deliberately shallow: deeper UI is ordinary page content, not a layout zone.
 *
 * A direct child is one ancestor hop; `MLayout → DocsHeader → MAppBar` is two.
 */
const MAX_LAYOUT_OWNER_ANCESTOR_HOPS = 3

function hasLayoutOwner(instance: ReturnType<typeof getCurrentInstance>, layoutUid: number) {
  let ancestor = instance?.parent

  for (let hops = 1; ancestor && hops <= MAX_LAYOUT_OWNER_ANCESTOR_HOPS; hops++) {
    if (ancestor.uid === layoutUid) return true
    ancestor = ancestor.parent
  }

  return false
}

export interface UseLayoutItem {
  layoutItemStyles: ComputedRef<Record<string, string>>
  layoutItemAttrs: ComputedRef<Record<string, string>>
  /** Registered as a zone of its `m-layout`. */
  isLayoutChild: boolean
  /** Inside a zone: donates its size to that zone instead of registering. */
  isLayoutHostChild: boolean
  /** Kind of the hosting zone; `undefined` unless `isLayoutHostChild`. */
  hostKind: Readonly<Ref<LayoutKind | undefined>>
  /** The hosting zone is its layout's scroller; `false` unless `isLayoutHostChild`. */
  hostIsScroller: Readonly<Ref<boolean>>
  /** The zone is its layout's scroller: `main` of a `full-height` layout. */
  isScroller: Readonly<Ref<boolean>>
}

const AXIS_OF: Record<LayoutKind, 'block' | 'inline' | undefined> = {
  top: 'block',
  bottom: 'block',
  start: 'inline',
  end: 'inline',
  main: undefined,
}

// A height only adds to a row zone and a width to a column; main takes the rest
// of the grid and has no size to add to.
function addsToHost(kind: LayoutKind | undefined, hostKind: LayoutKind | undefined) {
  const axis = kind && AXIS_OF[kind]
  return !!axis && axis === (hostKind && AXIS_OF[hostKind])
}

function notAZone(host: LayoutHostProvide | null = null): UseLayoutItem {
  const none = computed<Record<string, string>>(() => ({}))

  return {
    layoutItemStyles: none,
    layoutItemAttrs: none,
    isLayoutChild: false,
    isLayoutHostChild: Boolean(host),
    hostKind: computed(() => host?.kind.value),
    hostIsScroller: computed(() => host?.scroller.value ?? false),
    isScroller: computed(() => false),
  }
}

/**
 * Item-level: layout-aware components self-register when their owning
 * `<m-layout>` is within three transparent component ancestors. Nested items
 * inside an existing layout host contribute their size to that zone instead;
 * outside a layout, or without a `kind`, everything degrades to a no-op.
 */
export function useLayoutItem(options: UseLayoutItemOptions): UseLayoutItem {
  const layout = useLayoutContext()
  const host = useLayoutHostContext()
  const instance = getCurrentInstance()

  const sizeExpr = computed(() => normalizeSize(unref(options.sizeToken)))

  if (!layout) return notAZone()

  // A host wins over shallow owner discovery. This prevents a nested app bar
  // from registering a second top zone below MLayoutHeader/MLayoutMain.
  const isLayoutChild = !host && (options.force === true || hasLayoutOwner(instance, layout.uid))

  if (!isLayoutChild) {
    // Inside an existing zone, donate size to its host (for example, an
    // MAppBar inside MLayoutHeader). Other deeply nested UI stays a no-op.
    if (host) {
      const donated = computed(() => addsToHost(unref(options.kind), host.kind.value) ? sizeExpr.value : undefined)
      onScopeDispose(host.contribute(donated))
    }
    return notAZone(host)
  }

  // The type requires `kind`; a JS consumer can still omit it on `m-layout-item`.
  if (unref(options.kind) === undefined) {
    if (import.meta.dev) {
      console.warn('[m-layout] A layout item without `kind` is not a zone: it gets no grid area. Set kind="top|bottom|start|end|main".')
    }
    return notAZone()
  }

  const kindRef = computed(() => unref(options.kind))
  const isScroller = computed(() => kindRef.value === 'main' && layout.fullHeight.value)

  const autoId = (useId() || 'ssr').replace(/[^\w-]/g, '')
  const idRef = computed(() => sanitizeAreaName(unref(options.id) ?? `${kindRef.value}-${autoId}`))

  // Зона без явного sizeToken суммирует размеры вложенных компонентов
  const contributions = shallowReactive(new Set<Ref<string | undefined>>())

  provideLayoutHostContext({
    kind: kindRef,
    scroller: isScroller,
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

  // Live-геттеры: реестр всегда отдаёт АКТУАЛЬНЫЕ kind/size/sticky/order. Критично
  // для SSR: вклады детей появляются после setup родителя, watchEffect на
  // сервере не отработает — а css-computed резолвится в самом конце и через
  // геттеры видит финальные значения (и реактивно трекает их на клиенте)
  const snapshot = (): LayoutItem => ({
    id: idRef.value,
    get kind() { return kindRef.value },
    get size() { return effectiveSize.value },
    get sticky() { return unref(options.sticky) || undefined },
    get order() { return unref(options.order) },
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

  return {
    layoutItemStyles,
    layoutItemAttrs,
    isLayoutChild: true,
    isLayoutHostChild: false,
    hostKind: computed(() => undefined),
    hostIsScroller: computed(() => false),
    isScroller,
  }
}
