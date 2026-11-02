import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MRating from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

/** Mounts one rating at a time; the previous one is unmounted first. */
export async function mount(props: Record<string, unknown> = {}, slots?: Slots, attach = false) {
  unmountCurrent()
  current = await mountSuspended(MRating, { props, slots, ...(attach ? { attachTo: document.body } : {}) })

  return current as VueWrapper
}

export function unmountCurrent() {
  current?.unmount()
  current = null
}

function stubBox(element: Element, left: number, right: number) {
  const box = { x: left, y: 0, top: 0, left, right, bottom: 40, width: right - left, height: 40 }

  element.getBoundingClientRect = () => ({ ...box, toJSON: () => box }) as DOMRect
}

/**
 * happy-dom reports zero-sized boxes; pointer math needs real ones. Item i
 * spans 40i … 40i + 40 with no gap, its glyph 8 in from both sides.
 */
export function stubItems(wrapper: VueWrapper) {
  wrapper.findAll('.ui-rating__item').forEach((item, index) => {
    const left = index * 40
    stubBox(item.element, left, left + 40)

    const glyph = item.find('.ui-rating__glyph')
    if (glyph.exists()) stubBox(glyph.element, left + 8, left + 32)
  })
}

/** A primary press and release at `clientX`. */
export async function press(wrapper: VueWrapper, clientX: number, pointerType = 'mouse') {
  await slider(wrapper).trigger('pointerdown', { clientX, pointerType, button: 0 })
  await slider(wrapper).trigger('pointerup', { clientX, pointerType, button: 0 })
}

export const fills = (wrapper: VueWrapper) => wrapper.findAll('.ui-rating__fill').map(fill => fill.attributes('style') ?? '')

/** Preview layer styles per item; empty while nothing is previewed. */
export const previews = (wrapper: VueWrapper) => wrapper.findAll('.ui-rating__preview').map(layer => layer.attributes('style') ?? '')

/** The focusable slider inside the rating's root. */
export const slider = (wrapper: VueWrapper) => wrapper.find('[role="slider"]')
