import { nextTick, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

/**
 * Open state of an `MMenu` plus focus return to its trigger. `MMenu` hands
 * focus back to its parent element, which is the wrapper holding the trigger
 * and the menu, not the trigger itself — so after Escape or a choice the focus
 * would fall to `<body>`.
 */
export function useCrmMenu() {
  const open = ref(false)
  const trigger = ref<ComponentPublicInstance | null>(null)

  watch(open, (value) => {
    if (value) return

    nextTick(() => {
      const active = document.activeElement
      if (active && active !== document.body) return
      const element = trigger.value?.$el as HTMLElement | undefined
      element?.focus()
    })
  })

  const toggle = () => {
    open.value = !open.value
  }

  return { open, trigger, toggle }
}
