/**
 * @module usePanelStatus
 *
 * @remarks
 * The text of a polite live region that tells a screen reader what the open
 * panel says when it has no rows to offer: loading, nothing to choose, nothing
 * found.
 *
 * Why the text is read back from the DOM: the visible state is a slot, so an
 * app that localises `#empty` or `#no-results` would otherwise hear the kit's
 * English fallback announced over its own words. And why a separate region at
 * all: the panel is rendered only while open, and a live region inserted
 * together with its text is not reliably announced — the region has to exist
 * before the text arrives, so it lives in the field, which is always mounted.
 */
import { nextTick, ref, watch } from 'vue'
import type { Ref } from 'vue'

export interface UsePanelStatusOptions {
  open: () => boolean
  loading: () => boolean
  /** Whether rows are showing; a refresh under visible rows stays quiet. */
  hasRows: () => boolean
  /** The progress indicator's own name, said while loading an empty panel. */
  loadingText: string
  /** The element holding the visible state message. */
  state: () => HTMLElement | null | undefined
  /** Anything else that can change the visible state (item count, query). */
  sources?: () => unknown[]
}

export function usePanelStatus(options: UsePanelStatusOptions): Ref<string> {
  const text = ref('')

  function read() {
    if (!options.open()) {
      text.value = ''
      return
    }
    const visible = options.state()?.textContent?.trim() ?? ''
    const waiting = options.loading() && !options.hasRows() ? options.loadingText : ''
    text.value = visible || waiting
  }

  watch(
    () => [options.open(), options.loading(), options.hasRows(), ...(options.sources?.() ?? [])],
    () => nextTick(read),
    { flush: 'post' },
  )

  return text
}
