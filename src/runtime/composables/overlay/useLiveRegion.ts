/**
 * @module overlay/useLiveRegion
 *
 * @remarks
 * Announces a message through the persistent live region of a layer (see
 * `fragments/live-region`): the overlay host, or the open modal a surface
 * renders in — the host is inert under a modal, and a region in inert DOM
 * is not announced.
 *
 * The region is cleared first and the message written a moment later, so the
 * same message twice in a row is announced twice.
 */
import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useTimer } from '#kit/composables/useTimer'
import { IN_BROWSER } from '#kit/shared/constants/globals'

export type LivePoliteness = 'polite' | 'assertive'

/** Long enough for a screen reader to see the cleared region as a change. */
const WRITE_DELAY_MS = 100

export interface UseLiveRegionReturn {
  /** Whether the layer has its own regions (else the caller renders some). */
  hasRegion: () => boolean
  announce: (message: string, politeness?: LivePoliteness) => void
  /** Clears the region if it still holds `message`. */
  withdraw: (message: string) => void
}

function resolve(target: string | HTMLElement | null | undefined): HTMLElement | null {
  if (!IN_BROWSER || !target) return null
  return typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
}

export function useLiveRegion(target: MaybeRefOrGetter<string | HTMLElement | null | undefined>): UseLiveRegionReturn {
  let pending: { region: HTMLElement, message: string } | null = null

  const writer = useTimer(() => {
    if (pending) pending.region.textContent = pending.message
    pending = null
  }, { duration: WRITE_DELAY_MS })

  function region(politeness: LivePoliteness): HTMLElement | null {
    return resolve(toValue(target))?.querySelector<HTMLElement>(`:scope > .ui-live-region .ui-live-region__${politeness}`) ?? null
  }

  function announce(message: string, politeness: LivePoliteness = 'polite') {
    const el = region(politeness)
    if (!el || !message) return
    el.textContent = ''
    pending = { region: el, message }
    writer.start()
  }

  function withdraw(message: string) {
    if (pending?.message === message) {
      writer.stop()
      pending = null
    }
    for (const politeness of ['polite', 'assertive'] as const) {
      const el = region(politeness)
      if (el?.textContent === message) el.textContent = ''
    }
  }

  return { hasRegion: () => region('polite') !== null, announce, withdraw }
}
