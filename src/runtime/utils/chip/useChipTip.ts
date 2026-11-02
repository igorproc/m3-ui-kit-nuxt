import { nextTick, shallowRef } from 'vue'
import type { Ref } from 'vue'

interface ChipContentInstance {
  label: HTMLElement | null
}

/**
 * The tooltip of a cut-off chip label (W19-А). The label is measured only on
 * a user's request — a pointer entering the chip or keyboard focus on it —
 * never while rendering, so the server frame and the first client frame are the
 * plain chip. A chip whose label fits never mounts a tooltip at all; the first
 * cut-off one mounts it around the label (the look does not change) and opens it.
 *
 * Internal to `MChip`.
 */
export function useChipTip(disabled: Readonly<Ref<boolean>>) {
  const contentRef = shallowRef<ChipContentInstance | null>(null)
  const tip = shallowRef(false)
  const tipText = shallowRef('')
  const tipOpen = shallowRef(false)
  let wanted = false

  const labelCut = () => {
    const label = contentRef.value?.label
    return Boolean(label && label.scrollWidth > label.clientWidth)
  }

  async function requestTip() {
    wanted = true
    if (disabled.value || !labelCut()) return

    tipText.value = contentRef.value?.label?.textContent?.trim() ?? ''

    if (!tip.value) {
      tip.value = true
      // The tooltip mounts, then its surface: only then does a showing animate in.
      await nextTick()
      await nextTick()
    }

    if (wanted) tipOpen.value = true
  }

  function dropTip() {
    wanted = false
    tipOpen.value = false
  }

  function onFocusIn(event: FocusEvent) {
    const target = event.target as Element | null
    let keyboard = true
    try {
      keyboard = Boolean(target?.matches(':focus-visible'))
    } catch {
      // An engine without `:focus-visible` cannot tell keyboard from pointer focus.
    }
    if (keyboard) requestTip()
  }

  // The tooltip asks to open on its own hover too: it opens only if still cut off.
  function onTipOpen(value: boolean) {
    if (value) requestTip()
    else dropTip()
  }

  return { tip, tipText, tipOpen, contentRef, requestTip, dropTip, onFocusIn, onTipOpen }
}
