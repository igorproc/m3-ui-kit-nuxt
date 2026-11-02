import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MSlider from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

/** Mounts one slider at a time; the previous one is unmounted first. */
export async function mount(props: Record<string, unknown> = {}, slots?: Slots, attach = false) {
  unmountCurrent()
  current = await mountSuspended(MSlider, { props, slots, ...(attach ? { attachTo: document.body } : {}) })

  return current as VueWrapper
}

export function unmountCurrent() {
  current?.unmount()
  current = null
}

export const thumbs = (wrapper: VueWrapper) => wrapper.findAll('[role="slider"]')

/** happy-dom reports a zero-sized box; pointer math needs a real one. */
export function stubRect(element: Element, rect: Partial<DOMRect> = {}) {
  const full = { x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 40, width: 200, height: 40, ...rect }

  element.getBoundingClientRect = () => ({ ...full, toJSON: () => full }) as DOMRect
}
