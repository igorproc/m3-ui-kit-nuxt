/**
 * @module utils/feedback/useFeedbackBlock
 *
 * @remarks
 * What `MAlert` and `MBanner` share as blocks in the page flow.
 *
 * - **Announcement (W51).** A region mounted together with its text (`v-if`)
 *   is not reliably announced, so the block is not a live region itself: its
 *   text is written into the persistent region of its layer (the overlay host,
 *   or the open modal it sits in). A layer without one gets the block's own,
 *   teleported there once mounted.
 * - **Focus after dismissal (W50).** Closing from inside the block moves
 *   focus to what follows it, else to the nearest heading before it, instead
 *   of dropping it on `<body>`.
 */
import { nextTick, onMounted, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { useLiveRegion } from '#kit/composables/overlay/useLiveRegion'
import type { LivePoliteness } from '#kit/composables/overlay/useLiveRegion'
import { focusTargetAfter, focusWithoutTabStop } from '#kit/utils/focus/focusAfterRemoval'

/** Title and body read as one sentence: their texts joined by a space, not run together. */
function readMessage(content: HTMLElement | null): string {
  if (!content) return ''
  const parts = content.children.length ? Array.from(content.children, part => part.textContent ?? '') : [content.textContent ?? '']
  return parts.map(part => part.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ')
}

export interface UseBlockAnnouncementOptions {
  shown: Ref<boolean>
  /** The element whose text is the message (title and body, not the controls). */
  content: Readonly<Ref<HTMLElement | null>>
  politeness: () => LivePoliteness | 'off'
}

export function useBlockAnnouncement(options: UseBlockAnnouncementOptions) {
  const teleportTarget = useOverlayTeleportTarget()
  const live = useLiveRegion(teleportTarget)
  const ownsRegion = shallowRef(false)
  let message = ''

  async function announce() {
    const politeness = options.politeness()
    if (politeness === 'off') return
    await nextTick()
    message = readMessage(options.content.value)
    live.announce(message, politeness)
  }

  onMounted(() => {
    ownsRegion.value = !live.hasRegion()
    if (options.shown.value) void announce()
  })

  watch(options.shown, (shown) => {
    if (shown) void announce()
    else live.withdraw(message)
  })

  return { ownsRegion, teleportTarget }
}

export function closeNameWithTitle(closeLabel: string | undefined, title: string | undefined): string | undefined {
  const context = title?.trim()
  if (!closeLabel || !context) return closeLabel
  return `${closeLabel}: ${context}`
}

export interface UseBlockDismissOptions {
  shown: Ref<boolean>
  root: () => HTMLElement | null | undefined
  returnFocus: () => boolean
  onClose: () => void
}

/** Closes the block as the user asked, keeping focus on the page. */
export function useBlockDismiss(options: UseBlockDismissOptions) {
  return function close() {
    if (!options.shown.value) return

    const root = options.root()
    const holdsFocus = !!root && root.contains(document.activeElement)
    const target = holdsFocus && options.returnFocus() ? focusTargetAfter(root) : null

    options.onClose()
    options.shown.value = false
    if (target) void nextTick(() => focusWithoutTabStop(target))
  }
}
