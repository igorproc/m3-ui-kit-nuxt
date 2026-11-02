/**
 * @module useTitleTruncation
 *
 * @remarks
 * Whether a one-line app bar title is cut by its ellipsis. Read after mount
 * and on every resize of the text box: it only switches the tooltip with the
 * full title on, so the measured value never changes how the bar looks and the
 * server render stays the first frame.
 */
import { nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import type { ShallowRef, WatchSource } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'

export function useTitleTruncation(target: Readonly<ShallowRef<HTMLElement | null>>, text: WatchSource<string>) {
  const truncated = shallowRef(false)
  let observer: ResizeObserver | undefined

  function measure() {
    const el = target.value
    truncated.value = Boolean(el) && el!.scrollWidth > el!.clientWidth
  }

  onMounted(() => {
    measure()
    if (!IN_BROWSER || typeof ResizeObserver === 'undefined' || !target.value) return

    observer = new ResizeObserver(measure)
    observer.observe(target.value)
  })

  // A new text can overflow a box whose size did not change.
  watch(text, () => nextTick(measure))

  onBeforeUnmount(() => observer?.disconnect())

  return truncated
}
