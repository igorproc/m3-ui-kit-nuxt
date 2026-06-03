import {
  computed,
  watchEffect,
  onBeforeUnmount,
  reactive,
  unref,
  ref,
  isRef,
  type Ref,
} from 'vue'
import { createContext } from '~~/shared/utils/createContext'

export type LayoutArea = 'header' | 'left' | 'main' | 'right' | 'footer' | string

export interface LayoutItem {
  id: string
  area: LayoutArea
  sizeToken?: string
  order?: number
}

interface LayoutProvide {
  register: (item: LayoutItem) => void
  unregister: (id: string) => void
  items: Map<string, LayoutItem>
}

// Nullable defaults: layout-aware components degrade to a no-op when used
// outside an `<m-layout>` (no throw), so both contexts default to `null`.
const [useLayoutContext, provideLayoutContext] = createContext<LayoutProvide | null>('m3:layout', null)
const [useLayoutAreaContext, provideLayoutAreaContext] = createContext<Ref<LayoutArea> | null>('m3:layout-area', null)

/**
 * Root-level: called inside <m-layout> to create provide/inject context.
 * Returns reactive layoutStyles that auto-resolve CSS vars from registered items.
 */
export function createLayout() {
  const items = reactive<Map<string, LayoutItem>>(new Map())

  provideLayoutContext({
    register: (item) => {
      const existing = items.get(item.id)
      if (existing && !item.sizeToken && existing.sizeToken) {
        items.set(item.id, { ...item, sizeToken: existing.sizeToken })
      } else {
        items.set(item.id, item)
      }
    },
    unregister: (id) => { items.delete(id) },
    items,
  })

  // Auto-compute grid dimensions from registered components' size tokens
  const layoutStyles = computed(() => {
    const styles: Record<string, string> = {}

    for (const item of items.values()) {
      if (!item.sizeToken) {
        continue
      }

      if (item.area.startsWith('header') || item.area.startsWith('footer')) {
        styles[`--m3-layout-${item.area}-height`] = `var(${item.sizeToken})`
      } else if (item.area.startsWith('left') || item.area.startsWith('right')) {
        styles[`--m3-layout-${item.area}-width`] = `var(${item.sizeToken})`
      }
    }

    return styles
  })

  return { layoutStyles, items }
}

/**
 * Provides area context for children inside renderless layout wrappers.
 */
export function provideLayoutArea(area: LayoutArea | Ref<LayoutArea>) {
  provideLayoutAreaContext(isRef(area) ? area : ref(area))
}

/**
 * Item-level: called by layout-aware components (app-bar, navigation-rail, etc.)
 * to self-register in the layout system and receive grid-area style.
 *
 * Area resolution: explicit `area` option → parent context (provideLayoutArea) → 'main'
 */
export function useLayoutItem(options: {
  id: string | Ref<string>
  area?: LayoutArea | Ref<LayoutArea>
  sizeToken?: string | Ref<string>
  order?: number
}) {
  const layout = useLayoutContext()
  const parentArea = useLayoutAreaContext()

  if (!layout) {
    return { layoutItemStyles: computed(() => ({})) }
  }

  const idRef = computed(() => unref(options.id))
  const areaRef = computed(() => unref(options.area) ?? parentArea?.value ?? 'main')
  const sizeTokenRef = computed(() => unref(options.sizeToken))

  // Регистрируем сразу, чтобы SSR поймал данные при рендере
  layout.register({
    id: idRef.value,
    area: areaRef.value,
    sizeToken: sizeTokenRef.value,
    order: options.order,
  })

  // Обновляем при изменениях (на клиенте)
  watchEffect(() => {
    layout.register({
      id: idRef.value,
      area: areaRef.value,
      sizeToken: sizeTokenRef.value,
      order: options.order,
    })
  })

  onBeforeUnmount(() => {
    layout.unregister(idRef.value)
  })

  const layoutItemStyles = computed<Record<string, string | number | undefined>>(() => ({
    gridArea: areaRef.value,
    ...(options.order != null && { order: options.order }),
  }))

  return { layoutItemStyles }
}
