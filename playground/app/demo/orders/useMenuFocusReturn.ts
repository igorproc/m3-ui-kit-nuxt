import { nextTick, watch } from 'vue'
import type { ComponentPublicInstance, Ref } from 'vue'

/**
 * MMenu hands focus back to its parent element, which is our wrapper, not the
 * button that opened it — so an item pick or Escape would leave focus on
 * `<body>`. Same workaround as the kit's own split button.
 */
export function useMenuFocusReturn(open: Ref<boolean>, trigger: Readonly<Ref<ComponentPublicInstance | null>>) {
  watch(open, async (value) => {
    if (value) return

    await nextTick()
    const active = document.activeElement
    if (!active || active === document.body) (trigger.value?.$el as HTMLElement | undefined)?.focus()
  })
}
