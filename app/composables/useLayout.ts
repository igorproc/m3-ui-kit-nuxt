import { computed, inject, onBeforeUnmount, provide, reactive, unref, type InjectionKey, type Ref } from 'vue'

export type Position = 'top' | 'left' | 'right' | 'bottom'

export interface LayoutItem {
  id: string
  position: Position
  sizeToken: string
  order: number
}

interface LayoutProvide {
  register: (item: LayoutItem) => void
  unregister: (id: string) => void
  registeredItems: Map<string, LayoutItem>
}

const VuetifyLayoutKey: InjectionKey<LayoutProvide> = Symbol.for('ui:layout')

export function createLayout() {
  const registeredItems = reactive<Map<string, LayoutItem>>(new Map())

  provide(VuetifyLayoutKey, {
    register: (item) => {
      registeredItems.set(item.id, item)
    },
    unregister: (id) => {
      registeredItems.delete(id)
    },
    registeredItems,
  })

  const layoutStyles = computed(() => {
    const styles: Record<string, string> = {}
    const items = Array.from(registeredItems.values())

    const getCalc = (pos: Position) => {
      const tokens = items.filter(i => i.position === pos).map(i => i.sizeToken)
      return tokens.length ? `calc(${tokens.join(' + ')})` : '0px'
    }

    styles['--ui-layout-top'] = getCalc('top')
    styles['--ui-layout-bottom'] = getCalc('bottom')
    styles['--ui-layout-left'] = getCalc('left')
    styles['--ui-layout-right'] = getCalc('right')

    return styles
  })

  return { layoutStyles }
}

export function useLayoutItem(options: {
  id: string
  position: Ref<Position> | Position
  sizeToken: Ref<string> | string
  order?: Ref<number> | number
}) {
  const layout = inject(VuetifyLayoutKey, null)

  if (!layout) {
    return { layoutItemStyles: computed(() => ({})) }
  }

  const positionRef = computed(() => unref(options.position))
  const sizeTokenRef = computed(() => unref(options.sizeToken))
  const orderRef = computed(() => unref(options.order ?? 0))

  // Vue reactive map doesn't auto-unwrap refs properly inside manual objects if not deep reactive in some cases,
  // but since we update the registry dynamically on change, it's safer to just watch or use computed for the item.
  // Actually, since sizeToken can change (e.g. var(--ui-nav-rail-expanded-width)), we need to keep the registry updated.
  // The simplest is to watchEffect and re-register.
  import('vue').then(({ watchEffect }) => {
    watchEffect(() => {
      layout.register({
        id: options.id,
        position: positionRef.value,
        sizeToken: sizeTokenRef.value,
        order: orderRef.value,
      })
    })
  })

  onBeforeUnmount(() => {
    layout.unregister(options.id)
  })

  const layoutItemStyles = computed(() => {
    const items = Array.from(layout.registeredItems.values())
    const higherPriorityItems = items.filter(i => i.order < orderRef.value)

    const getOffset = (pos: Position) => {
      const tokens = higherPriorityItems.filter(i => i.position === pos).map(i => i.sizeToken)
      return tokens.length ? `calc(${tokens.join(' + ')})` : '0px'
    }

    const isHorizontal = positionRef.value === 'left' || positionRef.value === 'right'

    const styles: Record<string, string> = {
      position: 'absolute',
      [positionRef.value]: '0px',
    }

    if (isHorizontal) {
      styles.top = getOffset('top')
      styles.bottom = getOffset('bottom')
      styles.width = sizeTokenRef.value
    } else {
      styles.left = getOffset('left')
      styles.right = getOffset('right')
      styles.height = sizeTokenRef.value
    }

    return styles
  })

  return { layoutItemStyles }
}
