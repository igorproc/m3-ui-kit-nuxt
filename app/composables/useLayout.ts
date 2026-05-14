import {
  computed,
  inject,
  watchEffect,
  onBeforeUnmount,
  provide,
  reactive,
  unref,
  ref,
  isRef,
  type InjectionKey,
  type Ref,
} from 'vue'

export type LayoutArea = 'header' | 'left' | 'main' | 'right' | 'footer'

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

const LayoutKey: InjectionKey<LayoutProvide> = Symbol.for('m3:layout')
const LayoutAreaKey: InjectionKey<Ref<LayoutArea>> = Symbol.for('m3:layout-area')

/**
 * Root-level: called inside <m-layout> to create provide/inject context.
 * Returns reactive layoutStyles that auto-resolve CSS vars from registered items.
 */
export function createLayout() {
  const items = reactive<Map<string, LayoutItem>>(new Map())

  provide(LayoutKey, {
    register: (item) => { items.set(item.id, item) },
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

      switch (item.area) {
        case 'header':
          styles['--m3-layout-header-height'] = `var(${item.sizeToken})`
          break
        case 'left':
          styles['--m3-layout-left-width'] = `var(${item.sizeToken})`
          break
        case 'right':
          styles['--m3-layout-right-width'] = `var(${item.sizeToken})`
          break
        case 'footer':
          styles['--m3-layout-footer-height'] = `var(${item.sizeToken})`
          break
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
  provide(LayoutAreaKey, isRef(area) ? area : ref(area))
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
  const layout = inject(LayoutKey, null)
  const parentArea = inject(LayoutAreaKey, null)

  if (!layout) {
    return { layoutItemStyles: computed(() => ({})) }
  }

  const idRef = computed(() => unref(options.id))
  const areaRef = computed(() => unref(options.area) ?? parentArea?.value ?? 'main')
  const sizeTokenRef = computed(() => unref(options.sizeToken))

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
