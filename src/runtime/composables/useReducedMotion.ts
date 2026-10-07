/**
 * @module useReducedMotion
 *
 * @remarks
 * Whether the viewer asked the platform to reduce motion, as one ref shared by
 * every caller. `matchMedia` is read only once a caller is mounted — never in
 * setup — so the server and the hydrating client render the same markup; one
 * listener serves all callers and is removed with the last of them.
 */
import { getCurrentInstance, onBeforeUnmount, onMounted, readonly, shallowRef } from 'vue'
import type { Ref } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'

const reduced = shallowRef(false)
let query: MediaQueryList | undefined
let subscribers = 0

function onChange(event: MediaQueryListEvent) {
  reduced.value = event.matches
}

function subscribe() {
  subscribers += 1
  if (query || !IN_BROWSER || !window.matchMedia) return

  query = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = query.matches
  query.addEventListener('change', onChange)
}

function unsubscribe() {
  subscribers -= 1
  if (subscribers > 0 || !query) return

  query.removeEventListener('change', onChange)
  query = undefined
}

/** `true` while `prefers-reduced-motion: reduce` matches; `false` until mounted. */
export function useReducedMotion(): Readonly<Ref<boolean>> {
  if (getCurrentInstance()) {
    onMounted(subscribe)
    onBeforeUnmount(unsubscribe)
  }

  return readonly(reduced)
}
