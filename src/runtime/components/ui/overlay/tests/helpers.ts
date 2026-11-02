import { afterEach, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { __resetScrollLock } from '#kit/composables/overlay/useScrollLock'

/**
 * Real `<transition>`s, not the test-utils stub: the overlay lifecycle settles
 * on their hooks, so a stub would leave every phase pending.
 */
export const MOUNT_OPTIONS = { global: { stubs: { transition: false } } }

export type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

// Every mount shares one `$material.modal` registry while `useId()` restarts per
// app, so earlier mounts must go away or their entries shadow the new ids.
const mounted: Wrapper[] = []

export async function mountTracked(component: Parameters<typeof mountSuspended>[0], options: Record<string, unknown> = {}): Promise<Wrapper> {
  const wrapper = await mountSuspended(component, { ...MOUNT_OPTIONS, ...options }) as Wrapper
  mounted.push(wrapper)
  return wrapper
}

/** Lets happy-dom run the transition frames so a phase settles. */
export const settle = () => new Promise(resolve => setTimeout(resolve, 80))

/** Waits until `check` holds — for phases that settle later under a loaded run. */
export async function until(check: () => boolean, timeout = 1500) {
  for (let waited = 0; !check() && waited < timeout; waited += 20) await new Promise(resolve => setTimeout(resolve, 20))
}

/**
 * Overlays teleport into the app-level `#ui-overlay-host` (client-only); each
 * test gets a fresh host and leaves no lock, padding or mount behind.
 */
export function useOverlayHost() {
  beforeEach(() => {
    const host = document.createElement('div')
    host.id = 'ui-overlay-host'
    document.body.appendChild(host)
  })

  afterEach(() => {
    mounted.splice(0).forEach(wrapper => wrapper.unmount())
    document.getElementById('ui-overlay-host')?.remove()
    __resetScrollLock()
    document.documentElement.style.overflow = ''
    document.body.style.paddingRight = ''
  })
}

export const overlayHost = () => document.getElementById('ui-overlay-host')!

export function keydown(target: EventTarget, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}
